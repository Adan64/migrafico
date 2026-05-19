"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import embed, { Result } from "vega-embed";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { VisualFormattingSettingsModel } from "./settings";

interface BarDatum {
    category: string;
    value: number;
    formattedValue: string;
    index: number;
    selectionId: ISelectionId;
    target: number | null;
    annotation: string | null;
    rank: number;
    rankLabel: string;
    status: "above" | "below" | "at" | "none";
    iconPrefix: string;
}

interface ComparisonDatum {
    x1: string;
    x2: string;
    val1: number;
    val2: number;
    maxVal: number;
    pct: number | null;
    direction: "up" | "down" | "neutral";
    label: string;
    diff: number;
    labelAbs: string;
}

interface VisualConfig {
    xShow: boolean; xFontColor: string; xFontSize: number;
    xIsBold: boolean; xIsItalic: boolean; xLabelAngle: number;
    yShowGridlines: boolean; yGridlineStyle: string;
    yFontColor: string; yFontSize: number;
    colBarColor: string; colAlternateColors: boolean;
    colAlternateBarColor: string; colPadding: number;
    lblShow: boolean; lblPosition: string; lblFontColor: string;
    lblFontSize: number; lblIsBold: boolean; lblIsItalic: boolean;
    lblShowFullNumbers: boolean;
    compShow: boolean; compPositiveColor: string; compNegativeColor: string;
    compLineThickness: number; compLineStyle: string; compSymbolStyle: string;
    compShowAbsoluteDiff: boolean;
    tgtShow: boolean; tgtFixedValue: number; tgtLineColor: string; tgtLineThickness: number; tgtLineStyle: string;
    tgtShowCompliancePct: boolean; tgtComplianceFontSize: number;
    tgtConditionalLabels: boolean; tgtAboveTargetColor: string; tgtBelowTargetColor: string;
    tgtShowConditionalIcon: boolean;
    rankShow: boolean; rankFontColor: string; rankFontSize: number; rankBadgeColor: string;
    alertShow: boolean; alertThreshold: number; alertFillColor: string;
    alertFillOpacity: number; alertAbove: boolean;
    annShow: boolean; annFontColor: string; annFontSize: number; annBackgroundColor: string;
}

