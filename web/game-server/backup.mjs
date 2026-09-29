import { backup } from 'node:sqlite'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { join, dirname } from 'node:path'
export function scheduleBackups(db,file){
 const folder=join(dirname(file),'backups');let busy=false
 const save=async()=>{if(busy)return;busy=true;try{await mkdir(folder,{recursive:true});const today=new Date().toISOString().slice(0,10),target=join(folder,`pantry-${today}.sqlite3`);try{await stat(target)}catch{await backup(db,target)}for(const name of await readdir(folder)){if(!/^pantry-\d{4}-\d{2}-\d{2}\.sqlite3$/.test(name))continue;const path=join(folder,name);if(Date.now()-(await stat(path)).mtimeMs>7*86400000)await unlink(path)}}catch{console.error('Pantry backup failed; check the game volume.')}finally{busy=false}}
 const timer=setInterval(()=>void save(),3600000);timer.unref();void save();return()=>clearInterval(timer)
}
