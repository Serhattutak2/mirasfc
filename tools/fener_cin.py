#!/usr/bin/env python3
# Fener: Son Bekçi'yi Çin anakarasında satıştan çıkarır.
# (Çin'de oyunlar ISBN oyun lisansı ister; ayrıca güvenlik ve yapay zekâ uyum formları sadece Çin için gerekli.)
import os, sys
sys.argv = [sys.argv[0], "magaza"]
src = open(os.path.join(os.path.dirname(__file__), "fener_magaza.py"), encoding="utf-8").read()
src = src.split("meta = json.load(")[0]          # sadece yardımcı fonksiyonları al
exec(src)
st, r = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE}&limit=1")
app_id = r["data"][0]["id"]
st, r = api("GET", f"/v1/apps/{app_id}/appAvailabilityV2")
if st != 200 or not r.get("data"): die("satış bölgesi bilgisi yok", r)
av = r["data"]["id"]
url = f"/v2/appAvailabilities/{av}/territoryAvailabilities?include=territory&limit=200"
bulundu = False
while url:
    st, r = api("GET", url)
    for t in r.get("data", []):
        ter = (t.get("relationships", {}).get("territory", {}).get("data") or {}).get("id")
        if ter == "CHN":
            bulundu = True
            if not t["attributes"].get("available"): print("Çin anakarası zaten satışta değil ✓"); break
            st2, r2 = api("PATCH", f"/v1/territoryAvailabilities/{t['id']}", {"data": {"type": "territoryAvailabilities", "id": t["id"], "attributes": {"available": False}}})
            ok(st2, r2, "Çin anakarası satıştan çıkarıldı")
    url = r.get("links", {}).get("next")
if not bulundu: print("CHN bölgesi listede bulunamadı")
