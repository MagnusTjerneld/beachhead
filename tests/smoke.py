import asyncio
from playwright.async_api import async_playwright
import os
here=os.path.dirname(os.path.abspath(__file__))
html=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
three=open(os.path.join(here,'node_modules','three','build','three.min.js')).read()
page_html=html
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':1600,'height':900})
        errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
        await pg.route('**/three.min.js',lambda r: r.fulfill(status=200,content_type='application/javascript',body=three))
        await pg.route('**/fonts.googleapis.com/**',lambda r: r.abort())
        await pg.route('**/music/theme.mp3',lambda r: r.abort())
        await pg.route('http://localhost/',lambda r: r.fulfill(status=200,content_type='text/html',body=page_html))
        await pg.goto('http://localhost/')
        await pg.wait_for_timeout(2500)
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>document.getElementById('tPlay').click()")
        await pg.wait_for_timeout(2000)
        pos=await pg.evaluate("""()=>{const G=__BH.G;G.paused=true;const e=G.units.find(u=>u.kind==='eng');e.x=G.relays[0].x+120;e.y=G.relays[0].y+60;G.known.fill(1);G.knownV++;__BH.setSel([e.id]);const r=document.getElementById('cMap').getBoundingClientRect();const m=__BHui.mapX();return [r.left+m.ox+e.x*m.s,r.top+m.oy+e.y*m.s];}""")
        await pg.wait_for_timeout(1500)
        await pg.mouse.click(pos[0],pos[1],button='right')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=os.path.join(here,'smoke.png'),clip={'x':max(0,pos[0]-260),'y':max(0,pos[1]-220),'width':520,'height':440})
        print(await pg.evaluate("()=>[...document.querySelectorAll('#wheel button, .wheel button')].map(b=>b.textContent).join(' | ')"))
        print('errors',errs)
        await b.close()
asyncio.run(main())
