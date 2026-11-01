"""Make assets/board_clear.jpeg: a copy of board.jpeg with the printed city names erased and
re-typeset in a larger, clearer face. The game does NOT use this file yet (preview only).
Usage: python3 tools/clear_board_text.py [size] """
import json,re,sys,math
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
R='/home/claude/iberia/'
SIZE=int(sys.argv[1]) if len(sys.argv)>1 else 36
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
    sub=gray[y0:y1,x0:x1]
    m=(sub<148).astype(np.uint8)*255
    tight=(sub<100)
    cols=np.where(tight.sum(0)>=3)[0];rows=np.where(tight.sum(1)>=3)[0]
    boxes[cid]=(x0+4,y0+3,x1-4,y1-3)
    mask[y0:y1,x0:x1]=cv2.bitwise_or(mask[y0:y1,x0:x1],m)
mask=cv2.dilate(mask,np.ones((9,9),np.uint8))
clean=cv2.inpaint(img,mask,6,cv2.INPAINT_TELEA)
pil=Image.fromarray(cv2.cvtColor(clean,cv2.COLOR_BGR2RGB)).convert('RGBA')
font=ImageFont.truetype(R+'tools/fonts/EBGaramond-Variable.ttf',SIZE)
try: font.set_variation_by_axes([650])
except Exception as ex: print('weight axis not set',ex)
sym=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(SIZE*.8))
halo=Image.new('RGBA',pil.size,(0,0,0,0));hd=ImageDraw.Draw(halo)
txt=Image.new('RGBA',pil.size,(0,0,0,0));td=ImageDraw.Draw(txt)
CREAM=(247,238,212,235);INK=(38,24,10,255)
fonts={}
def F(sz):
    sz=int(round(sz))
    if sz not in fonts:
        f=ImageFont.truetype(R+'tools/fonts/EBGaramond-Variable.ttf',sz)
        try:f.set_variation_by_axes([650])
        except Exception:pass
        fonts[sz]=f
    return fonts[sz]
for cid,o in LO.items():
    ci=C[cid];name=ci['name'].upper()
    x0,y0,x1,y1=boxes[cid]
    bw,bh=x1-x0,y1-y0
    port=ci.get('port')
    two=(o[3]-o[1])>=26 and (' ' in name or '-' in name)
    if two:
        parts=re.split(r'(?<=-)|\s+',name);parts=[q for q in parts if q]
        best=None
        for k in range(1,len(parts)):
            l1=' '.join(parts[:k]);l2=' '.join(parts[k:]);sc=abs(len(l1)-len(l2))
            if best is None or sc<best[0]:best=(sc,l1,l2)
        lines=[best[1],best[2]]
    else: lines=[name]
    n=len(lines)
    ref=F(60);wref=max(td.textlength(l,font=ref) for l in lines)+(60*0.95 if port else 0)
    s_w=60*bw/wref                       # size that makes the new text as wide as the old
    s_h=(bh/n)/0.78*1.0                  # size from the old line height
    sz=SIZE
    font=F(sz);sym=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(sz*.8))
    lh=sz*0.98
    widths=[td.textlength(l,font=font) for l in lines]
    aw=sz*0.95 if port else 0
    w=max(widths)+aw
    midx=(x0+x1)/2;midy=(y0+y1)/2
    if o[0]>0: left=x0
    elif o[2]<0: left=x1-w
    else: left=midx-w/2
    top=midy-lh*n/2-sz*0.12
    for k,l in enumerate(lines):
        lw=widths[k]
        lx=left if o[0]>0 else (left+(w-aw-lw) if o[2]<0 else midx-lw/2-aw/2*(1 if k==n-1 else 0)*0)
        ly=top+k*lh
        for dx in (-2,0,2):
            for dy in (-2,0,2):
                hd.text((lx+dx,ly+dy),l,font=font,fill=CREAM)
        td.text((lx,ly),l,font=font,fill=INK)
        if port and k==n-1:
            ax=lx+lw+sz*0.1;ay=ly+sz*0.04
            hd.text((ax,ay),'\u2693',font=sym,fill=CREAM,stroke_width=2,stroke_fill=CREAM)
            td.text((ax,ay),'\u2693',font=sym,fill=INK)
halo=halo.filter(__import__('PIL.ImageFilter',fromlist=['x']).GaussianBlur(1.2))
out=Image.alpha_composite(Image.alpha_composite(pil,halo),txt).convert('RGB')
out.save(R+'assets/board_clear.jpeg',quality=92)
print('saved',out.size)
