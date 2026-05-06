# Codex KPI Sparkline Card

## Overview
A clean KPI card with optional target comparison and sparkline trend. Certification-ready.

## Features
- Displays a primary value (numeric or text) with optional label
- Shows target comparison as a delta (absolute and/or percentage) with directional arrow
- Renders a sparkline trend line from a series of values
- Configurable sparkline appearance: color, line width, area fill, and axis labels
- Value formatting: display units, decimal places, and automatic handling of text values
- Click to cross-filter other visuals by the sparkline category (first row)
- Tooltip on hover showing KPI value, target, and variance
- High contrast mode support (adapts to Power BI themes)
- Responsive font scaling for narrow containers
- Supports keyboard focus and screen readers

## Data Roles
| Role | Display Name | Kind | Required? | Data Type | Description |
|------|--------------|------|-----------|-----------|-------------|
| measure | Value | Measure | Yes (max 1) | Numeric or Text | The primary KPI value to display |
| target | Target | Measure | No (max 1) | Numeric | Target value for comparison (used to calculate delta) |
| sparkline | Sparkline Values | Measure | No (max 1) | Numeric | Series of values for the sparkline trend line |
| sparklineCategory | Sparkline Category | Grouping | No (max 1) | Text or Grouping | Categories for the sparkline x-axis (e.g. time periods) |
| sortOrder | Sort Order | Measure | No (max 1) | Numeric | Optional sort order for the sparkline data (ascending) |

Note: The Value role is required. Each role can accept only one field.

## Formatting Options
The visual provides the following format pane cards:

### Value Card
- Font Size: Size of the KPI value text in pixels
- Value Color: Text color of the KPI value
- Label Color: Text color of the KPI label (above the value)
- Background Color: Background color of the card (transparent in high contrast mode)
- Display Units: Units for value formatting (e.g. none, thousands, millions)
- Decimal Places: Number of decimal places to display (0-6)
- Show Label: Toggle visibility of the label above the value
- Label Text: Custom label text (defaults to the measure name if not set)
- Value Alignment: Horizontal alignment of the value (left, center, right)
- Label Alignment: Horizontal alignment of the label (left, center, right)

### Target Card
- Show Target: Toggle visibility of the target comparison delta
- Positive Color: Color for the delta when the value meets or exceeds the target
- Negative Color: Color for the delta when the value is below the target
- Variance Type: How to show the variance — Percentage, Absolute, or Both
- Target Alignment: Horizontal alignment of the delta (left, center, right)

### Sparkline Card
- Show Sparkline: Toggle visibility of the sparkline trend line
- Sparkline Color: Color of the sparkline line
- Line Width: Thickness of the sparkline line in pixels
- Show Area: Toggle visibility of the area under the sparkline line
- Show Axis Labels: Toggle visibility of axis labels below the sparkline (uses sparklineCategory values)

## How to Use
1. Import the `.pbiviz` file into Power BI Desktop (from the Visuals pane -> ... -> Import from file).
2. Locate the visual in the Visualizations pane and add it to the report canvas.
3. Bind data to the data roles:
   - **Value**: Required numeric or text measure for the main KPI
   - **Target**: Optional numeric measure for comparison
   - **Sparkline Values**: Optional numeric measure series for the trend line
   - **Sparkline Category**: Optional field for the x-axis categories (e.g. dates)
   - **Sort Order**: Optional numeric field to sort the sparkline data (ascending)
4. Use the format pane to adjust appearance:
   - Set value font, colors, background, label, and alignment
   - Configure target delta colors, variance type, and alignment
   - Adjust sparkline color, line width, area fill, and axis labels
5. Interact:
   - Click the card to cross-filter other visuals by the sparkline category (first row value)
   - Hover to see a tooltip with the KPI value, target, and variance (if applicable)
   - Right-click for the context menu

## Limitations
- The visual displays only the first row of data for the KPI value and target; additional rows are ignored.
- The sparkline expects a series of numeric values; non-numeric values are treated as zero.
- If sparklineCategory is bound, the visual uses the first row's category for cross-filtering on click.
- The sparkline does not display individual point tooltips; only the card tooltip is available.
- The visual does not support drill-through or bookmark selection.
- Each data role accepts only one field.
- The visual uses a data reduction algorithm (top 30,000 rows) which may limit the number of sparkline data points displayed.

## Support
For help or questions, visit https://nexuscodex.nexus/support