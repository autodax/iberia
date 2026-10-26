import base64,json,os
d=lambda p:open(p).read()
b64=lambda p,t:'data:image/'+t+';base64,'+base64.b64encode(open(p,'rb').read()).decode()
tokens={k:b64('assets/'+k+'.png','png') for k in ['water','prevention','infection','outbreak','rail']}
eng=d('src/engine.js').replace("if(typeof module!=='undefined')","if(false)")
mp=d('src/map.js').replace('if(typeof module!=="undefined")','if(false)')
js=mp+'\nconst TOKENS='+json.dumps(tokens)+';\n'+eng+'\n'+d('src/ui.js')
html=d('src/index.html').replace('/*CSS*/',d('src/style.css')).replace('/*BOARD*/',b64('assets/img0.jpeg','jpeg')).replace('/*JS*/',js.replace('</script','<\\/script'))
[open(f,'w').write(html) for f in ('index.html','iberia-browser-prototype-v09.html')];print(len(html))
