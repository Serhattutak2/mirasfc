#!/usr/bin/env python3
# Fener: Son Bekçi — App Store sayfası ve incelemeye gönderme.
# Kullanım: python3 tools/fener_magaza.py magaza   (metin, görsel, fiyat, yaş, build: hazırlar)
#           python3 tools/fener_magaza.py gonder   (hazırlar + incelemeye gönderir)
# Ortam: KID, ISS, P8.  Medya: fener-app/magaza/ (meta.json, tr_N.png, en_N.png, es_N.png)
import os, sys, time, json, glob, hashlib, urllib.request, urllib.error
import jwt

BUNDLE = "com.serhattutak.fener"
VER = json.load(open("fener-app/package.json")).get("surum", "1.2")
MD = "fener-app/magaza"
SITE = "https://serhattutak2.github.io/fener/"
GIZ = "https://serhattutak2.github.io/fener/gizlilik.html"
GONDER = len(sys.argv) > 1 and sys.argv[1] == "gonder"
KID = "".join(c for c in os.environ.get("KID", "") if c.isalnum())
ISS = "".join(c for c in os.environ.get("ISS", "") if c.isalnum() or c == "-")
P8 = "\n".join(l.strip() for l in os.environ.get("P8", "").replace("\r", "").split("\n") if l.strip()) + "\n"
BASE = "https://api.appstoreconnect.apple.com"
LOC = {"tr": "tr", "en-US": "en", "es-ES": "es"}
SORUN = []


def token():
    now = int(time.time())
    return jwt.encode({"iss": ISS, "iat": now, "exp": now + 1000, "aud": "appstoreconnect-v1"}, P8, algorithm="ES256", headers={"kid": KID, "typ": "JWT"})


def api(method, path, body=None):
    req = urllib.request.Request(path if path.startswith("http") else BASE + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read(); return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, {"raw": raw.decode(errors="replace")[:800]}


def err(r):
    return "; ".join(f"{e.get('title')}: {e.get('detail')}" + (f" [{e.get('source', {}).get('pointer')}]" if e.get('source') else "") for e in r.get("errors", [])) or str(r)[:500]


def ok(st, r, ne):
    if st in (200, 201, 204): print("  ✓", ne); return True
    print("  ✗", ne, "->", err(r)); SORUN.append(f"{ne}: {err(r)}"); return False


def die(m, r=None):
    print("HATA:", m, ("-> " + err(r)) if r is not None else ""); sys.exit(1)


meta = json.load(open(os.path.join(MD, "meta.json")))
if GONDER and not json.load(open("fener-app/reklam.json")).get("uygulama"):
    die("reklam.json'da gerçek AdMob uygulama kimliği yok — test reklamlarıyla App Store'a gönderilmez")
if GONDER and "REKLAM_KIMLIK = { gecis: ''" in open("fener-app/www/index.html", encoding="utf-8").read():
    die("oyunda gerçek reklam birimi kimlikleri yok — test reklamlarıyla App Store'a gönderilmez")

# 1) uygulama
st, r = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE}&limit=1")
if st != 200 or not r.get("data"): die("uygulama bulunamadı", r)
app = r["data"][0]; app_id = app["id"]
print("Uygulama:", app["attributes"].get("name"), app_id, "birincil dil:", app["attributes"].get("primaryLocale"))

# 2) içerik hakları
st, r = api("PATCH", f"/v1/apps/{app_id}", {"data": {"type": "apps", "id": app_id, "attributes": {"contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"}}})
ok(st, r, "içerik hakları: üçüncü taraf içerik yok")

# 3) uygulama bilgisi: kategori, ad, alt başlık, gizlilik adresi
st, r = api("GET", f"/v1/apps/{app_id}/appInfos?limit=5")
infos = r.get("data", [])
info = next((i for i in infos if i["attributes"].get("state") not in ("READY_FOR_DISTRIBUTION", "REPLACED_WITH_NEW_INFO")), infos[0] if infos else None)
if not info: die("appInfo yok", r)
st, r = api("PATCH", f"/v1/appInfos/{info['id']}", {"data": {"type": "appInfos", "id": info["id"], "relationships": {
    "primaryCategory": {"data": {"type": "appCategories", "id": "GAMES"}},
    "primarySubcategoryOne": {"data": {"type": "appCategories", "id": "GAMES_SIMULATION"}},
    "primarySubcategoryTwo": {"data": {"type": "appCategories", "id": "GAMES_ADVENTURE"}},
    "secondaryCategory": {"data": {"type": "appCategories", "id": "BOOKS"}} if False else {"data": None}}}})
