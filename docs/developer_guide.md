# Developer Guide: pbiKpiCard

## Architecture
The visual follows a standard Power BI custom visual structure:
- **visual.ts**: Main visual class implementing `IVisual`.
- **settings.ts**: Defines the formatting settings model using `powerbi-visuals-utils-formattingmodel`.
- **style/visual.less**: Styles for the visual (though the visual primarily uses inline styles via DOM API and SVG).
- **capabilities.json**: Defines data roles, objects, and capabilities.
- **pbiviz.json**: Manifest file with metadata.

**Rendering Model**:
The visual constructs a static DOM skeleton in the constructor and updates it in the `update` method. It does not recreate DOM elements on every update, only updating text content, styles, and attributes. This approach minimizes DOM churn and improves performance.

The visual is built as a container (`kpi-card`) with child elements for label, value, delta, and sparkline container. The sparkline is rendered using D3.js (d3-scale and d3-shape) within an SVG element.

## capabilities.json Summary
- **Data Roles**: 5 roles (measure, target, sparkline, sparklineCategory, sortOrder). 
  - measure: Measure (numeric or text) - primary KPI value
  - target: Measure (numeric) - target for comparison
  - sparkline: Measure (numeric) - values for sparkline trend
  - sparklineCategory: Grouping - category for sparkline x-axis
  - sortOrder: Measure (numeric) - sort order for sparkline data points
- **Data View Mapping**: Categorical with categories selecting sparklineCategory and values selecting measure, target, sparkline, and sortOrder.
- **Objects**: Three formatting objects (valueCard, targetCard, sparklineCard) controlling appearance.
- **Features**: Supports highlighting, keyboard focus, landing page, empty data view, multi-visual selection, and tooltips (default and canvas).
- **Privileges**: None.

## APIs Used
- **Selection Manager (`ISelectionManager`)**: 
  - For click-to-filter (when sparklineCategory is bound) and context menu.
  - Used in constructor to create selection manager and in click/contextmenu event handlers.
- **Tooltip Service (`ITooltipService`)**:
  - To show and hide tooltips on mousemove and mouseleave.
  - Builds tooltip data array from measure, target, and variance data.
- **Event Service (`IVisualEventService`)**:
  - Calls `renderingStarted` and `renderingFinished` to coordinate with Power BI's rendering cycle.
- **Host (`IVisualHost`)**:
  - Access to color palette (for high contrast), locale, and creation of selection manager, tooltip service, and localization manager.
- **Localization Manager (`ILocalizationManager`)**:
  - Currently unused but initialized for potential future localization.
- **Formatting Settings Service (`FormattingSettingsService`)**:
  - Populates the formatting settings model from the data view.
- **Power BI Utilities**:
  - `powerbi-visuals-utils-formattingmodel` for strongly-typed formatting settings.
- **D3.js**:
  - `d3-scale` for linear scales
  - `d3-shape` for line and area generators (line, area, curveMonotoneX)

## Performance Considerations
- **DOM Updates**: The visual updates only the necessary properties (textContent, style, className) on existing DOM elements, avoiding expensive recreation.
- **Sparkline Rendering**: The sparkline SVG is cleared and re-rendered only when sparkline data is present and viewport height > 100px.
- **Responsive Font Scaling**: Only adjusts font size when viewport width is below 200px, minimizing unnecessary style recalculations.
- **Data Parsing**: The visual processes only the first row of measure/target and all rows of sparkline data (for the sparkline).
- **Selection ID**: Creation of selection ID is done only when categories exist.
- **Tooltip Data**: Tooltip array is rebuilt only when data changes, but it is small (max 3-4 items).

## Accessibility Implementation
- **Keyboard Navigation**: The visual sets `tabindex` implicitly by being a focusable element (div). Click and key handlers (Enter/Space) are attached to the container for activation.
- **High Contrast**: Uses `host.colorPalette.isHighContrast` to skip setting background color (sets to transparent) and uses foreground color for text and sparkline.
- **Screen Reader**: Relies on semantic text content; all text is set via `textContent`. The visual does not use ARIA labels or roles because the text content is sufficient and in a logical order. Screen readers will announce the text content in the order it appears in the DOM (label, value, delta).
- **Color Usage**: The visual does not rely solely on color to convey information; the delta includes an arrow symbol (▲ for increase, ▼ for decrease) and text.
- **Focus Indicator**: The visual does not override the default focus outline; it relies on the browser's default focus styling for keyboard users.

## Security Compliance
- **No External Calls**: The visual does not load any external scripts (`externalJS` is null) and makes no network requests.
- **No eval/dynamic code**: All code is static; no use of `eval`, `Function`, `setTimeout` with strings, etc.
- **Safe DOM**: Uses `textContent` for text and `setAttribute`/`style` for styling. The visual uses D3.js for SVG manipulation, but D3 uses safe DOM methods.
- **No Data Persistence**: Does not use `localStorage`, `sessionStorage`, or cookies.
- **No Privileges**: The `privileges` array in `capabilities.json` is empty.

## Build & Packaging
- **Dependencies**: 
  - `powerbi-visuals-api`
  - `powerbi-visuals-utils-formattingmodel`
  - `d3-scale` (via D3.js)
  - `d3-shape` (via D3.js)
- **Build Steps** (typical for Power BI visuals):
  1. Install dependencies: `npm install`
  2. Compile TypeScript: `npm run build` (or `tsc -p .`)
  3. Package the visual: `pbiviz package`
- **Output**: The packaged `.pbiviz` file is found in the `dist/` directory.
- **Validation**: Use `pbiviz validate` to check the package against Power BI requirements.
- **Debugging**: Use `pbiviz start` to run the visual in debug mode with hot reload.

## Additional Notes
- The visual uses D3.js for sparkline rendering but only the scaleLinear, line, area, and curveMonotoneX functions.
- The visual supports right-click context menu via `selectionManager.showContextMenu`.
- The visual does not support custom tooltips beyond the built-in visual tooltip; it does not use the `ITooltipService` for custom tooltip pages.
- The visual handles both numeric and text measure values (text values pass through without formatting).