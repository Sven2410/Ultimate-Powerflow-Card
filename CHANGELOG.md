# Changelog

All notable changes to Ultimate Powerflow Card will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] – 2024-01-01

### Added
- Initial release of Ultimate Powerflow Card
- Animated neon energy flow lines between grid, household, solar, battery, and EV charger
- Automatic background image selection based on:
  - Day / night (via `sun.sun` or configurable sun entity)
  - Enabled features (solar, battery, EV charger)
- Full Lovelace GUI editor with:
  - Entity pickers for all sensors
  - Feature toggles (solar, battery, EV charger)
  - Single image base path field
  - Color configuration for all flow lines
  - Animation speed selector (slow / normal / fast)
  - Advanced label position overrides
- Weather overlay support:
  - Rain animation for `rainy` / `pouring` conditions
  - Snow animation for `snowy` / `snowy-rainy` conditions
- Automatic W / kW formatting (below 1000 W → W, 1000+ → kW)
- Graceful fallback for unavailable / unknown sensor states
- HACS frontend repository compatible
- Responsive 16:9 layout
- TypeScript source with full type safety
- Rollup build pipeline with minification

---

## [Unreleased]

### Planned
- Battery state of charge (%) display
- Configurable label display modes (icon only, value only, both)
- Custom SVG path support for flow lines
- Dark / light theme auto-detection
- Additional weather overlays (wind, fog)
- Multi-language support
