"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import { DisplayUnitSystemType } from "powerbi-visuals-utils-formattingutils/lib/src/displayUnitSystem/displayUnitSystemType";
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

import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { VisualFormattingSettingsModel, alignSelfFor, textAlignFor } from "./settings";
import { toRgba } from "./shared/colorHelpers";

// v3 appearance engine (frozen, Plan 15) — the KPI-family v2 look. This
// visual has NO pre-existing "direction logic" property (unlike
// pbiKpiCard's changeDirection), so the ONE colour token is sourced
// directly: value-vs-target when a Target measure is bound (mirrors
// band(value,target)'s ratio law via the pre-existing diff>=0 check —
// see the Deviations note in the Plan 16 Summary), falling back to the
// sparkline's own last-vs-first trend direction when no target is bound.
// Either way the token is resolved through the EXISTING Positive/
// Negative Colour pickers (never a raw bandEngine hex) so a user's
// custom colours still resolve (D-16) — the corner bracket, sparkline
// endpoint dot, and delta pill all share this single resolved hex.
import { Theme } from "./shared/bandEngine";
import { surfaceTokens, TABULAR_NUMS, RADII } from "./shared/designTokens";
import { makeCornerBrackets, CardSignatureHandle } from "./shared/cardSignature";
import { applyCardSignature } from "./shared/cardSignatureSettings";
import { settle } from "./shared/motion";
import { applyHighContrast, statusGlyph } from "./shared/highContrast";

/** Luminance-based theme pick (matches the pbiKpiCard v3 pilot's own
 * 0.55 threshold convention). This visual's pre-existing default IS an
 * opaque white card (unlike pbiProgressBarCard), so bgHex is a reliable
 * signal even at default — no "is it actually visible" gate needed. */
