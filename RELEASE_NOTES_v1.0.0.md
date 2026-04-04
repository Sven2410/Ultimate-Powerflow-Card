# 🎉 Ultimate Powerflow Card v1.0.0 – Release Notes

## First Official Release

We are thrilled to launch the **Ultimate Powerflow Card** for Home Assistant – a polished, production-ready
Lovelace card that brings your home energy system to life with beautiful animated neon power flows
overlaid on a photorealistic house image.

---

## ✨ Highlights

### 🏠 Photorealistic House Images
The card uses stunning 3D-rendered house images that automatically switch based on:
- **Time of day** – daytime vs nighttime scenes (via `sun.sun`)
- **Installed components** – images that match exactly which devices you have (solar panels, battery, EV charger)

No manual image selection needed – the card resolves the correct image filename automatically.

### ⚡ Animated Energy Flow Lines
Smooth, animated neon lines show where energy is flowing:
- **Grid → House** when importing
- **Solar → House** when producing
- **Solar → Battery** when charging
- **Solar → Grid** when exporting excess
- **Battery → House** when discharging
- **House → EV** when charging the car

Lines are only animated when actual power flows above the 5W threshold. Idle connections remain subtle.

### 🎛️ Full GUI Editor
Configure everything through the Lovelace UI:
- Drag-and-drop entity pickers
- Feature toggles (solar, battery, EV)
- Color customization per device
- Animation speed control
- Advanced label position overrides

### 🌦️ Weather Overlays
When connected to a weather entity:
- **Rain/Pouring** → animated rain overlay
- **Snowy/Snowy-rainy** → animated snow overlay

### 📐 Smart Power Formatting
- Below 1000 W: displayed as `W` (e.g., `450 W`)
- 1000 W and above: displayed as `kW` (e.g., `3.2 kW`)

---

## 📦 Installation

### Via HACS (Recommended)
1. Add this repository as a custom repository in HACS (Frontend category)
2. Search for "Ultimate Powerflow Card" and install
3. Add the card resource to your Lovelace resources (HACS does this automatically)
4. Copy your images to `/config/www/ultimate-powerflow/`
5. Add the card to your dashboard

### Manual
1. Download `ultimate-powerflow-card.js` from the releases page
2. Copy to `/config/www/ultimate-powerflow-card.js`
3. Add as a Lovelace resource: `/local/ultimate-powerflow-card.js`
4. Add the card to your dashboard

---

## 🗂️ Image Files Required

Place images in `/config/www/ultimate-powerflow/` (accessible as `/local/ultimate-powerflow/`).

The 8 required image filenames:
```
house-energy-day-grid.png
house-energy-night-grid.png
house-energy-day-grid-solar-panels.png
house-energy-night-grid-solar-panels.png
house-energy-day-grid-solar-panels-battery.png
house-energy-night-grid-solar-panels-battery.png
house-energy-day-grid-solar-panels-battery-ev-charger.png
house-energy-night-grid-solar-panels-battery-ev-charger.png
```

You only need the images for the combinations you actually use.

---

## 🙏 Thank You

Thank you for using the Ultimate Powerflow Card!
If you find bugs or have feature requests, please open an issue on GitHub.
Stars and PRs are always welcome. 🌟
