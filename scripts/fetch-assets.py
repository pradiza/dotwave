from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor
import json
root=Path(__file__).resolve().parents[1]
assets={
'japan-wave.jpg':'https://raw.githubusercontent.com/pradiza/rinintha-pradiza-portfolio/main/public/images/japan-wave-runway.jpg',
'nila.jpg':'https://raw.githubusercontent.com/pradiza/rinintha-pradiza-portfolio/main/public/images/nila5.jpg',
'kcontent.png':'https://raw.githubusercontent.com/pradiza/rinintha-pradiza-portfolio/main/public/images/kcontent-expo-panorama.png',
'hyper-wave.png':'https://raw.githubusercontent.com/pradiza/rinintha-pradiza-portfolio/main/public/images/hyper-wave-vamps-live.png',
'si-juki.png':'https://www.sijuki.com/_next/static/media/comic_medium.f1f8fdd1.png',
'erigo.jpg':'https://the1993.co/wp-content/uploads/2025/02/the1993-1.jpg'
}
def fetch(item):
 name,url=item
 target=root/'dist/assets/work'/name
 with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40) as r: target.write_bytes(r.read())
 print(name,target.stat().st_size)
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(fetch,assets.items()))
(root/'docs/image-sources.json').write_text(json.dumps(assets,indent=2))
