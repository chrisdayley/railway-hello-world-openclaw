/* Everlight v28 merchant buy/sell transactions and mobile trade UI.
 * Public API: window.EVERLIGHT_MERCHANTS
 */
(() => {
  'use strict';

  const HIGH_RARITY = Object.freeze(new Set(['Epic', 'Legendary', 'Mythic']));
  const RARITY_COLOR = Object.freeze({
    Common:'#d7dfda', Uncommon:'#79dfa0', Rare:'#67b9ff',
    Epic:'#c783ff', Legendary:'#ffc861', Mythic:'#ff7ee8'
  });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[char]);
  const attr = esc;
  const referenceId = reference => reference && typeof reference === 'object' ? reference.uid || reference.id || null : reference;

  function quote(item) {
    if (!item || item.type === 'Quest') return 0;
    const value = Math.max(0, Number(item.value) || 0);
    if (!value) return 0;
    const rank = Math.trunc(clamp(item.rank, 0, 5));
    let invested = 0;
    for (let current = 0; current < rank; current++) invested += Math.round((50 + value * 0.3) * (current + 1));
    const base = Math.round(value * 0.32);
    const premium = Math.min(Math.round(value * 0.28), Math.round(invested * 0.18));
    return Math.max(1, Math.min(Math.round(value * 0.6), base + premium));
  }

  function requiresConfirmation(item) {
    return !!item && HIGH_RARITY.has(String(item.rarity || 'Common'));
  }

  function equippedSlot(state, uid) {
    const wanted = String(uid ?? '');
    if (!wanted) return null;
    for (const [slot, reference] of Object.entries(state?.equipment || {})) {
      if (String(referenceId(reference) ?? '') === wanted) return ({Charm:'Charm I',Charm1:'Charm I',Charm2:'Charm II'})[slot] || slot;
    }
    return null;
  }

  function isEquipped(state, uid) {
    return !!equippedSlot(state, uid);
  }

  function sell(state, uid) {
    if (!state || !Array.isArray(state.inventory)) return { ok:false, message:'Your pack is unavailable.' };
    const index = state.inventory.findIndex(item => item?.uid === uid);
    if (index < 0) return { ok:false, message:'That item is no longer in your pack.' };
    const item = state.inventory[index];
    if (item.type === 'Quest') return { ok:false, message:'Story items cannot be sold.' };
    const slot = equippedSlot(state, uid);
    if (slot) return { ok:false, message:`Unequip ${item.name || 'this item'} from ${slot} before selling it.` };
    const gold = quote(item);
    if (gold <= 0) return { ok:false, message:`${item.name || 'This item'} has no resale value.` };
    const currentGold = Math.max(0, Number(state.gold) || 0);
    state.inventory.splice(index, 1);
    state.gold = currentGold + gold;
    return { ok:true, message:`Sold ${item.name || 'item'} for ${gold} gold.`, gold, item };
  }

  function itemSummary(item) {
    const parts = [];
    if (item.power) parts.push(`${item.power} damage`);
    if (item.armor) parts.push(`${item.armor} armor`);
    if (item.maxHp) parts.push(`+${item.maxHp} HP`);
    if (item.spell) parts.push(`+${Math.round(item.spell * 100)}% aether`);
    if (item.crit) parts.push(`+${Math.round(item.crit * 100)}% crit`);
    if (item.heal) parts.push(`Restores ${item.heal} HP`);
    if (item.mana) parts.push(`Restores ${item.mana} AE`);
    return parts.join(' · ') || item.description || item.type || 'Item';
  }

  function icon(type) {
    return ({Weapon:'⚔',Armor:'◆',Shield:'⬟',Helm:'⌒',Belt:'▣',Charm:'✦',Consumable:'◈',Quest:'◇'})[type] || '◇';
  }

  function buyRows(state, stock, templates, priceFor) {
    const source = Array.isArray(stock) ? stock : [];
    return source.map((entry, index) => {
      const item = typeof entry === 'string' ? (templates instanceof Map ? templates.get(entry) : templates?.[entry]) : entry;
      if (!item) return '';
      const id = item.id || (typeof entry === 'string' ? entry : '');
      let price = Number(item.value) || 0;
      try { if (typeof priceFor === 'function') price = Number(priceFor(item)); } catch (_) {}
      price = Math.max(0, Math.ceil(price || 0));
      const affordable = (Number(state?.gold) || 0) >= price;
      const rarity = String(item.rarity || 'Common');
      return `<article class="merchant28-row rarity-${rarity.toLowerCase()}" style="--merchant-rarity:${RARITY_COLOR[rarity] || RARITY_COLOR.Common}">
        <span class="merchant28-icon" aria-hidden="true">${icon(item.type)}</span><div><small>${esc(rarity)} · ${esc(item.type || 'Item')}</small><strong>${esc(item.name || id || 'Unnamed item')}</strong><p>${esc(itemSummary(item))}</p></div>
        <button data-buy="${attr(id)}" data-index="${index}" ${affordable?'':'disabled'}>${affordable?`${price}g`:`Need ${price - (Number(state?.gold)||0)}g`}</button>
      </article>`;
    }).join('');
  }

  function sellRows(state) {
    const items = Array.isArray(state?.inventory) ? state.inventory.filter(Boolean) : [];
    return items.map(item => {
      const rarity = String(item.rarity || 'Common'), slot = equippedSlot(state, item.uid), amount = quote(item);
      const blocked = item.type === 'Quest' || !!slot || amount <= 0;
      const label = item.type === 'Quest' ? 'Story item' : slot ? `Equipped · ${slot}` : amount <= 0 ? 'No value' : requiresConfirmation(item) ? `Review · ${amount}g` : `Sell · ${amount}g`;
      return `<article class="merchant28-row rarity-${rarity.toLowerCase()}${blocked?' is-locked':''}" style="--merchant-rarity:${RARITY_COLOR[rarity] || RARITY_COLOR.Common}">
        <span class="merchant28-icon" aria-hidden="true">${icon(item.type)}</span><div><small>${esc(rarity)} · ${esc(item.type || 'Item')}${item.rank?` · ${'★'.repeat(Math.trunc(clamp(item.rank,0,5)))}`:''}</small><strong>${esc(item.name || 'Unnamed item')}</strong><p>${esc(itemSummary(item))}</p></div>
        <button data-sell="${attr(item.uid)}" ${blocked?'disabled':''}>${esc(label)}</button>
      </article>`;
    }).join('') || `<div class="merchant28-empty"><span>◇</span><strong>Your pack is empty</strong><p>There is nothing available to sell.</p></div>`;
  }

  function confirmation(state, pendingUid) {
    const item = (state?.inventory || []).find(entry => entry?.uid === pendingUid);
    if (!item || !requiresConfirmation(item) || item.type === 'Quest' || isEquipped(state, pendingUid) || quote(item) <= 0) return '';
    const amount = quote(item), rarity = String(item.rarity || 'Common');
    return `<section class="merchant28-confirm rarity-${rarity.toLowerCase()}" style="--merchant-rarity:${RARITY_COLOR[rarity] || RARITY_COLOR.Common}" role="alertdialog" aria-label="Confirm sale of ${attr(item.name || 'rare item')}">
      <span class="merchant28-confirm-icon">${icon(item.type)}</span><div><small>${esc(rarity)} ${esc(item.type)}</small><h3>Sell ${esc(item.name || 'this item')}?</h3><p>This rare item leaves your pack permanently. You will receive <strong>${amount} gold</strong>.</p></div>
      <div class="merchant28-confirm-actions"><button data-cancel-sale>Keep item</button><button class="is-danger" data-confirm-sell="${attr(item.uid)}">Confirm sale · ${amount}g</button></div>
    </section>`;
  }

  function render({ state = {}, stock = [], templates = {}, priceFor, keeper = 'Merchant', view = 'buy' } = {}) {
    const options = view && typeof view === 'object' ? view : { mode:view };
    const mode = options.mode === 'sell' ? 'sell' : 'buy';
    const pending = mode === 'sell' ? confirmation(state, options.pendingUid || options.pendingSale) : '';
    const rows = mode === 'sell' ? sellRows(state) : buyRows(state, stock, templates, priceFor);
    const message = options.message ? `<div class="merchant28-feedback" role="status" aria-live="polite">${esc(options.message)}</div>` : '';
    return `<section class="merchant28 merchant28--${mode}" aria-label="Trade with ${attr(keeper)}">
      <header><div><small>Trade with</small><h3>${esc(keeper)}</h3></div><strong class="merchant28-purse">✦ ${Math.max(0,Number(state.gold)||0)}g</strong></header>
      <nav aria-label="Merchant actions"><button data-merchant-view="buy" class="${mode==='buy'?'is-active':''}" aria-pressed="${mode==='buy'}">Buy wares</button><button data-merchant-view="sell" class="${mode==='sell'?'is-active':''}" aria-pressed="${mode==='sell'}">Sell from pack</button></nav>
      ${message}${pending}<div class="merchant28-list">${rows}</div>
      <footer>${mode==='sell'?'Equipped and story items are protected. Rare sales ask for confirmation.':'Property and faction discounts are already included in shown prices.'}</footer>
    </section>`;
  }

  window.EVERLIGHT_MERCHANTS = Object.freeze({
    version:28, quote, requiresConfirmation, isEquipped, sell, render
  });
})();
