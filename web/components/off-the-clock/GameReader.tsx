'use client'
import { useEffect, useRef, useState } from 'react'
import { useSurfaceControls } from './GameControls'
import styles from './GameUI.module.css'
type ReaderProps={title:string;paragraphs:string[];onBack:()=>void;href?:string;spoilers?:string[]}
const bookmarks=new Map<string,{page:number;revealed:boolean}>()
export function GameReader(props:ReaderProps) {
  const readerKey=JSON.stringify([props.title,props.paragraphs])
  return <ReaderPage key={readerKey} readerKey={readerKey} {...props}/>
}
function ReaderPage({title,paragraphs,onBack,href,spoilers=[],readerKey}:ReaderProps&{readerKey:string}) {
  const root=useRef<HTMLDivElement>(null),measure=useRef<HTMLDivElement>(null)
  const [page,setPage]=useState(()=>bookmarks.get(readerKey)?.page??0),[pages,setPages]=useState<string[]>([]),[revealed,setRevealed]=useState(()=>bookmarks.get(readerKey)?.revealed??false)
  useEffect(()=>{bookmarks.set(readerKey,{page,revealed})},[readerKey,page,revealed])
  const text=[...paragraphs,...(revealed?spoilers:[])].join('\n\n')
  useSurfaceControls(root,true,45,onBack)
  useEffect(()=>{
    let alive=true
    void document.fonts.ready.then(()=>{
      const node=measure.current;if(!alive||!node)return
      const output:string[]=[],tokens=text.split(/(\s+)/);let current=''
      for(const token of tokens){node.textContent=current+token;if(node.scrollHeight>node.clientHeight&&current.trim()){output.push(current.trim());current=token.trimStart()}else current+=token}
      if(current.trim())output.push(current.trim());node.textContent='';setPages(output.length?output:['No notes available.'])
    });return()=>{alive=false}
  },[text])
  const index=Math.min(page,Math.max(0,pages.length-1))
  return <div className={styles.screen} ref={root} data-ui-screen="reader"><header className={styles.header}><h2>{title}</h2><span>{index+1}/{pages.length||1}</span></header><div style={{position:'relative'}}><p className={styles.reader} style={{height:252}}>{pages[index]??'Preparing page…'}</p><div ref={measure} aria-hidden className={styles.reader} style={{position:'absolute',inset:0,visibility:'hidden',height:252}}/></div><footer className={styles.footer}><button disabled={!index} onClick={()=>setPage(index-1)} aria-label="Previous page">‹</button><button data-autofocus disabled={index>=pages.length-1} onClick={()=>setPage(index+1)} aria-label="Next page">Next ›</button>{spoilers.length>0&&!revealed&&<button onClick={()=>setRevealed(true)}>Reveal spoilers</button>}{href&&<a href={href} target="_blank" rel="noreferrer">Full page ↗</a>}<button onClick={onBack}>B · Back</button></footer></div>
}
