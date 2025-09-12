const BASE=process.env.BASE_URL||'http://localhost:3000';

(async()=>{
  const r=await fetch(`${BASE}/api/v1/openapi.json`);
  if(!r.ok){ 
    console.error('❌ openapi.json ausente',r.status); 
    process.exit(1); 
  }
  const d=await r.json();
  if(!(d.openapi&&d.paths)){ 
    console.error('❌ openapi inválido'); 
    process.exit(1); 
  }
  // exemplos mínimos
  const some=Object.values(d.paths||{}).some(p=>Object.values(p).some(op=>op?.responses));
  if(!some){ 
    console.error('❌ openapi sem exemplos/responses'); 
    process.exit(1); 
  }
  console.log('✅ OpenAPI ok');
})().catch(e=>{console.error(e);process.exit(1)});
