"""i18n/en*.txt ('Türkçe ⇒ English' satırları) -> src/en.js (EN_DICT)."""
import pathlib, json, sys
root = pathlib.Path(__file__).resolve().parent.parent
d = {}
for f in sorted((root / 'i18n').glob('en*.txt'), key=lambda p: int(''.join(c for c in p.stem if c.isdigit()) or 0)):
    for line in f.read_text().split('\n'):
        if ' ⇒ ' not in line: continue
        a, b = line.split(' ⇒ ', 1)
        if a.strip(): d[a.strip()] = b.strip()
(root / 'src' / 'en.js').write_text('/* Otomatik üretildi: tools/i18n_build.py — i18n/en*.txt dosyalarını düzenle */\nconst EN_DICT = ' + json.dumps(d, ensure_ascii=False, indent=0) + ';\n')
print('en.js', len(d), 'kalıp')