ok(st, r, "kategori: Oyunlar > Simülasyon, Macera")
st, r = api("GET", f"/v1/appInfos/{info['id']}/appInfoLocalizations?limit=50")
il = {l["attributes"]["locale"]: l for l in r.get("data", [])}
for loc, m in meta.items():
    at = {"name": m["name"], "subtitle": m["subtitle"], "privacyPolicyUrl": GIZ}
    if loc in il:
        st, r = api("PATCH", f"/v1/appInfoLocalizations/{il[loc]['id']}", {"data": {"type": "appInfoLocalizations", "id": il[loc]["id"], "attributes": at}})
        if st != 200 and "name" in err(r).lower():
            at.pop("name"); st, r = api("PATCH", f"/v1/appInfoLocalizations/{il[loc]['id']}", {"data": {"type": "appInfoLocalizations", "id": il[loc]["id"], "attributes": at}})
    else:
        at["locale"] = loc
        st, r = api("POST", "/v1/appInfoLocalizations", {"data": {"type": "appInfoLocalizations", "attributes": at, "relationships": {"appInfo": {"data": {"type": "appInfos", "id": info["id"]}}}}})
        if st not in (200, 201) and "name" in err(r).lower():
            at["name"] = meta["tr"]["name"]; st, r = api("POST", "/v1/appInfoLocalizations", {"data": {"type": "appInfoLocalizations", "attributes": at, "relationships": {"appInfo": {"data": {"type": "appInfos", "id": info["id"]}}}}})
    ok(st, r, f"uygulama bilgisi {loc} ({at.get('name', '(ad aynı)')})")

# 4) yaş derecelendirmesi
st, r = api("GET", f"/v1/appInfos/{info['id']}/ageRatingDeclaration")
if st == 200 and r.get("data"):
    ad = r["data"]; cur = ad["attributes"]; print("  yaş alanları:", ", ".join(k for k in cur))
    hedef = {}
    for k, v in cur.items():
        if isinstance(v, bool) or k in ("gambling", "unrestrictedWebAccess", "lootBox", "messagingAndChat", "userGeneratedContent", "advertising", "parentalControls", "ageAssurance", "healthOrWellnessTopics", "seventeenPlus", "kidsAgeBand") or v is None:
            pass
    tum = {
        "alcoholTobaccoOrDrugUseOrReferences": "INFREQUENT_OR_MILD", "contests": "NONE", "gamblingSimulated": "NONE",
        "horrorOrFearThemes": "NONE", "matureOrSuggestiveThemes": "INFREQUENT_OR_MILD", "medicalOrTreatmentInformation": "NONE",
        "profanityOrCrudeHumor": "NONE", "sexualContentGraphicAndNudity": "NONE", "sexualContentOrNudity": "NONE",
        "violenceCartoonOrFantasy": "NONE", "violenceRealistic": "INFREQUENT_OR_MILD", "violenceRealisticProlongedGraphicOrSadistic": "NONE",
        "gunsOrOtherWeapons": "INFREQUENT_OR_MILD",
        "gambling": False, "unrestrictedWebAccess": False, "lootBox": False, "messagingAndChat": False, "userGeneratedContent": False,
        "advertising": True, "parentalControls": False, "ageAssurance": False, "healthOrWellnessTopics": False,
        "socialMedia": False, "datingAndRelationships": False, "sharedLocation": False, "socialMediaAgeRestricted": False,
    }
    hedef = {k: v for k, v in tum.items() if k in cur}
    st, r = api("PATCH", f"/v1/ageRatingDeclarations/{ad['id']}", {"data": {"type": "ageRatingDeclarations", "id": ad["id"], "attributes": hedef}})
    if not ok(st, r, "yaş derecelendirmesi"):
        # eksik denilen alanları false/NONE ile tamamlayıp bir kez daha dene
        for e in r.get("errors", []):
            k = (e.get("source") or {}).get("pointer", "").rsplit("/", 1)[-1]
            if k and k not in hedef: hedef[k] = False
        st, r = api("PATCH", f"/v1/ageRatingDeclarations/{ad['id']}", {"data": {"type": "ageRatingDeclarations", "id": ad["id"], "attributes": hedef}})
        if ok(st, r, "yaş derecelendirmesi (2. deneme)"): SORUN[:] = [x for x in SORUN if not x.startswith("yaş")]
    st, r = api("GET", f"/v1/appInfos/{info['id']}/ageRatingDeclaration")
    eksik = [k for k, v in r.get("data", {}).get("attributes", {}).items() if v is None]
    print("  boş kalan yaş alanları:", eksik or "yok")