function themeFor(hex: string): Theme {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex || "");
    if (!m) return "light";
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "light" : "dark";
}

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
    private titleEl: HTMLElement;
    private valueEl: HTMLElement;
    private labelEl: HTMLElement;
    private deltaEl: HTMLElement;
    private deltaArrow: HTMLElement;
    private deltaTextNode: Text;
    private sparklineContainer: HTMLElement;

    // v3 card signature — one corner-bracket pair for the whole card.
    private cornerSignature: CardSignatureHandle | null = null;
    // v3 motion — only re-settles the value once when its displayed text changes.
    private lastDisplayValue: string | null = null;

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
        this.container.style.position = "relative";

        this.titleEl = document.createElement("div");
        this.titleEl.className = "kpi-title";
        this.titleEl.style.display = "none";

        this.labelEl = document.createElement("div");
        this.labelEl.className = "kpi-label";

        this.valueEl = document.createElement("div");
        this.valueEl.className = "kpi-value";

        // ─── v2 delta pill (matches pbiKpiCard's grammar): arrow span +
        // text node inside a pill-shaped container, built via DOM API
        // only (createElement/createTextNode). ─────────────────────────
        this.deltaEl = document.createElement("div");
        this.deltaEl.className = "kpi-delta";
        this.deltaArrow = document.createElement("span");
        this.deltaArrow.className = "kpi-delta-arrow";
        this.deltaTextNode = document.createTextNode("");
        this.deltaEl.appendChild(this.deltaArrow);
        this.deltaEl.appendChild(this.deltaTextNode);

        this.sparklineContainer = document.createElement("div");
        this.sparklineContainer.className = "kpi-sparkline";

        this.container.appendChild(this.titleEl);
        this.container.appendChild(this.labelEl);
        this.container.appendChild(this.valueEl);
        this.container.appendChild(this.deltaEl);
        this.container.appendChild(this.sparklineContainer);
        this.target.appendChild(this.container);

        // Corner-bracket card signature — appended last (by
        // makeCornerBrackets itself) so it paints above everything.
        this.cornerSignature = makeCornerBrackets(this.container, "#8f8ab8", {
            variant: "cornerBracket",
            mirror: true,
        });

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

            const titleFmt = this.formattingSettings.titleSettings;
            const valSettings = this.formattingSettings.valueCardSettings;
            const tgtSettings = this.formattingSettings.targetCardSettings;
            const spkSettings = this.formattingSettings.sparklineCardSettings;
            const background = this.formattingSettings.background;

            // ─── Text treatment (font family/weight/style/decoration,
            // TEXT-01) — `?? default` reproduces each surface's PRE-EXISTING
            // hardcoded style exactly when an old saved report has none of
            // these new properties set (D-06): all three text surfaces
            // (.kpi-label, .kpi-value, .kpi-delta) had a hardcoded
            // font-weight in style/visual.less, so all three Bold toggles
            // default true (weightFor idiom, matches pbiVarianceWaterfall/
            // pbiNowVsThen precedent).
            const weightFor = (bold: boolean | undefined, restWeight: string): string => bold ? "700" : restWeight;

            // Dedicated background layer (D-05: this.container is an inner
            // div, never this.target/options.element). Reads the new shared
            // Background card (colour + 0-100% transparency) through the
            // frozen toRgba() wrapper. `?? default` on both reads means an
            // OLD saved report (properties undefined) renders fully opaque
            // white — pixel-identical to the pre-existing
            // `valSettings.backgroundColor` default (D-06). The old
            // valueCard.backgroundColor capability stays declared
            // (untouched, so old reports that reference it don't break)
            // but is no longer read at render, matching the pilot's swap
            // pattern (skip in high contrast — let system handle it).
            const bgHex = background.backgroundColor.value?.value ?? "#ffffff";
            const bgTransparencyPct = background.transparency.value ?? 0;
            this.container.style.backgroundColor = this.isHighContrast
                ? "transparent"
                : toRgba(bgHex, bgTransparencyPct);

            // v3: theme pick + the single HC fallback rule, computed once
            // and reused everywhere colour is resolved below.
            const theme: Theme = themeFor(bgHex);
            const hc = applyHighContrast(this.colorPalette, { fallbackColor: "#8f8ab8" });

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

            // ─── Title (iframe-internal, Policy 1180.2.5) ──────────────
            if (titleFmt.showTitle.value && titleFmt.titleText.value) {
                this.titleEl.textContent = String(titleFmt.titleText.value);
                this.titleEl.style.color = this.isHighContrast
                    ? (this.colorPalette.foreground?.value || titleFmt.titleColor.value.value)
                    : titleFmt.titleColor.value.value;
                this.titleEl.style.fontFamily = titleFmt.titleFontFamily.value || "Segoe UI, sans-serif";
                this.titleEl.style.fontSize = `${titleFmt.titleFontSize.value}pt`;
                this.titleEl.style.fontWeight = weightFor(titleFmt.titleBold.value, "400");
                this.titleEl.style.fontStyle = titleFmt.titleItalic.value ? "italic" : "normal";
                this.titleEl.style.textDecoration = titleFmt.titleUnderline.value ? "underline" : "none";
                const titleAlignVal = String(titleFmt.titleAlign?.value || "left");
                this.titleEl.style.alignSelf = alignSelfFor(titleAlignVal);
                this.titleEl.style.textAlign = textAlignFor(titleAlignVal);
                this.titleEl.style.display = "";
            } else {
                this.titleEl.style.display = "none";
            }

            // Build selection ID for cross-filtering
            if (categories) {
                this.currentSelectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories, 0)
                    .createSelectionId();
            }

            // ─── Conditional formatting (fx) wiring — Value Color (TRANS-04) ──
            // A bare `instanceKind: ConstantOrRule` declaration in settings.ts
            // does not make the fx button functional on its own — it also
            // needs a `selector` (dataViewWildcard, so a rule can match this
            // measure's instances/totals) and an `altConstantSelector` bound
            // to a concrete selectionId for the "set for all" swatch edit
            // path. Resolved via the official ColorHelper.getColorForMeasure
            // path against dataView.metadata.objects, matching the pilot's
            // single-value (not per-category-row) fx pattern — this KPI's
            // primary value is one aggregate reading, not a per-row series.
            valSettings.valueColor.selector = dataViewWildcard.createDataViewWildcardSelector(
                dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
            );
            valSettings.valueColor.altConstantSelector = undefined; // card-level constant persistence: swatch edits apply to ALL instances + round-trip into the pane (first-instance binding persisted a row-0-only override); fx rules stay per-instance via the wildcard selector;
            const valueColorHelper = new ColorHelper(
                this.host.colorPalette,
                { objectName: "valueCard", propertyName: "valueColor" },
                valSettings.valueColor.value.value
            );
            const resolvedValueColor = valueColorHelper.getColorForMeasure(dataView.metadata?.objects, "measure");

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
            const measureFormat = measureCol.source.format;
            const formattedValue = isNumeric
                ? this.formatValue(rawValue as number, displayUnits, decimals, measureFormat)
                : String(rawValue);

            const valueAlignVal = String(valSettings.valueAlign?.value || "center");
            this.valueEl.textContent = formattedValue;
            this.valueEl.style.fontFamily = valSettings.fontFamily.value || "Segoe UI, sans-serif";
            this.valueEl.style.fontSize = valSettings.fontSize.value + "px";
            this.valueEl.style.fontWeight = weightFor(valSettings.bold.value, "700");
            this.valueEl.style.fontStyle = valSettings.italic.value ? "italic" : "normal";
            this.valueEl.style.textDecoration = valSettings.underline.value ? "underline" : "none";
            this.valueEl.style.color = resolvedValueColor;
            this.valueEl.style.fontFeatureSettings = TABULAR_NUMS;
            this.valueEl.style.alignSelf = alignSelfFor(valueAlignVal);
            this.valueEl.style.textAlign = textAlignFor(valueAlignVal);

            // v3 motion: settle the value once when its displayed text
            // changes (skipped under prefers-reduced-motion — motion.ts).
            if (formattedValue !== this.lastDisplayValue) {
                settle(this.valueEl, [
                    { opacity: 0.35, transform: "translateY(3px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ], { duration: 220 });
                this.lastDisplayValue = formattedValue;
            }

            // Label
            const measureName = measureCol.source.displayName;
            if (valSettings.showLabel.value) {
                const labelAlignVal = String(valSettings.labelAlign?.value || "center");
                const labelText = valSettings.labelText.value || measureName;
                this.labelEl.textContent = labelText;
                this.labelEl.style.fontFamily = valSettings.labelFontFamily.value || "Segoe UI, sans-serif";
                this.labelEl.style.fontSize = valSettings.labelFontSize.value + "px";
                this.labelEl.style.fontWeight = weightFor(valSettings.labelBold.value, "600");
                this.labelEl.style.fontStyle = valSettings.labelItalic.value ? "italic" : "normal";
                this.labelEl.style.textDecoration = valSettings.labelUnderline.value ? "underline" : "none";
                this.labelEl.style.color = valSettings.labelColor.value.value;
                this.labelEl.style.alignSelf = alignSelfFor(labelAlignVal);
                this.labelEl.style.textAlign = textAlignFor(labelAlignVal);
                this.labelEl.style.display = "";
            } else {
                this.labelEl.style.display = "none";
            }

            // \u2500\u2500\u2500 v3 ONE colour token \u2014 shared by the delta pill, the
            // sparkline endpoint dot, and the corner bracket. Resolved
            // from the EXISTING Positive/Negative Colour pickers (never a
            // raw bandEngine hex \u2014 this visual has no prior "direction
            // logic" property to preserve, but it DOES have these two
            // literal swatches already, so they stay the single source of
            // truth, D-16). Target / delta (only for numeric values).
            let targetValue: number | null = null;
            let deltaText = "";
            let isPositive: boolean | null = null;
            let signalHex: string | null = null;
            const resolvedPositive = tgtSettings.positiveColor.value.value;
            const resolvedNegative = tgtSettings.negativeColor.value.value;

            if (isNumeric && targetCol && tgtSettings.showTarget.value) {
                targetValue = targetCol.values[0] as number;
                if (targetValue != null && !isNaN(targetValue) && targetValue !== 0) {
                    const diff = (rawValue as number) - targetValue;
                    const pctDiff = (diff / Math.abs(targetValue)) * 100;
                    isPositive = diff >= 0;
                    signalHex = isPositive ? resolvedPositive : resolvedNegative;
                    const arrow = isPositive ? "\u25B2" : "\u25BC";
                    const varianceType = tgtSettings.varianceType.value.value as string;

                    if (varianceType === "percentage") {
                        deltaText = Math.abs(pctDiff).toFixed(1) + "%";
                    } else if (varianceType === "absolute") {
                        deltaText = this.formatValue(Math.abs(diff), displayUnits, decimals, measureFormat);
                    } else {
                        deltaText = this.formatValue(Math.abs(diff), displayUnits, decimals, measureFormat)
                            + " (" + Math.abs(pctDiff).toFixed(1) + "%)";
                    }

                    const targetAlignVal = String(tgtSettings.targetAlign?.value || "center");
                    const pillHex = hc.active ? hc.color : signalHex;
                    const glyph = hc.active ? `${statusGlyph(isPositive ? "up" : "down")} ` : "";
                    this.deltaArrow.textContent = glyph + arrow;
                    this.deltaTextNode.textContent = " " + deltaText;
                    this.deltaEl.style.display = "inline-flex";
                    this.deltaEl.style.alignItems = "center";
                    this.deltaEl.style.gap = "4px";
                    this.deltaEl.style.padding = "4px 10px";
                    this.deltaEl.style.borderRadius = `${RADII.pill}px`;
                    this.deltaEl.style.fontFeatureSettings = TABULAR_NUMS;
                    this.deltaEl.style.backgroundColor = hc.active ? "transparent" : `color-mix(in srgb, ${pillHex} 15%, transparent)`;
                    this.deltaEl.style.border = hc.active ? `${hc.borderWidth}px solid ${hc.color}` : "none";
                    this.deltaEl.style.fontFamily = tgtSettings.deltaFontFamily.value || "Segoe UI, sans-serif";
                    this.deltaEl.style.fontSize = tgtSettings.deltaFontSize.value + "px";
                    this.deltaEl.style.fontWeight = weightFor(tgtSettings.deltaBold.value, "600");
                    this.deltaEl.style.fontStyle = tgtSettings.deltaItalic.value ? "italic" : "normal";
                    this.deltaEl.style.textDecoration = tgtSettings.deltaUnderline.value ? "underline" : "none";
                    this.deltaEl.style.color = pillHex;
                    this.deltaEl.style.alignSelf = alignSelfFor(targetAlignVal);
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
                        value: (isPositive ? "+" : "-") + deltaText
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
                    // Fallback signal (action text: "band(latest,target) or
                    // directionColor(trend)") — when no Target measure
                    // drove the signal above, derive it from the
                    // sparkline's OWN last-vs-first trend direction,
                    // resolved through the SAME Positive/Negative Colour
                    // pickers (never a raw bandEngine hex) so the delta
                    // pill and the endpoint dot always agree when both are
                    // shown, and a user's custom colours still resolve.
                    if (isPositive === null) {
                        isPositive = sparkData[sparkData.length - 1] >= sparkData[0];
                        signalHex = isPositive ? resolvedPositive : resolvedNegative;
                    }

                    this.renderSparkline(
                        sparkData,
                        spkSettings.sparklineColor.value.value,
                        spkSettings.lineWidth.value,
                        spkSettings.showArea.value,
                        spkSettings.showAxisLabels.value ? categoryLabels : null,
                        categoryLabels,
                        sparklineCol.source.displayName,
                        displayUnits,
                        decimals,
                        sparklineCol.source.format,
                        {
                            signalHex: signalHex ?? spkSettings.sparklineColor.value.value,
                            direction: isPositive,
                            theme,
                            hc,
                        }
                    );
                }
            }

            // Corner-bracket card signature re-tint (created once in the
            // constructor) — shares the SAME signal token as the delta
            // pill/endpoint dot, falling back to the muted neutral when
            // neither a target nor a usable sparkline trend produced one.
            applyCardSignature(this.cornerSignature, this.formattingSettings.cardSignature, {
                autoHex: signalHex ?? "#8f8ab8",
                hcActive: hc.active,
                hcColor: hc.color,
                mirror: true,
                glowMix: hc.active ? 0 : (theme === "dark" ? 55 : 0),
                muted: false,
            });

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
        this.titleEl.style.display = "none";
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

        applyCardSignature(this.cornerSignature, this.formattingSettings?.cardSignature, { autoHex: "#8f8ab8", mirror: true, muted: true });
    }

    private formatValue(value: number, units: string, decimals: number, columnFormat?: string): string {
        // Map our settings to valueFormatter inputs.
        // - "none"   : Verbose system (always full number, locale separators, honors column format)
        // - "auto"   : DataLabels system, sample value lets it auto-pick K/M/B
        // - thousands/millions/billions : force the divisor via the sample value
        const forcedUnit: number | undefined = {
            thousands: 1e3,
            millions: 1e6,
            billions: 1e9,
        }[units];

        const systemType = units === "none"
            ? DisplayUnitSystemType.Verbose
            : DisplayUnitSystemType.DataLabels;

        const formatter = vf.create({
            format: columnFormat,
            value: forcedUnit !== undefined ? forcedUnit : value,
            precision: decimals,
            displayUnitSystemType: systemType,
        });
        return formatter.format(value);
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
        decimals: number,
        columnFormat: string | undefined,
        v3: { signalHex: string; direction: boolean | null; theme: Theme; hc: ReturnType<typeof applyHighContrast> }
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
            formatted: this.formatValue(v, displayUnits, decimals, columnFormat)
        }));

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(totalHeight));
        svg.setAttribute("viewBox", "0 0 " + width + " " + totalHeight);

        // v2 board look (Plan 16 — unified spark grammar, shared with
        // Sparkline Table): soft area fill under the line — showArea now
        // defaults ON (settings.ts) as part of that shared grammar, still
        // fully toggle-able (D-16). Uses the line's own configured colour
        // (`color`), never the v3 signal token — the line/area is the
        // user's chosen series colour; the signal token is reserved for
        // the endpoint dot / delta pill / corner bracket only.
        if (showArea) {
            const areaGen = area<number>()
                .x((_d, i) => xScale(i))
                .y0(sparkHeight - padding)
                .y1(d => yScale(d))
                .curve(curveMonotoneX);

            const areaPath = document.createElementNS(svgNs, "path");
            areaPath.setAttribute("d", areaGen(data) || "");
            areaPath.setAttribute("fill", v3.hc.active ? "none" : color);
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
        linePath.setAttribute("stroke", v3.hc.active ? v3.hc.color : color);
        linePath.setAttribute("stroke-width", String(strokeWidth));

        svg.appendChild(linePath);

        // v2 board look: min/max whisper ticks — short muted vertical
        // dashes marking the two extreme data points (skipped when the
        // series is flat, min===max, since neither point is meaningfully
        // "extreme"). Drawn BEFORE the endpoint dot so the dot paints on
        // top when the last point happens to also be the min or max.
        const minVal2 = Math.min(...data);
        const maxVal2 = Math.max(...data);
        if (minVal2 !== maxVal2 && !v3.hc.active) {
            const whiskerColor = surfaceTokens(v3.theme).muted;
            const minIdx = data.indexOf(minVal2);
            const maxIdx = data.indexOf(maxVal2);
            [minIdx, maxIdx].forEach((idx) => {
                const cx = xScale(idx);
                const cy = yScale(data[idx]);
                const tick = document.createElementNS(svgNs, "line");
                tick.setAttribute("x1", String(cx));
                tick.setAttribute("x2", String(cx));
                tick.setAttribute("y1", String(cy - 4));
                tick.setAttribute("y2", String(cy + 4));
                tick.setAttribute("stroke", whiskerColor);
                tick.setAttribute("stroke-width", "1");
                tick.setAttribute("opacity", "0.6");
                svg.appendChild(tick);
            });
        }

        // v2 board look: band/direction-tinted endpoint dot — the SAME
        // signal token as the delta pill and corner bracket (v3.signalHex),
        // marking the sparkline's latest (rightmost) point. Under HC, a
        // flat colour-filled dot is colour-only, so it renders as the
        // direction glyph (▲/▼) instead — see bandEngine's HC contract.
        const lastIdx = data.length - 1;
        const lastCx = xScale(lastIdx);
        const lastCy = yScale(data[lastIdx]);
        if (v3.hc.active) {
            const glyphText = document.createElementNS(svgNs, "text");
            glyphText.setAttribute("x", String(lastCx));
            glyphText.setAttribute("y", String(lastCy + 3));
            glyphText.setAttribute("text-anchor", "middle");
            glyphText.setAttribute("font-size", "10");
            glyphText.setAttribute("fill", v3.hc.color);
            glyphText.textContent = statusGlyph(v3.direction === false ? "down" : "up");
            svg.appendChild(glyphText);
        } else {
            const dot = document.createElementNS(svgNs, "circle");
            dot.setAttribute("cx", String(lastCx));
            dot.setAttribute("cy", String(lastCy));
            dot.setAttribute("r", "4");
            dot.setAttribute("fill", v3.signalHex);
            const glowMix = v3.theme === "dark" ? 55 : 0;
            if (glowMix > 0) {
                dot.style.filter = `drop-shadow(0 0 4px color-mix(in srgb, ${v3.signalHex} ${glowMix}%, transparent))`;
            }
            svg.appendChild(dot);
        }

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
        this.cornerSignature?.destroy();
        this.cornerSignature = null;
        while (this.sparklineContainer.firstChild) {
            this.sparklineContainer.removeChild(this.sparklineContainer.firstChild);
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
