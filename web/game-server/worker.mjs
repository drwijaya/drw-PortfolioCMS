import { parentPort } from 'node:worker_threads'
import { initPhysics, replay, validateReplay } from './dist/core.mjs'
await initPhysics()
parentPort.on('message',({seed,events,endTick})=>{
 try{const input=validateReplay({events,endTick});const state=replay(seed,input.events,input.endTick);parentPort.postMessage({ok:true,score:state.score,highest:state.highest,merges:state.merges,drops:state.drops,ticks:state.tick})}
 catch{parentPort.postMessage({ok:false,error:'This run could not be verified. Your local score is still yours.'})}
})
