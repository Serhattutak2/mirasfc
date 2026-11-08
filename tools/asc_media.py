#!/usr/bin/env python3
"""App Store Connect: sürümün mağaza metinlerini, ekran görüntülerini ve tanıtım
videolarını günceller (incelemeye göndermez; o iş tools/asc_submit.py'de).
Ortam: KID, ISS, P8, APP_ID (bundle id), VER, MEDIA_DIR (store/v44 gibi).
MEDIA_DIR içinde: meta.json  {locale: {subtitle, promotionalText, keywords, description, whatsNew}}
                  MirasFC_TR_1..N.png, MirasFC_EN_1..N.png (1290x2796)
                  MirasFC_Preview_TR.mp4, MirasFC_Preview_EN.mp4 (886x1920)"""
import os, sys, time, json, glob, hashlib, urllib.request, urllib.error
import jwt

KID = os.environ["KID"].strip(); ISS = os.environ["ISS"].strip(); P8 = os.environ["P8"]
BUNDLE = os.environ["APP_ID"].strip(); VER = os.environ["VER"].strip(); MD = os.environ["MEDIA_DIR"]
BASE = "https://api.appstoreconnect.apple.com"
LOC = {"tr": "TR", "en-US": "EN"}
NAME = {"tr": "Miras FC: A Football Life", "en-US": "Miras FC: A Football Life"}
SHOT_TYPE, PREV_TYPE = "APP_IPHONE_67", "IPHONE_67"


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISS, "iat": now, "exp": now + 1000, "aud": "appstoreconnect-v1"}, P8, algorithm="ES256", headers={"kid": KID, "typ": "JWT"})


def api(method, path, body=None):
    url = path if path.startswith("http") else BASE + path
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Authorization", "Bearer " + token()); req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            t = r.read().decode(); return r.status, (json.loads(t) if t.strip() else {})
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try: return e.code, json.loads(t)
        except Exception: return e.code, {"raw": t[:1500]}


def err(r):
    try: return "; ".join((e.get("title", "") + ": " + e.get("detail", "")) for e in r.get("errors", [])) or json.dumps(r)[:600]
    except Exception: return str(r)[:600]


def die(m, r=None):
    print("HATA:", m, ("-> " + err(r)) if r is not None else ""); sys.exit(1)


meta = json.load(open(os.path.join(MD, "meta.json")))

# uygulama ve sürüm
st, r = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE}&limit=1")
if st != 200 or not r.get("data"): die("uygulama bulunamadı", r)
app_id = r["data"][0]["id"]
st, r = api("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=10")
print("Sürümler:", [(v["attributes"]["versionString"], v["attributes"]["appStoreState"]) for v in r.get("data", [])])
ver = next((v for v in r.get("data", []) if v["attributes"]["versionString"] == VER), None)
if not ver: die(f"{VER} sürümü yok (önce asc_submit NO_SUBMIT=1 ile oluşturulmalı)")
ver_id = ver["id"]

# --- uygulama bilgisi: alt başlık (düzenlenebilir appInfo) ---
st, r = api("GET", f"/v1/apps/{app_id}/appInfos?limit=5")
infos = r.get("data", [])
edit = next((i for i in infos if i["attributes"].get("appStoreState") not in ("READY_FOR_SALE", "REPLACED_WITH_NEW_INFO") and i["attributes"].get("state") not in ("READY_FOR_DISTRIBUTION",)), None) or (infos[0] if infos else None)
if edit:
    st, r = api("GET", f"/v1/appInfos/{edit['id']}/appInfoLocalizations?limit=50")
    il = {l["attributes"]["locale"]: l for l in r.get("data", [])}
    pp = next((l["attributes"].get("privacyPolicyUrl") for l in il.values() if l["attributes"].get("privacyPolicyUrl")), None)
    for loc, m in meta.items():
        if loc in il:
            st, r = api("PATCH", f"/v1/appInfoLocalizations/{il[loc]['id']}", {"data": {"type": "appInfoLocalizations", "id": il[loc]["id"], "attributes": {"subtitle": m["subtitle"]}}})
        else:
            at = {"locale": loc, "name": NAME[loc], "subtitle": m["subtitle"]}
            if pp: at["privacyPolicyUrl"] = pp
            st, r = api("POST", "/v1/appInfoLocalizations", {"data": {"type": "appInfoLocalizations", "attributes": at, "relationships": {"appInfo": {"data": {"type": "appInfos", "id": edit["id"]}}}}})
        print("alt başlık", loc, "->", st if st in (200, 201) else err(r))