else:
    print("  yaş derecelendirmesi okunamadı ->", err(r))

# 5) fiyat: ücretsiz
st, r = api("GET", f"/v1/apps/{app_id}/appPriceSchedule")
fiyat_var = False
if st == 200 and r.get("data"):
    st2, r2 = api("GET", f"/v1/appPriceSchedules/{r['data']['id']}/manualPrices?limit=5")
    fiyat_var = bool(r2.get("data")); print("  fiyat planı:", "var" if fiyat_var else "boş")
if fiyat_var:
    pass
else:
    st, r = api("GET", f"/v1/apps/{app_id}/appPricePoints?filter[territory]=USA&limit=200")
    pp = next((p for p in r.get("data", []) if float(p["attributes"].get("customerPrice") or 1) == 0.0), None)
    if pp:
        st, r = api("POST", "/v1/appPriceSchedules", {"data": {"type": "appPriceSchedules", "relationships": {
            "app": {"data": {"type": "apps", "id": app_id}},
            "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
            "manualPrices": {"data": [{"type": "appPrices", "id": "${ucretsiz}"}]}}},
            "included": [{"type": "appPrices", "id": "${ucretsiz}", "attributes": {"startDate": None},
                          "relationships": {"appPricePoint": {"data": {"type": "appPricePoints", "id": pp["id"]}}}}]})
        ok(st, r, "fiyat: ücretsiz")
    else:
        print("  ✗ ücretsiz fiyat noktası bulunamadı ->", err(r)); SORUN.append("fiyat")

# 6) satış bölgeleri: tüm ülkeler
st, r = api("GET", f"/v1/apps/{app_id}/appAvailabilityV2")
if st == 200 and r.get("data"):
    print("  satış bölgeleri zaten ayarlı")
else:
    ter, url = [], "/v1/territories?limit=200"
    while url:
        st, r = api("GET", url); ter += [t["id"] for t in r.get("data", []) if t["id"] != "CHN"]; url = r.get("links", {}).get("next")
    inc = [{"type": "territoryAvailabilities", "id": f"${{t{i}}}", "attributes": {"available": True},
            "relationships": {"territory": {"data": {"type": "territories", "id": t}}}} for i, t in enumerate(ter)]
    st, r = api("POST", "/v2/appAvailabilities", {"data": {"type": "appAvailabilities", "attributes": {"availableInNewTerritories": True},
        "relationships": {"app": {"data": {"type": "apps", "id": app_id}},
                          "territoryAvailabilities": {"data": [{"type": "territoryAvailabilities", "id": x["id"]} for x in inc]}}}, "included": inc})
    ok(st, r, f"satış bölgeleri: {len(ter)} ülke")

