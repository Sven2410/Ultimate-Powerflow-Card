# Ultimate Powerflow Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/Sven2410/Ultimate-Powerflow-Card.svg)](https://github.com/Sven2410/Ultimate-Powerflow-Card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A polished, production-ready Home Assistant Lovelace card that **visualizes your home energy system** using animated neon power flow lines overlaid on a photorealistic house image. Supports grid, solar panels, battery storage, and EV charging – all in one beautiful card.

---

## ✨ Features

- 🏠 **Photorealistic house images** that auto-switch for day/night and installed components
- ⚡ **Animated neon flow lines** showing real-time energy direction and magnitude
- ☀️ **Solar panels** with production display
- 🔋 **Battery** charge/discharge flows
- 🚗 **EV charger** power tracking
- 🌧️ **Weather overlays** – rain and snow effects via weather entity
- 📐 **Auto W/kW formatting** – smart unit switching
- 🎛️ **Full GUI editor** – configure without writing YAML
- 🌙 **Day/night image switching** via `sun.sun`
- 🔒 **Graceful error handling** – no crashes on unavailable sensors
- 📱 **Responsive** – works on all screen sizes
- 🎨 **Fully customizable** colors, animation speed, label positions
- 🔌 **HACS compatible** – one-click install

---

## 📸 Screenshots

> Place your screenshots in a `screenshots/` folder and link them here.

| Day view | Night view |
|----------|-----------|
| `screenshots/day-solar-battery-ev.png` | `screenshots/night-solar-battery-ev.png` |

---

## 🗂️ Image Files

The card automatically selects the correct background image based on:
1. **Day or night** – determined by the `sun.sun` entity (or your configured `sun_entity`)
2. **Enabled features** – solar, battery, and/or EV charger

### Naming Convention

Images must follow this exact naming pattern:

```
house-energy-{day|night}-grid.png
house-energy-{day|night}-grid-solar-panels.png
house-energy-{day|night}-grid-solar-panels-battery.png
house-energy-{day|night}-grid-solar-panels-battery-ev-charger.png
```

**Full list of all 8 possible image files:**

| Filename | Used when |
|----------|-----------|
| `house-energy-day-grid.png` | Daytime, grid only |
| `house-energy-night-grid.png` | Nighttime, grid only |
| `house-energy-day-grid-solar-panels.png` | Daytime, solar enabled |
| `house-energy-night-grid-solar-panels.png` | Nighttime, solar enabled |
| `house-energy-day-grid-solar-panels-battery.png` | Daytime, solar + battery |
| `house-energy-night-grid-solar-panels-battery.png` | Nighttime, solar + battery |
| `house-energy-day-grid-solar-panels-battery-ev-charger.png` | Daytime, full setup |
| `house-energy-night-grid-solar-panels-battery-ev-charger.png` | Nighttime, full setup |

> **Note:** You only need the images for the feature combinations you actually use.
> If solar is disabled, the grid-only images will be used.
> If battery is disabled but solar is enabled, the solar-only images will be used.
> EV charger images are only needed when EV charger is enabled AND battery AND solar are also enabled.

### Where to Place Images

Copy your image files to:
```
/config/www/ultimate-powerflow/
```

They will be accessible at `/local/ultimate-powerflow/` in Home Assistant.

---

## 📦 Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend**
3. Click the three-dot menu → **Custom repositories**
4. Add `https://github.com/Sven2410/Ultimate-Powerflow-Card` as a **Frontend** repository
5. Search for **Ultimate Powerflow Card** and click **Install**
6. Restart Home Assistant (or reload the Lovelace resources)
7. Copy your images to `/config/www/ultimate-powerflow/`
8. Add the card to your dashboard

### Manual Installation

