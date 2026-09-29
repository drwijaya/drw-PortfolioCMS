import ts from 'typescript'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
const destination=new URL('./dist/',import.meta.url)
await mkdir(destination,{recursive:true})
for(const name of ['config','core']){
 const source=await readFile(new URL(`../lib/off-the-clock/pantry/${name}.ts`,import.meta.url),'utf8')
 const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./config'","'./config.mjs'")
 await writeFile(new URL(`${name}.mjs`,destination),output)
}
