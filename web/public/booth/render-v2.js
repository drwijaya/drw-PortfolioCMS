export const layouts = {
  cinema: { name:'Cinema 143',w:360,h:810,x:36,y:36,fw:286,fh:200,gap:44,ratio:'1.43:1' },
  classic:{ name:'Classic Three',w:288,h:840,x:24,y:24,fw:240,fh:240,gap:12,ratio:'1:1' },
  portrait:{ name:'Portrait Ticket',w:288,h:1020,x:24,y:24,fw:240,fh:300,gap:12,ratio:'4:5' },
};
export const palettes={classic:['#2e2a26','#9c5833','#e3d4bd','#fff1ea'],night:['#1c1310','#3f2e23','#d98a5c','#f2ece3']};
const rgb=key=>palettes[key].map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
export function quantize(canvas,settings,exact=false){
  const c=canvas.getContext('2d',{willReadFrequently:true}),im=c.getImageData(0,0,canvas.width,canvas.height),colors=rgb(settings.palette);
  for(let i=0;i<im.data.length;i+=4){const d=im.data;let color;
    if(exact){let distance=Infinity;for(const candidate of colors){const n=(d[i]-candidate[0])**2+(d[i+1]-candidate[1])**2+(d[i+2]-candidate[2])**2;if(n<distance){distance=n;color=candidate}}}
    else{const n=i/4,x=n%canvas.width,y=Math.floor(n/canvas.width),contrast=settings.tone==='soft'?.78:settings.tone==='bold'?1.3:1;const light=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]-128)*contrast+128+settings.exposure+(((x*13+y*7)%16)/15-.5)*settings.grain;color=colors[Math.max(0,Math.min(3,Math.floor(light/64)))];}
    d[i]=color[0];d[i+1]=color[1];d[i+2]=color[2];d[i+3]=255;
  }c.putImageData(im,0,0);
}
export function renderPhoto(canvas,source,settings,crop={x:50,y:50},mirror=false){
  const c=canvas.getContext('2d'),sw=source.videoWidth||source.width,sh=source.videoHeight||source.height;if(!sw||!sh)return;
  const scale=Math.max(canvas.width/sw,canvas.height/sh),cw=canvas.width/scale,ch=canvas.height/scale;
  c.save();c.fillStyle=palettes[settings.palette][3];c.fillRect(0,0,canvas.width,canvas.height);if(mirror){c.translate(canvas.width,0);c.scale(-1,1)}c.drawImage(source,(sw-cw)*crop.x/100,(sh-ch)*crop.y/100,cw,ch,0,0,canvas.width,canvas.height);c.restore();quantize(canvas,settings);
}
export function drawStrip(canvas,id,photos,settings,details={}){
  const l=layouts[id],p=palettes[settings.palette],film=id==='cinema';canvas.width=l.w;canvas.height=l.h;const c=canvas.getContext('2d');c.fillStyle=film?p[0]:p[3];c.fillRect(0,0,l.w,l.h);
  if(film){c.fillStyle=p[3];for(let y=12;y<l.h-12;y+=22){c.fillRect(9,y,13,12);c.fillRect(l.w-22,y,13,12)}}
  if(id==='portrait'){c.fillStyle=p[1];for(let y=9;y<l.h;y+=12){c.fillRect(6,y,3,5);c.fillRect(l.w-9,y,3,5)}}
  const frame=document.createElement('canvas');frame.width=l.fw;frame.height=l.fh;
  for(let i=0;i<3;i++){const y=l.y+i*(l.fh+l.gap),photo=photos[i];c.fillStyle=p[2];c.fillRect(l.x,y,l.fw,l.fh);
    if(photo){renderPhoto(frame,photo.source,settings,photo.crops[id],photo.mirror);c.drawImage(frame,l.x,y)}else{c.fillStyle=p[1];c.beginPath();c.arc(l.x+l.fw/2,y+l.fh*.35,l.fw*.12,0,Math.PI*2);c.fill();c.fillRect(l.x+l.fw*.27,y+l.fh*.53,l.fw*.46,l.fh*.28);}
    if(film){c.fillStyle=p[3];c.font='bold 10px monospace';c.textAlign='left';c.fillText(`0${i+1}  ▸  OFF THE CLOCK`,l.x,y+l.fh+19);c.textAlign='right';c.fillText('1.43:1',l.x+l.fw,y+l.fh+19)}
  }
  c.fillStyle=film?p[3]:p[0];c.textAlign='center';c.font='bold 12px monospace';c.fillText('OFF THE CLOCK',l.w/2,l.h-38);c.font='bold 10px monospace';const caption=(details.caption||'THREE FRAMES · ONE LITTLE MEMORY');c.fillText(caption,l.w/2,l.h-22,l.w-32);if(details.date){c.font='9px monospace';c.fillText(details.date,l.w/2,l.h-8)}
  quantize(canvas,settings,true);frame.width=0;
}
export function makePhoto(source,mirror=false){const w=source.videoWidth||source.width,h=source.videoHeight||source.height;if(!w||!h)throw Error('Camera warming up. Try again in a moment.');if(w*h>60000000)throw Error('This photo is too large. Choose a smaller image.');const scale=Math.min(1,960/Math.max(w,h)),canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);return{source:canvas,mirror,crops:Object.fromEntries(Object.keys(layouts).map(k=>[k,{x:50,y:50}]))};}
