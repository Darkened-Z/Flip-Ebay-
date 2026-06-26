// FREE local hunt — real Chromium, no APIs/quota. Amazon search + eBay sold
// (new .s-card layout), FLIP rules, prints winners.  Run: node local-hunt.mjs
import { chromium } from "playwright";

const STOP=new Set(["with","for","and","the","set","pack","new","size","pcs","piece","pieces","count"]);
const cleanQuery=(t)=>t.replace(/\[[^\]]*\]/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-zA-Z0-9 ]/g," ").replace(/\b\d+\s?(pcs?|pack|count|ct)\b/gi," ").split(/\s+/).filter(Boolean).slice(0,6).join(" ");
const keyTokens=(t)=>t.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w)).slice(0,6);
const isUsed=(c)=>/(used|refurb|pre-?owned|open box|acceptable)/i.test(c??"");
const wordHit=(h,t)=>new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`).test(h);
const round2=(n)=>Math.round(n*100)/100;
const RESTRICTED=["nike","adidas","apple","sony","samsung","disney","lego","funko","gucci","rolex","yeti","stanley","dyson","bose","beats","supreme","patagonia","ugg","coach","ray-ban","oakley","gopro","garmin","nintendo","pokemon","hasbro","mattel"];
const EXCL=["lipstick","mascara","eyeliner","eyeshadow","concealer","nail polish","serum","sunscreen","perfume","cologne","glassware","wine glass","ceramic mug","porcelain","light bulb","figurine","vitamins","fish oil","protein powder","creatine","collagen","melatonin","coffee beans","beef jerky","energy drink","dog","puppy","kitten","pet","aquarium","leash","cat litter","chew toy","drone","quadcopter","fpv","rc helicopter","rc plane"];
const isRestricted=(t)=>RESTRICTED.some(b=>wordHit(t.toLowerCase(),b));
const isExcluded=(t)=>EXCL.some(b=>wordHit(t.toLowerCase(),b));
const FEE=0.166,FIX=0.30,now=Date.now();
const priceNum=(s)=>{const m=String(s||"").match(/[\d,]+\.\d{2}/);return m?Number(m[0].replace(/,/g,"")):NaN;};
const quickSale=(ps)=>{const s=ps.filter(p=>p>0).sort((a,b)=>a-b);const n=s.length;if(!n)return 0;if(n<=3)return round2(s[Math.min(1,n-1)]);return round2(s[Math.min(n-1,Math.max(1,Math.round(n*0.25)))]);};
function computeSold(rows,ref){let ch=rows.filter(r=>!isUsed(r.cond));const toks=keyTokens(ref);if(toks.length){const need=Math.min(2,toks.length);ch=ch.filter(r=>toks.filter(k=>wordHit((r.title||"").toLowerCase(),k)).length>=need);}const recent=ch.filter(r=>{const t=r.date?Date.parse(r.date):NaN;return !Number.isNaN(t)&&now-t<=30*86400000;});const pf=recent.length>=3?recent:ch;return {price:quickSale(pf.map(r=>r.price)),sold:recent.length};}

const SEEDS=["fishing reel","tactical flashlight","dash cam","knife sharpener","metal detector","multitool pliers","tire inflator portable","laser level","headlamp rechargeable","binoculars","jump starter","ratchet straps"];
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

const browser=await chromium.launch({headless:true,args:["--disable-blink-features=AutomationControlled","--no-sandbox"]});
const ctx=await browser.newContext({userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",viewport:{width:1366,height:900},locale:"en-US",extraHTTPHeaders:{"accept-language":"en-US,en;q=0.9"}});
await ctx.addInitScript(()=>{Object.defineProperty(navigator,"webdriver",{get:()=>undefined});});
const page=await ctx.newPage();
// Warm up sessions (skips bot-checks). NOTE: run this behind a US VPN/proxy so
// Amazon shows USD US prices — from a non-US IP it returns local currency and
// the USD price filter rejects everything.
await page.goto("https://www.amazon.com/",{waitUntil:"domcontentloaded",timeout:45000}); await page.waitForTimeout(1500);
await page.goto("https://www.ebay.com/",{waitUntil:"domcontentloaded",timeout:45000}); await page.waitForTimeout(1500);
const loc=await page.evaluate(()=>document.querySelector("#glow-ingress-line2")?.innerText||"").catch(()=>"");
if(loc && !/united states|new york|10001|select/i.test(loc)) console.log(`⚠ Amazon location = "${loc.trim()}" — connect a US VPN for USD prices, or results will be empty.\n`);

async function amazon(term){
  await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(term)}`,{waitUntil:"domcontentloaded",timeout:45000}); await page.waitForTimeout(1800);
  return page.$$eval('div[data-asin][data-component-type="s-search-result"]',els=>els.map(el=>({asin:el.getAttribute("data-asin"),title:(el.querySelector("h2")?.innerText||"").trim(),price:(el.querySelector(".a-price .a-offscreen")?.textContent||"").trim()})).filter(x=>x.asin&&x.title));
}
async function ebaySold(q){
  await page.goto(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1&LH_PrefLoc=1&LH_BIN=1&_ipg=60`,{waitUntil:"domcontentloaded",timeout:45000}); await page.waitForTimeout(1500);
  return page.$$eval(".s-card",els=>els.map(el=>{const txt=el.innerText||"";const m=txt.match(/Sold\s+([A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4})/);return{title:(el.querySelector(".s-card__title")?.innerText||"").trim(),price:(el.querySelector(".s-card__price")?.textContent||"").trim(),cond:(el.querySelector(".s-card__subtitle")?.innerText||"").trim(),date:m?m[1]:""};}).filter(x=>x.date&&!/shop on ebay/i.test(x.title)));
}

const winners=[];
for(const term of SEEDS){
  let rows; try{rows=await amazon(term);}catch{console.log(`${term}:amz-err`);continue;}
  const cands=rows.map(r=>({asin:r.asin,title:r.title,price:priceNum(r.price)})).filter(c=>c.price>10&&c.price<150&&!isRestricted(c.title)&&!isExcluded(c.title)).slice(0,3);
  process.stdout.write(`${term.split(" ")[0]}:${cands.length} `);
  for(const c of cands){ try{ const s=await ebaySold(cleanQuery(c.title)); const cs=computeSold(s.map(x=>({title:x.title,price:priceNum(x.price),date:x.date,cond:x.cond})),c.title); const net=round2(cs.price-c.price-(cs.price*FEE+FIX)); if(net>0&&cs.sold>=3) winners.push({...c,ebay:cs.price,sold:cs.sold,net,margin:Math.round(net/cs.price*100)}); await sleep(1800);}catch{} }
}
await browser.close();
winners.sort((a,b)=>b.net-a.net);
console.log(`\n\n========= ${winners.length} WINNERS (free real-browser scrape) =========`);
for(const w of winners) console.log(`\n  +$${w.net} net (${w.margin}%) | ${w.sold} sold/30d\n  Amazon $${w.price} -> eBay $${w.ebay}\n  ${w.title.slice(0,68)}\n  https://www.amazon.com/dp/${w.asin}`);
