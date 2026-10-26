"""Build the standalone game: python3 build.py -> index.html (+ versioned copy)."""
import base64,json,io,glob,os,re
from PIL import Image
d=lambda p:open(p,encoding='utf-8').read()
def uri(p,maxw=128):
    im=Image.open(p).convert('RGBA');w,h=im.size
    if max(w,h)>maxw:im=im.resize((round(w*maxw/max(w,h)),round(h*maxw/max(w,h))),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'PNG',optimize=True);return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
norm=lambda s:re.sub(r'_','-',s.lower())
# every PNG in assets/ becomes a built-in graphic at tokens/<name>; a local asset folder still overrides it
def ekey(p):
    rel=norm(os.path.splitext(os.path.relpath(p,'assets').replace(os.sep,'/'))[0])
    return rel if '/' in rel else 'tokens/'+rel
EMBED={ekey(p):uri(p,160 if 'railroad' in p else 128) for p in sorted(glob.glob('assets/**/*.png',recursive=True))}
T=lambda k:EMBED['tokens/'+k]
TOKENS={'water':T('purification'),'prevention':T('prevention'),'infection':T('infection-rate'),'outbreak':T('outbreak'),'rail':T('railroad')}
board='data:image/jpeg;base64,'+base64.b64encode(open('assets/img0.jpeg','rb').read()).decode()
eng=d('src/engine.js').replace("if(typeof module!=='undefined')","if(false)")
mp=d('src/map.js').replace('if(typeof module!=="undefined")','if(false)')
REPO_FILES=sorted(os.path.relpath(p,'assets').replace(os.sep,'/') for p in glob.glob('assets/**/*',recursive=True) if os.path.isfile(p))
js=mp+'\nconst REPO_FILES='+json.dumps(REPO_FILES)+';\nconst TOKENS='+json.dumps(TOKENS)+';\nconst EMBED='+json.dumps(EMBED)+';\n'+eng+'\n'+d('src/ui.js')
html=d('src/index.html').replace('/*CSS*/',d('src/style.css')).replace('/*BOARD*/',board).replace('/*JS*/',js.replace('</script','<\\/script'))
ver=re.search(r"UI_VERSION='([\d.]+)'",d('src/ui.js')).group(1)
os.makedirs('versions',exist_ok=True)
out=['index.html','versions/iberia-v'+ver+'.html']
for f in out:open(f,'w',encoding='utf-8').write(html)
print(len(html),'bytes ->',', '.join(out),'|',len(EMBED),'built-in graphics')

# versions/index.html: list of every playable version
vs=sorted(glob.glob('versions/iberia-v*.html'),key=lambda f:[int(x) for x in re.findall(r'\d+',os.path.basename(f))],reverse=True)
items=''.join('<li><a href="%s">%s</a>%s</li>'%(os.path.basename(f),os.path.basename(f)[7:-5],' (current)' if i==0 else '') for i,f in enumerate(vs))
open('versions/index.html','w',encoding='utf-8').write('<!doctype html><meta charset="utf-8"><title>Iberia versions</title><style>body{background:#516b60;font-family:system-ui,sans-serif;color:#2e4339;margin:0;padding:40px}main{max-width:520px;margin:auto;background:#f6e8cd;border:2px solid #c9ab72;border-radius:8px;padding:20px 28px}a{color:#2e4339;font-weight:600}li{margin:8px 0}</style><main><h1>Iberia prototype versions</h1><p><a href="../">Play the current version</a></p><ul>'+items+'</ul></main>')
