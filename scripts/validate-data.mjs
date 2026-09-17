import fs from 'fs';
const files=['world-events.json','properties.json','loot-tables.json','quests.json','factions.json','companions.json','crafting.json','regions.json','campaign.json'];
let failed=false;
for(const f of files){
  try{const p=`data/${f}`,v=JSON.parse(fs.readFileSync(p,'utf8'));if(!v||typeof v!=='object')throw new Error('root is not an object');console.log(`✓ ${p}`)}
  catch(e){failed=true;console.error(`✗ data/${f}: ${e.message}`)}
}
const props=JSON.parse(fs.readFileSync('data/properties.json','utf8'));
const events=JSON.parse(fs.readFileSync('data/world-events.json','utf8'));
const quests=JSON.parse(fs.readFileSync('data/quests.json','utf8'));
const factions=JSON.parse(fs.readFileSync('data/factions.json','utf8'));
function unique(list,label){const s=new Set();for(const x of list){if(s.has(x)){failed=true;console.error(`✗ duplicate ${label}: ${x}`)}s.add(x)}}
if(Array.isArray(props.properties))unique(props.properties.map(x=>x.id),'property id');
if(Array.isArray(events.events))unique(events.events.map(x=>x.id),'event id');
if(Array.isArray(quests.main))unique(quests.main.map(x=>x.id),'quest id');
if(Array.isArray(factions.factions))unique(factions.factions.map(x=>x.id),'faction id');
if(failed)process.exit(1);console.log('Everlight data validation passed.');
