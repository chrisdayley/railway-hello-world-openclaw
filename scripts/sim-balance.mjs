import fs from 'fs';
const props=JSON.parse(fs.readFileSync('data/properties.json','utf8'));
const raw=Array.isArray(props)?props:(props.properties||props.briarwatch||[]);
const list=raw.filter(p=>p && p.purchasePrice!==undefined || p && p.price!==undefined);
const N=10000;
function avg(a){return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length)}
console.log('=== Economy Monte Carlo ===');
for(const p of list){const min=p.baseRevenueMin??p.revenueMin??p.min??0,max=p.baseRevenueMax??p.revenueMax??p.max??0,cost=p.operatingCost??p.cost??0,price=p.purchasePrice??p.price??0;if(!max)continue;let vals=[];for(let i=0;i<N;i++)vals.push(min+Math.random()*(max-min)-cost);let daily=avg(vals),payback=daily>0?price/daily:Infinity;console.log(`${p.name||p.id}: avg ${daily.toFixed(1)}g/day, payback ${payback.toFixed(1)} days`)}
console.log('\n=== Loot rarity sample ===');
const counts={Common:0,Uncommon:0,Rare:0,Epic:0,Legendary:0,Mythic:0};
for(let i=0;i<N;i++){let r=Math.random(),k=r<.012?'Mythic':r<.045?'Legendary':r<.12?'Epic':r<.30?'Rare':r<.62?'Uncommon':'Common';counts[k]++}
for(const [k,v] of Object.entries(counts))console.log(`${k}: ${(v/N*100).toFixed(2)}%`);
