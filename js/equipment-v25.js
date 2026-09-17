/* Everlight v25 equipment, comparison, and paper-doll UI.
 * Public API: window.EVERLIGHT_EQUIPMENT
 */
(() => {
  'use strict';

  const SLOT_TYPES = Object.freeze(['Weapon', 'Armor', 'Charm']);
  const FILTERS = Object.freeze(['All', 'Weapon', 'Armor', 'Charm', 'Consumable', 'Quest']);
  const RARITY = Object.freeze({
    Common: '#d7dfda', Uncommon: '#79dfa0', Rare: '#67b9ff',
    Epic: '#c783ff', Legendary: '#ffc861', Mythic: '#ff7ee8'
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const rankOf = item => Math.trunc(clamp(item?.rank, 0, 5));
  const isGear = item => SLOT_TYPES.includes(item?.type);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const attr = esc;

  function effective(item) {
    if (!item || typeof item !== 'object') return null;
    const rank = rankOf(item);
    const result = { ...item, rank };
    if (item.type === 'Weapon') result.power = (Number(item.power) || 0) + rank * 3;
    if (item.type === 'Armor') {
      result.armor = (Number(item.armor) || 0) + rank * 2;
      result.maxHp = (Number(item.maxHp) || 0) + rank * 4;
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

  function equippedItem(state, equipment, type) {
    return effective(resolveItem(state, equipment?.[type]));
  }

  function stats(state = {}, equipment = state.equipment || {}) {
    const weapon = equippedItem(state, equipment, 'Weapon');
    const armorItem = equippedItem(state, equipment, 'Armor');
    const charm = equippedItem(state, equipment, 'Charm');
    const skills = Array.isArray(state.skills) ? state.skills : [];
    const hasSkill = id => skills.includes(id);
    const armor = (armorItem?.armor || 0) + (charm?.armor || 0) + (state.faction === 'ironbound' ? 8 : 0);
    const spell = (1 + (charm?.spell || 0)) * (hasSkill('aether_surge') ? 1.25 : 1) * (state.style === 'arcanist' ? 1.25 : 1);
    const speed = (state.activeMount ? 1.65 : 1) * (hasSkill('fleetstep') ? 1.12 : 1) * (state.style === 'ranger' ? 1.1 : 1);
    const crit = (Number(state.crit) || 0) + (state.faction === 'archive' ? 0.04 : 0);
    return {
      power: (weapon?.power || 8) * (hasSkill('keen_edge') ? 1.2 : 1),
      armor,
      spell,
      speed,
      crit,
      maxHp: (Number(state.maxHp) || 100) + (armorItem?.maxHp || 0),
      damageReduction: armor <= 0 ? 0 : 1 - (100 / (100 + armor * 6)),
      spellDamage: Math.round(25 * spell)
    };
  }

  function upgradeCost(item) {
    if (!isGear(item)) return null;
    const rank = rankOf(item);
    if (rank >= 5) return null;
    const gold = Math.round((50 + (Number(item.value) || 0) * 0.3) * (rank + 1));
    return rank <= 2
      ? Object.freeze({ gold, material: 'briarFiber', amount: (rank + 1) * 2, rank, nextRank: rank + 1 })
      : Object.freeze({ gold, material: 'wardenAlloy', amount: rank - 1, rank, nextRank: rank + 1 });
  }

  function stars(rank) {
    const value = Math.trunc(clamp(rank, 0, 5));
    return `<span class="eq25-stars" aria-label="Upgrade rank ${value} of 5"><b>${'★'.repeat(value)}</b>${'☆'.repeat(5 - value)}</span>`;
  }

  function iconSvg(type) {
    const common = 'viewBox="0 0 32 32" aria-hidden="true" focusable="false"';
    if (type === 'Weapon') return `<svg ${common}><path d="M23 3l6 1-1 6L13 25l-6 2 2-6L23 3z"/><path class="hi" d="M23 6l3 1L11 23l-2 1 1-2L23 6z"/><path d="M7 20l5 5-3 3-5-5 3-3z"/></svg>`;
    if (type === 'Armor') return `<svg ${common}><path d="M9 5l7-3 7 3 6 6-4 5-3-3v16H10V13l-3 3-4-5 6-6z"/><path class="hi" d="M12 6l4 2 4-2v17h-8V6z"/></svg>`;
    if (type === 'Charm') return `<svg ${common}><path d="M14 2h4l1 6 7 5-2 13-8 4-8-4-2-13 7-5 1-6z"/><path class="hi" d="M16 10l5 6-5 8-5-8 5-6z"/></svg>`;
    if (type === 'Consumable') return `<svg ${common}><path d="M11 3h10v5l4 7v12H7V15l4-7V3z"/><path class="hi" d="M10 18h12v6H10v-6z"/></svg>`;
    return `<svg ${common}><path d="M7 3h14l4 4v22H7V3z"/><path class="hi" d="M11 9h10v2H11zm0 6h10v2H11zm0 6h7v2h-7z"/></svg>`;
  }

  function formatStat(key, value) {
    if (key === 'crit' || key === 'damageReduction') return `${Math.round(value * 100)}%`;
    if (key === 'speed' || key === 'spell') return `${value.toFixed(2)}×`;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  const STAT_META = Object.freeze([
    ['power', 'Damage'], ['armor', 'Armor'], ['maxHp', 'Max HP'],
    ['spellDamage', 'Spell dmg'], ['damageReduction', 'Mitigation'], ['crit', 'Crit chance'], ['speed', 'Move speed']
  ]);

  function comparisonRows(before, after, changesOnly = false) {
    return STAT_META.filter(([key]) => !changesOnly || Math.abs((Number(after[key]) || 0) - (Number(before[key]) || 0)) > 0.0001).map(([key, label]) => {
      const current = Number(before[key]) || 0;
      const next = Number(after[key]) || 0;
      const delta = next - current;
      const direction = delta > 0.0001 ? 'up' : delta < -0.0001 ? 'down' : 'same';
      const deltaText = direction === 'same' ? 'No change' : `${delta > 0 ? '+' : ''}${formatStat(key, delta)}`;
      return `<div class="eq25-compare-row is-${direction}"><span>${label}</span><strong>${formatStat(key, current)} <i>→</i> ${formatStat(key, next)}</strong><em>${deltaText}</em></div>`;
    }).join('') || '<div class="eq25-compare-none">No combat stat change</div>';
  }

  function slotMarkup(state, type) {
    const item = effective(resolveItem(state, state.equipment?.[type]));
    const uid = item?.uid || '';
    return `<button class="eq25-slot eq25-slot--${type.toLowerCase()} ${item ? `rarity-${String(item.rarity || 'Common').toLowerCase()}` : 'is-empty'}" data-inspect="${attr(uid)}" ${item ? '' : 'disabled'} aria-label="${item ? `Inspect equipped ${esc(item.name)}` : `Empty ${type} slot`}">
      <span class="eq25-slot-icon">${iconSvg(type)}</span><small>${type}</small><strong>${item ? esc(item.name) : 'Empty'}</strong>${item ? stars(item.rank) : '<span class="eq25-empty-mark">—</span>'}
    </button>`;
  }

  function itemStats(item) {
    const current = effective(item);
    if (!current) return '';
    const values = [];
    if (current.power) values.push(`${current.power} damage`);
    if (current.armor) values.push(`${current.armor} armor`);
    if (current.maxHp) values.push(`+${current.maxHp} HP`);
    if (current.spell) values.push(`+${Math.round(current.spell * 100)}% aether`);
    if (current.heal) values.push(`Restores ${current.heal} HP`);
    if (current.mana) values.push(`Restores ${current.mana} AE`);
    return values.join(' · ') || current.type;
  }

  function cardMarkup(state, item, selectedUid) {
    const selected = item.uid === selectedUid;
    const equipped = isGear(item) && state.equipment?.[item.type] === item.uid;
    const rarity = String(item.rarity || 'Common');
    return `<button class="eq25-item rarity-${rarity.toLowerCase()}${selected ? ' is-selected' : ''}${equipped ? ' is-equipped' : ''}" data-inspect="${attr(item.uid)}" aria-pressed="${selected}">
      <span class="eq25-item-icon">${iconSvg(item.type)}</span>
      <span class="eq25-item-copy"><small>${esc(rarity)} ${esc(item.type)}${equipped ? ' · Equipped' : ''}</small><strong>${esc(item.name || 'Unnamed item')}</strong><span>${esc(itemStats(item))}</span>${isGear(item) ? stars(rankOf(item)) : ''}</span>
    </button>`;
  }

  function useDisabled(state, item) {
    if (item?.type !== 'Consumable') return true;
    if (item.heal) return (Number(state.hp) || 0) >= stats(state).maxHp;
    if (item.mana) return (Number(state.mana) || 0) >= (Number(state.maxMana) || 60);
    return false;
  }

  function detailMarkup(state, item) {
    if (!item) return `<div class="eq25-detail-empty"><span>✦</span><strong>Choose an item</strong><p>Tap a slot or pack item to inspect its real effect on your build.</p></div>`;
    const rarity = String(item.rarity || 'Common');
    const before = stats(state);
    let after = before;
    if (isGear(item)) after = stats(state, { ...(state.equipment || {}), [item.type]: item });
    const cost = upgradeCost(item);
    const materialCount = cost ? Number(state.materials?.[cost.material]) || 0 : 0;
    const canAfford = !!cost && (Number(state.gold) || 0) >= cost.gold && materialCount >= cost.amount;
    const isEquipped = isGear(item) && state.equipment?.[item.type] === item.uid;
    const materialName = cost?.material === 'briarFiber' ? 'Briar Fiber' : 'Warden Alloy';
    const upgraded = cost ? { ...item, rank: cost.nextRank } : null;
    const upgradeBefore = isGear(item) ? stats(state, { ...(state.equipment || {}), [item.type]: item }) : before;
    const upgradeAfter = upgraded ? stats(state, { ...(state.equipment || {}), [item.type]: upgraded }) : upgradeBefore;
    const goldNeeded = cost ? Math.max(0, cost.gold - (Number(state.gold) || 0)) : 0;
    const materialNeeded = cost ? Math.max(0, cost.amount - materialCount) : 0;
    const missing = cost ? [goldNeeded ? `${goldNeeded} more gold` : '', materialNeeded ? `${materialNeeded} more ${materialName}` : ''].filter(Boolean).join(' · ') : '';
    const equipAction = isGear(item) ? (isEquipped
      ? `<button data-unequip="${attr(item.type)}">Unequip ${esc(item.type)}</button>`
      : `<button data-equip="${attr(item.uid)}">Equip ${esc(item.type)}</button>`) : '';
    const upgradeAction = isGear(item) ? (cost
      ? `<button class="eq25-upgrade" data-upgrade="${attr(item.uid)}" ${canAfford ? '' : 'disabled'}>${canAfford ? `Raise to ${stars(cost.nextRank)}` : `<strong>Need ${esc(missing)}</strong>`}<span>${cost.gold}g · ${cost.amount} ${materialName}</span></button>`
      : `<button data-upgrade="${attr(item.uid)}" disabled>★★★★★ Masterworked</button>`) : '';
    const useBlocked = useDisabled(state, item);
    const useLabel = useBlocked ? (item.heal ? 'Health already full' : item.mana ? 'Aether already full' : 'Cannot use now') : 'Use now';
    const useAction = item.type === 'Consumable' ? `<button data-use="${attr(item.uid)}" ${useBlocked ? 'disabled' : ''}>${useLabel}</button>` : '';
    return `<article class="eq25-detail-card rarity-${rarity.toLowerCase()}">
      <button class="eq25-back" data-gear-back data-inspect="" aria-label="Back to pack">‹ <span>Back to pack</span></button>
      <header><span class="eq25-detail-icon">${iconSvg(item.type)}</span><div><small>${esc(rarity)} · ${esc(item.type)}</small><h3>${esc(item.name || 'Unnamed item')}</h3>${isGear(item) ? stars(rankOf(item)) : ''}</div></header>
      <p>${esc(item.description || 'A piece of the Vale’s long story.')}</p>
      <div class="eq25-traits">${esc(itemStats(item))}</div>
      ${isGear(item) ? '<div class="eq25-scroll-hint" aria-hidden="true">Scroll for comparison ↓</div>' : ''}
      ${isGear(item) ? `<div class="eq25-section-title"><span>Loadout impact</span><small>${isEquipped ? 'Currently equipped' : `Replacing ${esc(effective(resolveItem(state, state.equipment?.[item.type]))?.name || `empty ${item.type.toLowerCase()} slot`)}`}</small></div><div class="eq25-comparison">${comparisonRows(before, after)}</div>` : ''}
      ${cost ? `<div class="eq25-section-title eq25-section-title--upgrade"><span>Next star gains</span><small>Rank ${cost.rank} → ${cost.nextRank}</small></div><div class="eq25-comparison eq25-comparison--upgrade">${comparisonRows(upgradeBefore, upgradeAfter, true)}</div><div class="eq25-cost"><span>Upgrade cost</span><strong>${cost.gold} gold</strong><strong class="${materialCount >= cost.amount ? 'has-material' : ''}">${materialCount}/${cost.amount} ${materialName}</strong></div>` : ''}
      <div class="eq25-actions">${equipAction}${upgradeAction}${useAction}</div>
    </article>`;
  }

  function render(state = {}, options = {}) {
    const inventory = Array.isArray(state.inventory) ? state.inventory.filter(Boolean) : [];
    const filter = FILTERS.includes(options.filter) ? options.filter : 'All';
    const visible = filter === 'All' ? inventory : inventory.filter(item => item.type === filter);
    const requested = inventory.find(item => item.uid === options.selectedUid);
    const selected = requested || null;
    const build = stats(state);
    const pathName = ({ vanguard: 'Vanguard', ranger: 'Wayfinder', arcanist: 'Lightweaver' })[state.style] || 'Roadbearer';
    return `<section class="eq25-screen${selected ? ' has-selection' : ''}" data-equipment-filter="${attr(filter)}" aria-label="Equipment and inventory">
      <header class="eq25-header"><div><small>Roadbearer loadout</small><h2>Equipment & Pack</h2></div><div class="eq25-wallet"><span>✦ ${Math.max(0, Number(state.gold) || 0)}</span><small>${Math.max(0, Number(state.materials?.briarFiber) || 0)} fiber · ${Math.max(0, Number(state.materials?.wardenAlloy) || 0)} alloy</small></div></header>
      <div class="eq25-feedback" role="status" aria-live="polite">${esc(options.message || '')}</div>
      <div class="eq25-layout">
        <section class="eq25-character" aria-label="Equipped gear and character stats">
          <div class="eq25-paperdoll"><div class="eq25-preview-frame"><canvas id="equipmentPreview" width="240" height="260" aria-label="${esc(pathName)} character preview"></canvas><span>${esc(pathName)}</span></div>${slotMarkup(state, 'Weapon')}${slotMarkup(state, 'Armor')}${slotMarkup(state, 'Charm')}</div>
          <div class="eq25-stat-grid">
            <div><small>Damage</small><strong>${formatStat('power', build.power)}</strong></div><div><small>Armor</small><strong>${formatStat('armor', build.armor)}</strong></div><div><small>Max HP</small><strong>${formatStat('maxHp', build.maxHp)}</strong></div><div><small>Spell dmg</small><strong>${formatStat('spellDamage', build.spellDamage)}</strong></div><div><small>Mitigation</small><strong>${formatStat('damageReduction', build.damageReduction)}</strong></div><div><small>Crit chance</small><strong>${formatStat('crit', build.crit)}</strong></div>
          </div>
        </section>
        <section class="eq25-inventory" aria-label="Pack items">
          <nav class="eq25-filters" aria-label="Inventory filters">${FILTERS.map(name => `<button data-gear-filter="${name}" class="${name === filter ? 'is-active' : ''}" aria-pressed="${name === filter}">${name}</button>`).join('')}</nav>
          <div class="eq25-items">${visible.length ? visible.map(item => cardMarkup(state, item, selected?.uid)).join('') : `<div class="eq25-no-items"><span>◇</span><strong>No ${esc(filter.toLowerCase())} items</strong><p>Explore the Vale, trade, and defeat elites to expand your pack.</p></div>`}</div>
        </section>
        <aside class="eq25-detail" aria-label="Selected item details">${detailMarkup(state, selected)}</aside>
      </div>
    </section>`;
  }

  function paint(container, state = {}) {
    const canvas = container?.matches?.('#equipmentPreview') ? container : container?.querySelector?.('#equipmentPreview');
    if (!canvas?.getContext) return false;
    const box = canvas.getBoundingClientRect?.() || {};
    const width = Math.max(32, Math.round(box.width || 160));
    const height = Math.max(80, Math.round(box.height || 210));
    const ratio = clamp(globalThis.devicePixelRatio || 1, 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const glow = ctx.createRadialGradient(width / 2, height * 0.48, 8, width / 2, height * 0.52, width * 0.48);
    glow.addColorStop(0, 'rgba(104,232,204,.17)');
    glow.addColorStop(0.65, 'rgba(28,76,65,.08)');
    glow.addColorStop(1, 'rgba(2,13,12,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(229,194,105,.32)';
    ctx.lineWidth = 1;
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 23, 56 + ring * 12, 13 + ring * 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      ctx.fillStyle = i % 2 ? '#5edbc344' : '#f0ce7344';
      ctx.fillRect(Math.round(width / 2 + Math.cos(angle) * 65) - 1, Math.round(height - 24 + Math.sin(angle) * 15) - 1, 3, 3);
    }

    if (globalThis.EVERLIGHT_ACTORS?.draw) {
      ctx.save();
      const actorScale = Math.max(0.65, Math.min(2.45, (width - 8) / 48, (height - 42) / 64));
      ctx.translate(width / 2, height - 18);
      ctx.scale(actorScale, actorScale);
      globalThis.EVERLIGHT_ACTORS.draw(ctx, {
        id: 'player', name: 'Roadbearer', x: 0, y: 0, time: 0,
        moving: false, facing: 'down', role: state.style || 'vanguard', player: true
      });
      ctx.restore();
    } else {
      ctx.fillStyle = '#172b26'; ctx.fillRect(width / 2 - 25, height - 142, 50, 105);
      ctx.fillStyle = '#65b794'; ctx.fillRect(width / 2 - 17, height - 127, 34, 60);
      ctx.fillStyle = '#d7a27c'; ctx.fillRect(width / 2 - 13, height - 151, 26, 27);
    }

    const weapon = effective(resolveItem(state, state.equipment?.Weapon));
    const armor = effective(resolveItem(state, state.equipment?.Armor));
    ctx.save();
    const overlayScale = Math.max(0.65, Math.min(2.45, (width - 8) / 48, (height - 42) / 64));
    ctx.translate(width / 2, height - 18 - 30 * overlayScale);
    ctx.scale(Math.min(1.35, overlayScale), Math.min(1.35, overlayScale));
    if (weapon) {
      ctx.strokeStyle = '#182622'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(31, 22); ctx.lineTo(52, -25); ctx.stroke();
      ctx.strokeStyle = RARITY[weapon.rarity] || RARITY.Common; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(31, 22); ctx.lineTo(52, -25); ctx.stroke();
      ctx.fillStyle = '#e8cc76'; ctx.fillRect(26, 17, 15, 4);
    }
    if (armor) {
      const armorColor = RARITY[armor.rarity] || RARITY.Common;
      ctx.fillStyle = `${armorColor}24`;
      ctx.strokeStyle = armorColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -5); ctx.lineTo(-7, -10); ctx.lineTo(0, -7); ctx.lineTo(7, -10); ctx.lineTo(12, -5);
      ctx.lineTo(10, 12); ctx.lineTo(4, 16); ctx.lineTo(0, 13); ctx.lineTo(-4, 16); ctx.lineTo(-10, 12); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-15, 0); ctx.lineTo(-12, 5); ctx.moveTo(9, -4); ctx.lineTo(15, 0); ctx.lineTo(12, 5); ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  window.EVERLIGHT_EQUIPMENT = Object.freeze({
    version: 25,
    filters: FILTERS,
    slots: SLOT_TYPES,
    effective,
    stats,
    upgradeCost,
    render,
    paint
  });
})();
