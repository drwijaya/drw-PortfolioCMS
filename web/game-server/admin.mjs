// Run privately inside the score-service container. Never exposed as an HTTP route.
import { DatabaseSync } from 'node:sqlite'
const id=process.argv[2]
if(!/^[a-f0-9-]{36}$/.test(id||'')){console.error('Usage: node game-server/admin.mjs SCORE_ID');process.exit(1)}
const db=new DatabaseSync(process.env.PANTRY_DB||'/data/pantry.sqlite3')
const row=db.prepare('SELECT owner FROM scores WHERE id=?').get(id)
if(row){db.exec('BEGIN IMMEDIATE');db.prepare('DELETE FROM scores WHERE id=?').run(id);db.prepare("UPDATE runs SET status='revoked',result=NULL WHERE owner=?").run(row.owner);db.exec('COMMIT')}
db.close();console.log(row?'Score removed.':'Score not found.')
