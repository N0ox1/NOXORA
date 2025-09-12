import prisma from '../src/lib/prisma.ts';
async function main(){
 const maps = prisma._dmmf?.mappings?.modelOperations ?? [];
 console.log(JSON.stringify({ models: maps.map(m=>m.model) }, null, 2));
}
main().finally(()=>process.exit(0));