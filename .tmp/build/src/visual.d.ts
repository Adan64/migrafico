import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private container;
    private formattingSettings;
    private formattingSettingsService;
    private vegaResult;
    private selectionManager;
    private host;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private buildSpec;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
