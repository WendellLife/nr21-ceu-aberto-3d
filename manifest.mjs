// Gera MANIFESTO-SHA256.json com o hash SHA-256 de cada arquivo de dist/ (para conferir uma publicação).
// Uso: npm run manifest
import {createHash} from 'node:crypto';
import {readdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const files=[];
(function walk(dir){for(const name of readdirSync(dir).sort()){const p=join(dir,name);if(statSync(p).isDirectory())walk(p);else files.push(p);}})(root);
const entries={};
for(const p of files)entries[relative(root,p).split(sep).join('/')]=createHash('sha256').update(readFileSync(p)).digest('hex');
const out={algoritmo:'SHA-256',pasta:'dist/',arquivos:entries};
writeFileSync(fileURLToPath(new URL('./MANIFESTO-SHA256.json',import.meta.url)),JSON.stringify(out,null,1)+'\n');
console.log(`Manifesto gerado: ${files.length} arquivos.`);
