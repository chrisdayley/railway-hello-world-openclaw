/* Everlight v27 equipment, seven-slot loadout, comparison, and paper-doll UI.
 * Public API: window.EVERLIGHT_EQUIPMENT
 */
(() => {
  'use strict';

  const SLOT_DEFS = Object.freeze([
    Object.freeze({ key:'Armor', type:'Armor', label:'Armor' }),
    Object.freeze({ key:'Shield', type:'Shield', label:'Shield' }),
    Object.freeze({ key:'Helm', type:'Helm', label:'Helm' }),
    Object.freeze({ key:'Weapon', type:'Weapon', label:'Weapon' }),
    Object.freeze({ key:'Belt', type:'Belt', label:'Belt' }),
    Object.freeze({ key:'Charm1', type:'Charm', label:'Charm I' }),
    Object.freeze({ key:'Charm2', type:'Charm', label:'Charm II' })
  ]);
  const SLOT_KEYS = Object.freeze(SLOT_DEFS.map(slot => slot.key));
  const GEAR_TYPES = Object.freeze(['Weapon', 'Armor', 'Shield', 'Helm', 'Belt', 'Charm']);
  const FILTERS = Object.freeze(['All', ...GEAR_TYPES, 'Consumable', 'Quest']);
  const RARITY = Object.freeze({
    Common:'#d7dfda', Uncommon:'#79dfa0', Rare:'#67b9ff',
    Epic:'#c783ff', Legendary:'#ffc861', Mythic:'#ff7ee8'
  });
  const TYPE_SLOTS = Object.freeze({
    Weapon:Object.freeze(['Weapon']), Armor:Object.freeze(['Armor']), Shield:Object.freeze(['Shield']),
    Helm:Object.freeze(['Helm']), Belt:Object.freeze(['Belt']), Charm:Object.freeze(['Charm1', 'Charm2'])
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const rankOf = item => Math.trunc(clamp(item?.rank, 0, 5));
  const isGear = item => GEAR_TYPES.includes(item?.type);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[char]);
  const attr = esc;
  const referenceId = reference => reference && typeof reference === 'object' ? reference.uid || reference.id || reference : reference;

  function effective(item) {
    if (!item || typeof item !== 'object') return null;
    const rank = rankOf(item);
    const result = { ...item, rank };
    if (item.type === 'Weapon') result.power = (Number(item.power) || 0) + rank * 3;
    if (item.type === 'Armor') {
      result.armor = (Number(item.armor) || 0) + rank * 2;
      result.maxHp = (Number(item.maxHp) || 0) + rank * 4;
    }
    if (item.type === 'Shield') {
      result.armor = (Number(item.armor) || 0) + rank * 2;
      result.maxHp = (Number(item.maxHp) || 0) + rank * 2;
    }
    if (item.type === 'Helm') {
      result.armor = (Number(item.armor) || 0) + rank;
      result.maxHp = (Number(item.maxHp) || 0) + rank * 3;
    }
    if (item.type === 'Belt') {
      result.armor = (Number(item.armor) || 0) + rank;
      result.maxHp = (Number(item.maxHp) || 0) + rank * 2;
      result.crit = (Number(item.crit) || 0) + rank * 0.005;
    }
    if (item.type === 'Charm') {
      result.armor = (Number(item.armor) || 0) + rank;
      result.spell = (Number(item.spell) || 0) + rank * 0.03;
    }
    return result;
  }

  function resolveItem(state, reference) {
    if (reference && typeof reference === 'object') return reference;
    return (state?.inventory || []).find(item => item?.uid === reference) || null;
  }

  function canonical(input = {}, inventoryArg) {
    const isState = !!input && typeof input === 'object' && ('equipment' in input || Array.isArray(input.inventory));
    const source = isState ? (input.equipment || {}) : input;
    const inventory = inventoryArg || (isState ? input.inventory : null);
    const result = {
      Armor:source?.Armor ?? null,
      Shield:source?.Shield ?? null,
      Helm:source?.Helm ?? null,
      Weapon:source?.Weapon ?? null,
      Belt:source?.Belt ?? null,
      Charm1:source?.Charm1 ?? source?.Charm ?? null,
      Charm2:source?.Charm2 ?? null
    };
    if (result.Charm1 && result.Charm2 && referenceId(result.Charm1) === referenceId(result.Charm2)) result.Charm2 = null;
    if (Array.isArray(inventory)) {
      for (const slot of SLOT_DEFS) {
        const reference = result[slot.key];
        if (reference == null) continue;
        const item = typeof reference === 'object' ? reference : inventory.find(entry => entry?.uid === reference);
        if (!item || item.type !== slot.type) result[slot.key] = null;
      }
    }
    return result;
  }

  function migrate(state) {
    if (!state || typeof state !== 'object') return { ok:false, message:'No character state provided.' };
    const before = state.equipment || {};
    const equipment = canonical(state);
    const legacyCharmMoved = !!before.Charm && !before.Charm1 && equipment.Charm1 === before.Charm;
    state.equipment = equipment;
    return { ok:true, message:legacyCharmMoved ? 'Legacy charm moved to Charm I.' : 'Seven-slot loadout ready.', equipment };
  }

  function equippedSlots(state, equipment = state?.equipment || {}) {
    const normalized = canonical(equipment, state?.inventory || []), result = {}, seen = new Set();
    for (const slot of SLOT_DEFS) {
      const item = effective(resolveItem(state, normalized[slot.key]));
      const id = referenceId(item);
      if (!item || (id && seen.has(id))) result[slot.key] = null;
      else { result[slot.key] = item; if (id) seen.add(id); }
    }
    return result;
  }

  function aggregate(state = {}, equipment = state.equipment || {}) {
    const items = equippedSlots(state, equipment);
    const total = { power:0, armor:0, maxHp:0, spell:0, crit:0, dodge:0, items };
    for (const item of Object.values(items)) {
      if (!item) continue;
      total.power += Number(item.power) || 0;
      total.armor += Number(item.armor) || 0;
      total.maxHp += Number(item.maxHp) || 0;
      total.spell += Number(item.spell) || 0;
      total.crit += Number(item.crit) || 0;
      total.dodge += Number(item.dodge) || 0;
    }
    return total;
  }

  function stats(state = {}, equipment = state.equipment || {}) {
    const gear = aggregate(state, equipment), skills = Array.isArray(state.skills) ? state.skills : [];
    const hasSkill = id => skills.includes(id);
    const bonus = window.EVERLIGHT_SKILLS?.bonuses(state) || {};
    const levelBonus = 1 + Math.min(20, Math.max(0, (Number(state.level) || 1) - 1)) * 0.045;
    const armor = gear.armor + (state.faction === 'ironbound' ? 8 : 0) + (bonus.armor || 0);
    const spell = (1 + gear.spell) * (hasSkill('aether_surge') ? 1.25 : 1) * (state.style === 'arcanist' ? 1.25 : 1) * (1+(bonus.spell||0));
    const speed = (state.activeMount ? 1.65 : 1) * (hasSkill('fleetstep') ? 1.12 : 1) * (state.style === 'ranger' ? 1.1 : 1) * (1+(bonus.move||0));
    const crit = Math.min(.65,(Number(state.crit) || 0) + gear.crit + (state.faction === 'archive' ? 0.04 : 0) + (bonus.crit||0));
    const weaponPower = gear.items.Weapon?.power || 8;
    return {
      power:weaponPower * (hasSkill('keen_edge') ? 1.2 : 1) * levelBonus * (1+(bonus.power||0)+(gear.items.Weapon?.id==='wayfarer_bow'?(bonus.rangedPower||0):0)),
      armor, spell, speed, crit, dodge:gear.dodge,
      maxHp:(Number(state.maxHp) || 100) + gear.maxHp + (bonus.maxHp||0),
      maxMana:(Number(state.maxMana)||60)+(bonus.maxMana||0),maxStamina:(Number(state.maxStam)||100)+(bonus.maxStamina||0),
      levelBonus,
      damageReduction:Math.min(0.7, armor <= 0 ? 0 : 1 - (100 / (100 + armor * 3))),
      spellDamage:Math.round(25 * spell * levelBonus)
    };
  }

  function slotForItem(item, equipment = {}, preferredSlot) {
    if (!isGear(item)) return null;
    const candidates = TYPE_SLOTS[item.type] || [];
    if (preferredSlot && candidates.includes(preferredSlot)) return preferredSlot;
    const uid = referenceId(item), existing = candidates.find(slot => referenceId(equipment?.[slot]) === uid);
    return existing || candidates.find(slot => !equipment?.[slot]) || candidates[0] || null;
  }

  function equip(state, uid, preferredSlot) {
    const item = resolveItem(state, uid);
    if (!item || !isGear(item)) return { ok:false, message:'That item cannot be equipped.' };
    const equipment = canonical(state), slot = slotForItem(item, equipment, preferredSlot);
    if (!slot) return { ok:false, message:'No compatible gear slot exists.' };
    const id = referenceId(item);
    for (const key of SLOT_KEYS) if (referenceId(equipment[key]) === id) equipment[key] = null;
    equipment[slot] = item.uid;
    state.equipment = equipment;
    return { ok:true, message:`${item.name || item.type} equipped in ${SLOT_DEFS.find(entry => entry.key === slot)?.label || slot}.`, slot, item };
  }

  function unequip(state, slot) {
    if (!SLOT_KEYS.includes(slot)) return { ok:false, message:'Unknown equipment slot.' };
    const equipment = canonical(state);
    if (!equipment[slot]) return { ok:false, message:`${slot} is already empty.` };
    equipment[slot] = null;
    state.equipment = equipment;
    return { ok:true, message:`${SLOT_DEFS.find(entry => entry.key === slot)?.label || slot} cleared.`, slot };
  }

  function upgradeCost(item) {
    if (!isGear(item)) return null;
    const rank = rankOf(item);
    if (rank >= 5) return null;
    const gold = Math.round((50 + (Number(item.value) || 0) * 0.3) * (rank + 1));
    return rank <= 2
      ? Object.freeze({ gold, material:'briarFiber', amount:(rank + 1) * 2, rank, nextRank:rank + 1 })
      : Object.freeze({ gold, material:'wardenAlloy', amount:rank - 1, rank, nextRank:rank + 1 });
  }

  function stars(rank) {
    const value = Math.trunc(clamp(rank, 0, 5));
    return `<span class="eq25-stars" aria-label="Upgrade rank ${value} of 5"><b>${'★'.repeat(value)}</b>${'☆'.repeat(5 - value)}</span>`;
  }

  function iconSvg(type) {
    const common = 'viewBox="0 0 32 32" aria-hidden="true" focusable="false"';
    if (type === 'Weapon') return `<svg ${common}><path d="M23 3l6 1-1 6L13 25l-6 2 2-6L23 3z"/><path class="hi" d="M23 6l3 1L11 23l-2 1 1-2L23 6z"/><path d="M7 20l5 5-3 3-5-5 3-3z"/></svg>`;
    if (type === 'Armor') return `<svg ${common}><path d="M9 5l7-3 7 3 6 6-4 5-3-3v16H10V13l-3 3-4-5 6-6z"/><path class="hi" d="M12 6l4 2 4-2v17h-8V6z"/></svg>`;
    if (type === 'Shield') return `<svg ${common}><path d="M16 2l12 5v8c0 8-5 13-12 16C9 28 4 23 4 15V7l12-5z"/><path class="hi" d="M16 6v20c5-3 8-7 8-12V9l-8-3z"/></svg>`;
    if (type === 'Helm') return `<svg ${common}><path d="M6 15C6 7 10 3 16 3s10 4 10 12v12h-6v-8h-8v8H6V15z"/><path class="hi" d="M10 14c1-5 3-7 6-7v8h-6v-1z"/></svg>`;
    if (type === 'Belt') return `<svg ${common}><path d="M3 10h26v12H3V10zm10 2v8h8v-8h-8z"/><path class="hi" d="M15 14h4v4h-4z"/></svg>`;
    if (type === 'Charm') return `<svg ${common}><path d="M14 2h4l1 6 7 5-2 13-8 4-8-4-2-13 7-5 1-6z"/><path class="hi" d="M16 10l5 6-5 8-5-8 5-6z"/></svg>`;
    if (type === 'Consumable') return `<svg ${common}><path d="M11 3h10v5l4 7v12H7V15l4-7V3z"/><path class="hi" d="M10 18h12v6H10v-6z"/></svg>`;
    return `<svg ${common}><path d="M7 3h14l4 4v22H7V3z"/><path class="hi" d="M11 9h10v2H11zm0 6h10v2H11zm0 6h7v2h-7z"/></svg>`;
  }

  function formatStat(key, value) {
    if (key === 'crit' || key === 'damageReduction' || key === 'dodge') return `${Math.round(value * 100)}%`;
    if (key === 'speed' || key === 'spell' || key === 'levelBonus') return `${value.toFixed(2)}×`;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  const STAT_META = Object.freeze([
    ['power','Damage'], ['armor','Armor'], ['maxHp','Max HP'], ['spellDamage','Spell dmg'],
    ['damageReduction','Mitigation'], ['crit','Crit chance'], ['speed','Move speed']
  ]);

  function comparisonRows(before, after, changesOnly = false) {
    return STAT_META.filter(([key]) => !changesOnly || Math.abs((Number(after[key]) || 0) - (Number(before[key]) || 0)) > 0.0001).map(([key, label]) => {
      const current = Number(before[key]) || 0, next = Number(after[key]) || 0, delta = next - current;
      const direction = delta > 0.0001 ? 'up' : delta < -0.0001 ? 'down' : 'same';
      const deltaText = direction === 'same' ? 'No change' : `${delta > 0 ? '+' : ''}${formatStat(key, delta)}`;
      return `<div class="eq25-compare-row is-${direction}"><span>${label}</span><strong>${formatStat(key,current)} <i>→</i> ${formatStat(key,next)}</strong><em>${deltaText}</em></div>`;
    }).join('') || '<div class="eq25-compare-none">No combat stat change</div>';
  }

  function slotMarkup(state, slot) {
    const equipment = canonical(state), item = effective(resolveItem(state, equipment[slot.key])), uid = item?.uid || '';
    return `<button class="eq25-slot eq25-slot--${slot.key.toLowerCase()} ${item ? `rarity-${String(item.rarity || 'Common').toLowerCase()}` : 'is-empty'}" data-inspect="${attr(uid)}" ${item ? '' : 'disabled'} aria-label="${item ? `Inspect equipped ${esc(item.name)}` : `Empty ${slot.label} slot`}">
      <span class="eq25-slot-icon">${iconSvg(slot.type)}</span><small>${slot.label}</small><strong>${item ? esc(item.name) : 'Empty'}</strong>${item ? stars(item.rank) : '<span class="eq25-empty-mark">—</span>'}
    </button>`;
  }

  function itemStats(item) {
    const current = effective(item); if (!current) return '';
    const values = [];
    if (current.power) values.push(`${current.power} damage`);
    if (current.armor) values.push(`${current.armor} armor`);
    if (current.maxHp) values.push(`+${current.maxHp} HP`);
    if (current.spell) values.push(`+${Math.round(current.spell * 100)}% aether`);
    if (current.crit) values.push(`+${Math.round(current.crit * 100)}% crit`);
    if (current.dodge) values.push(`+${Math.round(current.dodge * 100)}% dodge`);
    if (current.heal) values.push(`Restores ${current.heal} HP`);
    if (current.mana) values.push(`Restores ${current.mana} AE`);
    return values.join(' · ') || current.type;
  }

  function equippedSlotFor(state, item) {
    const equipment = canonical(state), uid = referenceId(item);
    return SLOT_KEYS.find(slot => referenceId(equipment[slot]) === uid) || null;
  }

  function cardMarkup(state, item, selectedUid) {
    const selected = item.uid === selectedUid, equippedSlot = isGear(item) ? equippedSlotFor(state,item) : null;
    const rarity = String(item.rarity || 'Common'), slotLabel = SLOT_DEFS.find(slot => slot.key === equippedSlot)?.label;
    return `<button class="eq25-item rarity-${rarity.toLowerCase()}${selected?' is-selected':''}${equippedSlot?' is-equipped':''}" data-inspect="${attr(item.uid)}" aria-pressed="${selected}">
      <span class="eq25-item-icon">${iconSvg(item.type)}</span><span class="eq25-item-copy"><small>${esc(rarity)} ${esc(item.type)}${slotLabel?` · ${esc(slotLabel)}`:''}</small><strong>${esc(item.name || 'Unnamed item')}</strong><span>${esc(itemStats(item))}</span>${isGear(item)?stars(rankOf(item)):''}</span>
    </button>`;
  }

  function useDisabled(state, item) {
    if (item?.type !== 'Consumable') return true;
    if (item.heal) return (Number(state.hp) || 0) >= stats(state).maxHp;
    if (item.mana) return (Number(state.mana) || 0) >= (Number(state.maxMana) || 60);
    return false;
  }

  function equipmentWith(state, item, slot) {
    const equipment = canonical(state), uid = referenceId(item);
    for (const key of SLOT_KEYS) if (referenceId(equipment[key]) === uid) equipment[key] = null;
    equipment[slot] = item;
    return equipment;
  }

  function deltaSummary(before, after) {
    return STAT_META.map(([key,label]) => [label,(Number(after[key])||0)-(Number(before[key])||0)])
      .filter(([,delta]) => Math.abs(delta) > .0001).slice(0,2)
      .map(([label,delta]) => `${label} ${delta>0?'+':''}${label.includes('chance')||label==='Mitigation'?`${Math.round(delta*100)}%`:Number.isInteger(delta)?delta:delta.toFixed(1)}`).join(' · ') || 'No stat change';
  }

  function detailMarkup(state, item) {
    if (!item) return `<div class="eq25-detail-empty"><span>✦</span><strong>Choose an item</strong><p>Tap a slot or pack item to inspect its real effect on your build.</p></div>`;
    const rarity = String(item.rarity || 'Common'), before = stats(state), equipment = canonical(state);
    const equippedSlot = isGear(item) ? equippedSlotFor(state,item) : null;
    const compatible = isGear(item) ? TYPE_SLOTS[item.type] : [];
    const previewSlot = equippedSlot || slotForItem(item,equipment);
    const after = previewSlot ? stats(state,equipmentWith(state,item,previewSlot)) : before;
    const cost = upgradeCost(item), materialCount = cost ? Number(state.materials?.[cost.material]) || 0 : 0;
    const canAfford = !!cost && (Number(state.gold)||0) >= cost.gold && materialCount >= cost.amount;
    const materialName = cost?.material === 'briarFiber' ? 'Briar Fiber' : 'Warden Alloy';
    const upgraded = cost ? {...item,rank:cost.nextRank} : null;
    const upgradeBefore = previewSlot ? stats(state,equipmentWith(state,item,previewSlot)) : before;
    const upgradeAfter = upgraded && previewSlot ? stats(state,equipmentWith(state,upgraded,previewSlot)) : upgradeBefore;
    const goldNeeded = cost ? Math.max(0,cost.gold-(Number(state.gold)||0)) : 0;
    const materialNeeded = cost ? Math.max(0,cost.amount-materialCount) : 0;
    const missing = cost ? [goldNeeded?`${goldNeeded} more gold`:'',materialNeeded?`${materialNeeded} more ${materialName}`:''].filter(Boolean).join(' · ') : '';
    let equipAction = '';
    if (isGear(item)) {
      if (equippedSlot) equipAction = `<button data-unequip="${equippedSlot}">Unequip ${esc(SLOT_DEFS.find(slot=>slot.key===equippedSlot)?.label || equippedSlot)}</button>`;
      else if (item.type === 'Charm') equipAction = `<div class="eq25-charm-actions">${compatible.map(slot=>{const slotAfter=stats(state,equipmentWith(state,item,slot));return `<button data-equip="${attr(item.uid)}" data-slot="${slot}"><span>Equip ${esc(SLOT_DEFS.find(entry=>entry.key===slot)?.label)}</span><small>${esc(deltaSummary(before,slotAfter))}</small></button>`}).join('')}</div>`;
      else equipAction = `<button data-equip="${attr(item.uid)}" data-slot="${previewSlot}">Equip ${esc(SLOT_DEFS.find(slot=>slot.key===previewSlot)?.label || item.type)}</button>`;
    }
    const upgradeAction = isGear(item) ? (cost
      ? `<button class="eq25-upgrade" data-upgrade="${attr(item.uid)}" ${canAfford?'':'disabled'}>${canAfford?`Raise to ${stars(cost.nextRank)}`:`<strong>Need ${esc(missing)}</strong>`}<span>${cost.gold}g · ${cost.amount} ${materialName}</span></button>`
      : `<button data-upgrade="${attr(item.uid)}" disabled>★★★★★ Masterworked</button>`) : '';
    const useBlocked = useDisabled(state,item), useLabel = useBlocked ? (item.heal?'Health already full':item.mana?'Aether already full':'Cannot use now') : 'Use now';
    const useAction = item.type === 'Consumable' ? `<button data-use="${attr(item.uid)}" ${useBlocked?'disabled':''}>${useLabel}</button>` : '';
    const replacement = previewSlot ? effective(resolveItem(state,equipment[previewSlot])) : null;
    return `<article class="eq25-detail-card rarity-${rarity.toLowerCase()}">
      <button class="eq25-back" data-gear-back data-inspect="" aria-label="Back to pack">‹ <span>Back to pack</span></button>
      <header><span class="eq25-detail-icon">${iconSvg(item.type)}</span><div><small>${esc(rarity)} · ${esc(item.type)}</small><h3>${esc(item.name || 'Unnamed item')}</h3>${isGear(item)?stars(rankOf(item)):''}</div></header>
      <p>${esc(item.description || 'A piece of the Vale’s long story.')}</p><div class="eq25-traits">${esc(itemStats(item))}</div>
      ${isGear(item)?'<div class="eq25-scroll-hint" aria-hidden="true">Scroll for comparison ↓</div>':''}
      ${isGear(item)?`<div class="eq25-section-title"><span>Loadout impact</span><small>${equippedSlot?'Currently equipped':`Previewing ${esc(SLOT_DEFS.find(slot=>slot.key===previewSlot)?.label || item.type)} · replacing ${esc(replacement?.name || 'empty slot')}`}</small></div><div class="eq25-comparison">${comparisonRows(before,after)}</div>`:''}
      ${cost?`<div class="eq25-section-title eq25-section-title--upgrade"><span>Next star gains</span><small>Rank ${cost.rank} → ${cost.nextRank}</small></div><div class="eq25-comparison eq25-comparison--upgrade">${comparisonRows(upgradeBefore,upgradeAfter,true)}</div><div class="eq25-cost"><span>Upgrade cost</span><strong>${cost.gold} gold</strong><strong class="${materialCount>=cost.amount?'has-material':''}">${materialCount}/${cost.amount} ${materialName}</strong></div>`:''}
      <div class="eq25-actions">${equipAction}${upgradeAction}${useAction}</div>
    </article>`;
  }

  function render(state = {}, options = {}) {
    const inventory = Array.isArray(state.inventory) ? state.inventory.filter(Boolean) : [];
    const filter = FILTERS.includes(options.filter) ? options.filter : 'All';
    const visible = filter === 'All' ? inventory : inventory.filter(item => item.type === filter);
    const selected = inventory.find(item => item.uid === options.selectedUid) || null;
    const build = stats(state), pathName = ({vanguard:'Vanguard',ranger:'Wayfinder',arcanist:'Lightweaver'})[state.style] || 'Roadbearer';
    return `<section class="eq25-screen${selected?' has-selection':''}" data-equipment-filter="${attr(filter)}" aria-label="Equipment and inventory">
      <header class="eq25-header"><div><small>Seven-slot loadout</small><h2>Equipment & Pack</h2></div><div class="eq25-wallet"><span>✦ ${Math.max(0,Number(state.gold)||0)}</span><small>${Math.max(0,Number(state.materials?.briarFiber)||0)} fiber · ${Math.max(0,Number(state.materials?.wardenAlloy)||0)} alloy</small></div></header>
      <div class="eq25-feedback" role="status" aria-live="polite">${esc(options.message || '')}</div>
      <div class="eq25-layout"><section class="eq25-character" aria-label="Equipped gear and character stats">
        <div class="eq25-paperdoll"><div class="eq25-preview-frame"><canvas id="equipmentPreview" width="240" height="260" aria-label="${esc(pathName)} character preview"></canvas><span>${esc(pathName)}</span></div>${SLOT_DEFS.map(slot=>slotMarkup(state,slot)).join('')}</div>
        <div class="eq25-stat-grid"><div><small>Damage</small><strong>${formatStat('power',build.power)}</strong></div><div><small>Armor</small><strong>${formatStat('armor',build.armor)}</strong></div><div><small>Max HP</small><strong>${formatStat('maxHp',build.maxHp)}</strong></div><div><small>Spell dmg</small><strong>${formatStat('spellDamage',build.spellDamage)}</strong></div><div><small>Mitigation</small><strong>${formatStat('damageReduction',build.damageReduction)}</strong></div><div><small>Crit chance</small><strong>${formatStat('crit',build.crit)}</strong></div></div>
      </section><section class="eq25-inventory" aria-label="Pack items"><nav class="eq25-filters" aria-label="Inventory filters">${FILTERS.map(name=>`<button data-gear-filter="${name}" class="${name===filter?'is-active':''}" aria-pressed="${name===filter}">${name}</button>`).join('')}</nav><div class="eq25-items">${visible.length?visible.map(item=>cardMarkup(state,item,selected?.uid)).join(''):`<div class="eq25-no-items"><span>◇</span><strong>No ${esc(filter.toLowerCase())} items</strong><p>Explore the Vale, trade, and defeat elites to expand your pack.</p></div>`}</div></section><aside class="eq25-detail" aria-label="Selected item details">${detailMarkup(state,selected)}</aside></div>
    </section>`;
  }

  function paint(container, state = {}) {
    const canvas = container?.matches?.('#equipmentPreview') ? container : container?.querySelector?.('#equipmentPreview');
    if (!canvas?.getContext) return false;
    const box = canvas.getBoundingClientRect?.() || {}, width = Math.max(32,Math.round(box.width||160)), height = Math.max(80,Math.round(box.height||210));
    const ratio = clamp(globalThis.devicePixelRatio||1,1,2); canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
    const ctx=canvas.getContext('2d'); if(!ctx)return false; ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,width,height); ctx.imageSmoothingEnabled=false;
    const glow=ctx.createRadialGradient(width/2,height*.48,8,width/2,height*.52,width*.48);glow.addColorStop(0,'rgba(104,232,204,.17)');glow.addColorStop(.65,'rgba(28,76,65,.08)');glow.addColorStop(1,'rgba(2,13,12,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='rgba(229,194,105,.32)';ctx.lineWidth=1;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.ellipse(width/2,height-21,42+ring*9,9+ring*3,0,0,Math.PI*2);ctx.stroke();}
    if(globalThis.EVERLIGHT_ACTORS?.draw){ctx.save();const scale=Math.max(.6,Math.min(2.35,(width-5)/48,(height-35)/64));ctx.translate(width/2,height-16);ctx.scale(scale,scale);globalThis.EVERLIGHT_ACTORS.draw(ctx,{id:'player',name:'Roadbearer',x:0,y:0,time:0,moving:false,facing:'down',role:state.style||'vanguard',player:true});ctx.restore();}
    else{ctx.fillStyle='#172b26';ctx.fillRect(width/2-20,height-116,40,82);ctx.fillStyle='#65b794';ctx.fillRect(width/2-14,height-104,28,47);ctx.fillStyle='#d7a27c';ctx.fillRect(width/2-11,height-124,22,22);}
    const gear=equippedSlots(state);const scale=Math.max(.6,Math.min(1.25,(width-5)/48,(height-35)/64));ctx.save();ctx.translate(width/2,height-16-29*scale);ctx.scale(scale,scale);
    if(gear.Weapon){const c=RARITY[gear.Weapon.rarity]||RARITY.Common;ctx.strokeStyle='#17231f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(27,22);ctx.lineTo(45,-22);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(27,22);ctx.lineTo(45,-22);ctx.stroke();}
    if(gear.Shield){const c=RARITY[gear.Shield.rarity]||RARITY.Common;ctx.fillStyle=`${c}33`;ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-25,-2);ctx.lineTo(-13,-7);ctx.lineTo(-10,8);ctx.lineTo(-19,18);ctx.lineTo(-28,8);ctx.closePath();ctx.fill();ctx.stroke();}
    if(gear.Helm){const c=RARITY[gear.Helm.rarity]||RARITY.Common;ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-23,10,Math.PI,0);ctx.lineTo(10,-15);ctx.moveTo(-10,-23);ctx.lineTo(-10,-15);ctx.stroke();}
    ctx.restore();return true;
  }

  window.EVERLIGHT_EQUIPMENT = Object.freeze({
    version:27, filters:FILTERS, slots:SLOT_KEYS, slotDefs:SLOT_DEFS, gearTypes:GEAR_TYPES,
    effective, canonical, migrate, equippedSlots, aggregate, stats, slotForItem, equip, unequip,
    upgradeCost, render, paint
  });
})();
