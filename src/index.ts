// ============================================================
// Ultimate Powerflow Card – Entry Point
// ============================================================

import "./ultimate-powerflow-card";
import "./ultimate-powerflow-card-editor";

// Register the card with Home Assistant's custom card registry
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "ultimate-powerflow-card",
  name: "Ultimate Powerflow Card",
  description:
    "Visualizes energy flow (grid, solar, battery, EV) over a house image with animated neon power lines.",
  preview: true,
  documentationURL: "https://github.com/Sven2410/Ultimate-Powerflow-Card",
});

declare global {
  interface Window {
    customCards: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
}
