"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private eventService: IVisualEventService;
    private selectionManager: ISelectionManager;
    private tooltipService: ITooltipService;
    private colorPalette: ISandboxExtendedColorPalette;
    private localizationManager: ILocalizationManager;
    private isHighContrast: boolean;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    // DOM elements
    private container: HTMLElement;
    private valueEl: HTMLElement;
    private labelEl: HTMLElement;
    private deltaEl: HTMLElement;
    private sparklineContainer: HTMLElement;

    // State for tooltips and selection
    private currentSelectionId: ISelectionId | null = null;
    private sparklineSelectionIds: ISelectionId[] = [];
    private cardTooltipItems: VisualTooltipDataItem[] = [];
    private sparklineDataPoints: { value: number; category: string; formatted: string }[] = [];

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.eventService = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();
        this.tooltipService = options.host.tooltipService;
        this.colorPalette = options.host.colorPalette as ISandboxExtendedColorPalette;
        this.localizationManager = options.host.createLocalizationManager();
        this.isHighContrast = this.colorPalette.isHighContrast;

        // Context menu on right-click
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu(
                {},
                { x: e.clientX, y: e.clientY }
            );
            e.preventDefault();
        });

        // Build static DOM skeleton
        this.container = document.createElement("div");
        this.container.className = "kpi-card";

        this.labelEl = document.createElement("div");
        this.labelEl.className = "kpi-label";

        this.valueEl = document.createElement("div");
        this.valueEl.className = "kpi-value";

        this.deltaEl = document.createElement("div");
        this.deltaEl.className = "kpi-delta";

        this.sparklineContainer = document.createElement("div");
        this.sparklineContainer.className = "kpi-sparkline";

        this.container.appendChild(this.labelEl);
        this.container.appendChild(this.valueEl);
        this.container.appendChild(this.deltaEl);
        this.container.appendChild(this.sparklineContainer);
        this.target.appendChild(this.container);

        // Tooltip on card body — show on hover, hide on leave
        this.container.addEventListener("mousemove", (e: MouseEvent) => {
            if (this.cardTooltipItems.length > 0) {
                this.tooltipService.show({
                    coordinates: [e.clientX, e.clientY],
                    isTouchEvent: false,
                    dataItems: this.cardTooltipItems,
                    identities: this.currentSelectionId ? [this.currentSelectionId] : []
                });
            }
        });
        this.container.addEventListener("mouseleave", () => {
            this.tooltipService.hide({ isTouchEvent: false, immediately: false });
        });

        // Click to cross-filter
        this.container.addEventListener("click", (e: MouseEvent) => {
            if (this.currentSelectionId) {
                this.selectionManager.select(this.currentSelectionId);
            }
            e.stopPropagation();
        });

        // Allow deselection by registering with the selection manager
        this.selectionManager.registerOnSelectCallback(() => {
            // Selection changed externally
        });
    }

    public update(options: VisualUpdateOptions): void {
        this.eventService.renderingStarted(options);

        try {
            const dataView: DataView = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel, dataView
            );

            // High contrast mode detection
            this.isHighContrast = this.colorPalette.isHighContrast;

            const valSettings = this.formattingSettings.valueCardSettings;
            const tgtSettings = this.formattingSettings.targetCardSettings;
            const spkSettings = this.formattingSettings.sparklineCardSettings;

            // Apply background (skip in high contrast — let system handle it)
            this.container.style.backgroundColor = this.isHighContrast
                ? "transparent"
                : valSettings.backgroundColor.value.value;

            // Clear sparkline
            while (this.sparklineContainer.firstChild) {
                this.sparklineContainer.removeChild(this.sparklineContainer.firstChild);
            }

            // Reset state
            this.currentSelectionId = null;
            this.sparklineSelectionIds = [];
            this.cardTooltipItems = [];
            this.sparklineDataPoints = [];

            if (!dataView || !dataView.categorical || !dataView.categorical.values) {
                this.renderEmpty();
                this.eventService.renderingFinished(options);
                return;
            }

            const categorical = dataView.categorical;
            const values = categorical.values;
            const categories = categorical.categories && categorical.categories[0];

            // Find columns by role
            let measureCol: powerbi.DataViewValueColumn | null = null;
            let targetCol: powerbi.DataViewValueColumn | null = null;
            let sparklineCol: powerbi.DataViewValueColumn | null = null;
            let sortOrderCol: powerbi.DataViewValueColumn | null = null;

            for (let i = 0; i < values.length; i++) {
                const roles = values[i].source.roles;
                if (roles["measure"]) measureCol = values[i];
                if (roles["target"]) targetCol = values[i];
                if (roles["sparkline"]) sparklineCol = values[i];
                if (roles["sortOrder"]) sortOrderCol = values[i];
            }

            if (!measureCol) {
                this.renderEmpty();
                this.eventService.renderingFinished(options);
                return;
            }

            // Build selection ID for cross-filtering
            if (categories) {
                this.currentSelectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories, 0)
                    .createSelectionId();
            }

            // Extract primary KPI value (first row or aggregate)
            const rawValue = measureCol.values[0];
            if (rawValue == null) {
                this.renderEmpty();
                this.eventService.renderingFinished(options);
                return;
            }

            // Format and display value — text passes through, numbers get formatted
            const isNumeric = typeof rawValue === "number" && !isNaN(rawValue);
            const displayUnits = valSettings.displayUnits.value.value as string;
            const decimals = valSettings.decimalPlaces.value;
            const formattedValue = isNumeric
                ? this.formatValue(rawValue as number, displayUnits, decimals)
                : String(rawValue);

            this.valueEl.textContent = formattedValue;
            this.valueEl.style.fontSize = valSettings.fontSize.value + "px";
            this.valueEl.style.color = valSettings.valueColor.value.value;
            this.valueEl.style.textAlign = (valSettings.valueAlign?.value as string) || "center";

            // Label
            const measureName = measureCol.source.displayName;
            if (valSettings.showLabel.value) {
                const labelText = valSettings.labelText.value || measureName;
                this.labelEl.textContent = labelText;
                this.labelEl.style.color = valSettings.labelColor.value.value;
                this.labelEl.style.textAlign = (valSettings.labelAlign?.value as string) || "center";
                this.labelEl.style.display = "";
            } else {
                this.labelEl.style.display = "none";
            }

            // Target / delta (only for numeric values)
            let targetValue: number | null = null;
            let deltaText = "";
            if (isNumeric && targetCol && tgtSettings.showTarget.value) {
                targetValue = targetCol.values[0] as number;
                if (targetValue != null && !isNaN(targetValue) && targetValue !== 0) {
                    const diff = (rawValue as number) - targetValue;
                    const pctDiff = (diff / Math.abs(targetValue)) * 100;
                    const isPositive = diff >= 0;
                    const color = isPositive
                        ? tgtSettings.positiveColor.value.value
                        : tgtSettings.negativeColor.value.value;
                    const arrow = isPositive ? "\u25B2" : "\u25BC";
                    const varianceType = tgtSettings.varianceType.value.value as string;

                    if (varianceType === "percentage") {
                        deltaText = arrow + " " + Math.abs(pctDiff).toFixed(1) + "%";
                    } else if (varianceType === "absolute") {
                        deltaText = arrow + " " + this.formatValue(Math.abs(diff), displayUnits, decimals);
                    } else {
                        deltaText = arrow + " " + this.formatValue(Math.abs(diff), displayUnits, decimals)
                            + " (" + Math.abs(pctDiff).toFixed(1) + "%)";
                    }

                    this.deltaEl.textContent = deltaText;
                    this.deltaEl.style.color = color;
                    this.deltaEl.style.textAlign = (tgtSettings.targetAlign?.value as string) || "center";
                    this.deltaEl.style.display = "";
                } else {
                    this.deltaEl.style.display = "none";
                }
            } else {
                this.deltaEl.style.display = "none";
            }

            // Build tooltip data for the card
            this.cardTooltipItems = [{ displayName: measureName, value: formattedValue }];
            if (targetCol && targetValue != null) {
                this.cardTooltipItems.push({
                    displayName: targetCol.source.displayName,
                    value: String(targetValue)
                });
                if (deltaText) {
                    this.cardTooltipItems.push({
                        displayName: "Variance",
                        value: deltaText.replace("\u25B2 ", "+").replace("\u25BC ", "-")
                    });
                }
            }

            // Sparkline
            const viewportHeight = options.viewport.height;
            if (sparklineCol && spkSettings.showSparkline.value && viewportHeight > 100) {
                // Build array of indices for sorting
                const indices: number[] = [];
                for (let i = 0; i < sparklineCol.values.length; i++) {
                    indices.push(i);
                }

                // Sort by sortOrder column if provided
                if (sortOrderCol) {
                    indices.sort((a, b) => {
                        const va = sortOrderCol.values[a] as number;
                        const vb = sortOrderCol.values[b] as number;
                        return (va != null ? va : 0) - (vb != null ? vb : 0);
                    });
                }

                const sparkData: number[] = [];
                const categoryLabels: string[] = [];
                const selectionIds: ISelectionId[] = [];
                for (let i = 0; i < indices.length; i++) {
                    const idx = indices[i];
                    const v = sparklineCol.values[idx] as number;
                    sparkData.push(v != null && !isNaN(v) ? v : 0);
                    if (categories) {
                        categoryLabels.push(String(categories.values[idx] ?? ""));
                        selectionIds.push(
                            this.host.createSelectionIdBuilder()
                                .withCategory(categories, idx)
                                .createSelectionId()
                        );
                    }
                }

                this.sparklineSelectionIds = selectionIds;

                if (sparkData.length > 1) {
                    this.renderSparkline(
                        sparkData,
                        spkSettings.sparklineColor.value.value,
                        spkSettings.lineWidth.value,
                        spkSettings.showArea.value,
                        spkSettings.showAxisLabels.value ? categoryLabels : null,
                        categoryLabels,
                        sparklineCol.source.displayName,
                        displayUnits,
                        decimals
                    );
                }
            }

            // Responsive font scaling
            const viewportWidth = options.viewport.width;
            if (viewportWidth < 120) {
                this.valueEl.style.fontSize = Math.max(14, valSettings.fontSize.value * 0.5) + "px";
            } else if (viewportWidth < 200) {
                this.valueEl.style.fontSize = Math.max(18, valSettings.fontSize.value * 0.7) + "px";
            }

            this.eventService.renderingFinished(options);
        } catch (e) {
            this.eventService.renderingFailed(options, String(e));
        }
    }

    private renderEmpty(): void {
        this.valueEl.textContent = "--";
        this.valueEl.style.color = this.isHighContrast ? "" : "#999999";
        this.labelEl.style.display = "";
        this.labelEl.style.color = this.isHighContrast ? "" : "#999999";
        this.deltaEl.style.display = "none";
        while (this.sparklineContainer.firstChild) {
            this.sparklineContainer.removeChild(this.sparklineContainer.firstChild);
        }

        // Landing page guidance (localized)
        this.labelEl.textContent = this.localizationManager.getDisplayName("Visual_Short_Description") || "KPI Card";
        const hint = document.createElement("div");
        hint.className = "kpi-landing-hint";
        hint.style.fontSize = "11px";
        hint.style.color = this.isHighContrast ? "" : "#666666";
        hint.style.marginTop = "4px";
        hint.textContent = "Drag a Value measure, then optionally add Target and Sparkline fields";
        this.sparklineContainer.appendChild(hint);
    }

    private formatValue(value: number, units: string, decimals: number): string {
        let displayValue = value;
        let suffix = "";

        if (units === "auto") {
            const abs = Math.abs(value);
            if (abs >= 1e9) {
                displayValue = value / 1e9;
                suffix = "B";
            } else if (abs >= 1e6) {
                displayValue = value / 1e6;
                suffix = "M";
            } else if (abs >= 1e3) {
                displayValue = value / 1e3;
                suffix = "K";
            }
        } else if (units === "thousands") {
            displayValue = value / 1e3;
            suffix = "K";
        } else if (units === "millions") {
            displayValue = value / 1e6;
            suffix = "M";
        } else if (units === "billions") {
            displayValue = value / 1e9;
            suffix = "B";
        }

        return displayValue.toFixed(decimals) + suffix;
    }

    private renderSparkline(
        data: number[],
        color: string,
        strokeWidth: number,
        showArea: boolean,
        axisLabels: string[] | null,
        allCategoryLabels: string[],
        sparklineMeasureName: string,
        displayUnits: string,
        decimals: number
    ): void {
        const width = this.sparklineContainer.clientWidth || 200;
        const showLabels = axisLabels && axisLabels.length > 1;
        const labelHeight = showLabels ? 14 : 0;
        const sparkHeight = 40;
        const totalHeight = sparkHeight + labelHeight;
        const padding = 2;

        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);

        const xScale = scaleLinear()
            .domain([0, data.length - 1])
            .range([padding, width - padding]);

        const yScale = scaleLinear()
            .domain([minVal, maxVal === minVal ? minVal + 1 : maxVal])
            .range([sparkHeight - padding, padding]);

        // Store data points for tooltip
        this.sparklineDataPoints = data.map((v, i) => ({
            value: v,
            category: allCategoryLabels[i] || "",
            formatted: this.formatValue(v, displayUnits, decimals)
        }));

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(totalHeight));
        svg.setAttribute("viewBox", "0 0 " + width + " " + totalHeight);

        if (showArea) {
            const areaGen = area<number>()
                .x((_d, i) => xScale(i))
                .y0(sparkHeight - padding)
                .y1(d => yScale(d))
                .curve(curveMonotoneX);

            const areaPath = document.createElementNS(svgNs, "path");
            areaPath.setAttribute("d", areaGen(data) || "");
            areaPath.setAttribute("fill", color);
            areaPath.setAttribute("fill-opacity", "0.15");
            svg.appendChild(areaPath);
        }

        const lineGen = line<number>()
            .x((_d, i) => xScale(i))
            .y(d => yScale(d))
            .curve(curveMonotoneX);

        const linePath = document.createElementNS(svgNs, "path");
        linePath.setAttribute("d", lineGen(data) || "");
        linePath.setAttribute("fill", "none");
        linePath.setAttribute("stroke", color);
        linePath.setAttribute("stroke-width", String(strokeWidth));

        svg.appendChild(linePath);

        // Invisible hit circles for tooltips and cross-filtering on sparkline points
        for (let i = 0; i < data.length; i++) {
            const circle = document.createElementNS(svgNs, "circle");
            circle.setAttribute("cx", String(xScale(i)));
            circle.setAttribute("cy", String(yScale(data[i])));
            circle.setAttribute("r", "6");
            circle.setAttribute("fill", "transparent");
            circle.setAttribute("data-index", String(i));
            circle.style.cursor = "pointer";
            svg.appendChild(circle);
        }

        // Render first and last category labels below the sparkline
        if (showLabels) {
            const labelY = sparkHeight + labelHeight - 2;
            const labelColor = this.isHighContrast ? "" : "#767676";

            const firstLabel = document.createElementNS(svgNs, "text");
            firstLabel.setAttribute("x", String(padding));
            firstLabel.setAttribute("y", String(labelY));
            firstLabel.setAttribute("fill", labelColor);
            firstLabel.setAttribute("font-size", "10");
            firstLabel.setAttribute("text-anchor", "start");
            firstLabel.textContent = axisLabels[0];
            svg.appendChild(firstLabel);

            const lastLabel = document.createElementNS(svgNs, "text");
            lastLabel.setAttribute("x", String(width - padding));
            lastLabel.setAttribute("y", String(labelY));
            lastLabel.setAttribute("fill", labelColor);
            lastLabel.setAttribute("font-size", "10");
            lastLabel.setAttribute("text-anchor", "end");
            lastLabel.textContent = axisLabels[axisLabels.length - 1];
            svg.appendChild(lastLabel);
        }

        this.sparklineContainer.appendChild(svg);

        // Sparkline tooltip — show on point hover, hide on leave
        svg.addEventListener("mousemove", (e: MouseEvent) => {
            const target = e.target as SVGElement;
            const idx = target?.getAttribute?.("data-index");
            if (idx != null) {
                const i = parseInt(idx, 10);
                const dp = this.sparklineDataPoints[i];
                if (dp) {
                    const items: VisualTooltipDataItem[] = [];
                    if (dp.category) {
                        items.push({ displayName: "Category", value: dp.category });
                    }
                    items.push({ displayName: sparklineMeasureName, value: dp.formatted });
                    this.tooltipService.show({
                        coordinates: [e.clientX, e.clientY],
                        isTouchEvent: false,
                        dataItems: items,
                        identities: this.sparklineSelectionIds[i] ? [this.sparklineSelectionIds[i]] : []
                    });
                }
            }
        });
        svg.addEventListener("mouseleave", () => {
            this.tooltipService.hide({ isTouchEvent: false, immediately: false });
        });

        // Click on sparkline points to cross-filter
        svg.addEventListener("click", (e: MouseEvent) => {
            const target = e.target as SVGElement;
            const idx = target?.getAttribute?.("data-index");
            if (idx != null) {
                const i = parseInt(idx, 10);
                const selId = this.sparklineSelectionIds[i];
                if (selId) {
                    this.selectionManager.select(selId, e.ctrlKey || e.metaKey);
                }
                e.stopPropagation();
            }
        });
    }

    public destroy(): void {
        // Clean up DOM references
        while (this.sparklineContainer.firstChild) {
            this.sparklineContainer.removeChild(this.sparklineContainer.firstChild);
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