# 7) sürüm
st, r = api("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=10")
vers = r.get("data", [])
print("Sürümler:", [(v["attributes"]["versionString"], v["attributes"]["appStoreState"]) for v in vers])
ver = next((v for v in vers if v["attributes"]["versionString"] == VER), None)
if not ver:
    ver = next((v for v in vers if v["attributes"]["appStoreState"] in ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED")), None)
    if ver:
        st, r = api("PATCH", f"/v1/appStoreVersions/{ver['id']}", {"data": {"type": "appStoreVersions", "id": ver["id"], "attributes": {"versionString": VER}}})
        ok(st, r, f"sürüm adı -> {VER}")
    else:
        st, r = api("POST", "/v1/appStoreVersions", {"data": {"type": "appStoreVersions", "attributes": {"platform": "IOS", "versionString": VER},
                                                     "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}})
        if not ok(st, r, f"sürüm oluştur {VER}"): die("sürüm yok")
        ver = r["data"]
ver_id = ver["id"]
st, r = api("PATCH", f"/v1/appStoreVersions/{ver_id}", {"data": {"type": "appStoreVersions", "id": ver_id, "attributes": {"releaseType": "AFTER_APPROVAL", "copyright": "2026 Serhat Tutak"}}})
ok(st, r, "yayın: onaylanınca otomatik, telif: 2026 Serhat Tutak")

# 8) sürüm metinleri
st, r = api("GET", f"/v1/appStoreVersions/{ver_id}/appStoreVersionLocalizations?limit=50")
vl = {l["attributes"]["locale"]: l for l in r.get("data", [])}
for loc, m in meta.items():
    at = {"description": m["description"], "keywords": m["keywords"], "promotionalText": m["promotionalText"], "supportUrl": SITE, "marketingUrl": SITE}
    if loc in vl:
        st, r = api("PATCH", f"/v1/appStoreVersionLocalizations/{vl[loc]['id']}", {"data": {"type": "appStoreVersionLocalizations", "id": vl[loc]["id"], "attributes": at}})
    else:
        at["locale"] = loc
        st, r = api("POST", "/v1/appStoreVersionLocalizations", {"data": {"type": "appStoreVersionLocalizations", "attributes": at, "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver_id}}}}})
        if st in (200, 201): vl[loc] = r["data"]
    ok(st, r, f"açıklama {loc}")


# 9) ekran görüntüleri (6.7" / 6.9")
def yukle(set_id, path):
    data = open(path, "rb").read(); md5 = hashlib.md5(data).hexdigest()
    st, r = api("POST", "/v1/appScreenshots", {"data": {"type": "appScreenshots", "attributes": {"fileName": os.path.basename(path), "fileSize": len(data)},
                                                       "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}}}})
    if st not in (200, 201): print("   rezervasyon olmadı", os.path.basename(path), err(r)); return False
    oid = r["data"]["id"]
    for op in r["data"]["attributes"]["uploadOperations"]:
        q = urllib.request.Request(op["url"], data=data[op["offset"]:op["offset"] + op["length"]], method=op["method"])
        for h in op.get("requestHeaders", []): q.add_header(h["name"], h["value"])
        with urllib.request.urlopen(q, timeout=300) as resp: resp.read()
    st, r = api("PATCH", f"/v1/appScreenshots/{oid}", {"data": {"type": "appScreenshots", "id": oid, "attributes": {"uploaded": True, "sourceFileChecksum": md5}}})
    return st == 200


for loc, tag in LOC.items():
    if loc not in vl: continue
    lid = vl[loc]["id"]
    shots = sorted(glob.glob(os.path.join(MD, f"{tag}_*.png")), key=lambda p: int(p.rsplit("_", 1)[1].split(".")[0]))
    st, r = api("GET", f"/v1/appStoreVersionLocalizations/{lid}/appScreenshotSets?limit=50")
    hedef = None
    for s in r.get("data", []):
        st2, r2 = api("GET", f"/v1/appScreenshotSets/{s['id']}/appScreenshots?limit=50")
        for sh in r2.get("data", []): api("DELETE", f"/v1/appScreenshots/{sh['id']}")
        if s["attributes"]["screenshotDisplayType"] == "APP_IPHONE_67": hedef = s["id"]
    if not hedef:
        st, r = api("POST", "/v1/appScreenshotSets", {"data": {"type": "appScreenshotSets", "attributes": {"screenshotDisplayType": "APP_IPHONE_67"},
                                                               "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": lid}}}}})
        if not ok(st, r, f"görsel seti {loc}"): continue
        hedef = r["data"]["id"]
    n = sum(1 for p in shots if yukle(hedef, p))
    print(f"  ✓ ekran görüntüsü {loc}: {n}/{len(shots)}")

# 10) inceleme iletişim bilgisi (Miras FC'deki bilgiler kullanılır)
iletisim = None
st, r = api("GET", "/v1/apps?filter[bundleId]=com.serhattutak.mirasfc&limit=1")
if r.get("data"):
    mid = r["data"][0]["id"]
    st, r = api("GET", f"/v1/apps/{mid}/appStoreVersions?filter[platform]=IOS&limit=10")
    for v in r.get("data", []):
        st2, r2 = api("GET", f"/v1/appStoreVersions/{v['id']}/appStoreReviewDetail")
        a = (r2.get("data") or {}).get("attributes") or {}
        if a.get("contactPhone"): iletisim = a; break
at = {"contactFirstName": "Serhat", "contactLastName": "Tutak", "contactEmail": "serhattutak2@icloud.com", "demoAccountRequired": False,
      "notes": "Offline single-player game. No account, no login, no ads, no in-app purchases. Language can be changed in Settings (Turkish, English, Spanish)."}
if iletisim:
    for k in ("contactFirstName", "contactLastName", "contactEmail", "contactPhone"):
        if iletisim.get(k): at[k] = iletisim[k]
st, r = api("GET", f"/v1/appStoreVersions/{ver_id}/appStoreReviewDetail")
if r.get("data"):
    st, r = api("PATCH", f"/v1/appStoreReviewDetails/{r['data']['id']}", {"data": {"type": "appStoreReviewDetails", "id": r["data"]["id"], "attributes": at}})
else:
    st, r = api("POST", "/v1/appStoreReviewDetails", {"data": {"type": "appStoreReviewDetails", "attributes": at, "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver_id}}}}})
ok(st, r, "inceleme iletişim bilgisi" + (" (telefon Miras FC'den)" if iletisim else " (TELEFON YOK)"))

# 11) build
build = None
for k in range(30):
    st, r = api("GET", f"/v1/builds?filter[app]={app_id}&filter[preReleaseVersion.version]={VER}&sort=-uploadedDate&limit=10")
    bl = r.get("data", [])
    build = next((b for b in bl if b["attributes"].get("processingState") == "VALID"), None)
    if build: break
    print("  build bekleniyor…", [b["attributes"].get("processingState") for b in bl] or "henüz görünmüyor"); time.sleep(30)
if build:
    st, r = api("PATCH", f"/v1/appStoreVersions/{ver_id}/relationships/build", {"data": {"type": "builds", "id": build["id"]}})
    ok(st, r, f"build {build['attributes'].get('version')} sürüme bağlandı")
    print("  şifreleme beyanı: Info.plist'te (ITSAppUsesNonExemptEncryption = NO)")
else:
    print("  ✗", VER, "build'i bulunamadı"); SORUN.append("build yok")

# görsellerin işlenmesini bekle
for k in range(20):
    bekle = 0; bozuk = []
    for loc in LOC:
        if loc not in vl: continue
        st, r = api("GET", f"/v1/appStoreVersionLocalizations/{vl[loc]['id']}/appScreenshotSets?limit=50")
        for s in r.get("data", []):
            st2, r2 = api("GET", f"/v1/appScreenshotSets/{s['id']}/appScreenshots?limit=50")
            for x in r2.get("data", []):
                d = (x["attributes"].get("assetDeliveryState") or {}).get("state")
                if d in ("UPLOAD_COMPLETE", "AWAITING_UPLOAD"): bekle += 1
                elif d == "FAILED": bozuk.append((loc, x["attributes"].get("fileName"), x["attributes"].get("assetDeliveryState", {}).get("errors")))
    print(f"  görseller işleniyor: {bekle}, hatalı: {len(bozuk)}", bozuk or "")
    if not bekle: break
    time.sleep(15)

print("\nHAZIRLIK SORUNLARI:", SORUN or "yok")
if not GONDER:
    print("Gönderim yapılmadı (adım: magaza)."); sys.exit(0)

# 12) incelemeye gönder
st, r = api("GET", f"/v1/reviewSubmissions?filter[app]={app_id}&limit=20")
sub = next((s for s in r.get("data", []) if s["attributes"].get("state") in ("READY_FOR_REVIEW", "UNRESOLVED_ISSUES")), None)
if not sub:
    st, r = api("POST", "/v1/reviewSubmissions", {"data": {"type": "reviewSubmissions", "attributes": {"platform": "IOS"}, "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}})
    if not ok(st, r, "gönderim oluştur"): die("gönderim açılamadı")
    sub = r["data"]
sid = sub["id"]
st, r = api("GET", f"/v1/reviewSubmissions/{sid}/items?limit=50")
if not any((it.get("relationships", {}).get("appStoreVersion", {}).get("data") or {}).get("id") == ver_id for it in r.get("data", [])):
    st, r = api("POST", "/v1/reviewSubmissionItems", {"data": {"type": "reviewSubmissionItems", "relationships": {
        "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sid}}, "appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver_id}}}}})
    if not ok(st, r, "sürümü gönderime ekle"):
        for e in r.get("errors", []):
            for k, v in (e.get("meta", {}).get("associatedErrors") or {}).items():
                for x in v: print("   eksik:", x.get("code"), "—", x.get("detail"))
        die("sürüm gönderime eklenemedi (yukarıdaki eksikler App Store Connect'te elle tamamlanmalı)")
st, r = api("PATCH", f"/v1/reviewSubmissions/{sid}", {"data": {"type": "reviewSubmissions", "id": sid, "attributes": {"submitted": True}}})
if not ok(st, r, "incelemeye gönder"):
    print(json.dumps(r, ensure_ascii=False)[:4000]); die("gönderilemedi")
print("GÖNDERİLDİ ✓ Durum:", r["data"]["attributes"].get("state"))
