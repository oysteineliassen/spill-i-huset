from PIL import Image,ImageDraw
import random
def ikon(n):
    im=Image.new('RGB',(n,n),'#0e1622');g=ImageDraw.Draw(im);k=n/512
    for i in range(60):
        import random;random.seed(i);x,y=random.random()*n,random.random()*n*0.55;r=max(1,int(2*k));g.ellipse([x-r,y-r,x+r,y+r],fill='#c9d6e6')
    g.rectangle([0,int(380*k),n,n],fill='#eef3f9')
    g.rectangle([int(140*k),int(250*k),int(372*k),int(400*k)],fill='#5a6270')
    g.polygon([(int(110*k),int(260*k)),(int(256*k),int(140*k)),(int(402*k),int(260*k))],fill='#2c313a')
    g.polygon([(int(110*k),int(260*k)),(int(256*k),int(140*k)),(int(402*k),int(260*k)),(int(380*k),int(268*k)),(int(256*k),int(165*k)),(int(132*k),int(268*k))],fill='#f4f7fb')
    g.rectangle([int(236*k),int(320*k),int(276*k),int(400*k)],fill='#f4f1ea')
    for x0 in (170,300):g.rectangle([int(x0*k),int(290*k),int((x0+42)*k),int(330*k)],fill='#ffd27a')
    g.polygon([(int(300*k),int(150*k)),(int(350*k),int(60*k)),(int(372*k),int(150*k))],fill='#d42a35')
    g.rectangle([int(292*k),int(146*k),int(380*k),int(166*k)],fill='#ffffff');r=int(16*k);g.ellipse([int(350*k)-r,int(60*k)-r,int(350*k)+r,int(60*k)+r],fill='#ffffff')
    return im
