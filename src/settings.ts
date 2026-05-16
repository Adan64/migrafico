"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class XAxisSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar Eje X", value: true });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Color de texto", value: { value: "#999999" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Tamaño de fuente", value: 11 });
    isBold = new formattingSettings.ToggleSwitch({ name: "isBold", displayName: "Negrita", value: false });
    isItalic = new formattingSettings.ToggleSwitch({ name: "isItalic", displayName: "Cursiva", value: false });
    labelAngle = new formattingSettings.NumUpDown({ name: "labelAngle", displayName: "Inclinación (°)", value: 0 });

    name: string = "xAxis";
    displayName: string = "Eje X";
    slices: Array<FormattingSettingsSlice> = [this.show, this.fontColor, this.fontSize, this.isBold, this.isItalic, this.labelAngle];
}

class YAxisSettings extends FormattingSettingsCard {
    showGridlines = new formattingSettings.ToggleSwitch({ name: "showGridlines", displayName: "Mostrar Cuadrícula", value: true });
    gridlineStyle = new formattingSettings.ItemDropdown({
        name: "gridlineStyle",
        displayName: "Estilo de cuadrícula",
        items: [
            { value: "solid", displayName: "Sólida" },
            { value: "dashed", displayName: "Discontinua" },
            { value: "dotted", displayName: "Punteada" }
        ],
        value: { value: "solid", displayName: "Sólida" }
    });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Color de texto", value: { value: "#999999" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Tamaño de fuente", value: 11 });

    name: string = "yAxis";
    displayName: string = "Eje Y";
    slices: Array<FormattingSettingsSlice> = [this.showGridlines, this.gridlineStyle, this.fontColor, this.fontSize];
}

class ColumnsSettings extends FormattingSettingsCard {
    barColor = new formattingSettings.ColorPicker({ name: "barColor", displayName: "Color principal", value: { value: "#4A90D9" } });
    alternateColors = new formattingSettings.ToggleSwitch({ name: "alternateColors", displayName: "Intercalar colores", value: false });
    alternateBarColor = new formattingSettings.ColorPicker({ name: "alternateBarColor", displayName: "Color alterno", value: { value: "#85C1E9" } });
    padding = new formattingSettings.NumUpDown({ name: "padding", displayName: "Espaciado (%)", value: 20 });

    name: string = "columns";
    displayName: string = "Columnas";
    slices: Array<FormattingSettingsSlice> = [this.barColor, this.alternateColors, this.alternateBarColor, this.padding];
}

class DataLabelsSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar Etiquetas", value: true });
    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Posición",
        items: [
            { value: "outside", displayName: "Exterior superior" },
            { value: "inside", displayName: "Interior superior" }
        ],
        value: { value: "outside", displayName: "Exterior superior" }
    });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Color de texto", value: { value: "#444444" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Tamaño de fuente", value: 11 });
    isBold = new formattingSettings.ToggleSwitch({ name: "isBold", displayName: "Negrita", value: false });
    isItalic = new formattingSettings.ToggleSwitch({ name: "isItalic", displayName: "Cursiva", value: false });
    showFullNumbers = new formattingSettings.ToggleSwitch({ name: "showFullNumbers", displayName: "Mostrar números exactos", value: false });

    name: string = "dataLabels";
    displayName: string = "Etiquetas de datos";
    slices: Array<FormattingSettingsSlice> = [this.show, this.position, this.fontColor, this.fontSize, this.isBold, this.isItalic, this.showFullNumbers];
}

class ComparisonsSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar Comparaciones", value: true });
    positiveColor = new formattingSettings.ColorPicker({ name: "positiveColor", displayName: "Color positivo", value: { value: "#27ae60" } });
    negativeColor = new formattingSettings.ColorPicker({ name: "negativeColor", displayName: "Color negativo", value: { value: "#e74c3c" } });
    lineThickness = new formattingSettings.NumUpDown({ name: "lineThickness", displayName: "Grosor de líneas", value: 1.5 });
    lineStyle = new formattingSettings.ItemDropdown({
        name: "lineStyle",
        displayName: "Estilo de líneas",
        items: [
            { value: "solid", displayName: "Sólida" },
            { value: "dashed", displayName: "Discontinua" },
            { value: "dotted", displayName: "Punteada" }
        ],
        value: { value: "solid", displayName: "Sólida" }
    });
    symbolStyle = new formattingSettings.ItemDropdown({
        name: "symbolStyle",
        displayName: "Estilo de símbolo",
        items: [
            { value: "arrows", displayName: "▲ / ▼" },
            { value: "signs", displayName: "+ / -" },
            { value: "arrows_thin", "displayName": "↑ / ↓" }
        ],
        value: { value: "arrows", displayName: "▲ / ▼" }
    });

    name: string = "comparisons";
    displayName: string = "Comparaciones";
    slices: Array<FormattingSettingsSlice> = [this.show, this.positiveColor, this.negativeColor, this.lineThickness, this.lineStyle, this.symbolStyle];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    xAxis = new XAxisSettings();
    yAxis = new YAxisSettings();
    columns = new ColumnsSettings();
    dataLabels = new DataLabelsSettings();
    comparisons = new ComparisonsSettings();

    cards = [this.xAxis, this.yAxis, this.columns, this.dataLabels, this.comparisons];
}
