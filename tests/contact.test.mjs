import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,validate} from '../api/contact.js';
const valid={name:'Test Person',company:'Example',email:'test@example.com',market:'Indonesia',message:'A test project inquiry.',language:'en'};
function response(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;},send(body){this.body=body;return this;}};}
const request=(body=valid,more={})=>({method:'POST',headers:{'content-type':'application/json',accept:'application/json',host:'dotwave.vercel.app',origin:'https://dotwave.vercel.app'},body,...more});
test('Formspree delivery requires explicit provider acceptance',async()=>{
  for(const accepted of [true,false]){
    let sent;const res=response();
    await createHandler({env:{FORMSPREE_FORM_ID:'exampleid'},send:async(url,options)=>{sent={url,...options};return {ok:true,json:async()=>({ok:accepted})};}})(request(),res);
    assert.equal(sent.url,'https://formspree.io/f/exampleid');
    assert.equal(JSON.parse(sent.body).email,valid.email);
    assert.equal(JSON.parse(sent.body).website,undefined);
    assert.equal(res.statusCode,accepted?200:502);
    assert.equal(res.body.ok,accepted);
  }
});
test('invalid Formspree configuration never sends data elsewhere',async()=>{
  let sent=false;const res=response();
  await createHandler({env:{FORMSPREE_FORM_ID:'../other'},send:async()=>{sent=true;}})(request(),res);
  assert.equal(sent,false);assert.equal(res.statusCode,503);
});
test('validates required fields, length, email and support',()=>{assert.ok(validate(valid));for(const patch of [{name:''},{email:'bad'},{email:'a@b.com\r\nBcc:x@y.com'},{message:'short'},{message:'x'.repeat(6001)},{support:'invalid'}])assert.equal(validate({...valid,...patch}),null);});
test('missing credentials never produces a false success',async()=>{const res=response();await createHandler({env:{}})(request(),res);assert.equal(res.statusCode,503);assert.equal(res.body.ok,false);});
test('rejects method, cross-origin, unsupported payload and malformed JSON',async()=>{const handler=createHandler({env:{}});for(const [req,code]of [[request(valid,{method:'GET'}),405],[request(valid,{headers:{...request().headers,origin:'https://other.example'}}),403],[request(valid,{headers:{...request().headers,'content-type':'text/plain'}}),415],[request('{'),400]]){const res=response();await handler(req,res);assert.equal(res.statusCode,code);}});
test('delivers to fixed recipient with safe reply-to and idempotency',async()=>{let sent;const res=response();await createHandler({env:{RESEND_API_KEY:'test',CONTACT_FROM:'dot.wave <hello@example.com>'},send:async(url,options)=>{sent={url,...options};return {ok:true};}})(request(),res);assert.equal(res.body.ok,true);const data=JSON.parse(sent.body);assert.deepEqual(data.to,['dotwave.creative@gmail.com']);assert.equal(data.reply_to,'test@example.com');assert.match(sent.headers['Idempotency-Key'],/^[a-f0-9]{64}$/);});
test('provider rejection and timeout are visible failures',async()=>{for(const send of [async()=>({ok:false}),async()=>{throw new Error('timeout');}]){const res=response();await createHandler({env:{RESEND_API_KEY:'test',CONTACT_FROM:'test'},send})(request(),res);assert.equal(res.body.ok,false);assert.equal(res.statusCode,502);}});
test('honeypot never sends email',async()=>{let called=false;const res=response();await createHandler({send:async()=>{called=true;}})(request({...valid,website:'spam'}),res);assert.equal(called,false);assert.equal(res.statusCode,200);});
test('no-JS urlencoded submission receives localized HTML',async()=>{const res=response();await createHandler({env:{RESEND_API_KEY:'test',CONTACT_FROM:'test'},send:async()=>({ok:true})})(request(new URLSearchParams({...valid,language:'ja'}).toString(),{headers:{'content-type':'application/x-www-form-urlencoded',accept:'text/html'}}),res);assert.match(res.body,/lang="ja"/);assert.match(res.body,/お問い合わせを受け付けました/);});