export class Visual implements IVisual {
    private container: HTMLElement;
    private formattingSettings!: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private vegaResult: Result | null = null;
    private selectionManager: ISelectionManager;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = document.createElement("div");
        this.container.className = "visual-container";
        options.element.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews[0]
        );

        const dataView = options.dataViews?.[0];
        const categorical = dataView?.categorical;
        const categories = categorical?.categories?.[0];
        const measureSeries = categorical?.values?.find(v => v.source.roles?.["measure"]);
        const targetSeries  = categorical?.values?.find(v => v.source.roles?.["target"]);
        const annotationSeries = categorical?.values?.find(v => v.source.roles?.["annotation"]);

        // Manejo del estado sin datos
        if (!categorical || !categories || !measureSeries || !categories.values?.length || !measureSeries.values?.length) {
            // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
            this.container.innerHTML = `
                <div style="padding: 20px; text-align: center; font-family: 'Segoe UI', sans-serif; color: #777; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h3 style="margin-bottom: 8px;">Esperando datos</h3>
                    <p style="font-size: 14px; margin: 0;">Por favor, añade un campo en <b>Categoría</b> y un campo en <b>Valor</b> en el panel de datos.</p>
                </div>
            `;
            if (this.vegaResult) {
                this.vegaResult.view.finalize();
                this.vegaResult = null;
            }
            return;
        }

        const xAxis          = this.formattingSettings.xAxis;
        const yAxis          = this.formattingSettings.yAxis;
        const columns        = this.formattingSettings.columns;
        const dataLabels     = this.formattingSettings.dataLabels;
        const comparisonsCard  = this.formattingSettings.comparisons;
        const targetLineCard   = this.formattingSettings.targetLine;
        const rankingCard      = this.formattingSettings.ranking;
        const alertZoneCard    = this.formattingSettings.alertZone;
        const annotationsCard  = this.formattingSettings.annotations;

        const config: VisualConfig = {
            xShow: xAxis.show.value,
            xFontColor: xAxis.fontColor.value.value || "#999999",
            xFontSize: xAxis.fontSize.value,
            xIsBold: xAxis.isBold.value,
            xIsItalic: xAxis.isItalic.value,
            xLabelAngle: xAxis.labelAngle.value,

            yShowGridlines: yAxis.showGridlines.value,
            yGridlineStyle: yAxis.gridlineStyle.value.value as string,
            yFontColor: yAxis.fontColor.value.value || "#999999",
            yFontSize: yAxis.fontSize.value,

            colBarColor: columns.barColor.value.value || "#4A90D9",
            colAlternateColors: columns.alternateColors.value,
            colAlternateBarColor: columns.alternateBarColor.value.value || "#85C1E9",
            colPadding: Math.min(Math.max(columns.padding.value, 0), 95) / 100,

            lblShow: dataLabels.show.value,
            lblPosition: dataLabels.position.value.value as string,
            lblFontColor: dataLabels.fontColor.value.value || "#444444",
            lblFontSize: dataLabels.fontSize.value,
            lblIsBold: dataLabels.isBold.value,
            lblIsItalic: dataLabels.isItalic.value,
            lblShowFullNumbers: dataLabels.showFullNumbers.value,

            compShow: comparisonsCard.show.value,
            compPositiveColor: comparisonsCard.positiveColor.value.value || "#27ae60",
            compNegativeColor: comparisonsCard.negativeColor.value.value || "#e74c3c",
            compLineThickness: comparisonsCard.lineThickness.value,
            compLineStyle: comparisonsCard.lineStyle.value.value as string,
            compSymbolStyle: comparisonsCard.symbolStyle.value.value as string,
            compShowAbsoluteDiff: comparisonsCard.showAbsoluteDiff.value,

            tgtShow: targetLineCard.show.value,
            tgtFixedValue: targetLineCard.fixedValue.value,
            tgtLineColor: targetLineCard.lineColor.value.value || "#e74c3c",
            tgtLineThickness: targetLineCard.lineThickness.value,
            tgtLineStyle: targetLineCard.lineStyle.value.value as string,
            tgtShowCompliancePct: targetLineCard.showCompliancePct.value,
            tgtComplianceFontSize: targetLineCard.complianceFontSize.value,
            tgtConditionalLabels: targetLineCard.conditionalLabels.value,
            tgtAboveTargetColor: targetLineCard.aboveTargetColor.value.value || "#27ae60",
            tgtBelowTargetColor: targetLineCard.belowTargetColor.value.value || "#e74c3c",
            tgtShowConditionalIcon: targetLineCard.showConditionalIcon.value,

            rankShow: rankingCard.show.value,
            rankFontColor: rankingCard.fontColor.value.value || "#ffffff",
            rankFontSize: rankingCard.fontSize.value,
            rankBadgeColor: rankingCard.badgeColor.value.value || "#2c3e50",

            alertShow: alertZoneCard.show.value,
            alertThreshold: alertZoneCard.threshold.value,
            alertFillColor: alertZoneCard.fillColor.value.value || "#e74c3c",
            alertFillOpacity: Math.min(Math.max(alertZoneCard.fillOpacity.value, 0), 100),
            alertAbove: alertZoneCard.aboveThreshold.value,

            annShow: annotationsCard.show.value,
            annFontColor: annotationsCard.fontColor.value.value || "#555555",
            annFontSize: annotationsCard.fontSize.value,
            annBackgroundColor: annotationsCard.backgroundColor.value.value || "#fff9c4"
        };

        const formatNumber = (num: number, full: boolean) => {
            if (full) return num.toLocaleString();
            if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + "M";
            if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "k";
            return num.toString();
        };

        const toOrdinal = (r: number): string => {
            if (r === 1) return "1er";
            if (r === 2) return "2do";
            if (r === 3) return "3er";
            return `${r}°`;
        };

        const bars: BarDatum[] = categories.values
            .map((cat, i) => {
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories, i)
                    .createSelectionId();
                const val    = Number(measureSeries.values[i]) || 0;
                const target = targetSeries
                    ? (Number(targetSeries.values[i]) || null)
                    : (config.tgtFixedValue > 0 ? config.tgtFixedValue : null);
                const annRaw = annotationSeries ? String(annotationSeries.values[i] ?? "").trim() : "";
                const status: BarDatum["status"] = target !== null
                    ? val > target ? "above" : val < target ? "below" : "at"
                    : "none";
                const iconPrefix = config.tgtShowConditionalIcon && status !== "none"
                    ? status === "above" ? "✓" : status === "below" ? "✗" : "="
                    : "";
                return {
                    category: String(cat),
                    value: val,
                    formattedValue: formatNumber(val, config.lblShowFullNumbers),
                    index: i,
                    selectionId,
                    target,
                    annotation: annRaw || null,
                    rank: 0,
                    rankLabel: "",
                    status,
                    iconPrefix
                };
            })
            .filter(d => !isNaN(d.value));

        // Calcular ranking por valor descendente
        const sorted = [...bars].sort((a, b) => b.value - a.value);
        sorted.forEach((b, i) => {
            b.rank = i + 1;
            b.rankLabel = toOrdinal(i + 1);
        });

        const comparisons: ComparisonDatum[] = [];
        for (let i = 1; i < bars.length; i++) {
            const prev = bars[i - 1].value;
            const curr = bars[i].value;
            const pct  = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null;
            const diff = curr - prev;

            let prefix = "";
            if (pct !== null) {
                if (config.compSymbolStyle === "arrows")      prefix = pct >= 0 ? "▲" : "▼";
                else if (config.compSymbolStyle === "signs")  prefix = pct >= 0 ? "+" : "-";
                else if (config.compSymbolStyle === "arrows_thin") prefix = pct >= 0 ? "↑" : "↓";
            }

            const direction = pct === null ? "neutral" : pct >= 0 ? "up" : "down";
            const label    = pct === null ? "N/A" : `${prefix} ${Math.abs(pct).toFixed(0)}%`;
            const labelAbs = (diff >= 0 ? "+" : "") + formatNumber(diff, config.lblShowFullNumbers);

            comparisons.push({
                x1: bars[i - 1].category,
                x2: bars[i].category,
                val1: prev,
                val2: curr,
                maxVal: Math.max(prev, curr),
                pct,
                direction,
                label,
                diff,
                labelAbs
            });
        }

        const w = Math.max(options.viewport.width - 10, 10);
        const h = Math.max(options.viewport.height - 10, 10);
        const maxValue  = Math.max(...bars.map(b => b.value));
        const maxTarget = Math.max(...bars.map(b => b.target ?? 0));
        const yMax = Math.max(maxValue, maxTarget) > 0 ? Math.max(maxValue, maxTarget) * 1.50 : 10;

        // Actualización dinámica si el gráfico ya existe
        if (this.vegaResult) {
            const view = this.vegaResult.view;
            view.signal("width", w).signal("height", h).signal("yMax", yMax);
            for (const [key, value] of Object.entries(config)) {
                view.signal(key, value);
            }
            view.data("bars", bars).data("comparisons", comparisons).runAsync().catch(console.error);
            return;
        }

        const spec = this.buildSpec(bars, comparisons, w, h, yMax, config);
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        embed(this.container, spec as any, { actions: false, renderer: "svg" })
            .then(result => {
                this.vegaResult = result;
                result.view.addEventListener("click", (event, item) => {
                    if (item?.datum?.selectionId) {
                        const selectionId = item.datum.selectionId as ISelectionId;
                        const multiSelect = (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).shiftKey;
                        this.selectionManager.select(selectionId, multiSelect);
                    } else {
                        this.selectionManager.clear();
                    }
                });
            })
            .catch(console.error);
    }

    private buildSpec(
        bars: BarDatum[],
        comparisons: ComparisonDatum[],
        width: number,
        height: number,
        yMax: number,
        config: VisualConfig
    ): object {
        const signals: any[] = [
            { name: "yMax", value: yMax },
            { name: "bracketOffset", update: "lblFontSize * 3" }
        ];
        for (const [key, value] of Object.entries(config)) {
            signals.push({ name: key, value });
        }

        const strokeDashExpr = (signalName: string) =>
            `${signalName} === 'dashed' ? [6, 4] : ${signalName} === 'dotted' ? [2, 3] : []`;

        return {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width,
            height,
            padding: 5,
            autosize: { type: "fit", contains: "padding" },
            signals,

            data: [
                { name: "bars", values: bars },
                { name: "comparisons", values: comparisons }
            ],

            scales: [
                {
                    name: "x",
                    type: "band",
                    domain: { data: "bars", field: "category" },
                    range: "width",
                    paddingInner: { signal: "colPadding" },
                    paddingOuter: 0.1
                },
                {
                    name: "y",
                    type: "linear",
                    domain: [0, { signal: "yMax" }],
                    range: "height",
                    nice: true
                }
            ],

            axes: [
                {
                    orient: "bottom",
                    scale: "x",
                    domainOpacity: { signal: "xShow ? 1 : 0" },
                    labelOpacity: { signal: "xShow ? 1 : 0" },
                    tickOpacity: { signal: "xShow ? 1 : 0" },
                    labelAngle: { signal: "xLabelAngle" },
                    labelOverlap: true,
                    labelColor: { signal: "xFontColor" },
                    labelFontSize: { signal: "xFontSize" },
                    labelFontWeight: { signal: "xIsBold ? 'bold' : 'normal'" },
                    labelFontStyle: { signal: "xIsItalic ? 'italic' : 'normal'" },
                    labelFont: "Segoe UI, sans-serif"
                },
                {
                    orient: "left",
                    scale: "y",
                    grid: true,
                    gridOpacity: { signal: "yShowGridlines ? 1 : 0" },
                    gridDash: { signal: strokeDashExpr("yGridlineStyle") },
                    gridColor: "#eee",
                    tickCount: 4,
                    labelColor: { signal: "yFontColor" },
                    labelFontSize: { signal: "yFontSize" },
                    labelFont: "Segoe UI, sans-serif",
                    format: { signal: "lblShowFullNumbers ? ',' : '~s'" }
                }
            ],

            marks: [
                // F5: Zona de alerta (fondo, antes de barras)
                {
                    type: "rect",
                    encode: {
                        update: {
                            x: { value: 0 },
                            x2: { signal: "width" },
                            y: { signal: "alertAbove ? 0 : scale('y', alertThreshold)" },
                            y2: { signal: "alertAbove ? scale('y', alertThreshold) : height" },
                            fill: { signal: "alertFillColor" },
                            fillOpacity: { signal: "alertShow ? alertFillOpacity / 100 : 0" }
                        }
                    }
                },

                // Barras
                {
                    type: "rect",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            cornerRadiusTopLeft: { value: 4 },
                            cornerRadiusTopRight: { value: 4 }
                        },
                        update: {
                            x: { scale: "x", field: "category" },
                            width: { scale: "x", band: 1 },
                            y: { scale: "y", field: "value" },
                            y2: { scale: "y", value: 0 },
                            fill: { signal: "colAlternateColors && (datum.index % 2 === 1) ? colAlternateBarColor : colBarColor" },
                            fillOpacity: { value: 1 },
                            tooltip: { signal: "{'Categoría': datum.category, 'Valor': datum.formattedValue}" }
                        },
                        hover: { fillOpacity: { value: 0.8 } }
                    }
                },

                // F4: Badge de ranking ENCIMA de la barra (rect fondo)
                {
                    type: "rect",
                    from: { data: "bars" },
                    encode: {
                        update: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2 - 16" },
                            y: { signal: "scale('y', datum.value) - 20" },
                            width: { value: 32 },
                            height: { value: 16 },
                            fill: { signal: "rankBadgeColor" },
                            cornerRadius: { value: 3 },
                            opacity: { signal: "rankShow ? 1 : 0" }
                        }
                    }
                },

                // F4: Badge de ranking (texto)
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "middle" },
                            fontWeight: { value: "bold" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.value) - 12" },
                            text: { field: "rankLabel" },
                            fill: { signal: "rankFontColor" },
                            fontSize: { signal: "rankFontSize" },
                            opacity: { signal: "rankShow ? 1 : 0" }
                        }
                    }
                },

                // F2: Línea de meta (rule por barra)
                {
                    type: "rule",
                    from: { data: "bars" },
                    encode: {
                        update: {
                            x: { scale: "x", field: "category" },
                            x2: { signal: "scale('x', datum.category) + bandwidth('x')" },
                            y: { signal: "datum.target !== null ? scale('y', datum.target) : -9999" },
                            stroke: { signal: "tgtLineColor" },
                            strokeWidth: { signal: "tgtLineThickness" },
                            strokeDash: { signal: strokeDashExpr("tgtLineStyle") },
                            opacity: { signal: "tgtShow && datum.target !== null ? 1 : 0" }
                        }
                    }
                },

                // F2: % Cumplimiento sobre la línea de meta
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            fontWeight: { value: "600" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "datum.target !== null ? scale('y', datum.target) - 3 : -9999" },
                            text: { signal: "tgtShowCompliancePct && datum.target !== null && datum.target !== 0 ? round(datum.value / datum.target * 100) + '%' : ''" },
                            fill: { signal: "tgtLineColor" },
                            fontSize: { signal: "tgtComplianceFontSize" },
                            opacity: { signal: "tgtShow && tgtShowCompliancePct && datum.target !== null ? 1 : 0" }
                        }
                    }
                },

                // Línea horizontal del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        update: {
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: strokeDashExpr("compLineStyle") },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - bracketOffset" },
                            stroke: { signal: "datum.direction === 'neutral' ? '#888888' : (datum.direction === 'up' ? compPositiveColor : compNegativeColor)" }
                        }
                    }
                },

                // Línea vertical izquierda del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        update: {
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: strokeDashExpr("compLineStyle") },
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val1)" },
                            y2: { signal: "scale('y', datum.maxVal) - bracketOffset" },
                            stroke: { signal: "datum.direction === 'neutral' ? '#888888' : (datum.direction === 'up' ? compPositiveColor : compNegativeColor)" }
                        }
                    }
                },

                // Línea vertical derecha del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        update: {
                            opacity: { signal: "compShow ? 1 : 0" },
                            strokeWidth: { signal: "compLineThickness" },
                            strokeDash: { signal: strokeDashExpr("compLineStyle") },
                            x: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.val2)" },
                            y2: { signal: "scale('y', datum.maxVal) - bracketOffset" },
                            stroke: { signal: "datum.direction === 'neutral' ? '#888888' : (datum.direction === 'up' ? compPositiveColor : compNegativeColor)" }
                        }
                    }
                },

                // Fondo blanco para etiqueta de valor (evita que línea del bracket la tache)
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            stroke: { value: "#ffffff" },
                            strokeWidth: { value: 4 },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            opacity: { signal: "lblShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            fontWeight: { signal: "lblIsBold ? 'bold' : 'normal'" },
                            fontStyle: { signal: "lblIsItalic ? 'italic' : 'normal'" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "lblPosition === 'inside' ? scale('y', datum.value) + 14 : scale('y', datum.value) - 6" },
                            text: { signal: "datum.iconPrefix ? datum.iconPrefix + ' ' + datum.formattedValue : datum.formattedValue" }
                        }
                    }
                },

                // F3: Etiqueta de valor con colores condicionales
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            opacity: { signal: "lblShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            fontWeight: { signal: "lblIsBold ? 'bold' : 'normal'" },
                            fontStyle: { signal: "lblIsItalic ? 'italic' : 'normal'" },
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "lblPosition === 'inside' ? scale('y', datum.value) + 14 : scale('y', datum.value) - 6" },
                            text: { signal: "datum.iconPrefix ? datum.iconPrefix + ' ' + datum.formattedValue : datum.formattedValue" },
                            fill: { signal: "tgtConditionalLabels && datum.status !== 'none' ? (datum.status === 'above' ? tgtAboveTargetColor : datum.status === 'below' ? tgtBelowTargetColor : '#888888') : lblFontColor" }
                        }
                    }
                },

                // F1: Etiqueta % del bracket
                {
                    type: "text",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            fontWeight: { value: "600" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            opacity: { signal: "compShow ? 1 : 0" },
                            fontSize: { signal: "lblFontSize" },
                            x: { signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2" },
                            y: { signal: "scale('y', datum.maxVal) - bracketOffset - 5" },
                            text: { field: "label" },
                            fill: { signal: "datum.direction === 'neutral' ? '#888888' : (datum.direction === 'up' ? compPositiveColor : compNegativeColor)" }
                        }
                    }
                },

                // F1: Diferencia absoluta ENCIMA del % (una línea más arriba)
                {
                    type: "text",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            opacity: { signal: "compShow && compShowAbsoluteDiff ? 1 : 0" },
                            fontSize: { signal: "lblFontSize - 1" },
                            x: { signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2" },
                            y: { signal: "scale('y', datum.maxVal) - bracketOffset - 5 - lblFontSize" },
                            text: { field: "labelAbs" },
                            fill: { signal: "datum.direction === 'neutral' ? '#888888' : (datum.direction === 'up' ? compPositiveColor : compNegativeColor)" }
                        }
                    }
                },

                // F6: Fondo de anotación
                {
                    type: "rect",
                    from: { data: "bars" },
                    encode: {
                        update: {
                            x: { signal: "scale('x', datum.category) + 2" },
                            x2: { signal: "scale('x', datum.category) + bandwidth('x') - 2" },
                            y: { signal: "scale('y', 0) - 20" },
                            y2: { signal: "scale('y', 0) - 2" },
                            fill: { signal: "annBackgroundColor" },
                            cornerRadius: { value: 2 },
                            opacity: { signal: "annShow && datum.annotation !== null ? 0.9 : 0" }
                        }
                    }
                },

                // F6: Texto de anotación (con límite de ancho para no desbordar)
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            align: { value: "center" },
                            baseline: { value: "middle" },
                            font: { value: "Segoe UI, sans-serif" }
                        },
                        update: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', 0) - 11" },
                            text: { field: "annotation" },
                            fill: { signal: "annFontColor" },
                            fontSize: { signal: "annFontSize" },
                            limit: { signal: "max(bandwidth('x') - 6, 10)" },
                            opacity: { signal: "annShow && datum.annotation !== null ? 1 : 0" }
                        }
                    }
                }
            ]
        };
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
