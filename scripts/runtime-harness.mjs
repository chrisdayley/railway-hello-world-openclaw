import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

class ClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
}

function drawingContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradient;
      if (property === 'measureText') return text => ({ width: String(text).length * 8 });
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) { target[property] = value; return true; }
  });
}

class StubElement {
  constructor(id = '') {
    this.id = id;
    this.classList = new ClassList(['is-hidden']);
    this.style = { setProperty() {} };
    this.dataset = {};
    this.listeners = new Map();
    this.children = [];
    this.textContent = '';
    this.innerHTML = '';
    this.inert = false;
    this.width = 960;
    this.height = 540;
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  dispatchEvent(event) {
    for (const handler of this.listeners.get(event.type) || []) handler(event);
    return true;
  }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this[name] = String(value); }
  querySelector(selector) { return selector === '#equipmentPreview' ? null : new StubElement(); }
  querySelectorAll() { return []; }
  matches() { return false; }
  getContext() { return drawingContext(); }
  getBoundingClientRect() { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844 }; }
  focus() {}
  closest() { return null; }
  setPointerCapture() {}
}

function audioContextClass() {
  const frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const gainValue = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  return class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    resume() { this.state = 'running'; }
    createOscillator() {
      return { frequency, connect(node) { return node; }, start() {}, stop() {}, type: 'sine' };
    }
    createGain() { return { gain: gainValue, connect() { return this; } }; }
  };
}

export function loadRuntime() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new StubElement(id));
    return elements.get(id);
  };
  const windowListeners = new Map();
  const documentListeners = new Map();
  const storage = new Map();
  const document = {
    hidden: false,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    activeElement: element('activeElement'),
    documentElement: element('documentElement'),
    body: element('body'),
    getElementById: element,
    createElement: tag => new StubElement(tag),
    querySelectorAll: () => [],
    addEventListener(type, handler) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(handler);
    },
    exitFullscreen: async () => {}
  };
  const AudioContext = audioContextClass();
  const context = {
    console,
    document,
    location: { hostname: 'localhost', search: '', reload() {}, replace() {} },
    navigator: { standalone: false, vibrate() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
    visualViewport: null,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    removeEventListener() {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 1,
    clearTimeout() {},
    performance: { now: () => 1_000 },
    Image: class Image { constructor() { this.complete = false; this.onload = null; } },
    AudioContext,
    webkitAudioContext: AudioContext,
    URLSearchParams,
    structuredClone,
    confirm: () => true,
    Math,
    Date,
    Map,
    Set,
    Object,
    Array,
    JSON,
    Promise
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  for (const relativePath of [
    'js/world-atlas-v22.js',
    'js/exploration-v24.js',
    'js/actors-v24.js',
    'js/camera-v25.js',
    'js/equipment-v25.js',
    'js/economy-v26.js',
    'js/progression-v27.js',
    'js/interiors-v27.js',
    'js/minimap-v27.js',
    'js/merchants-v28.js',
    'js/skills-v28.js',
    'js/story-v28.js',
    'js/game-v4.js'
  ]) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
  }
  const debug = context.__EVERLIGHT_DEBUG__;
  assert(debug?.navigation, 'localhost runtime must expose navigation debug API');
  const dispatchWindow = (type, event = {}) => {
    for (const handler of windowListeners.get(type) || []) handler({ type, ...event });
  };
  return { context, debug, nav: debug.navigation, dispatchWindow, elements, storage };
}
