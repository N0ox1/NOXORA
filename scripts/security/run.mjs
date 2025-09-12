import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const steps=['jwt','tenant','rbac','lockout','cors_csrf'];

(async()=>{
  for(const s of steps){
    const mod = join(__dirname, `${s}.mjs`);
    console.log(`\n▶ Executando ${s}.mjs`);
    const p = spawn(process.execPath, ['--no-warnings', mod], {stdio:'inherit'});
    const code = await new Promise(r => p.on('close', r));
    if(code !== 0) {
      process.exitCode = code;
      break;
    }
  }
})()
