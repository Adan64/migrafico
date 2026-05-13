"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import embed, { Result } from "vega-embed";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

interface BarDatum {
    category: string;
    value: number;
}

interface ComparisonDatum {
    x1: string;
    x2: string;
    maxVal: number;
    pct: number;
    direction: "up" | "down";
    label: string;
}

export class Visual implements IVisual {
    private container: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private vegaResult: Result | null = null;

    constructor(options: VisualConstructorOptions) {
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
        if (!dataView?.categorical) return;

        const categorical = dataView.categorical;
        const categories = categorical.categories?.[0]?.values ?? [];
        const values = categorical.values?.[0]?.values ?? [];
        if (categories.length === 0) return;

        const bars: BarDatum[] = categories
            .map((cat, i) => ({ category: String(cat), value: Number(values[i]) || 0 }))
            .filter(d => d.value !== null && !isNaN(d.value));

        const comparisons: ComparisonDatum[] = [];
        for (let i = 1; i < bars.length; i++) {
            const prev = bars[i - 1].value;
            const curr = bars[i].value;
            const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
            comparisons.push({
                x1: bars[i - 1].category,
                x2: bars[i].category,
                maxVal: Math.max(prev, curr),
                pct,
                direction: pct >= 0 ? "up" : "down",
                label: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}%`
            });
        }

        const { width, height } = options.viewport;
        const barColor = this.formattingSettings.dataPointCard.barColor.value.value || "#4A90D9";
        const maxValue = Math.max(...bars.map(b => b.value));

        const spec = this.buildSpec(bars, comparisons, width, height, maxValue * 1.35, barColor);

        if (this.vegaResult) {
            this.vegaResult.view.finalize();
            this.vegaResult = null;
        }
        this.container.innerHTML = "";

        embed(this.container, spec as any, { actions: false, renderer: "svg" })
            .then(result => { this.vegaResult = result; })
            .catch(console.error);
    }

    private buildSpec(
        bars: BarDatum[],
        comparisons: ComparisonDatum[],
        width: number,
        height: number,
        yMax: number,
        barColor: string
    ): object {
        const pad = { left: 40, right: 12, top: 16, bottom: 36 };
        const w = Math.max(width - pad.left - pad.right, 10);
        const h = Math.max(height - pad.top - pad.bottom, 10);

        return {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width: w,
            height: h,
            padding: pad,
            background: null,

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
                    paddingInner: 0.35,
                    paddingOuter: 0.15
                },
                {
                    name: "y",
                    type: "linear",
                    domain: [0, yMax],
                    range: "height",
                    reverse: true
                }
            ],

            axes: [
                {
                    orient: "bottom",
                    scale: "x",
                    domain: false,
                    ticks: false,
                    labelPadding: 8,
                    labelColor: "#555",
                    labelFontSize: 12,
                    labelFont: "Segoe UI, sans-serif"
                },
                {
                    orient: "left",
                    scale: "y",
                    domain: false,
                    ticks: false,
                    grid: true,
                    gridDash: [3, 3],
                    gridColor: "#e8e8e8",
                    tickCount: 4,
                    labelColor: "#999",
                    labelFontSize: 11,
                    labelFont: "Segoe UI, sans-serif",
                    format: "~s"
                }
            ],

            marks: [
                // Barras
                {
                    type: "rect",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            x: { scale: "x", field: "category" },
                            width: { scale: "x", band: 1 },
                            y: { scale: "y", field: "value" },
                            y2: { scale: "y", value: 0 },
                            fill: { value: barColor },
                            cornerRadiusTopLeft: { value: 4 },
                            cornerRadiusTopRight: { value: 4 }
                        },
                        hover: { fillOpacity: { value: 0.8 } },
                        update: { fillOpacity: { value: 1 } }
                    }
                },

                // Etiqueta de valor sobre cada barra
                {
                    type: "text",
                    from: { data: "bars" },
                    encode: {
                        enter: {
                            x: { signal: "scale('x', datum.category) + bandwidth('x') / 2" },
                            y: { scale: "y", field: "value", offset: -6 },
                            text: { field: "value" },
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            fill: { value: "#444" },
                            fontSize: { value: 11 },
                            font: { value: "Segoe UI, sans-serif" }
                        }
                    }
                },

                // Línea horizontal del bracket entre barras
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" },
                            strokeWidth: { value: 1.5 }
                        }
                    }
                },

                // Tick vertical izquierdo del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            x: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x1) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 14" },
                            y2: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" },
                            strokeWidth: { value: 1.5 }
                        }
                    }
                },

                // Tick vertical derecho del bracket
                {
                    type: "rule",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            x: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            x2: { signal: "scale('x', datum.x2) + bandwidth('x') / 2" },
                            y: { signal: "scale('y', datum.maxVal) - 14" },
                            y2: { signal: "scale('y', datum.maxVal) - 22" },
                            stroke: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" },
                            strokeWidth: { value: 1.5 }
                        }
                    }
                },

                // Etiqueta de porcentaje (▲/▼ + %)
                {
                    type: "text",
                    from: { data: "comparisons" },
                    encode: {
                        enter: {
                            x: {
                                signal: "(scale('x', datum.x1) + bandwidth('x') / 2 + scale('x', datum.x2) + bandwidth('x') / 2) / 2"
                            },
                            y: { signal: "scale('y', datum.maxVal) - 26" },
                            text: { field: "label" },
                            align: { value: "center" },
                            baseline: { value: "bottom" },
                            fill: { signal: "datum.direction === 'up' ? '#27ae60' : '#e74c3c'" },
                            fontSize: { value: 11 },
                            fontWeight: { value: "600" },
                            font: { value: "Segoe UI, sans-serif" }
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
