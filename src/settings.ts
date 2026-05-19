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
    showAbsoluteDiff = new formattingSettings.ToggleSwitch({ name: "showAbsoluteDiff", displayName: "Mostrar diferencia absoluta", value: true });

    name: string = "comparisons";
    displayName: string = "Comparaciones";
    slices: Array<FormattingSettingsSlice> = [this.show, this.positiveColor, this.negativeColor, this.lineThickness, this.lineStyle, this.symbolStyle, this.showAbsoluteDiff];
}

class TargetLineSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar línea de meta", value: true });
    fixedValue = new formattingSettings.NumUpDown({ name: "fixedValue", displayName: "Meta fija (si no hay campo)", value: 0 });
    lineColor = new formattingSettings.ColorPicker({ name: "lineColor", displayName: "Color de línea", value: { value: "#e74c3c" } });
    lineThickness = new formattingSettings.NumUpDown({ name: "lineThickness", displayName: "Grosor", value: 2 });
    lineStyle = new formattingSettings.ItemDropdown({
        name: "lineStyle",
        displayName: "Estilo de línea",
        items: [
            { value: "solid", displayName: "Sólida" },
            { value: "dashed", displayName: "Discontinua" },
            { value: "dotted", displayName: "Punteada" }
        ],
        value: { value: "dashed", displayName: "Discontinua" }
    });
    showCompliancePct = new formattingSettings.ToggleSwitch({ name: "showCompliancePct", displayName: "Mostrar % cumplimiento", value: true });
    complianceFontSize = new formattingSettings.NumUpDown({ name: "complianceFontSize", displayName: "Tamaño fuente cumplimiento", value: 10 });
    conditionalLabels = new formattingSettings.ToggleSwitch({ name: "conditionalLabels", displayName: "Etiquetas condicionales", value: false });
    aboveTargetColor = new formattingSettings.ColorPicker({ name: "aboveTargetColor", displayName: "Color si supera meta", value: { value: "#27ae60" } });
    belowTargetColor = new formattingSettings.ColorPicker({ name: "belowTargetColor", displayName: "Color si baja de meta", value: { value: "#e74c3c" } });
    showConditionalIcon = new formattingSettings.ToggleSwitch({ name: "showConditionalIcon", displayName: "Mostrar ícono (✓/✗/=)", value: false });

    name: string = "targetLine";
    displayName: string = "Línea de meta";
    slices: Array<FormattingSettingsSlice> = [
        this.show, this.fixedValue, this.lineColor, this.lineThickness, this.lineStyle,
        this.showCompliancePct, this.complianceFontSize,
        this.conditionalLabels, this.aboveTargetColor, this.belowTargetColor, this.showConditionalIcon
    ];
}

class RankingSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar ranking", value: true });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Color de texto", value: { value: "#ffffff" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Tamaño de fuente", value: 10 });
    badgeColor = new formattingSettings.ColorPicker({ name: "badgeColor", displayName: "Color de badge", value: { value: "#2c3e50" } });

    name: string = "ranking";
    displayName: string = "Ranking";
    slices: Array<FormattingSettingsSlice> = [this.show, this.fontColor, this.fontSize, this.badgeColor];
}

class AlertZoneSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar zona de alerta", value: true });
    threshold = new formattingSettings.NumUpDown({ name: "threshold", displayName: "Umbral", value: 100 });
    fillColor = new formattingSettings.ColorPicker({ name: "fillColor", displayName: "Color de zona", value: { value: "#e74c3c" } });
    fillOpacity = new formattingSettings.NumUpDown({ name: "fillOpacity", displayName: "Opacidad (0-100)", value: 15 });
    aboveThreshold = new formattingSettings.ToggleSwitch({ name: "aboveThreshold", displayName: "Sombrear por encima", value: false });

    name: string = "alertZone";
    displayName: string = "Zona de alerta";
    slices: Array<FormattingSettingsSlice> = [this.show, this.threshold, this.fillColor, this.fillOpacity, this.aboveThreshold];
}

class AnnotationsSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({ name: "show", displayName: "Mostrar anotaciones", value: true });
    fontColor = new formattingSettings.ColorPicker({ name: "fontColor", displayName: "Color de texto", value: { value: "#555555" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Tamaño de fuente", value: 10 });
    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Color de fondo", value: { value: "#fff9c4" } });

    name: string = "annotations";
    displayName: string = "Anotaciones";
    slices: Array<FormattingSettingsSlice> = [this.show, this.fontColor, this.fontSize, this.backgroundColor];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    xAxis = new XAxisSettings();
    yAxis = new YAxisSettings();
    columns = new ColumnsSettings();
    dataLabels = new DataLabelsSettings();
    comparisons = new ComparisonsSettings();
    targetLine = new TargetLineSettings();
    ranking = new RankingSettings();
    alertZone = new AlertZoneSettings();
    annotations = new AnnotationsSettings();

    cards = [
        this.xAxis, this.yAxis, this.columns, this.dataLabels, this.comparisons,
        this.targetLine, this.ranking, this.alertZone, this.annotations
    ];
}
