#!/usr/bin/env python3
# Fener: Son Bekçi — App Store Connect işlemleri (Miras FC deposunun API anahtarıyla).
# Kullanım: python3 tools/fener_asc.py hazirlik | tfgrup | durum
#   hazirlik : com.serhattutak.fener paket kimliğini kaydeder, uygulama var mı bakar
#   tfgrup   : iç TestFlight grubunu kurar, hesap kullanıcılarını testçi yapar
#   durum    : uygulama, sürüm ve build durumunu yazar
# Ortam: KID, ISS, P8
import os, sys, time, json, urllib.request, urllib.error
import jwt

BUNDLE = "com.serhattutak.fener"
NAME = "Fener Son Bekci"
KID = "".join(c for c in os.environ.get("KID", "") if c.isalnum())
ISS = "".join(c for c in os.environ.get("ISS", "") if c.isalnum() or c == "-")
P8 = "\n".join(l.strip() for l in os.environ.get("P8", "").replace("\r", "").split("\n") if l.strip()) + "\n"
BASE = "https://api.appstoreconnect.apple.com"


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISS, "iat": now, "exp": now + 1000, "aud": "appstoreconnect-v1"},
                      P8, algorithm="ES256", headers={"kid": KID, "typ": "JWT"})


def api(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw.decode(errors="replace")[:500]}


def err(r):
    return "; ".join(f"{e.get('title')}: {e.get('detail')}" for e in r.get("errors", [])) or str(r)[:300]


def die(msg, r=None):
    print("HATA:", msg, ("— " + err(r)) if r else "")
    sys.exit(1)


def find_app():
    st, r = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE}&limit=1")
    return r["data"][0] if st == 200 and r.get("data") else None


def need_app():
    a = find_app()
    if not a:
        die(f"App Store Connect'te {BUNDLE} paket kimlikli uygulama yok. App Store Connect > Uygulamalar > + > Yeni Uygulama ile oluştur.")
    print("Uygulama:", a["attributes"].get("name"), a["id"])
    return a["id"]


def hazirlik():
    st, r = api("GET", f"/v1/bundleIds?filter[identifier]={BUNDLE}&limit=5")
    if st != 200:
        die("API anahtarı çalışmadı", r)
    if any(b["attributes"]["identifier"] == BUNDLE for b in r.get("data", [])):
        print("Paket kimliği zaten kayıtlı:", BUNDLE)
    else:
        st, r = api("POST", "/v1/bundleIds", {"data": {"type": "bundleIds",
                    "attributes": {"identifier": BUNDLE, "name": NAME, "platform": "IOS"}}})
        if st not in (200, 201):
            die("Paket kimliği kaydedilemedi", r)
        print("✓ Paket kimliği kaydedildi:", BUNDLE)
    a = find_app()
    print("App Store Connect uygulaması:",
          "VAR (" + a["attributes"]["name"] + ")" if a else "YOK — App Store Connect'te Yeni Uygulama oluştur ve bu paket kimliğini seç.")


def tfgrup():
    app_id = need_app()
    st, r = api("GET", f"/v1/apps/{app_id}/betaGroups?limit=20")
    grp = next((g for g in r.get("data", []) if g["attributes"].get("isInternalGroup")), None)
    if not grp:
        st, r = api("POST", "/v1/betaGroups", {"data": {"type": "betaGroups",
                    "attributes": {"name": "Ekip", "isInternalGroup": True, "hasAccessToAllBuilds": True},
                    "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}})
        if st not in (200, 201):
            die("İç test grubu oluşturulamadı", r)
        grp = r["data"]
    print("İç test grubu:", grp["attributes"]["name"])
    st, r = api("GET", "/v1/users?limit=20")
    users = r.get("data", [])
    if not users:
        die("Hesap kullanıcıları okunamadı", r)
    st, r = api("GET", f"/v1/betaGroups/{grp['id']}/betaTesters?limit=50")
    have = {t["attributes"].get("email", "").lower() for t in r.get("data", [])}
    for u in users:
        a = u["attributes"]
        mail = (a.get("username") or "").lower()
        if not mail or mail in have:
            print("  ✓ zaten testçi")
            continue
        st, r = api("POST", "/v1/betaTesters", {"data": {"type": "betaTesters",
                    "attributes": {"email": mail, "firstName": a.get("firstName", ""), "lastName": a.get("lastName", "")},
                    "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": grp["id"]}]}}}})
        print(("✓" if st in (200, 201) else "✗"), "Testçi:", a.get("firstName", ""), a.get("lastName", ""),
              "" if st in (200, 201) else err(r))


def durum():
    a = find_app()
    if not a:
        print("Uygulama App Store Connect'te yok.")
        return
    print("Uygulama:", a["attributes"]["name"])
    st, r = api("GET", f"/v1/apps/{a['id']}/appStoreVersions?limit=5")
    for v in r.get("data", []):
        print("Sürüm", v["attributes"]["versionString"], v["attributes"]["appStoreState"])
    st, r = api("GET", f"/v1/builds?filter[app]={a['id']}&sort=-uploadedDate&limit=5")
    for b in r.get("data", []):
        print("Build", b["attributes"].get("version"), b["attributes"].get("processingState"))


if __name__ == "__main__":
    if not KID or not ISS or "PRIVATE KEY" not in P8:
        die("Gizli anahtarlar eksik (ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8).")
    cmd = sys.argv[1] if len(sys.argv) > 1 else "durum"
    {"hazirlik": hazirlik, "tfgrup": tfgrup, "durum": durum}[cmd]()
