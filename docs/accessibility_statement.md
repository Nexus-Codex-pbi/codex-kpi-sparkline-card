# Accessibility Statement for pbiKpiCard

## Keyboard Navigation
The visual supports keyboard focus (supportsKeyboardFocus: true). Users can navigate to the visual using the Tab key. When the visual has focus:
- Pressing Enter or Space activates the click-to-filter functionality (if a measure is bound and the visual is configured to allow selection).
- The visual does not trap focus; focus moves to the next element in the tab order when exiting.
- The visual supports the context menu via the keyboard (typically Shift+F10 or the context menu key) when focused.

## High Contrast Mode
The visual detects high contrast mode via the Power BI host's color palette (`colorPalette.isHighContrast`). In high contrast mode:
- The visual skips setting a background color (sets to transparent) to allow the system background to show through.
- Text (value, label, delta) uses the foreground color from the palette for better contrast.
- The sparkline, if shown, uses the foreground color for the line and area (if applicable).
- The visual ensures that all text has sufficient contrast against the background.

## Screen Reader Support
The visual uses standard HTML `<div>` elements with text content:
- All text elements (label, value, delta) are populated via `textContent`, making them accessible to screen readers.
- The sparkline is rendered as an SVG, but the visual does not currently provide ARIA labels for the sparkline elements.
- However, the tooltip (on hover/focus) provides the same data as the sparkline (data points) and the KPI value, label, and delta.
- Screen readers will announce the text content in the order it appears in the DOM (label, value, delta) and can access the tooltip for additional details.

## Color Usage
The visual conveys information through color in the following ways:
- The value text color is configurable (via the valueColor property).
- The delta text color indicates positive (typically green) or negative (typically red) change relative to the target.
- The sparkline uses a configurable color for the line and area.
Users should ensure sufficient contrast between text and background colors. The visual does not rely solely on color to convey information; the delta text includes an arrow symbol (▲ for increase, ▼ for decrease) and the text of the change.

## Animations
The visual does not use any animations. The sparkline is rendered statically, and updates are immediate.

## Text Scaling
The visual respects the user's text size settings through the use of `px` units for font sizes (which scale with the user's display settings in Power BI). The visual does not override or disable the browser's text scaling capabilities. Responsive font scaling is applied only when the container width is very narrow (less than 200px) to prevent overflow, but still respects the minimum font size set by the user.

## Summary
pbiKpiCard is designed to be accessible, supporting keyboard navigation, high contrast mode, and screen readers. The visual avoids relying solely on color for information and ensures text is legible in various viewing conditions.