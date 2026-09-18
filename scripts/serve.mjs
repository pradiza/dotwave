import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import handler from '../api/contact.js';
const root=new URL('../dist/',import.meta.url).pathname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/_vercel/')){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end('/* Analytics disabled on local preview. */');}
  if(url.pathname==='/api/contact'){
    let body='';for await(const chunk of req){body+=chunk;if(body.length>20000){res.writeHead(413);return res.end();}}
    req.body=body;res.status=n=>(res.statusCode=n,res);res.json=d=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d));};res.send=d=>res.end(d);
    return handler(req,res);
  }
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!target.startsWith(root)){res.writeHead(403);return res.end();}
  if(url.pathname==='/')target=path.join(root,'index.html');else if(!path.extname(target))target+='.html';
  try{const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(path.join(root,'404.html')));}
}).listen(4173,'127.0.0.1',()=>console.log('dot.wave preview: http://127.0.0.1:4173'));
