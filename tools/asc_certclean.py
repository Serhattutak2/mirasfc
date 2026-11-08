"""Eski geliştirme sertifikalarını App Store Connect API ile siler.
Xcode'un otomatik imzası her derlemede yeni bir "Apple Development" sertifikası
oluşturur; hesap sınırı dolunca derleme durur. Bu betik yalnızca DEVELOPMENT /
IOS_DEVELOPMENT türündekileri siler, dağıtım (DISTRIBUTION) sertifikalarına dokunmaz.
Ortam: KID, ISS, P8 (dosya yolu ya da içerik)."""
import os, sys, time, json, urllib.request
try:
    import jwt
except ImportError:
    os.system(f'{sys.executable} -m pip install -q pyjwt cryptography >/dev/null 2>&1'); import jwt

kid, iss, p8 = os.environ['KID'].strip(), os.environ['ISS'].strip(), os.environ['P8']
key = open(p8).read() if os.path.isfile(p8) else p8
tok = jwt.encode({'iss': iss, 'iat': int(time.time()), 'exp': int(time.time()) + 600, 'aud': 'appstoreconnect-v1'}, key, algorithm='ES256', headers={'kid': kid, 'typ': 'JWT'})
H = {'Authorization': 'Bearer ' + tok}


def call(method, url):
    r = urllib.request.Request(url, headers=H, method=method)
    with urllib.request.urlopen(r) as resp:
        b = resp.read(); return json.loads(b) if b else {}


certs = call('GET', 'https://api.appstoreconnect.apple.com/v1/certificates?limit=200')['data']
dev = [c for c in certs if c['attributes'].get('certificateType') in ('DEVELOPMENT', 'IOS_DEVELOPMENT')]
print(f'toplam {len(certs)} sertifika, {len(dev)} geliştirme sertifikası siliniyor')
for c in dev:
    try:
        call('DELETE', f"https://api.appstoreconnect.apple.com/v1/certificates/{c['id']}"); print('silindi', c['id'])
    except Exception as e:
        print('silinemedi', c['id'], e)
