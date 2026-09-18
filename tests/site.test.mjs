import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {site,projects,members} from '../src/content.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(join(dir,f.name)):[join(dir,f.name)]);}
const pages=walk(root).filter(f=>f.endsWith('.html')&&!f.endsWith('/404.html'));
const localFile=p=>p==='/'?join(root,'index.html'):join(root,p.replace(/^\//,''))+(p.split('/').at(-1).includes('.')?'':'.html');
test('28 crawlable pages have unique metadata, one H1, and reciprocal languages',()=>{
 assert.equal(pages.length,28);const titles=new Set();
 for(const file of pages){const s=readFileSync(file,'utf8');assert.equal((s.match(/<h1>/g)||[]).length,1,file);let title=s.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),file);titles.add(title);assert.match(s,/<html lang="(?:en|ja)"/);assert.match(s,/<meta name="description" content="[^"]+"/);assert.match(s,/hreflang="en"/);assert.match(s,/hreflang="ja"/);assert.match(s,/<main id="main"/);const json=s.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1];assert.ok(JSON.parse(json)['@graph']);}
});
test('every internal link, image, stylesheet and fragment resolves',()=>{
 for(const file of pages){const s=readFileSync(file,'utf8');for(const match of s.matchAll(/(?:href|src)="([^"]+)"/g)){
 let value=match[1];if(!value.startsWith('/')&&!value.startsWith('#'))continue;if(value.startsWith('/_vercel/'))continue;
 const [p,fragment]=value.split('#');const target=p?localFile(p):file;assert.ok(existsSync(target),`${file}: ${value}`);
 if(fragment)assert.ok(readFileSync(target,'utf8').includes(`id="${fragment}"`),`${file}: ${value}`);
 }
 for(const img of s.matchAll(/<img\b[^>]*>/g))assert.match(img[0],/alt="[^"]+"/);
 }
});
test('home has exactly three project cards, members are ordered, work has six cases',()=>{
 for(const file of ['index.html','ja.html']){const s=readFileSync(join(root,file),'utf8');assert.equal((s.match(/class="project-card"/g)||[]).length,3);assert.ok(s.indexOf('<h3>Faza Meonk')<s.indexOf('<h3>Rinintha Pradiza'));assert.equal((s.match(/class="member-title"/g)||[]).length,5);}
 assert.equal(site.featured.length,3);assert.equal(projects.length,6);assert.equal(members.length,5);
});
test('all case pages separate scope, contribution and outcome and link evidence',()=>{
 for(const p of projects){const en=readFileSync(join(root,`work/${p.id}.html`),'utf8');const ja=readFileSync(join(root,`ja/work/${p.id}.html`),'utf8');for(const s of [en,ja]){assert.match(s,/class="attribution"/);assert.ok(s.includes(p.source));}for(const h of ['Project scope','Member contribution','Outcome'])assert.ok(en.includes(`<h2>${h}</h2>`));}
});
test('contact stays short and exposes accessible status and direct email',()=>{
 for(const f of ['contact.html','ja/contact.html']){const s=readFileSync(join(root,f),'utf8');assert.ok(!s.includes('name="budget"'));assert.match(s,/role="status" aria-live="polite"/);assert.match(s,/mailto:dotwave.creative@gmail.com/);assert.match(s,/action="\/api\/contact"/);}
});