# --- sürüm yerelleri: metinler ---
st, r = api("GET", f"/v1/appStoreVersions/{ver_id}/appStoreVersionLocalizations?limit=50")
vl = {l["attributes"]["locale"]: l for l in r.get("data", [])}
ref = next(iter(vl.values()), None)
for loc, m in meta.items():
    at = {"description": m["description"], "keywords": m["keywords"], "promotionalText": m["promotionalText"], "whatsNew": m["whatsNew"]}
    if loc in vl:
        lid = vl[loc]["id"]
        st, r = api("PATCH", f"/v1/appStoreVersionLocalizations/{lid}", {"data": {"type": "appStoreVersionLocalizations", "id": lid, "attributes": at}})
        if st != 200 and "whatsNew" in err(r):  # ilk sürümde whatsNew yazılamaz
            at.pop("whatsNew"); st, r = api("PATCH", f"/v1/appStoreVersionLocalizations/{lid}", {"data": {"type": "appStoreVersionLocalizations", "id": lid, "attributes": at}})
    else:
        if ref:
            for k in ("supportUrl", "marketingUrl"):
                if ref["attributes"].get(k): at[k] = ref["attributes"][k]
        at["locale"] = loc
        st, r = api("POST", "/v1/appStoreVersionLocalizations", {"data": {"type": "appStoreVersionLocalizations", "attributes": at, "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver_id}}}}})
        if st in (200, 201): vl[loc] = r["data"]
    print("metinler", loc, "->", st if st in (200, 201) else err(r))


def upload(kind, set_id, path):
    data = open(path, "rb").read(); md5 = hashlib.md5(data).hexdigest()
    typ, rel = ("appScreenshots", "appScreenshotSet") if kind == "shot" else ("appPreviews", "appPreviewSet")
    st, r = api("POST", f"/v1/{typ}", {"data": {"type": typ, "attributes": {"fileName": os.path.basename(path), "fileSize": len(data)}, "relationships": {rel: {"data": {"type": rel + "s", "id": set_id}}}}})
    if st not in (200, 201): print("  rezervasyon olmadı", os.path.basename(path), err(r)); return False
    oid = r["data"]["id"]
    for op in r["data"]["attributes"]["uploadOperations"]:
        part = data[op["offset"]:op["offset"] + op["length"]]
        q = urllib.request.Request(op["url"], data=part, method=op["method"])
        for h in op.get("requestHeaders", []): q.add_header(h["name"], h["value"])
        with urllib.request.urlopen(q, timeout=300) as resp: resp.read()
    st, r = api("PATCH", f"/v1/{typ}/{oid}", {"data": {"type": typ, "id": oid, "attributes": {"uploaded": True, "sourceFileChecksum": md5}}})
    print("  yüklendi", os.path.basename(path), "->", st if st == 200 else err(r))
    return st == 200


for loc, tag in LOC.items():
    if loc not in vl: continue
    lid = vl[loc]["id"]
    # ekran görüntüleri: bu yereldeki tüm eski setleri boşalt, 6.7"/6.9" setine yenileri koy
    shots = sorted(glob.glob(os.path.join(MD, f"MirasFC_{tag}_*.png")), key=lambda p: int(p.rsplit("_", 1)[1].split(".")[0]))
    if shots:
        st, r = api("GET", f"/v1/appStoreVersionLocalizations/{lid}/appScreenshotSets?limit=50")
        sets = r.get("data", []); target = None
        for s in sets:
            st2, r2 = api("GET", f"/v1/appScreenshotSets/{s['id']}/appScreenshots?limit=50")
            for sh in r2.get("data", []): api("DELETE", f"/v1/appScreenshots/{sh['id']}")
            if s["attributes"]["screenshotDisplayType"] == SHOT_TYPE: target = s["id"]
            print(f"  {loc} eski set temizlendi:", s["attributes"]["screenshotDisplayType"], len(r2.get("data", [])))
        if not target:
            st, r = api("POST", "/v1/appScreenshotSets", {"data": {"type": "appScreenshotSets", "attributes": {"screenshotDisplayType": SHOT_TYPE}, "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": lid}}}}})
            if st not in (200, 201): die("ekran görüntüsü seti açılamadı", r)
            target = r["data"]["id"]
        print("Ekran görüntüleri", loc, len(shots))
        for p in shots: upload("shot", target, p)
    # tanıtım videosu
    pv = os.path.join(MD, f"MirasFC_Preview_{tag}.mp4")
    if os.path.exists(pv):
        st, r = api("GET", f"/v1/appStoreVersionLocalizations/{lid}/appPreviewSets?limit=50")
        target = None
        for s in r.get("data", []):
            st2, r2 = api("GET", f"/v1/appPreviewSets/{s['id']}/appPreviews?limit=10")
            for x in r2.get("data", []): api("DELETE", f"/v1/appPreviews/{x['id']}")
            if s["attributes"]["previewType"] == PREV_TYPE: target = s["id"]
        if not target:
            st, r = api("POST", "/v1/appPreviewSets", {"data": {"type": "appPreviewSets", "attributes": {"previewType": PREV_TYPE}, "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": lid}}}}})
            if st not in (200, 201): print("video seti açılamadı", err(r)); continue
            target = r["data"]["id"]
        print("Tanıtım videosu", loc); upload("prev", target, pv)

# yüklenenlerin işlenmesini bekle (en fazla ~6 dk)
for k in range(24):
    bad, pend = [], 0
    for loc in LOC:
        if loc not in vl: continue
        lid = vl[loc]["id"]
        for path, typ in ((f"/v1/appStoreVersionLocalizations/{lid}/appScreenshotSets?limit=50", "appScreenshots"), (f"/v1/appStoreVersionLocalizations/{lid}/appPreviewSets?limit=50", "appPreviews")):
            st, r = api("GET", path)
            for s in r.get("data", []):
                st2, r2 = api("GET", f"/v1/{'appScreenshotSets' if typ == 'appScreenshots' else 'appPreviewSets'}/{s['id']}/{typ}?limit=50")
                for x in r2.get("data", []):
                    d = (x["attributes"].get("assetDeliveryState") or {}).get("state")
                    if d in ("UPLOAD_COMPLETE", "AWAITING_UPLOAD"): pend += 1
                    elif d == "FAILED": bad.append((loc, x["attributes"].get("fileName"), x["attributes"].get("assetDeliveryState", {}).get("errors")))
    print(f"işleniyor: {pend}, hatalı: {len(bad)}")
    if bad: print("HATALI:", bad)
    if not pend: break
    time.sleep(15)
print("MEDYA TAMAM")
