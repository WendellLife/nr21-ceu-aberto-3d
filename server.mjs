import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.PORT||8765);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT deve ser uma porta entre 1 e 65535.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.glb':'model/gltf-binary'};
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Acesso negado');return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`A porta ${port} já está em uso. Feche o outro servidor ou defina PORT com outro número.`:e.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>console.log(`\nNR 21 — Trabalhos a céu aberto\nAbra no navegador: http://127.0.0.1:${port}\nMantenha esta janela aberta. Para encerrar, pressione Ctrl+C.\n`));
