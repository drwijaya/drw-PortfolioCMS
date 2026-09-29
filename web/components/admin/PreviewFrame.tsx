"use client";
import { useState,useEffect,useRef } from 'react';
import Link from 'next/link';
import { AdminBrand, BackIcon } from './AdminBrand';
export function PreviewFrame({id,version}:{id:string;version:number}){
 const [width,setWidth]=useState(1440),[theme,setTheme]=useState('light'),[ready,setReady]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===frame.current?.contentWindow&&event.data==='cms-preview-ready')setReady(true)};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[]);
 return <main className="cms-preview-frame">
  <header className="cms-preview-header">
   <div className="cms-preview-identity"><Link href="/admin" aria-label="Dashboard admin"><AdminBrand/></Link><span className="cms-preview-divider"/><div><span className="cms-eyebrow">Preview privat</span><strong>Revisi {version}</strong><small>Belum tampil di website publik</small></div></div>
   <div className="cms-preview-navigation"><Link className="cms-back-link" href={`/admin/edit/${id}`}><BackIcon/> Kembali ke editor</Link>{ready?<Link className="cms-preview-review" href={`/admin/edit/${id}?review=1`}>Lanjut ke review <span aria-hidden="true">→</span></Link>:<span role="status">Memuat preview…</span>}</div>
  </header>
  <div className="cms-preview-controls"><div className="cms-device-switch" role="group" aria-label="Ukuran preview">{([[1440,'Desktop'],[768,'Tablet'],[390,'Mobile']] as const).map(([size,label])=><button key={size} aria-pressed={width===size} onClick={()=>setWidth(size)}>{label}</button>)}</div><span className="cms-preview-dimensions">{width} px</span><button className="cms-preview-theme" onClick={()=>{setReady(false);setTheme(theme==='light'?'dark':'light')}} aria-label={theme==='light'?'Preview mode gelap':'Preview mode terang'}>{theme==='light'?'Mode terang':'Mode gelap'} <span aria-hidden="true">◐</span></button></div>
  <div className="cms-preview-stage"><div className="cms-preview-viewport" style={{width}}><iframe ref={frame} title="Preview website privat" src={`/admin/preview/${id}?frame=1&theme=${theme}`} onLoad={()=>setReady(true)}/></div></div>
 </main>
}
