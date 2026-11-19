"""App Store Connect durum özeti: sürümler, son build'ler, inceleme gönderimleri."""
import os, sys
os.environ.setdefault("VER", "0")
sys.argv = [sys.argv[0]]
src = open(os.path.join(os.path.dirname(__file__), "asc_submit.py")).read().split("# 1) App id")[0]
exec(src)
st, r = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE}&limit=1"); app_id = r["data"][0]["id"]
st, r = api("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=8")
for v in r.get("data", []): print("SÜRÜM", v["attributes"]["versionString"], v["attributes"]["appStoreState"], v["attributes"].get("createdDate"))
st, r = api("GET", f"/v1/builds?filter[app]={app_id}&sort=-uploadedDate&limit=6&include=preReleaseVersion")
pv = {i["id"]: i["attributes"]["version"] for i in r.get("included", [])}
for b in r.get("data", []): print("BUILD", pv.get(b["relationships"]["preReleaseVersion"]["data"]["id"]), b["attributes"]["version"], b["attributes"]["processingState"], b["attributes"]["uploadedDate"])
st, r = api("GET", f"/v1/reviewSubmissions?filter[app]={app_id}&limit=6")
for s in r.get("data", []): print("GÖNDERİM", s["id"], s["attributes"].get("state"), s["attributes"].get("submittedDate"))
