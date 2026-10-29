"""Render the 3D pawn PNGs: python3 tools/render_pawns.py assets/pawns  (numpy + Pillow; isometric view, lit like the cube art)."""
import numpy as np
from PIL import Image
W,H,SS=256,384,3
def smin(a,b,k):h=np.clip(0.5+0.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h)
def sdf(p):
    x,y,z=p[...,0],p[...,1],p[...,2];r=np.sqrt(x*x+z*z)
    def rcyl(r0,y0,y1,rb):  # rounded cylinder
        d=np.stack([r-(r0-rb),np.abs(y-(y0+y1)/2)-((y1-y0)/2-rb)],-1)
        return np.minimum(np.maximum(d[...,0],d[...,1]),0)+np.linalg.norm(np.maximum(d,0),axis=-1)-rb
    base=rcyl(0.40,0.0,0.10,0.035)
    # body: tapered from r=.32 at y=.08 to r=.15 at y=.62 with concave flare
    t=np.clip((y-0.08)/0.54,0,1);prof=0.15+0.17*(1-t)**1.8
    body=np.maximum((r-prof)*0.8,np.maximum(0.08-y,y-0.64))
    collar=rcyl(0.235,0.60,0.67,0.03)
    head=np.sqrt(x*x+(y-0.84)**2+z*z)-0.19
    d=smin(base,body,0.05);d=smin(d,collar,0.03);d=smin(d,head,0.05);return d
def normal(p):
    e=1e-3;n=np.stack([sdf(p+np.array(v))-sdf(p-np.array(v)) for v in [(e,0,0),(0,e,0),(0,0,e)]],-1)
    return n/np.linalg.norm(n,axis=-1,keepdims=True)
# isometric camera: yaw 45, pitch 30 (orthographic)
pitch=np.radians(30);yaw=np.radians(45)
fwd=np.array([-np.cos(pitch)*np.sin(yaw),-np.sin(pitch),-np.cos(pitch)*np.cos(yaw)])
right=np.cross(fwd,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,fwd)
w,h=W*SS,H*SS;sc=1.12/W*1.0
u=(np.arange(w)-w/2+.5)/SS*sc*1.0;v=(h/2-np.arange(h)-.5)/SS*sc*1.0
U,V=np.meshgrid(u,v);center=np.array([0,0.47,0])
ro=center+U[...,None]*right+V[...,None]*up-fwd*3
rd=np.broadcast_to(fwd,ro.shape)
tt=np.zeros(U.shape);hit=np.zeros(U.shape,bool)
for i in range(140):
    p=ro+rd*tt[...,None];d=sdf(p);hit|=d<4e-4;tt=np.where(hit,tt,tt+d*0.9)
    if (tt>6).all():break
hit&=tt<6
p=ro+rd*tt[...,None];n=normal(p)
def shade(hexcol):
    base=np.array([int(hexcol[i:i+2],16) for i in (1,3,5)])/255.
    # face-tone lighting like the cube art: top bright, left mid, right dark
    L1=np.array([-0.55,1.0,0.35]);L1/=np.linalg.norm(L1)
    lam=np.clip((n*L1).sum(-1),0,1)
    k=0.74+0.36*lam
    k=k+0.05*np.clip(n[...,1],0,1)
    # soft specular, subtle
    hv=L1-fwd;hv/=np.linalg.norm(hv);spec=np.clip((n*hv).sum(-1),0,1)**40*0.18
    # darken the underside contact
    col=np.clip(base[None,None,:]*k[...,None]+spec[...,None],0,1)
    a=hit.astype(float)
    img=np.concatenate([col,a[...,None]],-1)
    im=Image.fromarray((img*255).astype(np.uint8),'RGBA')
    # premultiplied downsample
    arr=np.asarray(im).astype(float)/255;pm=arr.copy();pm[...,:3]*=pm[...,3:]
    pm=pm.reshape(H,SS,W,SS,4).mean((1,3));out=pm.copy();out[...,:3]=np.where(pm[...,3:]>0,pm[...,:3]/np.maximum(pm[...,3:],1e-6),0)
    return Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8),'RGBA')
import sys,os
PAWN={'sailor':'#2f6fb3','agronomist':'#3f8f3a','railwayman':'#8a5a2b','politician':'#6b3fa0','nurse':'#e07aa6','scientist':'#ece4cf','rural_doctor':'#e07b1a','civil_engineer':'#2c3340','palliative_nurse':'#d9dde3','student':'#c0489a','time_traveler':'#2fa37a','professor':'#e6c229'}
os.makedirs(sys.argv[1],exist_ok=True)
ONLY=os.environ.get('ONLY','').split(',') if os.environ.get('ONLY') else None
for k,c in PAWN.items():
    if ONLY and k not in ONLY:continue
    im=shade(c).crop((30,36,226,330));print(k,im.size,im.getbbox());im.save(os.path.join(sys.argv[1],'pawn_'+k+'.png'))
