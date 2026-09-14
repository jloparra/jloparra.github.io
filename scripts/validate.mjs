import {readdir,readFile} from 'node:fs/promises';
const required=['index.html','src/app.mjs','src/decision-engine.mjs','styles/tokens.css','styles/base.css','styles/components.css'];
for(const file of required){const text=await readFile(file,'utf8');if(!text.trim())throw new Error(`${file} is empty`)}
const files=await readdir('src');for(const file of files.filter(x=>x.endsWith('.mjs'))){const text=await readFile(`src/${file}`,'utf8');if(/\beval\s*\(/.test(text))throw new Error(`eval is not allowed: ${file}`)}
console.log('Static validation passed');
