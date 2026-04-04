/**
 * Ultimate Powerflow Card v1.0.0
 * Home Assistant Lovelace custom card
 * https://github.com/Sven2410/Ultimate-Powerflow-Card
 * License: MIT
 *
 * Pre-built distributable – place in /config/www/ and register as a Lovelace resource.
 * No build step required for end users.
 */

// ── Helpers ────────────────────────────────────────────────

function formatPower(watts) {
  if (watts === null || watts === undefined || isNaN(watts)) return "—";
  const abs = Math.abs(watts);
  if (abs < 1000) return `${Math.round(abs)} W`;
  const kw = abs / 1000;
  if (kw < 10) return `${kw.toFixed(2)} kW`;
  if (kw < 100) return `${kw.toFixed(1)} kW`;
  return `${Math.round(kw)} kW`;
}

function parseEntityValue(state) {
  if (!state || state === "unavailable" || state === "unknown" || state === "none") return null;
  const num = parseFloat(state);
  return isNaN(num) ? null : num;
}

function isDaytime(sunState) {
  if (!sunState) return true;
  return sunState === "above_horizon";
}

function resolveImageFilename({ isDay, solarEnabled, batteryEnabled, evChargerEnabled, basePath }) {
  const t = isDay ? "day" : "night";
  let name = `house-energy-${t}-grid`;
  if (solarEnabled) {
    name += "-solar-panels";
    if (batteryEnabled) {
      name += "-battery";
      if (evChargerEnabled) name += "-ev-charger";
    }
  }
  name += ".png";
  const base = basePath.endsWith("/") ? basePath : basePath + "/";
  return `${base}${name}`;
}

function getOverlayType(condition) {
  if (!condition) return "none";
  const c = condition.toLowerCase();
  if (c === "rainy" || c === "pouring" || c === "lightning-rainy") return "rain";
  if (c === "snowy" || c === "snowy-rainy" || c === "hail") return "snow";
  return "none";
}

