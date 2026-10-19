"""Miras FC derleyici: src/ altındaki dosyaları tek dosyalık index.html'e birleştirir.
Kullanım: python3 tools/build.py            -> index.html
          python3 tools/build.py --artifact X -> X (Claude Artifact için iskeletsiz sürüm)"""
import sys, pathlib, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / 'tools' / 'i18n_build.py')], check=True)
order = ['en.js', 'i18n.js', 'data.js', 'core.js', 'squad.js', 'events.js', 'events2.js', 'life.js', 'stories.js', 'career.js', 'nego.js', 'engine.js', 'engine5.js', 'engine6.js', 'engine7.js', 'engine8.js', 'engine9.js', 'engine11.js', 'engine12.js', 'match.js', 'finance.js', 'owner.js', 'coach.js', 'coach2.js', 'coach3.js', 'owner2.js', 'legacy.js', 'shop.js', 'ui.js', 'emoji.js', 'tutorial.js', 'voxdata.js', 'engine10.js', 'hall.js', 'kariyer2.js', 'coach4.js', 'coach5.js', 'coach6.js', 'ads.js', 'iap.js', 'awards.js', 'packs2.js', 'justice.js', 'story2.js', 'rules41.js', 'voice2.js']
js = '\n'.join((root / 'src' / f).read_text() for f in order) + '\nmenu();\n'
css = (root / 'src' / 'styles.css').read_text()
html = (root / 'src' / 'shell.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js)
if '--artifact' in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index('--artifact') + 1])
    head, body = html.split('</head><body>', 1)
    head = head[head.index('<title>'):]
    body = body.replace('</body></html>', '')
    out.write_text(head.replace('</title>', '</title><meta name="claude:viewport-fit-sides" content="cover">', 1) + '\n' + body)
    print('artifact ->', out, len(out.read_text()))
else:
    (root / 'index.html').write_text(html)
    print('index.html', len(html))
