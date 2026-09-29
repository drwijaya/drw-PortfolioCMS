/** Keep original PNGs unchanged and encode smaller, lossless runtime sprites. */
import sharp from 'sharp'
import { mkdir, copyFile, readFile, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = `${root}public/img/off-the-clock/buildings`
const archive = `${root}../reports/off-the-clock/buildings/source-originals`
const inputs = [
  ['film','17d580e7-3eb8-4ca3-bba5-04698ca77fc1/codex-clipboard-37275a0e-7d31-43f4-a74d-2c042be026d3.png',[92,143,1163,1062],[500,790,752,1052],'double'],
  ['music','46ac4b21-84e5-4713-9b78-7f925556a4a3/codex-clipboard-c0b1991d-28e3-4b0e-81fa-92d9e312de7f.png',[82,120,1172,1123],[580,806,678,1077],'single'],
  ['games','a4f1b549-70ce-4ab8-bd71-598e8735903b/codex-clipboard-2875cdce-6c48-475d-855d-0003e6d601be.png',[59,272,1196,1014],[527,739,727,999],'open'],
  ['homelab','d115df62-9e25-4e0e-8f05-8276d0184564/codex-clipboard-09d51016-2225-4439-9b60-8d5d2bbf3680.png',[77,233,1179,1074],[555,923,691,1060],'single'],
]
await mkdir(output,{recursive:true}); await mkdir(archive,{recursive:true})
const manifest={}
for(const [id,attachment,bounds,door,style] of inputs){
  const source=`${archive}/${id}.png`
  try {await access(source)} catch {await copyFile(`/home/winter/.codex/attachments/${attachment}`,source)}
  const bytes=await readFile(source), hash=createHash('sha256').update(bytes).digest('hex')
  const original=`${id}-${hash.slice(0,16)}.png`
  await copyFile(source,`${output}/${original}`)
  const file=`${id}-${hash.slice(0,16)}.webp`
  await sharp(bytes).webp({lossless:true,effort:6}).toFile(`${output}/${file}`)
  const metadata=await sharp(bytes).metadata()
  const [x,y,right,bottom]=bounds, width=112, scale=width/(right-x)
  const opening={x:(door[0]-x)*scale,y:(door[1]-y)*scale,w:(door[2]-door[0])*scale,h:(door[3]-door[1])*scale}
  manifest[id]={file,sha256:hash,sourceWidth:metadata.width,sourceHeight:metadata.height,
    crop:{x,y,w:right-x,h:bottom-y},width,height:(bottom-y)*scale,
    offsetX:44-opening.x-opening.w/2,offsetY:66-opening.y-opening.h,
    sourceDoor:{x:door[0],y:door[1],w:door[2]-door[0],h:door[3]-door[1]},door:opening,style}
}
await writeFile(`${root}lib/off-the-clock/building-sprites.json`,JSON.stringify(manifest,null,2)+'\n')
console.log('Original PNGs preserved; lossless WebP runtime sprites generated.')
