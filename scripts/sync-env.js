const fs=require('fs');
const src='.env.local';
const dst='.env';
if(!fs.existsSync(src)){console.log('[sync-env] .env.local não existe, pulei');process.exit(0);} 
const a=fs.readFileSync(src,'utf8');
let b='';try{b=fs.readFileSync(dst,'utf8')}catch{}
if(a!==b){fs.writeFileSync(dst,a);console.log('[sync-env] .env <- .env.local');}else{console.log('[sync-env] .env já está alinhado');}
