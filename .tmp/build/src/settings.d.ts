import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class XAxisSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    isBold: formattingSettings.ToggleSwitch;
    isItalic: formattingSettings.ToggleSwitch;
    labelAngle: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class YAxisSettings extends FormattingSettingsCard {
    showGridlines: formattingSettings.ToggleSwitch;
    gridlineStyle: formattingSettings.ItemDropdown;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class ColumnsSettings extends FormattingSettingsCard {
    barColor: formattingSettings.ColorPicker;
    alternateColors: formattingSettings.ToggleSwitch;
    alternateBarColor: formattingSettings.ColorPicker;
    padding: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class DataLabelsSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    position: formattingSettings.ItemDropdown;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    isBold: formattingSettings.ToggleSwitch;
    isItalic: formattingSettings.ToggleSwitch;
    showFullNumbers: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class ComparisonsSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    positiveColor: formattingSettings.ColorPicker;
    negativeColor: formattingSettings.ColorPicker;
    lineThickness: formattingSettings.NumUpDown;
    lineStyle: formattingSettings.ItemDropdown;
    symbolStyle: formattingSettings.ItemDropdown;
    showAbsoluteDiff: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class TargetLineSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    lineColor: formattingSettings.ColorPicker;
    lineThickness: formattingSettings.NumUpDown;
    lineStyle: formattingSettings.ItemDropdown;
    showCompliancePct: formattingSettings.ToggleSwitch;
    complianceFontSize: formattingSettings.NumUpDown;
    conditionalLabels: formattingSettings.ToggleSwitch;
    aboveTargetColor: formattingSettings.ColorPicker;
    belowTargetColor: formattingSettings.ColorPicker;
    showConditionalIcon: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class RankingSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    badgeColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class AlertZoneSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    threshold: formattingSettings.NumUpDown;
    fillColor: formattingSettings.ColorPicker;
    fillOpacity: formattingSettings.NumUpDown;
    aboveThreshold: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
declare class AnnotationsSettings extends FormattingSettingsCard {
    show: formattingSettings.ToggleSwitch;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    backgroundColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    xAxis: XAxisSettings;
    yAxis: YAxisSettings;
    columns: ColumnsSettings;
    dataLabels: DataLabelsSettings;
    comparisons: ComparisonsSettings;
    targetLine: TargetLineSettings;
    ranking: RankingSettings;
    alertZone: AlertZoneSettings;
    annotations: AnnotationsSettings;
    cards: (XAxisSettings | YAxisSettings | ColumnsSettings | DataLabelsSettings | ComparisonsSettings | TargetLineSettings | RankingSettings | AlertZoneSettings | AnnotationsSettings)[];
}
export {};
