import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class DataPointCardSettings extends FormattingSettingsCard {
    barColor: formattingSettings.ColorPicker;
    textColor: formattingSettings.ColorPicker;
    positiveColor: formattingSettings.ColorPicker;
    negativeColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dataPointCard: DataPointCardSettings;
    cards: DataPointCardSettings[];
}
export {};
