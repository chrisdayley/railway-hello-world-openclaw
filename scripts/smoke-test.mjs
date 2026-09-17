import fs from 'node:fs';

const html = fs.readFileSync('index.html','utf8');
const js = fs.readFileSync('js/game-v4.js','utf8');
const requiredIds = [
  'titleScreen','pathScreen','gameScreen','gameCanvas','continueBtn','newGameBtn','hpBar','manaBar','stamBar',
  'objectiveBtn','joystick','attackBtn','spellBtn','dodgeBtn','interactBtn','dialogue','journal','interactionPanel','chapterComplete'
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required UI node #${id}`);
  if (!js.includes(`'${id}'`)) throw new Error(`Runtime does not bind #${id}`);
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicates = ids.filter((id,index) => ids.indexOf(id)!==index);
if (duplicates.length) throw new Error(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

for (const path of ['styles/game-v3.css','styles/visual-v22.css','js/visual-upgrade-v22.js','js/world-atlas-v22.js','js/game-v4.js','assets/northford-twilight.jpg','assets/hero-player-v2.png','assets/hero-walk-v22.png','assets/hero-attack-v22.png','assets/enemies-v22.png','assets/interior-smithy-v1.jpg','assets/interior-apothecary-v1.jpg','assets/interior-inn-v1.jpg','assets/interior-guildhall-v1.jpg','assets/interior-stable-v1.jpg','manifest.webmanifest','sw.js']) {
  if (!fs.existsSync(path)) throw new Error(`Missing core asset: ${path}`);
}

if (!html.includes('viewport-fit=cover')) throw new Error('Safe-area viewport support is missing');
if (!html.includes('aria-live')) throw new Error('Live accessibility feedback is missing');
if (!js.includes('localStorage.setItem')) throw new Error('Autosave implementation is missing');
if (!html.includes('world-atlas-v22.js')) throw new Error('World atlas runtime is not loaded');
if (!html.includes('visual-upgrade-v22.js')) throw new Error('Animated visual runtime is not loaded');
for (const marker of ['INTERIOR_LAYOUTS','smithyCache','apothecaryCache','innHearthCache','guildCache','stableCache','talkLocal','inspectLore']) {
  if (!js.includes(marker)) throw new Error(`Missing living-interior system marker: ${marker}`);
}
for (const marker of ['atlasShop','atlasNpc','atlasLore','talkAtlasNpc','inspectAtlasLore']) {
  if (!js.includes(marker)) throw new Error(`Missing living-world system marker: ${marker}`);
}

console.log(`Everlight smoke test passed (${ids.length} unique UI IDs).`);
