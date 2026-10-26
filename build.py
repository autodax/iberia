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
EMBED={'tokens/'+norm(os.path.splitext(os.path.basename(p))[0]):uri(p,160 if 'railroad' in p else 128) for p in sorted(glob.glob('assets/*.png'))}
T=lambda k:EMBED['tokens/'+k]
TOKENS={'water':T('purification'),'prevention':T('prevention'),'infection':T('infection-rate'),'outbreak':T('outbreak'),'rail':T('railroad')}
board='data:image/jpeg;base64,'+base64.b64encode(open('assets/img0.jpeg','rb').read()).decode()
eng=d('src/engine.js').replace("if(typeof module!=='undefined')","if(false)")
mp=d('src/map.js').replace('if(typeof module!=="undefined")','if(false)')
REPO_FILES=sorted(os.path.relpath(p,'assets').replace(os.sep,'/') for p in glob.glob('assets/**/*',recursive=True) if os.path.isfile(p))
js=mp+'\nconst REPO_FILES='+json.dumps(REPO_FILES)+';\nconst TOKENS='+json.dumps(TOKENS)+';\nconst EMBED='+json.dumps(EMBED)+';\n'+eng+'\n'+d('src/ui.js')
html=d('src/index.html').replace('/*CSS*/',d('src/style.css')).replace('/*BOARD*/',board).replace('/*JS*/',js.replace('</script','<\\/script'))
ver=re.search(r"UI_VERSION='([\d.]+)'",d('src/ui.js')).group(1)
out=['index.html','iberia-browser-prototype-v'+ver+'.html']
for f in glob.glob('iberia-browser-prototype-v*.html'):os.remove(f)
for f in out:open(f,'w',encoding='utf-8').write(html)
print(len(html),'bytes ->',', '.join(out),'|',len(EMBED),'built-in graphics')