function animateRain(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = canvas.offsetHeight || 225;
  const drops = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    len: 10 + Math.random() * 20,
    speed: 8 + Math.random() * 10,
    opacity: 0.3 + Math.random() * 0.5,
  }));
  let rafId = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops.forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y + d.len);
      ctx.strokeStyle = `rgba(174,214,241,${d.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
}

function animateSnow(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = canvas.offsetHeight || 225;
  const flakes = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    len: 2 + Math.random() * 4,
    speed: 1 + Math.random() * 2,
    opacity: 0.5 + Math.random() * 0.5,
  }));
  let rafId = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach((f) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.len, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
      ctx.fill();
      f.y += f.speed;
      f.x += Math.sin(f.y / 30) * 0.5;
      if (f.y > canvas.height) { f.y = -f.len * 2; f.x = Math.random() * canvas.width; }
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
}

const FLOW_THRESHOLD = 5;

function calculateFlows(v) {
  const safe = (n) => Math.max(0, n || 0);
  const solar = safe(v.solar);
  const batt_ch = safe(v.battery_charging);
  const batt_dis = safe(v.battery_discharging);
  const ev = safe(v.ev_charger);
  const house = safe(v.household);
  const grid = v.grid || 0;

  const total_load = house + ev;
  const solar_to_load = Math.min(solar, total_load);
  const solar_rem = solar - solar_to_load;
  const solar_to_battery = Math.min(solar_rem, batt_ch);
  const solar_to_grid = Math.max(0, solar_rem - solar_to_battery);
  const load_deficit = total_load - solar_to_load;
  const battery_to_load = Math.min(batt_dis, load_deficit);
  const grid_to_load = Math.max(0, load_deficit - battery_to_load);

  const grid_import = grid_to_load > 1 ? grid_to_load : Math.max(0, grid);
  const grid_export = solar_to_grid > 1 ? solar_to_grid : 0;

  const solar_to_house = total_load > 0 ? solar_to_load * (house / total_load) : 0;
  const battery_to_house = total_load > 0 ? battery_to_load * (house / total_load) : 0;

  return { solar_to_house, solar_to_battery, solar_to_grid, battery_to_house, grid_to_house: grid_import, house_to_ev: ev, grid_import, grid_export };
}

// ── Default positions & anchors ────────────────────────────

const DEFAULT_POSITIONS = {
  grid:       { x: 88, y: 72 },
  household:  { x: 62, y: 58 },
  solar:      { x: 42, y: 18 },
  battery:    { x: 55, y: 72 },
  ev_charger: { x: 16, y: 75 },
};

const ANCHORS = {
  grid:       { x: 88, y: 65 },
  household:  { x: 62, y: 52 },
  solar:      { x: 43, y: 30 },
  battery:    { x: 55, y: 65 },
  ev_charger: { x: 20, y: 70 },
};

const DEFAULT_COLORS = {
  grid: "#f39c12",
  solar: "#f1c40f",
  battery: "#2ecc71",
  household: "#3498db",
  ev_charger: "#9b59b6",
};

const DEFAULT_BASE_PATH = "/local/ultimate-powerflow/";

// ── Styles ─────────────────────────────────────────────────

const CARD_STYLES = `
  :host {
    display: block;
    --upfc-grid-color: #f39c12;
    --upfc-solar-color: #f1c40f;
    --upfc-battery-color: #2ecc71;
    --upfc-household-color: #3498db;
    --upfc-ev-color: #9b59b6;
  }
  ha-card { overflow: hidden; background: var(--card-background-color, #1c1c2e); border-radius: var(--ha-card-border-radius, 12px); }
  .upfc-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden; border-radius: var(--ha-card-border-radius, 12px); }
  .upfc-inner { position: absolute; inset: 0; }
  .upfc-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .upfc-bg-placeholder { position: absolute; inset: 0; background: linear-gradient(135deg,#1a1a2e,#16213e,#0f3460); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:rgba(255,255,255,.5); font-size:13px; z-index:0; }
  .upfc-svg-overlay { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; }
  .upfc-weather-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; border-radius: inherit; }
  .upfc-rain-canvas, .upfc-snow-canvas { width: 100%; height: 100%; opacity: 0.45; }
  .upfc-label { position: absolute; transform: translate(-50%,-50%); background: rgba(10,10,20,.75); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 5px 10px; display: flex; flex-direction: column; align-items: center; gap: 1px; z-index: 5; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); min-width: 62px; pointer-events: none; box-shadow: 0 2px 12px rgba(0,0,0,.4); }
  .upfc-label-icon { font-size: 13px; line-height: 1; opacity: .7; }
  .upfc-label-title { font-size: 9px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; opacity: .55; color: #fff; line-height: 1.2; }
  .upfc-label-value { font-size: 13px; font-weight: 700; color: #fff; line-height: 1.3; white-space: nowrap; }
  .upfc-label-value.unavailable { opacity: .45; font-size: 11px; }
  .upfc-label[data-type="grid"]       { border-top: 2px solid var(--upfc-grid-color); }
  .upfc-label[data-type="solar"]      { border-top: 2px solid var(--upfc-solar-color); }
  .upfc-label[data-type="battery"]    { border-top: 2px solid var(--upfc-battery-color); }
  .upfc-label[data-type="household"]  { border-top: 2px solid var(--upfc-household-color); }
  .upfc-label[data-type="ev_charger"] { border-top: 2px solid var(--upfc-ev-color); }
  @keyframes flowDash { to { stroke-dashoffset: -48; } }
  .flow-active { stroke-dasharray: 12 8; animation: flowDash 1s linear infinite; }
  .flow-slow   { stroke-dasharray: 12 8; animation: flowDash 2s linear infinite; }
  .flow-fast   { stroke-dasharray: 12 8; animation: flowDash .5s linear infinite; }
  .flow-inactive { opacity: .12; }
  @media (max-width:480px) {
    .upfc-label { padding: 3px 7px; min-width: 46px; }
    .upfc-label-value { font-size: 10px; }
    .upfc-label-title { font-size: 7px; }
  }
`;

// ── Main Card ──────────────────────────────────────────────

class UltimatePowerflowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._cancelWeather = null;
    this._imageError = false;
    this._overlayType = "none";
    this._resizeObserver = null;
  }

  static getConfigElement() {
    return document.createElement("ultimate-powerflow-card-editor");
  }

  static getStubConfig() {
    return { grid_power_entity: "sensor.grid_power", household_power_entity: "sensor.household_power" };
  }

  setConfig(config) {
    if (!config.grid_power_entity) throw new Error("grid_power_entity is required");
    if (!config.household_power_entity) throw new Error("household_power_entity is required");
    this._config = {
      sun_entity: "sun.sun",
      image_base_path: DEFAULT_BASE_PATH,
      animation_speed: "normal",
      solar_enabled: false,
      battery_enabled: false,
      ev_charger_enabled: false,
      ...config,
    };
    this._imageError = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config) this._render();
  }

  connectedCallback() {
    this._setupResizeObserver();
  }

  disconnectedCallback() {
    this._cancelWeather?.();
    this._resizeObserver?.disconnect();
  }

  _setupResizeObserver() {
    this._resizeObserver = new ResizeObserver(() => {
      if (this._overlayType !== "none") {
        this._cancelWeather?.();
        this._cancelWeather = null;
        this._startWeatherAnimation();
      }
    });
    this._resizeObserver.observe(this);
  }

  _state(entity) {
    if (!entity || !this._hass) return undefined;
    return this._hass.states?.[entity]?.state;
  }

  _colors() {
    return { ...DEFAULT_COLORS, ...(this._config?.colors ?? {}) };
  }

  _isDay() {
    return isDaytime(this._state(this._config?.sun_entity ?? "sun.sun"));
  }

  _resolveImage() {
    const cfg = this._config;
    return resolveImageFilename({
      isDay: this._isDay(),
      solarEnabled: !!cfg.solar_enabled,
      batteryEnabled: !!cfg.battery_enabled,
      evChargerEnabled: !!cfg.ev_charger_enabled,
      basePath: cfg.image_base_path ?? DEFAULT_BASE_PATH,
    });
  }

  _getPowerValues() {
    const cfg = this._config;
    return {
      solar: parseEntityValue(this._state(cfg.solar_power_entity)) ?? 0,
      battery_charging: parseEntityValue(this._state(cfg.battery_charging_power_entity)) ?? 0,
      battery_discharging: parseEntityValue(this._state(cfg.battery_discharging_power_entity)) ?? 0,
      ev_charger: parseEntityValue(this._state(cfg.ev_charger_power_entity)) ?? 0,
      grid: parseEntityValue(this._state(cfg.grid_power_entity)) ?? 0,
      household: parseEntityValue(this._state(cfg.household_power_entity)) ?? 0,
    };
  }

  _animClass() {
    const s = this._config?.animation_speed ?? "normal";
    if (s === "slow") return "flow-slow";
    if (s === "fast") return "flow-fast";
    return "flow-active";
  }

  _labelPos(type) {
    return this._config?.label_positions?.[type] ?? DEFAULT_POSITIONS[type];
  }

  _flowPath(from, to, power, color, reversed) {
    const active = Math.abs(power) >= FLOW_THRESHOLD;
    const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;
    const mx = (x1 + x2) / 2;
    const d = `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`;
    const cls = active ? `${this._animClass()}` : "flow-inactive";
    const glow = active ? `filter:drop-shadow(0 0 4px ${color});` : "";
    return `<path class="${cls}" d="${d}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" style="${glow}" />`;
  }

  _renderSVGFlows(flows) {
    const colors = this._colors();
    const cfg = this._config;
    const parts = [];

    // Grid ↔ House
    parts.push(this._flowPath(ANCHORS.grid, ANCHORS.household, flows.grid_import, colors.grid));
    if (flows.grid_export >= FLOW_THRESHOLD)
      parts.push(this._flowPath(ANCHORS.household, ANCHORS.grid, flows.grid_export, colors.solar, true));

    if (cfg.solar_enabled) {
      parts.push(this._flowPath(ANCHORS.solar, ANCHORS.household, flows.solar_to_house, colors.solar));
      if (flows.solar_to_grid >= FLOW_THRESHOLD)
        parts.push(this._flowPath(ANCHORS.solar, ANCHORS.grid, flows.solar_to_grid, colors.solar));
      if (cfg.battery_enabled)
        parts.push(this._flowPath(ANCHORS.solar, ANCHORS.battery, flows.solar_to_battery, colors.solar));
    }
    if (cfg.battery_enabled)
      parts.push(this._flowPath(ANCHORS.battery, ANCHORS.household, flows.battery_to_house, colors.battery));
    if (cfg.ev_charger_enabled)
      parts.push(this._flowPath(ANCHORS.household, ANCHORS.ev_charger, flows.house_to_ev, colors.ev_charger));

    return parts.join("\n");
  }

  _renderLabel(type, title, icon, value) {
    const pos = this._labelPos(type);
    const colors = this._colors();
    const colorMap = { grid: colors.grid, solar: colors.solar, battery: colors.battery, household: colors.household, ev_charger: colors.ev_charger };
    const displayVal = value === null ? "—" : formatPower(value);
    const unavailableClass = value === null ? "unavailable" : "";
    return `
      <div class="upfc-label" data-type="${type}" style="left:${pos.x}%;top:${pos.y}%;--upfc-${type.replace("_","-")}-color:${colorMap[type] || "#fff"}">
        <span class="upfc-label-icon">${icon}</span>
        <span class="upfc-label-title">${title}</span>
        <span class="upfc-label-value ${unavailableClass}">${displayVal}</span>
      </div>`;
  }

  _render() {
    if (!this._config) return;
    const cfg = this._config;
    const values = this._getPowerValues();
    const flows = calculateFlows(values);
    const imageSrc = this._resolveImage();

    const gridVal = parseEntityValue(this._state(cfg.grid_power_entity));
    const houseVal = parseEntityValue(this._state(cfg.household_power_entity));
    const solarVal = cfg.solar_enabled ? parseEntityValue(this._state(cfg.solar_power_entity)) : null;
    const battChVal = parseEntityValue(this._state(cfg.battery_charging_power_entity));
    const battDisVal = parseEntityValue(this._state(cfg.battery_discharging_power_entity));
    const battVal = cfg.battery_enabled ? (battChVal ?? battDisVal) : null;
    const evVal = cfg.ev_charger_enabled ? parseEntityValue(this._state(cfg.ev_charger_power_entity)) : null;

    const gridIcon = (gridVal ?? 0) < 0 ? "⚡↑" : "⚡";

    // Weather overlay
    let weatherHtml = "";
    const weatherState = this._state(cfg.weather_entity);
    const newOverlay = getOverlayType(weatherState);
    if (newOverlay === "rain") {
      weatherHtml = `<div class="upfc-weather-overlay"><canvas class="upfc-rain-canvas"></canvas></div>`;
    } else if (newOverlay === "snow") {
      weatherHtml = `<div class="upfc-weather-overlay"><canvas class="upfc-snow-canvas"></canvas></div>`;
    }

    const bgHtml = this._imageError
      ? `<div class="upfc-bg-placeholder"><span style="font-size:40px;opacity:.3">🏠</span><span>Image not found</span><small style="opacity:.4;font-size:11px">${imageSrc}</small></div>`
      : `<img class="upfc-bg" src="${imageSrc}" alt="House energy" />`;

    const labelsHtml = [
      this._renderLabel("grid", "Grid", gridIcon, gridVal !== null ? Math.abs(gridVal) : null),
      this._renderLabel("household", "House", "🏠", houseVal),
      cfg.solar_enabled ? this._renderLabel("solar", "Solar", "☀️", solarVal) : "",
      cfg.battery_enabled ? this._renderLabel("battery", "Battery", "🔋", battVal) : "",
      cfg.ev_charger_enabled ? this._renderLabel("ev_charger", "EV", "🚗", evVal) : "",
    ].join("");

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="upfc-wrapper">
          <div class="upfc-inner">
            ${bgHtml}
            ${weatherHtml}
            <svg class="upfc-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              ${this._renderSVGFlows(flows)}
            </svg>
            ${labelsHtml}
          </div>
        </div>
      </ha-card>`;

    // Image error listener
    const img = this.shadowRoot.querySelector(".upfc-bg");
    if (img) {
      img.addEventListener("error", () => { this._imageError = true; this._render(); });
      img.addEventListener("load", () => { if (this._imageError) { this._imageError = false; } });
    }

    // Weather animation
    if (newOverlay !== this._overlayType) {
      this._cancelWeather?.();
      this._cancelWeather = null;
      this._overlayType = newOverlay;
    }
    this._startWeatherAnimation();
  }

  _startWeatherAnimation() {
    if (this._overlayType === "rain") {
      const canvas = this.shadowRoot?.querySelector(".upfc-rain-canvas");
      if (canvas && !this._cancelWeather) this._cancelWeather = animateRain(canvas);
    } else if (this._overlayType === "snow") {
      const canvas = this.shadowRoot?.querySelector(".upfc-snow-canvas");
      if (canvas && !this._cancelWeather) this._cancelWeather = animateSnow(canvas);
    }
  }

  getCardSize() { return 4; }
}

// ── Editor ─────────────────────────────────────────────────

const EDITOR_STYLES = `
  :host { display: block; }
  .section-title { font-weight: 700; font-size: 12px; letter-spacing: .07em; text-transform: uppercase; color: var(--secondary-text-color); margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--divider-color, rgba(255,255,255,.1)); }
  .section-title:first-child { margin-top: 0; }
  .row { display: flex; gap: 10px; margin-bottom: 8px; align-items: center; }
  .row ha-entity-picker, .row ha-textfield { flex: 1; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
  .toggle-label { font-size: 14px; color: var(--primary-text-color); }
  .color-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
  .color-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: var(--secondary-text-color); }
  .color-item input[type=color] { width: 40px; height: 28px; border: none; background: none; cursor: pointer; border-radius: 6px; overflow: hidden; }
  .speed-select { width: 100%; background: var(--card-background-color,#1c1c2e); color: var(--primary-text-color); border: 1px solid var(--divider-color,rgba(255,255,255,.2)); border-radius: 4px; padding: 8px; font-size: 14px; margin-top: 4px; }
  .info-note { font-size: 12px; color: var(--secondary-text-color); background: var(--secondary-background-color,rgba(255,255,255,.04)); border-radius: 6px; padding: 8px 10px; margin: 6px 0; line-height: 1.5; }
  .pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
`;

class UltimatePowerflowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  _fire(config) {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _set(key, value) {
    const keys = key.split(".");
    if (keys.length === 3 && keys[0] === "label_positions") {
      const [, comp, axis] = keys;
      this._config = { ...this._config, label_positions: { ...(this._config.label_positions ?? {}), [comp]: { ...(this._config.label_positions?.[comp] ?? {}), [axis]: parseFloat(value) } } };
    } else if (keys.length === 2) {
      const [parent, child] = keys;
      this._config = { ...this._config, [parent]: { ...(this._config[parent] ?? {}), [child]: value } };
    } else {
      this._config = { ...this._config, [key]: value };
    }
    this._fire(this._config);
    this._render();
  }

  _render() {
    const cfg = this._config;
    const colors = cfg.colors ?? {};
    const pos = cfg.label_positions ?? {};

    this.shadowRoot.innerHTML = `<style>${EDITOR_STYLES}</style>
      <div class="section-title">⚡ Core Entities (Required)</div>
      <div class="row">
        <ha-entity-picker label="Grid Power Entity *" value="${cfg.grid_power_entity ?? ""}" data-key="grid_power_entity" allow-custom-entity></ha-entity-picker>
      </div>
      <div class="row">
        <ha-entity-picker label="Household Power Entity *" value="${cfg.household_power_entity ?? ""}" data-key="household_power_entity" allow-custom-entity></ha-entity-picker>
      </div>
      <div class="row">
        <ha-entity-picker label="Sun Entity (default: sun.sun)" value="${cfg.sun_entity ?? "sun.sun"}" data-key="sun_entity" allow-custom-entity></ha-entity-picker>
      </div>

      <div class="section-title">🔌 Optional Devices</div>
      <div class="toggle-row"><span class="toggle-label">☀️ Solar Panels</span><ha-switch data-key="solar_enabled" ${cfg.solar_enabled ? "checked" : ""}></ha-switch></div>
      ${cfg.solar_enabled ? `<div class="row"><ha-entity-picker label="Solar Power Entity" value="${cfg.solar_power_entity ?? ""}" data-key="solar_power_entity" allow-custom-entity></ha-entity-picker></div>` : ""}

      <div class="toggle-row"><span class="toggle-label">🔋 Battery Storage</span><ha-switch data-key="battery_enabled" ${cfg.battery_enabled ? "checked" : ""}></ha-switch></div>
      ${cfg.battery_enabled ? `
        <div class="row"><ha-entity-picker label="Battery Charging Power" value="${cfg.battery_charging_power_entity ?? ""}" data-key="battery_charging_power_entity" allow-custom-entity></ha-entity-picker></div>
        <div class="row"><ha-entity-picker label="Battery Discharging Power" value="${cfg.battery_discharging_power_entity ?? ""}" data-key="battery_discharging_power_entity" allow-custom-entity></ha-entity-picker></div>` : ""}

      <div class="toggle-row"><span class="toggle-label">🚗 EV Charger</span><ha-switch data-key="ev_charger_enabled" ${cfg.ev_charger_enabled ? "checked" : ""}></ha-switch></div>
      ${cfg.ev_charger_enabled ? `<div class="row"><ha-entity-picker label="EV Charger Power Entity" value="${cfg.ev_charger_power_entity ?? ""}" data-key="ev_charger_power_entity" allow-custom-entity></ha-entity-picker></div>` : ""}

      <div class="row"><ha-entity-picker label="Weather Entity (optional)" value="${cfg.weather_entity ?? ""}" data-key="weather_entity" allow-custom-entity></ha-entity-picker></div>

      <div class="section-title">🖼️ Image</div>
      <p class="info-note">The card automatically picks the correct image. Just set the folder where you placed the image files.</p>
      <div class="row"><ha-textfield style="flex:1" label="Image Base Path" value="${cfg.image_base_path ?? "/local/ultimate-powerflow/"}" data-key="image_base_path"></ha-textfield></div>

      <div class="section-title">🎨 Appearance</div>
      <label style="font-size:13px;color:var(--secondary-text-color)">Animation Speed</label>
      <select class="speed-select" data-key="animation_speed">
        <option value="slow" ${cfg.animation_speed === "slow" ? "selected" : ""}>Slow</option>
        <option value="normal" ${(!cfg.animation_speed || cfg.animation_speed === "normal") ? "selected" : ""}>Normal</option>
        <option value="fast" ${cfg.animation_speed === "fast" ? "selected" : ""}>Fast</option>
      </select>
      <br/><br/>
      <label style="font-size:13px;color:var(--secondary-text-color)">Flow Line Colors</label>
      <div class="color-row">
        <div class="color-item"><input type="color" value="${colors.grid ?? "#f39c12"}" data-key="colors.grid" /><span>Grid</span></div>
        <div class="color-item"><input type="color" value="${colors.solar ?? "#f1c40f"}" data-key="colors.solar" /><span>Solar</span></div>
        <div class="color-item"><input type="color" value="${colors.battery ?? "#2ecc71"}" data-key="colors.battery" /><span>Battery</span></div>
        <div class="color-item"><input type="color" value="${colors.household ?? "#3498db"}" data-key="colors.household" /><span>House</span></div>
        ${cfg.ev_charger_enabled ? `<div class="color-item"><input type="color" value="${colors.ev_charger ?? "#9b59b6"}" data-key="colors.ev_charger" /><span>EV</span></div>` : ""}
      </div>

      <div class="section-title">🔧 Advanced – Label Positions (%)</div>
      <p class="info-note">Optionally override label positions (0–100% of card size). Leave empty for defaults.</p>
      <div class="pos-grid">
        <ha-textfield label="Grid X" type="number" value="${pos.grid?.x ?? ""}" data-key="label_positions.grid.x"></ha-textfield>
        <ha-textfield label="Grid Y" type="number" value="${pos.grid?.y ?? ""}" data-key="label_positions.grid.y"></ha-textfield>
        <ha-textfield label="House X" type="number" value="${pos.household?.x ?? ""}" data-key="label_positions.household.x"></ha-textfield>
        <ha-textfield label="House Y" type="number" value="${pos.household?.y ?? ""}" data-key="label_positions.household.y"></ha-textfield>
        ${cfg.solar_enabled ? `<ha-textfield label="Solar X" type="number" value="${pos.solar?.x ?? ""}" data-key="label_positions.solar.x"></ha-textfield><ha-textfield label="Solar Y" type="number" value="${pos.solar?.y ?? ""}" data-key="label_positions.solar.y"></ha-textfield>` : ""}
        ${cfg.battery_enabled ? `<ha-textfield label="Battery X" type="number" value="${pos.battery?.x ?? ""}" data-key="label_positions.battery.x"></ha-textfield><ha-textfield label="Battery Y" type="number" value="${pos.battery?.y ?? ""}" data-key="label_positions.battery.y"></ha-textfield>` : ""}
        ${cfg.ev_charger_enabled ? `<ha-textfield label="EV X" type="number" value="${pos.ev_charger?.x ?? ""}" data-key="label_positions.ev_charger.x"></ha-textfield><ha-textfield label="EV Y" type="number" value="${pos.ev_charger?.y ?? ""}" data-key="label_positions.ev_charger.y"></ha-textfield>` : ""}
      </div>`;

    // Bind events
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((el) => {
      el.hass = this._hass;
      el.addEventListener("value-changed", (e) => {
        const key = el.dataset.key;
        if (key) this._set(key, e.detail.value);
      });
    });
    this.shadowRoot.querySelectorAll("ha-switch").forEach((el) => {
      el.addEventListener("change", (e) => {
        const key = el.dataset.key;
        if (key) this._set(key, e.target.checked);
      });
    });
    this.shadowRoot.querySelectorAll("ha-textfield").forEach((el) => {
      el.addEventListener("input", (e) => {
        const key = el.dataset.key;
        if (key) this._set(key, e.target.value);
      });
    });
    this.shadowRoot.querySelectorAll("select").forEach((el) => {
      el.addEventListener("change", (e) => {
        const key = el.dataset.key;
        if (key) this._set(key, e.target.value);
      });
    });
    this.shadowRoot.querySelectorAll("input[type=color]").forEach((el) => {
      el.addEventListener("input", (e) => {
        const key = el.dataset.key;
        if (key) this._set(key, e.target.value);
      });
    });
  }
}

// ── Register custom elements ────────────────────────────────

if (!customElements.get("ultimate-powerflow-card")) {
  customElements.define("ultimate-powerflow-card", UltimatePowerflowCard);
}
if (!customElements.get("ultimate-powerflow-card-editor")) {
  customElements.define("ultimate-powerflow-card-editor", UltimatePowerflowCardEditor);
}

// Register with HA custom card registry
window.customCards = window.customCards ?? [];
if (!window.customCards.find((c) => c.type === "ultimate-powerflow-card")) {
  window.customCards.push({
    type: "ultimate-powerflow-card",
    name: "Ultimate Powerflow Card",
    description: "Animated energy flow visualization over a photorealistic house image. Supports grid, solar, battery, and EV charger.",
    preview: true,
    documentationURL: "https://github.com/Sven2410/Ultimate-Powerflow-Card",
  });
}

console.info(
  "%c ULTIMATE-POWERFLOW-CARD %c v1.0.0 ",
  "background:#1a1a2e;color:#f1c40f;font-weight:700;padding:2px 6px;border-radius:3px 0 0 3px",
  "background:#f1c40f;color:#1a1a2e;font-weight:700;padding:2px 6px;border-radius:0 3px 3px 0"
);
