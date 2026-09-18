import { createHash } from 'node:crypto';
const recipient = 'dotwave.creative@gmail.com';
const fields = {name:160,company:160,email:254,market:160,message:6000,support:40,timeline:160,language:2,website:200};
const allowedSupport = ['', 'research', 'partnerships', 'creative', 'live', 'other'];
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const data = {};
  for (const [key,max] of Object.entries(fields)) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max) return null;
    data[key] = value.trim();
  }
  if (!['en','ja'].includes(data.language)) data.language = 'en';
  if (data.website) return { ...data, spam:true };
  if (['name','company','market'].some(k=>!data[k]) || data.message.length<10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.email) || !allowedSupport.includes(data.support)) return null;
  return data;
}
const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function respond(req,res,status,ok,language='en') {
  res.setHeader('Cache-Control','no-store');
  const success=language==='ja'?'お問い合わせを受け付けました。内容を確認し、ご記入のメールアドレスへご連絡します。':'Thank you. We’ve received your project inquiry. We’ll review it and reply to the email provided.';
  const failure=language==='ja'?'送信を確認できませんでした。再度お試しいただくか、メールで直接ご連絡ください。':'We couldn’t confirm delivery. Please try again or email us directly.';
  if ((req.headers.accept||'').includes('application/json')) return res.status(status).json({ok});
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(status).send(`<!doctype html><html lang="${language}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>dot.wave</title><link rel="stylesheet" href="/styles.css"><main class="section"><h1>dot<span class="red">.</span>wave</h1><p role="status">${escape(ok?success:failure)}</p><p><a href="mailto:${recipient}">${recipient}</a></p><a href="${language==='ja'?'/ja':''}/contact">${language==='ja'?'お問い合わせに戻る':'Back to contact'}</a></main></html>`);
}
export function createHandler({env=process.env,send=fetch}={}) {
  return async function handler(req,res) {
    if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(req,res,405,false);}
    if(Number(req.headers['content-length']||0)>20000)return respond(req,res,413,false);
    const origin=req.headers.origin;
    if(origin){try{if(new URL(origin).host!==req.headers.host)return respond(req,res,403,false);}catch{return respond(req,res,403,false);}}
    const type=(req.headers['content-type']||'').split(';')[0];
    if(!['application/json','application/x-www-form-urlencoded'].includes(type))return respond(req,res,415,false);
    let input=req.body;
    try {
      if(typeof input==='string'){
        if(Buffer.byteLength(input)>20000)return respond(req,res,413,false);
        input=type==='application/json'?JSON.parse(input):Object.fromEntries(new URLSearchParams(input));
      }
    }catch{return respond(req,res,400,false);}
    const data=validate(input);
    if(!data)return respond(req,res,400,false);
    if(data.spam)return respond(req,res,200,true,data.language);
    // Fail closed: never claim receipt before the configured delivery provider accepts it.
    const formspreeId=env.FORMSPREE_FORM_ID;
    if(formspreeId && !/^[a-zA-Z0-9]+$/.test(formspreeId))return respond(req,res,503,false,data.language);
    if(!formspreeId && (!env.RESEND_API_KEY || !env.CONTACT_FROM))return respond(req,res,503,false,data.language);
    const {website,spam,...safe}=data;
    const body=Object.entries(safe).map(([k,v])=>`${k}: ${v}`).join('\n\n');
    // Provider-level idempotency prevents duplicate sends on retries within a day.
    const key=createHash('sha256').update(JSON.stringify(safe)+new Date().toISOString().slice(0,10)).digest('hex');
    try {
      if(formspreeId){
        const result=await send('https://formspree.io/f/'+formspreeId,{
          method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
          body:JSON.stringify({...safe,_subject:'dot.wave — Project inquiry'}),
          signal:AbortSignal.timeout(12000)
        });
        const accepted=result.ok && (await result.json()).ok===true;
        return respond(req,res,accepted?200:502,accepted,data.language);
      }
      const result=await send('https://api.resend.com/emails',{
        method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':key},
        body:JSON.stringify({from:env.CONTACT_FROM,to:[recipient],reply_to:data.email,subject:'dot.wave — Project inquiry',text:body}),
        signal:AbortSignal.timeout(12000)
      });
      if(!result.ok)return respond(req,res,502,false,data.language);
      return respond(req,res,200,true,data.language);
    }catch{return respond(req,res,502,false,data.language);}
  };
}
export default createHandler();
