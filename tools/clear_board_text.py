"""Make assets/board_clear.jpeg: a copy of board.jpeg with the printed city names erased and
re-typeset in a larger, clearer face. The game does NOT use this file yet (preview only).
Usage: python3 tools/clear_board_text.py [size] """
import json,re,sys,math
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
R='/home/claude/iberia/'
SIZE=int(sys.argv[1]) if len(sys.argv)>1 else 50
src=open(R+'src/ui.js').read()
LO=json.loads(re.search(r"const LABEL_OFF=(\{.*?\});",src).group(1))
M=json.JSONDecoder().raw_decode(open(R+'src/map.js').read().split('=',1)[1].lstrip())[0]
C={c['id']:c for c in M['cities']}
a,b,c_,d,e,f=0.3869826,-0.0003860,0.0003860,0.3869826,6.782,8.266
det=a*d-b*c_
def to_img(x,y):
    x-=e;y-=f
    return ((d*x-c_*y)/det,(-b*x+a*y)/det)
img=cv2.imread(R+'assets/board.jpeg');H,W=img.shape[:2]
gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
mask=np.zeros((H,W),np.uint8)
boxes={}
for cid,o in LO.items():
    cx,cy=C[cid]['x'],C[cid]['y']
    p0=to_img(cx+o[0]-2,cy+o[1]-2);p1=to_img(cx+o[2]+2,cy+o[3]+2)
    x0,y0,x1,y1=[int(round(v)) for v in (min(p0[0],p1[0]),min(p0[1],p1[1]),max(p0[0],p1[0]),max(p0[1],p1[1]))]
    boxes[cid]=(x0,y0,x1,y1)
    sub=gray[y0:y1,x0:x1]
    m=(sub<135).astype(np.uint8)*255
    mask[y0:y1,x0:x1]=cv2.bitwise_or(mask[y0:y1,x0:x1],m)
mask=cv2.dilate(mask,np.ones((7,7),np.uint8))
clean=cv2.inpaint(img,mask,6,cv2.INPAINT_TELEA)
pil=Image.fromarray(cv2.cvtColor(clean,cv2.COLOR_BGR2RGB)).convert('RGBA')
font=ImageFont.truetype(R+'tools/fonts/EBGaramond-Variable.ttf',SIZE)
try: font.set_variation_by_axes([650])
except Exception as ex: print('weight axis not set',ex)
sym=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(SIZE*.8))
halo=Image.new('RGBA',pil.size,(0,0,0,0));hd=ImageDraw.Draw(halo)
txt=Image.new('RGBA',pil.size,(0,0,0,0));td=ImageDraw.Draw(txt)
CREAM=(247,238,212,235);INK=(38,24,10,255)
for cid,o in LO.items():
    ci=C[cid];name=ci['name'].upper()
    two=(o[3]-o[1])>=26 and (' ' in name or '-' in name)
    if two:
        parts=re.split(r'(?<=[ -])',name) if '-' in name and ' ' not in name else name.split(' ')
        # split roughly in half by characters
        best=None
        for i in range(1,len(parts)):
            l1=' '.join(parts[:i]).strip();l2=' '.join(parts[i:]).strip()
            sc=abs(len(l1)-len(l2))
            if best is None or sc<best[0]:best=(sc,l1,l2)
        lines=[best[1],best[2]]
    else: lines=[name]
    port=ci.get('port')
    cxm,cym=to_img(ci['x'],ci['y'])
    x0,y0,x1,y1=boxes[cid]
    midx=(x0+x1)/2;midy=(y0+y1)/2
    lh=SIZE*0.95
    widths=[td.textlength(l,font=font) for l in lines]
    w=max(widths)+(SIZE*0.95 if port else 0)
    if o[0]>0: left=x0+4                     # label sits to the right of the city
    elif o[2]<0: left=x1-4-w                 # to the left
    else: left=midx-w/2                      # above or below
    top=midy-lh*len(lines)/2
    for k,l in enumerate(lines):
        lw=widths[k]
        if o[0]>0: lx=left
        elif o[2]<0: lx=left+(w-(SIZE*0.95 if port else 0))-lw if len(lines)==1 else left+(w-lw)
        else: lx=midx-lw/2
        if len(lines)>1 and o[0]>0: lx=left
        if len(lines)>1 and not(o[0]>0) and not(o[2]<0): lx=midx-lw/2
        ly=top+k*lh
        for dx in (-3,0,3):
            for dy in (-3,0,3):
                hd.text((lx+dx,ly+dy),l,font=font,fill=CREAM)
        td.text((lx,ly),l,font=font,fill=INK)
        if port and k==len(lines)-1:
            ax=lx+lw+SIZE*0.12;ay=ly+SIZE*0.02
            hd.text((ax,ay),'⚓',font=sym,fill=CREAM,stroke_width=3,stroke_fill=CREAM)
            td.text((ax,ay),'⚓',font=sym,fill=INK)
halo=halo.filter(__import__('PIL.ImageFilter',fromlist=['x']).GaussianBlur(1.2))
out=Image.alpha_composite(Image.alpha_composite(pil,halo),txt).convert('RGB')
out.save(R+'assets/board_clear.jpeg',quality=92)
print('saved',out.size)
