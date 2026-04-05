// ============================================================
// Ultimate Powerflow Card
// A polished Home Assistant Lovelace card that shows energy
// flow over a house image with animated neon power lines.
// ============================================================

import {
  LitElement,
  html,
  nothing,
  type TemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { cardStyles } from "./styles";
import { formatPower, parseEntityValue } from "./helpers/format";
import { resolveImageFilename, isDaytime } from "./helpers/image-resolver";
import { calculateFlows, FLOW_THRESHOLD } from "./helpers/flow-calculator";
import {
  getOverlayType,
  animateRain,
  animateSnow,
  type OverlayType,
} from "./helpers/weather-overlay";

import type {
  UltimatePowerflowCardConfig,
  HomeAssistant,
  PowerValues,
  LabelPosition,
  ColorConfig,
} from "./types";

// ── Default label positions (% of card width/height) ────────
const DEFAULT_POSITIONS = {
  grid: { x: 88, y: 72 },
  household: { x: 62, y: 58 },
  solar: { x: 42, y: 18 },
  battery: { x: 55, y: 72 },
  ev_charger: { x: 16, y: 75 },
};

// ── Default flow line anchor points (% of card width/height) ─
// These represent approximate positions of each component in
// the reference house image.
const ANCHORS = {
  grid: { x: 88, y: 65 },
  household: { x: 62, y: 52 },
  solar: { x: 43, y: 30 },
  battery: { x: 55, y: 65 },
  ev_charger: { x: 20, y: 70 },
};

const DEFAULT_COLORS: Required<ColorConfig> = {
  grid: "#f39c12",
  solar: "#f1c40f",
  battery: "#2ecc71",
  household: "#3498db",
  ev_charger: "#9b59b6",
};

const DEFAULT_BASE_PATH = "/local/ultimate-powerflow/";

@customElement("ultimate-powerflow-card")
export class UltimatePowerflowCard extends LitElement {
  static override styles = cardStyles;

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: UltimatePowerflowCardConfig;
  @state() private _imageError = false;
  @state() private _overlayType: OverlayType = "none";

  private _cancelWeather: (() => void) | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  // ── Lovelace card config API ─────────────────────────────

  public setConfig(config: UltimatePowerflowCardConfig): void {
    if (!config.grid_power_entity) {
      throw new Error("ultimate-powerflow-card: grid_power_entity is required");
    }
    if (!config.household_power_entity) {
      throw new Error(
        "ultimate-powerflow-card: household_power_entity is required"
      );
    }
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
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement("ultimate-powerflow-card-editor");
  }

  public static getStubConfig(): UltimatePowerflowCardConfig {
    return {
      grid_power_entity: "sensor.grid_power",
      household_power_entity: "sensor.household_power",
    };
  }

  // ── Lifecycle ────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupResizeObserver();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelWeather?.();
    this._resizeObserver?.disconnect();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has("hass") || changed.has("_config")) {
      this._updateWeatherOverlay();
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  private _getState(entity: string | undefined): string | undefined {
    if (!entity) return undefined;
    return this.hass?.states?.[entity]?.state;
  }

  private _colors(): Required<ColorConfig> {
    return { ...DEFAULT_COLORS, ...this._config.colors };
  }

  private _isDay(): boolean {
    return isDaytime(this._getState(this._config.sun_entity ?? "sun.sun"));
  }

  private _resolveImage(): string {
    return resolveImageFilename({
      isDay: this._isDay(),
      solarEnabled: !!this._config.solar_enabled,
      batteryEnabled: !!this._config.battery_enabled,
      evChargerEnabled: !!this._config.ev_charger_enabled,
      basePath: this._config.image_base_path ?? DEFAULT_BASE_PATH,
    });
  }

  private _getPowerValues(): PowerValues {
    const g = parseEntityValue(this._getState(this._config.grid_power_entity));
    const h = parseEntityValue(this._getState(this._config.household_power_entity));
    const s = parseEntityValue(this._getState(this._config.solar_power_entity));
    const bc = parseEntityValue(this._getState(this._config.battery_charging_power_entity));
    const bd = parseEntityValue(this._getState(this._config.battery_discharging_power_entity));
    const ev = parseEntityValue(this._getState(this._config.ev_charger_power_entity));

    return {
      solar: s ?? 0,
      battery_charging: bc ?? 0,
      battery_discharging: bd ?? 0,
      ev_charger: ev ?? 0,
      grid: g ?? 0,
      household: h ?? 0,
    };
  }

  private _labelPos(type: keyof typeof DEFAULT_POSITIONS): LabelPosition {
    return (
      this._config.label_positions?.[type] ?? DEFAULT_POSITIONS[type]
    );
  }

  private _animClass(): string {
    const speed = this._config.animation_speed ?? "normal";
    if (speed === "slow") return "upfc-flow-animated-slow";
    if (speed === "fast") return "upfc-flow-animated-fast";
    return "upfc-flow-animated";
  }

  private _updateWeatherOverlay(): void {
    const weatherState = this._getState(this._config.weather_entity);
    const newType = getOverlayType(weatherState);
    if (newType === this._overlayType) return;

    this._overlayType = newType;
    this._cancelWeather?.();
    this._cancelWeather = null;

    // Animate canvas after render
    this.updateComplete.then(() => {
      if (this._overlayType === "rain") {
        const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>(
          ".upfc-rain-canvas"
        );
        if (canvas) this._cancelWeather = animateRain(canvas);
      } else if (this._overlayType === "snow") {
        const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>(
          ".upfc-snow-canvas"
        );
        if (canvas) this._cancelWeather = animateSnow(canvas);
      }
    });
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver(() => {
      // Re-trigger weather animation on resize so canvas fills correctly
      if (this._overlayType !== "none") {
        this._cancelWeather?.();
        this._cancelWeather = null;
        this.updateComplete.then(() => this._updateWeatherOverlay());
      }
    });
    this._resizeObserver.observe(this);
  }

  // ── SVG Flow Lines ───────────────────────────────────────

  private _renderFlowLines(flows: ReturnType<typeof calculateFlows>): TemplateResult {
    const colors = this._colors();
    const animClass = this._animClass();
    const cfg = this._config;
    const EPSILON = FLOW_THRESHOLD;

    /**
     * Render a single animated bezier flow line between two anchor points.
     *
     * FIX 1: animation-direction: reverse → keert de richting om bij teruglevering
     *         (was: stroke-dashoffset: 0, wat geen effect had)
     * FIX 2: dubbele drop-shadow voor sterkere neon glow
     * FIX 3: stroke-width verhoogd van 2.5 naar 3
     */
    const line = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      power: number,
      color: string,
      reversed = false
    ) => {
      const active = Math.abs(power) >= EPSILON;

      // CSS classes: basis + actief/inactief + animatie-snelheidsklasse
      const cls = active
        ? `upfc-flow-line upfc-flow-line-active ${animClass}`
        : "upfc-flow-line upfc-flow-line-inactive";

      // SVG viewBox coördinaten (0–100)
      const x1 = from.x;
      const y1 = from.y;
      const x2 = to.x;
      const y2 = to.y;

      // Cubic bezier control points voor lichte bocht in de lijn
      const mx = (x1 + x2) / 2;
      const cy1 = y1;
      const cy2 = y2;
      const d = `M ${x1} ${y1} C ${mx} ${cy1}, ${mx} ${cy2}, ${x2} ${y2}`;

      // FIX 1: animation-direction: reverse keert de dots-richting om bij export/teruglevering
      //        Dit vervangt de oude "stroke-dashoffset: 0" die geen effect had
      const animationDirection = active && reversed ? "animation-direction: reverse;" : "";

      // FIX 2: dubbele drop-shadow = sterkere, meer zichtbare neon glow
      const glowFilter = active
        ? `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})`
        : "none";

      // FIX 3: stroke-width 3 (was 2.5)
      return html`<path
        class="${cls}"
        d="${d}"
        style="stroke: ${color}; filter: ${glowFilter}; ${animationDirection}"
        stroke-width="3"
      />`;
    };

    const house = ANCHORS.household;
    const grid = ANCHORS.grid;
    const solar = ANCHORS.solar;
    const battery = ANCHORS.battery;
    const ev = ANCHORS.ev_charger;

    return html`
      <!-- Grid → House (import) -->
      ${line(grid, house, flows.grid_import, colors.grid)}

      <!-- House → Grid (export / teruglevering) — reversed=true zodat dots de goede kant op gaan -->
      ${flows.grid_export >= EPSILON
        ? line(house, grid, flows.grid_export, colors.solar, true)
        : nothing}

      <!-- Solar → House -->
      ${cfg.solar_enabled
        ? line(solar, house, flows.solar_to_house, colors.solar)
        : nothing}

      <!-- Solar → Battery (opladen) -->
      ${cfg.solar_enabled && cfg.battery_enabled
        ? line(solar, battery, flows.solar_to_battery, colors.solar)
        : nothing}

      <!-- Solar → Grid (directe export van solar) -->
      ${cfg.solar_enabled && flows.solar_to_grid >= EPSILON
        ? line(solar, grid, flows.solar_to_grid, colors.solar, true)
        : nothing}

      <!-- Battery → House (ontladen) -->
      ${cfg.battery_enabled
        ? line(battery, house, flows.battery_to_house, colors.battery)
        : nothing}

      <!-- House → EV Charger -->
      ${cfg.ev_charger_enabled
        ? line(house, ev, flows.house_to_ev, colors.ev_charger)
        : nothing}
    `;
  }

  // ── Label rendering ──────────────────────────────────────

  private _renderLabel(
    type: keyof typeof DEFAULT_POSITIONS,
    title: string,
    icon: string,
    value: number | null,
    colorKey: keyof Required<ColorConfig>
  ): TemplateResult {
    const pos = this._labelPos(type);
    const colors = this._colors();

    const displayVal =
      value === null ? "—" : formatPower(value);
    const isUnavailable = value === null;

    const labelStyle = styleMap({
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      "--upfc-label-accent": colors[colorKey],
    });

    return html`
      <div
        class="upfc-label"
        data-type="${type}"
        style="${labelStyle}"
      >
        <span class="upfc-label-icon">${icon}</span>
        <span class="upfc-label-title">${title}</span>
        <span class="upfc-label-value ${isUnavailable ? "unavailable" : ""}"
          >${displayVal}</span
        >
      </div>
    `;
  }

  // ── Main render ──────────────────────────────────────────

  override render(): TemplateResult {
    if (!this._config) return html``;

    const values = this._getPowerValues();
    const flows = calculateFlows(values);
    const cfg = this._config;
    const imageSrc = this._resolveImage();

    // Weather overlay canvas
    const overlayHtml =
      this._overlayType === "rain"
        ? html`<div class="upfc-weather-overlay">
            <canvas class="upfc-rain-canvas"></canvas>
          </div>`
        : this._overlayType === "snow"
        ? html`<div class="upfc-weather-overlay">
            <canvas class="upfc-snow-canvas"></canvas>
          </div>`
        : nothing;

    // Ruwe sensorwaarden voor de labels (null = unavailable)
    const gridVal = parseEntityValue(this._getState(cfg.grid_power_entity));
    const houseVal = parseEntityValue(this._getState(cfg.household_power_entity));
    const solarVal = cfg.solar_enabled
      ? parseEntityValue(this._getState(cfg.solar_power_entity))
      : null;
    const battVal =
      cfg.battery_enabled
        ? (parseEntityValue(this._getState(cfg.battery_charging_power_entity)) ??
           parseEntityValue(this._getState(cfg.battery_discharging_power_entity)))
        : null;
    const evVal = cfg.ev_charger_enabled
      ? parseEntityValue(this._getState(cfg.ev_charger_power_entity))
      : null;

    // Grid icoon: pijl omhoog bij teruglevering
    const gridIcon = (gridVal ?? 0) < 0 ? "⚡↑" : "⚡";

    return html`
      <ha-card>
        <div class="upfc-wrapper">
          <div class="upfc-inner">
            <!-- Achtergrondafbeelding -->
            ${this._imageError
              ? html`<div class="upfc-bg-placeholder">
                  <span class="icon">🏠</span>
                  <span>Image not found</span>
                  <small>${imageSrc}</small>
                </div>`
              : html`<img
                  class="upfc-bg"
                  src="${imageSrc}"
                  alt="House energy overview"
                  @error="${() => (this._imageError = true)}"
                  @load="${() => (this._imageError = false)}"
                />`}

            <!-- Weer overlay -->
            ${overlayHtml}

            <!-- SVG stroomlijnen overlay -->
            <svg
              class="upfc-svg-overlay"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              ${this._renderFlowLines(flows)}
            </svg>

            <!-- Labels -->
            ${this._renderLabel("grid", "Grid", gridIcon, Math.abs(gridVal ?? 0), "grid")}
            ${this._renderLabel("household", "House", "🏠", houseVal, "household")}
            ${cfg.solar_enabled
              ? this._renderLabel("solar", "Solar", "☀️", solarVal, "solar")
              : nothing}
            ${cfg.battery_enabled
              ? this._renderLabel("battery", "Battery", "🔋", battVal, "battery")
              : nothing}
            ${cfg.ev_charger_enabled
              ? this._renderLabel("ev_charger", "EV", "🚗", evVal, "ev_charger")
              : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ultimate-powerflow-card": UltimatePowerflowCard;
  }
}
