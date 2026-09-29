import http from 'node:http'
import { createHash, randomBytes, randomUUID, createHmac } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { Worker } from 'node:worker_threads'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { RULES_VERSION } from './dist/config.mjs'
import { validateReplay } from './dist/core.mjs'
import { scheduleBackups } from './backup.mjs'

const PORT=Number(process.env.PORT||8081), file=process.env.PANTRY_DB||'/data/pantry.sqlite3'
const origins=new Set((process.env.PANTRY_ORIGINS||'https://davidrwijaya.site').split(','))
const cookieSecure=process.env.COOKIE_SECURE!=='false'
const cookieName='pantry-player', cookiePath='/api/off-the-clock/pantry'
mkdirSync(dirname(file),{recursive:true})
const db=new DatabaseSync(file)
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,owner TEXT NOT NULL,seed INTEGER NOT NULL,version TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open',digest TEXT,result TEXT);
CREATE INDEX IF NOT EXISTS runs_owner ON runs(owner,created);
CREATE TABLE IF NOT EXISTS scores(id TEXT PRIMARY KEY,owner TEXT NOT NULL,version TEXT NOT NULL,initials TEXT NOT NULL,score INTEGER NOT NULL,highest INTEGER NOT NULL,created INTEGER NOT NULL,UNIQUE(owner,version));
CREATE INDEX IF NOT EXISTS scores_board ON scores(version,score DESC,created);
PRAGMA user_version=1;`)
// A restart cannot complete an old in-memory job. Permit its identical replay to be retried.
db.exec("UPDATE runs SET status='open' WHERE status='pending'")
const stopBackups=process.env.PANTRY_BACKUPS==='off'?()=>{}:scheduleBackups(db,file)
let lastSweep=0, active=0
const rate=new Map(), rateSecret=randomBytes(32)
const hash=value=>createHash('sha256').update(value).digest('hex')
function owner(req){const raw=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);return raw&&/^[a-f0-9]{64}$/.test(raw)?hash(raw):null}
function sweep(){const now=Date.now();if(now-lastSweep<60000)return;lastSweep=now;db.prepare('DELETE FROM runs WHERE expires < ?').run(now-86400000);for(const[k,v]of rate)if(v.until<now)rate.delete(k)}
function limit(key,max){const now=Date.now();let item=rate.get(key);if(!item||item.until<now){if(rate.size>=10000)return false;item={count:0,until:now+60000};rate.set(key,item)}return ++item.count<=max}
function networkKey(req){return createHmac('sha256',rateSecret).update(req.headers['x-pantry-network']||req.socket.remoteAddress||'unknown').digest('hex')}
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data))}
function readJSON(req){return new Promise((resolve,reject)=>{let size=0;const parts=[];req.on('data',chunk=>{size+=chunk.length;if(size>65536){reject(Error('large'));return}parts.push(chunk)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString()))}catch{reject(Error('json'))}})})}
const publicEntry=row=>row?{id:row.id,initials:row.initials,score:row.score,highest:row.highest,date:new Date(row.created).toISOString(),rank:1+Number(db.prepare('SELECT COUNT(*) n FROM scores WHERE version=? AND score>?').get(row.version,row.score).n)}:null
function resultFor(run){return {status:run.status,...(run.result?JSON.parse(run.result):{})}}
function verify(run,input,initials){
 active++
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{resourceLimits:{maxOldGenerationSizeMb:128}})
 let done=false
 const finish=result=>{
  if(done)return;done=true;clearTimeout(timer);active--;void worker.terminate()
  const latest=db.prepare('SELECT status FROM runs WHERE id=?').get(run.id)
  if(latest?.status!=='pending')return
  if(!result.ok){db.prepare("UPDATE runs SET status='rejected',result=? WHERE id=?").run(JSON.stringify({error:result.error||'Verification failed. Try a new run.'}),run.id);return}
  if(result.score<=0||result.merges<1){db.prepare("UPDATE runs SET status='rejected',result=? WHERE id=?").run(JSON.stringify({error:'Make at least one merge to join the board.'}),run.id);return}
  db.exec('BEGIN IMMEDIATE')
  try{
   db.prepare(`INSERT INTO scores(id,owner,version,initials,score,highest,created) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner,version) DO UPDATE SET initials=excluded.initials,score=excluded.score,highest=excluded.highest,created=excluded.created WHERE excluded.score>scores.score`).run(randomUUID(),run.owner,run.version,initials,result.score,result.highest,Date.now())
   const entry=publicEntry(db.prepare('SELECT * FROM scores WHERE owner=? AND version=?').get(run.owner,run.version))
   db.prepare("UPDATE runs SET status='accepted',result=? WHERE id=?").run(JSON.stringify({verifiedScore:result.score,entry}),run.id)
   db.exec('COMMIT')
  }catch{db.exec('ROLLBACK');db.prepare("UPDATE runs SET status='open' WHERE id=?").run(run.id)}
 }
 const timer=setTimeout(()=>finish({ok:false,error:'This run exceeded the verification limit. Your device best is kept.'}),30000)
 worker.once('message',finish);worker.once('error',()=>finish({ok:false}));worker.once('exit',code=>{if(code!==0&&!done)finish({ok:false})})
 worker.postMessage({seed:run.seed,...input})
}
const server=http.createServer(async(req,res)=>{
 try{
  sweep();const url=new URL(req.url,'http://game-api'),path=url.pathname,method=req.method
  if(path==='/health')return send(res,200,{ok:true,rules:RULES_VERSION})
  if(!path.startsWith('/pantry/'))return send(res,404,{error:'Not found.'})
  if(method!=='GET'&&(!origins.has(req.headers.origin)||!['same-origin','none',undefined].includes(req.headers['sec-fetch-site'])))return send(res,403,{error:'Open the game on this website to continue.'})
  const net=networkKey(req)
  if(!limit('all:'+net,240))return send(res,429,{error:'Too many requests. Please wait a minute.'},{'Retry-After':'60'})
  let who=owner(req)
  if(path==='/pantry/leaderboard'&&method==='GET'){
   const version=url.searchParams.get('version')||RULES_VERSION
   if(version!==RULES_VERSION)return send(res,400,{error:'This rules version is unavailable.'})
   const rows=db.prepare('SELECT * FROM scores WHERE version=? ORDER BY score DESC,created ASC,id ASC LIMIT 20').all(version).map(publicEntry)
   return send(res,200,{version,entries:rows,record:rows[0]||null,updatedAt:new Date().toISOString()},{'Cache-Control':'public, max-age=15'})
  }
  if(path==='/pantry/me'&&method==='GET')return send(res,200,{entry:who?publicEntry(db.prepare('SELECT * FROM scores WHERE owner=? AND version=?').get(who,RULES_VERSION)):null})
  if(path==='/pantry/me/entry'&&method==='DELETE'){
   if(!who)return send(res,401,{error:'No ranked browser identity was found.'})
   db.exec('BEGIN IMMEDIATE');try{db.prepare('DELETE FROM scores WHERE owner=?').run(who);db.prepare("UPDATE runs SET status='revoked',result=NULL WHERE owner=?").run(who);db.exec('COMMIT')}catch{db.exec('ROLLBACK');throw Error('delete')}
   return send(res,200,{removed:true})
  }
  if(path==='/pantry/runs'&&method==='POST'){
   if(process.env.PANTRY_RANKED==='off')return send(res,503,{error:'Ranked runs are resting. Practice is available.'})
   if(!limit('start-net:'+net,30))return send(res,429,{error:'Please wait a minute before starting another ranked run.'},{'Retry-After':'60'})
   let cookie
   if(!who){const token=randomBytes(32).toString('hex');who=hash(token);cookie=`${cookieName}=${token}; Path=${cookiePath}; Max-Age=7776000; HttpOnly; SameSite=Strict${cookieSecure?'; Secure':''}`}
   if(!limit('start:'+who,6))return send(res,429,{error:'Please wait a minute, or play Practice.'},{'Retry-After':'60'})
   if(Number(db.prepare("SELECT COUNT(*) n FROM runs WHERE status='open' AND expires>?").get(Date.now()).n)>5000)return send(res,503,{error:'The leaderboard is busy. Practice is available.'})
   // Keep at most three active tickets. Old abandoned intros cannot lock a player out for two hours.
   const old=db.prepare("SELECT id FROM runs WHERE owner=? AND status='open' ORDER BY created DESC LIMIT -1 OFFSET 2").all(who)
   for(const row of old)db.prepare("UPDATE runs SET status='revoked' WHERE id=?").run(row.id)
   const id=randomUUID(),seed=randomBytes(4).readUInt32LE(),now=Date.now(),expires=now+7200000
   db.prepare('INSERT INTO runs(id,owner,seed,version,created,expires) VALUES(?,?,?,?,?,?)').run(id,who,seed,RULES_VERSION,now,expires)
   return send(res,201,{id,seed,version:RULES_VERSION,expiresAt:new Date(expires).toISOString()},cookie?{'Set-Cookie':cookie}:{})
  }
  const match=path.match(/^\/pantry\/runs\/([a-f0-9-]{36})\/(submit|status)$/)
  if(match){
   if(!who)return send(res,401,{error:'This ranked session is unavailable. Start a new run.'})
   const run=db.prepare('SELECT * FROM runs WHERE id=? AND owner=?').get(match[1],who)
   if(!run)return send(res,404,{error:'Run not found for this browser.'})
   if(match[2]==='status'&&method==='GET')return send(res,200,resultFor(run))
   if(match[2]==='submit'&&method==='POST'){
    if(process.env.PANTRY_SUBMISSIONS==='off')return send(res,503,{error:'Submissions are temporarily paused. Please retry later.'})
    if(!limit('submit:'+who,10)||!limit('submit-net:'+net,30))return send(res,429,{error:'Please wait a minute before retrying.'},{'Retry-After':'60'})
    if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'Expected a game replay.'})
    let data;try{data=await readJSON(req)}catch{return send(res,400,{error:'Invalid or oversized replay.'})}
    const initials=typeof data?.initials==='string'?data.initials:''
    if(!/^[A-Z0-9]{3}$/.test(initials)||['ASS','SEX','FUK','KKK','FAG','NIG'].includes(initials))return send(res,400,{error:'Choose three other letters or numbers.'})
    let input;try{input=validateReplay(data)}catch{return send(res,400,{error:'Invalid replay.'})}
    const digest=hash(JSON.stringify({initials,...input}))
    if(run.digest&&run.digest!==digest)return send(res,409,{error:'This run was already submitted with different details.'})
    if(run.status==='accepted'||run.status==='pending'||run.status==='rejected')return send(res,run.status==='pending'?202:200,resultFor(run))
    if(run.status!=='open'||run.expires<Date.now()||run.version!==RULES_VERSION)return send(res,410,{error:'This ranked ticket expired. Your local best is still kept.'})
    if(active>=2)return send(res,503,{error:'The verifier is busy. Please retry shortly.'},{'Retry-After':'5'})
    db.prepare("UPDATE runs SET status='pending',digest=? WHERE id=?").run(digest,run.id)
    verify(run,input,initials)
    return send(res,202,{status:'pending'})
   }
  }
  send(res,404,{error:'Not found.'})
 }catch{if(!res.headersSent)send(res,500,{error:'The leaderboard could not complete that request. Please retry.'});else res.end()}
})
server.requestTimeout=15000;server.headersTimeout=10000
server.listen(PORT,process.env.HOST||'0.0.0.0',()=>console.log(`Pantry score service ready on ${PORT}; rules ${RULES_VERSION}`))
process.on('SIGTERM',()=>{stopBackups();server.close(()=>{db.close();process.exit(0)})})
