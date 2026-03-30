import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private host;
    private eventService;
    private selectionManager;
    private tooltipService;
    private colorPalette;
    private localizationManager;
    private isHighContrast;
    private formattingSettings;
    private formattingSettingsService;
    private container;
    private valueEl;
    private labelEl;
    private deltaEl;
    private sparklineContainer;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private renderEmpty;
    private formatValue;
    private renderSparkline;
    destroy(): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
