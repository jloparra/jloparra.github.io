import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const path of ['index.html','favicon.svg','manifest.webmanifest','service-worker.js','src','styles','legal'])await cp(path,`dist/${path}`,{recursive:true});
console.log('Build created in dist/');
