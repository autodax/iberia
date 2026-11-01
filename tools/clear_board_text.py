"""Make assets/board_clear.jpeg: a copy of board.jpeg with the printed city names erased and
re-typeset in a larger, clearer face. The game does NOT use this file yet (preview only).
Usage: python3 tools/clear_board_text.py [size] """
import json,re,sys,math
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
R='/home/claude/iberia/'
SIZE=int(sys.argv[1]) if len(sys.argv)>1 else 44
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
halo=Image.new('L',pil.size,0);hd=ImageDraw.Draw(halo)
txt=Image.new('L',pil.size,0);td=ImageDraw.Draw(txt)
CREAM=(247,238,212,235);INK=(38,24,10,255)
fonts={}
def F(sz):
    sz=int(round(sz))
    if sz not in fonts:
        f=ImageFont.truetype(R+'tools/fonts/EBGaramond-Variable.ttf',sz)
        try:f.set_variation_by_axes([620])
        except Exception:pass
        fonts[sz]=f
    return fonts[sz]
TRACK=0.04          # letter spacing as a fraction of the font size
def tw(t,font,sz): return sum(font.getlength(ch) for ch in t)+len(t)*sz*TRACK
def put(d,x,y,t,font,sz,fill,**kw):
    for ch in t:
        d.text((x,y),ch,font=font,fill=fill,**kw);x+=font.getlength(ch)+sz*TRACK
patch=Image.new('RGBA',pil.size,(0,0,0,0));pd=ImageDraw.Draw(patch)
cleanarr=np.array(pil.convert('RGB'))
CIRC=[to_img(c['x'],c['y']) for c in M['cities']]
INK=(14,9,4,255);CREAM=(250,243,222,255)
for cid,o in LO.items():
    ci=C[cid];name=ci['name'].upper()
    x0,y0,x1,y1=boxes[cid];port=ci.get('port')
    long=len(name)>15 and (' ' in name or '-' in name)
    two=((o[3]-o[1])>=26 or long) and (' ' in name or '-' in name)
    if two:
        parts=[q for q in re.split(r'(?<=-)|\s+',name) if q]
        best=None
        for k in range(1,len(parts)):
            l1=' '.join(parts[:k]);l2=' '.join(parts[k:]);sc=abs(len(l1)-len(l2))
            if best is None or sc<best[0]:best=(sc,l1,l2)
        lines=[best[1],best[2]]
    else: lines=[name]
    n=len(lines);sz=SIZE;font=F(sz)
    sym=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(sz*.85))
    lh=sz*0.98;widths=[tw(l,font,sz) for l in lines];aw=sz*1.0 if port else 0
    w=max(widths)+aw;h=lh*n
    midx=(x0+x1)/2;midy=(y0+y1)/2
    if o[0]>0: left=x0
    elif o[2]<0: left=x1-w
    else: left=midx-w/2
    top=midy-h/2-sz*0.1
    # keep clear of every city circle (radius about 40 px at this scale)
    def clash(L,T):
        for (cx,cy) in CIRC:
            nx=min(max(cx,L),L+w);ny=min(max(cy,T+sz*.15),T+h)
            if math.hypot(nx-cx,ny-cy)<44:return True
        return False
    step=6;tries=0
    while clash(left,top) and tries<14:
        if o[0]>0: left+=step
        elif o[2]<0: left-=step
        else: top+=step*(1 if midy>CIRC[int(cid[1:])][1] else -1)
        tries+=1
    left=max(30,min(left,pil.size[0]-w-30))
    # lighten the ground behind the name (soft patch)
    L0,T0,R0,B0=int(left-10),int(top),int(left+w+10),int(top+h+sz*.25)
    reg=cleanarr[max(0,T0):B0,max(0,L0):R0].reshape(-1,3)
    if len(reg):
        med=np.median(reg,axis=0);col=tuple(int(min(255,v*1.1+12)) for v in med)
        pd.rounded_rectangle([L0,T0,R0,B0],radius=14,fill=col+(120,))
    for k,l in enumerate(lines):
        lw=widths[k]
        lx=left if (o[0]>0 or len(lines)>1 and o[2]>=0) else (left+(w-aw-lw) if o[2]<0 else left+(w-aw-lw)/2)
        if len(lines)>1 and o[2]<0: lx=left+(w-aw-lw)
        if len(lines)>1 and o[0]<=0 and o[2]>=0: lx=left+(w-aw-lw)/2
        ly=top+k*lh
        put(hd,lx,ly,l,font,sz,255)
        put(td,lx,ly,l,font,sz,255)
        if port and k==n-1:
            ax=lx+lw+sz*0.08;ay=ly+sz*0.02
            hd.text((ax,ay),'\u2693',font=sym,fill=255)
            td.text((ax,ay),'\u2693',font=sym,fill=255)
from PIL import ImageFilter
patch=patch.filter(ImageFilter.GaussianBlur(14))
# one even cream outline per word: grow the text mask, close the gaps between letters, soften the edge
cream_a=halo.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(2.2)).point(lambda v:min(255,int(v*1.15)))
cream=Image.new('RGBA',pil.size,CREAM[:3]+(0,));cream.putalpha(cream_a)
ink=Image.new('RGBA',pil.size,INK[:3]+(0,));ink.putalpha(txt)
out=Image.alpha_composite(Image.alpha_composite(Image.alpha_composite(pil,patch),cream),ink).convert('RGB')
out.save(R+'assets/board_clear.jpeg',quality=95,subsampling=0)
print('saved',out.size)
