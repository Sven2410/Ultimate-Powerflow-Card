// ============================================================
// Ultimate Powerflow Card – GUI Editor
// ============================================================

import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { UltimatePowerflowCardConfig, HomeAssistant } from "./types";

@customElement("ultimate-powerflow-card-editor")
export class UltimatePowerflowCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) private _config!: UltimatePowerflowCardConfig;

  static override styles = css`
    :host {
      display: block;
    }
    .section-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin: 20px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
    }
    .section-title:first-child {
      margin-top: 0;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .row ha-entity-picker,
    .row ha-textfield {
      flex: 1;
    }
    ha-formfield {
      display: block;
      margin-bottom: 8px;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
    }
    .toggle-label {
      font-size: 14px;
      color: var(--primary-text-color);
    }
    .color-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .color-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .color-item input[type="color"] {
      width: 40px;
      height: 28px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
    }
    .speed-select {
      width: 100%;
      background: var(--card-background-color, #1c1c2e);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
      font-size: 14px;
    }
    .info-note {
      font-size: 12px;
      color: var(--secondary-text-color);
      background: var(--secondary-background-color);
      border-radius: 6px;
      padding: 8px 10px;
      margin: 6px 0;
      line-height: 1.5;
    }
    .pos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
  `;

  public setConfig(config: UltimatePowerflowCardConfig): void {
    this._config = config;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) return;
    const target = ev.target as HTMLInputElement & { configValue?: string };
    if (!target.configValue) return;

    const value =
      target.type === "checkbox"
        ? target.checked
        : target.value ?? (ev.detail as { value: unknown })?.value;

    // Handle nested keys like "colors.grid"
    const keys = target.configValue.split(".");
    if (keys.length === 2) {
      const [parent, child] = keys;
      this._config = {
        ...this._config,
        [parent]: {
          ...(this._config as Record<string, Record<string, unknown>>)[parent],
          [child]: value,
        },
      };
    } else {
      this._config = { ...this._config, [target.configValue]: value };
    }

    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }

  private _entityPicker(
    label: string,
    configKey: keyof UltimatePowerflowCardConfig,
    required = false
  ): TemplateResult {
    const value = (this._config?.[configKey] as string) ?? "";
    return html`
      <div class="row">
        <ha-entity-picker
          .hass="${this.hass}"
          .label="${label}${required ? " *" : ""}"
          .value="${value}"
          .configValue="${configKey}"
          allow-custom-entity
          @value-changed="${this._valueChanged}"
        ></ha-entity-picker>
      </div>
    `;
  }

  private _toggle(
    label: string,
    configKey: keyof UltimatePowerflowCardConfig
  ): TemplateResult {
    const value = !!(this._config?.[configKey] as boolean);
    return html`
      <div class="toggle-row">
        <span class="toggle-label">${label}</span>
        <ha-switch
          .checked="${value}"
          .configValue="${configKey}"
          @change="${this._valueChanged}"
        ></ha-switch>
      </div>
    `;
  }

  private _colorInput(
    label: string,
    configKey: string,
    defaultColor: string
  ): TemplateResult {
    const colors = (this._config?.colors ?? {}) as Record<string, string>;
    const value = colors[configKey] ?? defaultColor;
    return html`
      <div class="color-item">
        <input
          type="color"
          .value="${value}"
          .configValue="${`colors.${configKey}`}"
          @input="${this._valueChanged}"
        />
        <span>${label}</span>
      </div>
    `;
  }

  override render(): TemplateResult {
    if (!this.hass || !this._config) return html``;

    const cfg = this._config;
    const pos = cfg.label_positions ?? {};

    return html`
      <!-- ══ Core Entities ══════════════════════════════ -->
      <div class="section-title">⚡ Core Entities (Required)</div>
      ${this._entityPicker("Grid Power Entity", "grid_power_entity", true)}
      ${this._entityPicker("Household Power Entity", "household_power_entity", true)}
      ${this._entityPicker("Sun Entity", "sun_entity")}

      <!-- ══ Optional Devices ═══════════════════════════ -->
      <div class="section-title">🔌 Optional Devices</div>

      ${this._toggle("☀️ Solar Panels enabled", "solar_enabled")}
      ${cfg.solar_enabled
        ? this._entityPicker("Solar Power Entity", "solar_power_entity")
        : html``}

      ${this._toggle("🔋 Battery enabled", "battery_enabled")}
      ${cfg.battery_enabled
        ? html`
            ${this._entityPicker(
              "Battery Charging Power",
              "battery_charging_power_entity"
            )}
            ${this._entityPicker(
              "Battery Discharging Power",
              "battery_discharging_power_entity"
            )}
          `
        : html``}

      ${this._toggle("🚗 EV Charger enabled", "ev_charger_enabled")}
      ${cfg.ev_charger_enabled
        ? this._entityPicker("EV Charger Power Entity", "ev_charger_power_entity")
        : html``}

      ${this._entityPicker("Weather Entity (optional)", "weather_entity")}

      <!-- ══ Image ══════════════════════════════════════ -->
      <div class="section-title">🖼️ Image</div>
      <p class="info-note">
        The card automatically selects the correct image based on enabled features and day/night state.
        Only configure the base folder where you placed the images.
      </p>
      <div class="row">
        <ha-textfield
          label="Image Base Path"
          .value="${cfg.image_base_path ?? "/local/ultimate-powerflow/"}"
          .configValue="image_base_path"
          helper="Folder containing all house images. Default: /local/ultimate-powerflow/"
          @input="${this._valueChanged}"
        ></ha-textfield>
      </div>

      <!-- ══ Appearance ════════════════════════════════ -->
      <div class="section-title">🎨 Appearance</div>
      <label>Animation Speed</label>
      <select
        class="speed-select"
        .value="${cfg.animation_speed ?? "normal"}"
        .configValue="animation_speed"
        @change="${this._valueChanged}"
      >
        <option value="slow">Slow</option>
        <option value="normal" ?selected="${cfg.animation_speed === "normal" || !cfg.animation_speed}">Normal</option>
        <option value="fast">Fast</option>
      </select>

      <br /><br />
      <label>Flow Line Colors</label>
      <div class="color-row" style="margin-top:8px">
        ${this._colorInput("Grid", "grid", "#f39c12")}
        ${this._colorInput("Solar", "solar", "#f1c40f")}
        ${this._colorInput("Battery", "battery", "#2ecc71")}
        ${this._colorInput("House", "household", "#3498db")}
        ${cfg.ev_charger_enabled
          ? this._colorInput("EV", "ev_charger", "#9b59b6")
          : html``}
      </div>

      <!-- ══ Advanced: Label Positions ═════════════════ -->
      <div class="section-title">🔧 Advanced – Label Positions (%)</div>
      <p class="info-note">
        Optionally override label positions. Values are percentages (0–100) of card width/height.
        Leave empty to use defaults.
      </p>
      <div class="pos-grid">
        <ha-textfield
          label="Grid X"
          type="number"
          .value="${(pos as Record<string, {x:number;y:number}>)?.grid?.x ?? ""}"
          .configValue="label_positions.grid.x"
          @input="${this._positionChanged}"
        ></ha-textfield>
        <ha-textfield
          label="Grid Y"
          type="number"
          .value="${(pos as Record<string, {x:number;y:number}>)?.grid?.y ?? ""}"
          .configValue="label_positions.grid.y"
          @input="${this._positionChanged}"
        ></ha-textfield>
        <ha-textfield
          label="House X"
          type="number"
          .value="${(pos as Record<string, {x:number;y:number}>)?.household?.x ?? ""}"
          .configValue="label_positions.household.x"
          @input="${this._positionChanged}"
        ></ha-textfield>
        <ha-textfield
          label="House Y"
          type="number"
          .value="${(pos as Record<string, {x:number;y:number}>)?.household?.y ?? ""}"
          .configValue="label_positions.household.y"
          @input="${this._positionChanged}"
        ></ha-textfield>
      </div>
    `;
  }

  private _positionChanged(ev: InputEvent): void {
    if (!this._config) return;
    const target = ev.target as HTMLInputElement & { configValue?: string };
    if (!target.configValue) return;

    // configValue format: "label_positions.household.x"
    const parts = target.configValue.split(".");
    if (parts.length !== 3) return;
    const [, component, axis] = parts;

    const currentPositions = { ...(this._config.label_positions ?? {}) } as
      Record<string, { x: number; y: number }>;

    currentPositions[component] = {
      ...(currentPositions[component] ?? {}),
      [axis]: parseFloat(target.value),
    };

    this._config = { ...this._config, label_positions: currentPositions as UltimatePowerflowCardConfig["label_positions"] };

    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ultimate-powerflow-card-editor": UltimatePowerflowCardEditor;
  }
}
