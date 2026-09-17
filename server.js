import http from 'http';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=process.env.PORT||3000;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer((req,res)=>{
  let url=decodeURIComponent((req.url||'/').split('?')[0]);
  if(url==='/')url='/index.html';
  const file=path.normalize(path.join(root,url));
  if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(port,()=>console.log(`Everlight listening on ${port}`));
