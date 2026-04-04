// ============================================================
// Ultimate Powerflow Card – Styles
// ============================================================

import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
    --upfc-grid-color: #f39c12;
    --upfc-solar-color: #f1c40f;
    --upfc-battery-color: #2ecc71;
    --upfc-household-color: #3498db;
    --upfc-ev-color: #9b59b6;
    --upfc-line-width: 3px;
    --upfc-glow-blur: 8px;
    --upfc-label-bg: rgba(10, 10, 20, 0.72);
    --upfc-label-border: rgba(255, 255, 255, 0.08);
    --upfc-label-radius: 8px;
    --upfc-font-family: var(
      --paper-font-body1_-_font-family,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif
    );
  }

  ha-card {
    overflow: hidden;
    background: var(--card-background-color, #1c1c2e);
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .upfc-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    overflow: hidden;
    border-radius: var(--ha-card-border-radius, 12px);
  }

  .upfc-inner {
    position: absolute;
    inset: 0;
  }

  .upfc-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
    z-index: 0;
    transition: opacity 0.6s ease;
  }

  .upfc-bg-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    z-index: 0;
  }

  .upfc-bg-placeholder .icon {
    font-size: 48px;
    opacity: 0.3;
  }

  .upfc-svg-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;
  }

  /* ── Energy flow lines ── */
  .upfc-flow-line {
    stroke-linecap: round;
    fill: none;
    stroke-width: 3;
    transition: stroke 0.3s ease;
  }

  .upfc-flow-line-inactive {
    opacity: 0.12;
    stroke-dasharray: none;
  }

  .upfc-flow-line-active {
    opacity: 1;
    filter: drop-shadow(0 0 4px currentColor);
  }

  /* ── Animated dash for active flow ── */
  @keyframes flowDash {
    to {
      stroke-dashoffset: -48;
    }
  }

  .upfc-flow-animated {
    stroke-dasharray: 12 8;
    animation: flowDash 1s linear infinite;
  }

  .upfc-flow-animated-slow {
    stroke-dasharray: 12 8;
    animation: flowDash 2s linear infinite;
  }

  .upfc-flow-animated-fast {
    stroke-dasharray: 12 8;
    animation: flowDash 0.5s linear infinite;
  }

  /* ── Labels ── */
  .upfc-label {
    position: absolute;
    transform: translate(-50%, -50%);
    background: var(--upfc-label-bg);
    border: 1px solid var(--upfc-label-border);
    border-radius: var(--upfc-label-radius);
    padding: 5px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    z-index: 5;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    min-width: 64px;
    pointer-events: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  .upfc-label-icon {
    font-size: 13px;
    line-height: 1;
    opacity: 0.7;
  }

  .upfc-label-title {
    font-family: var(--upfc-font-family);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.55;
    color: #fff;
    line-height: 1.2;
  }

  .upfc-label-value {
    font-family: var(--upfc-font-family);
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .upfc-label-value.unavailable {
    opacity: 0.45;
    font-size: 11px;
  }

  /* Color-tinted label top border */
  .upfc-label[data-type="grid"] {
    border-top: 2px solid var(--upfc-grid-color);
  }
  .upfc-label[data-type="solar"] {
    border-top: 2px solid var(--upfc-solar-color);
  }
  .upfc-label[data-type="battery"] {
    border-top: 2px solid var(--upfc-battery-color);
  }
  .upfc-label[data-type="household"] {
    border-top: 2px solid var(--upfc-household-color);
  }
  .upfc-label[data-type="ev_charger"] {
    border-top: 2px solid var(--upfc-ev-color);
  }

  /* ── Error / warning state ── */
  .upfc-error {
    padding: 16px;
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Weather overlay ── */
  .upfc-weather-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    overflow: hidden;
    z-index: 2;
  }

  .upfc-rain-canvas,
  .upfc-snow-canvas {
    width: 100%;
    height: 100%;
  }

  /* ── Responsive tweaks ── */
  @media (max-width: 480px) {
    .upfc-label {
      padding: 3px 7px;
      min-width: 48px;
    }
    .upfc-label-value {
      font-size: 10px;
    }
    .upfc-label-title {
      font-size: 7px;
    }
  }
`;