1. Download `ultimate-powerflow-card.js` from the [latest release](https://github.com/Sven2410/Ultimate-Powerflow-Card/releases/latest)
2. Copy it to `/config/www/ultimate-powerflow-card.js`
3. In Home Assistant, go to **Settings → Dashboards → Resources**
4. Click **Add Resource**
5. URL: `/local/ultimate-powerflow-card.js`
6. Type: **JavaScript module**
7. Save and reload

---

## 🔧 Configuration

### Minimal YAML (Grid only)

```yaml
type: custom:ultimate-powerflow-card
grid_power_entity: sensor.grid_power
household_power_entity: sensor.household_power
```

### Grid + Solar

```yaml
type: custom:ultimate-powerflow-card
grid_power_entity: sensor.grid_power
household_power_entity: sensor.household_power
solar_power_entity: sensor.solar_power
solar_enabled: true
```

### Grid + Solar + Battery

```yaml
type: custom:ultimate-powerflow-card
grid_power_entity: sensor.grid_power
household_power_entity: sensor.household_power
solar_power_entity: sensor.solar_power
battery_charging_power_entity: sensor.battery_charging_power
battery_discharging_power_entity: sensor.battery_discharging_power
solar_enabled: true
battery_enabled: true
```

### Full Setup – Grid + Solar + Battery + EV Charger

```yaml
type: custom:ultimate-powerflow-card
grid_power_entity: sensor.grid_power
household_power_entity: sensor.household_power
solar_power_entity: sensor.solar_power
battery_charging_power_entity: sensor.battery_charging_power
battery_discharging_power_entity: sensor.battery_discharging_power
ev_charger_power_entity: sensor.ev_charger_power
solar_enabled: true
battery_enabled: true
ev_charger_enabled: true
weather_entity: weather.home
```

### Full Config with All Options

```yaml
type: custom:ultimate-powerflow-card
grid_power_entity: sensor.grid_power
household_power_entity: sensor.household_power
solar_power_entity: sensor.solar_power
battery_charging_power_entity: sensor.battery_charging_power
battery_discharging_power_entity: sensor.battery_discharging_power
ev_charger_power_entity: sensor.ev_charger_power
sun_entity: sun.sun
weather_entity: weather.home
solar_enabled: true
battery_enabled: true
ev_charger_enabled: true
image_base_path: /local/ultimate-powerflow/
animation_speed: normal
colors:
  grid: "#f39c12"
  solar: "#f1c40f"
  battery: "#2ecc71"
  household: "#3498db"
  ev_charger: "#9b59b6"
label_positions:
  grid:
    x: 88
    y: 72
  household:
    x: 62
    y: 58
  solar:
    x: 42
    y: 18
  battery:
    x: 55
    y: 72
  ev_charger:
    x: 16
    y: 75
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `grid_power_entity` | string | **required** | Entity for grid power (W). Positive = import. |
| `household_power_entity` | string | **required** | Entity for household consumption (W). |
| `solar_power_entity` | string | — | Entity for solar production (W). |
| `battery_charging_power_entity` | string | — | Entity for battery charging power (W). |
| `battery_discharging_power_entity` | string | — | Entity for battery discharging power (W). |
| `ev_charger_power_entity` | string | — | Entity for EV charger power (W). |
| `sun_entity` | string | `sun.sun` | Entity used for day/night detection. |
| `weather_entity` | string | — | Weather entity for rain/snow overlays. |
| `solar_enabled` | boolean | `false` | Show solar panels and flow. |
| `battery_enabled` | boolean | `false` | Show battery and flow. |
| `ev_charger_enabled` | boolean | `false` | Show EV charger and flow. |
| `image_base_path` | string | `/local/ultimate-powerflow/` | Base folder for house images. |
| `animation_speed` | string | `normal` | Flow animation speed: `slow`, `normal`, or `fast`. |
| `colors.grid` | string | `#f39c12` | Grid flow line color. |
| `colors.solar` | string | `#f1c40f` | Solar flow line color. |
| `colors.battery` | string | `#2ecc71` | Battery flow line color. |
| `colors.household` | string | `#3498db` | Household label color. |
| `colors.ev_charger` | string | `#9b59b6` | EV charger flow line color. |
| `label_positions` | object | (see defaults) | Advanced: override label positions (%). |

### Label Position Defaults

| Label | X (%) | Y (%) |
|-------|--------|--------|
| Grid | 88 | 72 |
| Household | 62 | 58 |
| Solar | 42 | 18 |
| Battery | 55 | 72 |
| EV Charger | 16 | 75 |

---

## 🖥️ GUI Editor

The card ships with a full Lovelace GUI editor. In the editor you will find:

- **⚡ Core Entities** – required entity pickers for grid and household
- **🔌 Optional Devices** – toggles and entity pickers for solar, battery, and EV charger
- **🖼️ Image** – single base path field (image filename selection is fully automatic)
- **🎨 Appearance** – animation speed and color pickers for each device
- **🔧 Advanced** – optional manual label position overrides

> The editor **never** asks you to select individual image files for day/night or component combinations.
> All image logic is handled automatically.

---

## 🌙 Day / Night Switching

The card reads the state of `sun.sun` (or your configured `sun_entity`):

- State `above_horizon` → **day** images are used
- State `below_horizon` → **night** images are used

This switches automatically without any manual configuration.

---

## 🌧️ Rain & Snow Overlays

When a `weather_entity` is configured, the card adds a tasteful weather overlay:

| Weather condition | Overlay |
|-------------------|---------|
| `rainy`, `pouring`, `lightning-rainy` | Animated rain drops |
| `snowy`, `snowy-rainy`, `hail` | Animated snow flakes |
| All others | No overlay |

The overlays are drawn on a canvas and are translucent – they do not hide labels or power values.

---

## 📐 W / kW Formatting

Power values are formatted automatically:

| Raw value | Displayed as |
|-----------|-------------|
| 0–999 W | `450 W` |
| 1000+ W | `1.1 kW`, `3.45 kW`, `12 kW` |

Unavailable or unknown sensor states display as `—`.

---

## 🏗️ Developer Guide

### Building from Source

```bash
# Install dependencies
npm install

# Build (production)
npm run build

# Build (development with watch)
npm run watch

# Type check
npm run typecheck
```

Output is written to `dist/ultimate-powerflow-card.js`.

### Repository Structure

```
Ultimate-Powerflow-Card/
├── src/
│   ├── index.ts                         # Entry point + card registration
│   ├── ultimate-powerflow-card.ts       # Main card component
│   ├── ultimate-powerflow-card-editor.ts# GUI editor component
│   ├── styles.ts                        # CSS-in-JS styles
│   ├── types.ts                         # TypeScript interfaces
│   └── helpers/
│       ├── format.ts                    # W/kW formatting helpers
│       ├── image-resolver.ts            # Automatic image filename logic
│       ├── flow-calculator.ts           # Energy flow calculation
│       └── weather-overlay.ts           # Rain/snow canvas animations
├── dist/
│   └── ultimate-powerflow-card.js       # Pre-built distributable
├── examples/
│   └── example-config.yaml             # Example Lovelace YAML
├── hacs.json
├── package.json
├── tsconfig.json
├── rollup.config.js
├── LICENSE
├── CHANGELOG.md
└── RELEASE_NOTES_v1.0.0.md
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss your change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm run build` and `npm run typecheck`
5. Commit and open a pull request

---

## 📜 License

MIT – see [LICENSE](LICENSE) for details.
