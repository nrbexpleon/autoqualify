import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assess, validateInput } from './engine.mjs';
import { Store } from './store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new Store(path.resolve(process.env.DATA_DIR || path.join(root,'data')));
await store.init();
const port = Number(process.env.PORT || 3000);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json' };

async function body(req) { let data=''; for await (const c of req) { data += c; if (data.length > 2_000_000) throw Object.assign(new Error('Request too large'),{status:413}); } return data ? JSON.parse(data) : {}; }
function send(res,status,data,type='application/json; charset=utf-8') { res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY'}); res.end(type.startsWith('application/json') ? JSON.stringify(data) : data); }

async function route(req,res) {
  const url = new URL(req.url,`http://${req.headers.host || 'localhost'}`);
  if (req.method==='GET' && url.pathname==='/api/health') return send(res,200,{status:'ok',service:'AutoQualify',time:new Date().toISOString()});
  if (req.method==='GET' && url.pathname==='/api/assessments') return send(res,200,await store.list());
  if (req.method==='POST' && url.pathname==='/api/assessments') {
    const input=await body(req), errors=validateInput(input); if(errors.length) return send(res,400,{errors});
    const result=assess(input); const record=await store.create({status:'REVIEW_REQUIRED',input,result,audit:[{at:new Date().toISOString(),action:'ASSESSMENT_CREATED'}]}); return send(res,201,record);
  }
  const m=url.pathname.match(/^\/api\/assessments\/([a-f0-9-]+)(?:\/(review|report))?$/i);
  if(m && req.method==='GET' && !m[2]) return send(res,200,await store.get(m[1]));
  if(m && req.method==='GET' && m[2]==='report') { const r=await store.get(m[1]); return send(res,200,{id:r.id,status:r.status,component:r.input.component,result:r.result,review:r.review||null,audit:r.audit}); }
  if(m && req.method==='POST' && m[2]==='review') {
    const r=await store.get(m[1]), input=await body(req); if(!input.reviewer?.trim()) return send(res,400,{error:'Reviewer is required.'});
    if(!['APPROVED','REJECTED','REWORK'].includes(input.disposition)) return send(res,400,{error:'Disposition must be APPROVED, REJECTED, or REWORK.'});
    r.review={reviewer:input.reviewer.trim(),disposition:input.disposition,notes:String(input.notes||''),at:new Date().toISOString()}; r.status=`HUMAN_${input.disposition}`; r.audit.push({at:r.review.at,action:r.status,reviewer:r.review.reviewer}); await store.save(r); return send(res,200,r);
  }
  if(req.method==='GET') {
    const file=url.pathname==='/'?'index.html':url.pathname.replace(/^\/+/,''), target=path.join(root,'public',path.normalize(file));
    if(!target.startsWith(path.join(root,'public'))) return send(res,403,{error:'Forbidden'});
    try { const data=await readFile(target); return send(res,200,data,mime[path.extname(target)]||'application/octet-stream'); } catch { return send(res,404,{error:'Not found'}); }
  }
  return send(res,404,{error:'Not found'});
}

http.createServer((req,res)=>route(req,res).catch(e=>{console.error(e);send(res,e.status||500,{error:e.message||'Unexpected error'});})).listen(port,'0.0.0.0',()=>console.log(`AutoQualify listening on ${port}`));
