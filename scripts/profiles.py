"""Build the EN/JP company profiles from shared website content."""
import json,os
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'tmp/profile-data.json').read_text())
FONT=os.environ.get('PROFILE_FONT','/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
pdfmetrics.registerFont(TTFont('Body',FONT))
pdfmetrics.registerFont(TTFont('Bold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
W,H=842,595
PAPER='#F8F7F3';INK='#151515';RED='#BC002D';MUTED='#65645E';SOFT='#EBE9E2'
def local(v,l):return v[l] if isinstance(v,dict) else v
def build(lang):
 out=ROOT/'dist/downloads'/f'dotwave-profile-{lang}.pdf'
 c=Canvas(str(out),pagesize=(W,H));c.setTitle('dot.wave | '+('Company Profile' if lang=='en' else '会社案内'));c.setAuthor('dot.wave');c.setSubject('Indonesia - Japan consulting collective')
 n=0
 def txt(s,x,y,w=720,size=14,color=INK,bold=False):
  style=ParagraphStyle('p',fontName='Bold' if bold and lang=='en' else 'Body',fontSize=size,leading=size*(1.6 if lang=='ja' else 1.4),textColor=HexColor(color),wordWrap='CJK' if lang=='ja' else None)
  p=Paragraph(escape(str(s)).replace('\n','<br/>'),style);_,h=p.wrap(w,1000);p.drawOn(c,x,H-y-h);return y+h
 def page(label,dark=False):
  nonlocal n
  if n:c.showPage()
  n+=1;c.setFillColor(HexColor(INK if dark else PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
  txt('dot.wave',44,25,200,19, PAPER if dark else INK,True);txt(label,440,30,355,10,PAPER if dark else MUTED)
  c.setStrokeColor(HexColor(MUTED));c.line(44, H-70,W-44,H-70)
  txt('Local Insight. Global Motion.',44,H-35,500,9,PAPER if dark else MUTED);txt(f'{n:02d} / 08',745,H-35,80,9,PAPER if dark else MUTED)
 def photo(name,x,y,w,h):
  p=ROOT/'dist/assets/work'/name
  portrait=not p.exists()
  if portrait:p=ROOT/'dist/assets/optimized'/name
  im=Image.open(p);iw,ih=im.size
  scale=(min if portrait else max)(w/iw,h/ih);nw,nh=iw*scale,ih*scale
  if portrait:
   c.setFillColor(HexColor(SOFT));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
  c.saveState();q=c.beginPath();q.rect(x,H-y-h,w,h);c.clipPath(q,stroke=0)
  c.drawImage(str(p),x-(nw-w)/2,H-y-h-(nh-h)/2,width=nw,height=nh);c.restoreState()
 page('COMPANY PROFILE / ENGLISH' if lang=='en' else '会社案内 / 日本語')
 txt('Indonesia\n↔ Japan',44,96,690,62,INK,True)
 txt('Ideas + People. Infinite Possibilities.',48,295,700,22)
 txt('We help organizations navigate opportunities between Indonesia and Japan - from research and strategy to partnerships, creative development and execution.' if lang=='en' else 'インドネシアと日本のビジネス・クリエイティブの課題に、必要な知見と専門家を。市場理解から戦略、パートナーシップ、実行まで支援します。',48,355,580,18)
 txt('A multidisciplinary consulting collective' if lang=='en' else '多分野の専門家によるコンサルティング・コレクティブ',48,465,680,13,RED)
 txt('September 2026 / dotwave.vercel.app',48,504,680,10,MUTED)
 page('01 / WHAT WE DO' if lang=='en' else '01 / できること')
 txt('Start with the question.' if lang=='en' else 'まずは、課題から。',44,90,750,32,INK,True)
 for i,q in enumerate(D['questions']):
  x=44+(i%2)*393;y=160+(i//2)*151
  txt(f'0{i+1}',x,y,50,11,RED)
  yy=txt(local(q['title'],lang),x,y+23,350,20,INK,True)
  txt(local(q['outputs'],lang),x,yy+10,350,12,MUTED)
 txt('Focused research · Advisory · Partner search · Creative development · Project delivery · Ongoing support' if lang=='en' else 'テーマを絞った調査・戦略助言・パートナー探索・企画開発・実行支援・継続的な相談',44,497,750,11,RED)
 # Six flagship cases, two per spread. Factual source links remain readable.
 for j in range(3):
  page('02 / SELECTED MEMBER EXPERIENCE' if lang=='en' else '02 / メンバーの過去実績')
  for k,p in enumerate(D['projects'][j*2:j*2+2]):
   x=44+k*393;wid=355
   if p.get('image'):photo(p['image'],x,92,wid,148)
   else:
    c.setFillColor(HexColor(INK));c.rect(x,H-240,wid,148,fill=1,stroke=0)
    txt('Research → Strategy',x+20,132,wid-40,27,PAPER)
   txt(p['title'],x,253,wid,23,INK,True)
   txt(local(p['year'],lang)+' / '+next(m['name'] for m in D['members'] if m['id']==p['member']),x,293,wid,10,RED)
   yy=txt(local(p['summary'],lang),x,319,wid,13)
   yy=txt(('Outcome: ' if lang=='en' else '成果：')+local(p['outcome'],lang),x,yy+12,wid,11,MUTED)
   source=p['source'];txt('Source: '+source.split('#')[0],x,495,wid,8,MUTED)
   c.linkURL(source,(x,H-514,x+wid,H-490),relative=0)
  txt('Prior member work; not dot.wave commissions. Outcomes reflect the wider project and its collaborators.' if lang=='en' else 'dot.wave設立以前の実績です。成果はプロジェクトと協業者全体によるものです。',44,528,750,9,MUTED)
 for j,group in enumerate([D['members'][:2],D['members'][2:]]):
  page('03 / THE COLLECTIVE' if lang=='en' else '03 / メンバー')
  width=355 if j==0 else 232;gap=38 if j==0 else 29
  for k,m in enumerate(group):
   x=44+k*(width+gap);photo(m['image'],x,92,width,150)
   txt(m['name'],x,255,width,23 if j==0 else 20,INK,True)
   role=('Co-founder · ' if lang=='en' else '共同創設者・') if m.get('cofounder') else ''
   txt(role+('Member dot.wave' if lang=='en' else 'dot.waveメンバー'),x,292,width,10,RED)
   yy=txt(local(m['proof'],lang),x,323,width,13)
   txt(local(m['expertise'],lang),x,yy+17,width,10,MUTED)
   txt(m['url'].replace('https://',''),x,499,width,8,MUTED);c.linkURL(m['url'],(x,H-521,x+width,H-491),relative=0)
 page('04 / HOW WE WORK' if lang=='en' else '04 / 進め方',True)
 txt('One lead. The right specialists.' if lang=='en' else '一人のリード。必要な専門家。',44,92,750,30,PAPER,True)
 for i,p in enumerate(D['process']):
  x=44+i*193;txt(f'0{i+1}',x,169,170,11,'#FF8CA5');txt(local(p['name'],lang),x,201,170,22,PAPER,True);txt(local(p['short'],lang),x,246,168,12,PAPER)
 txt('Projects begin with a clear scope, team, timeline and fees. Formal contracting and invoicing through an Indonesian legal entity. NDA available.' if lang=='en' else '業務範囲、体制、日程、費用を合意してから開始します。契約・請求はインドネシア法人を通じて行います。NDAにも対応します。',44,334,700,14,PAPER)
 txt('Discuss a project' if lang=='en' else 'プロジェクトを相談する',44,427,720,27,PAPER,True)
 txt(D['site']['email'],44,477,720,17,'#FF8CA5');c.linkURL('mailto:'+D['site']['email'],(44,75,500,115),relative=0)
 txt('Based in Indonesia. Working across Indonesia and Japan.' if lang=='en' else 'インドネシアを拠点に。日本とインドネシアをつなぐ。',44,515,730,11,PAPER)
 c.save();print(out)
for lang in ['en','ja']:build(lang)
