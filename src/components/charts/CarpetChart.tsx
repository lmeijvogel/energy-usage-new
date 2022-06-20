import * as d3 from "d3";
import { getDaysInMonth } from "date-fns";

import { useEffect } from "react";
import { GraphDescription } from "../../models/GraphDescription";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { PeriodDescription } from "../../models/PeriodDescription";
import { UsageField } from "../../models/UsageData";

type Props = {
    width: number;
    height: number;
    entries: MeasurementEntry[];
    fieldName: UsageField;
    periodDescription: PeriodDescription;
    graphDescription: GraphDescription;
};

export function CarpetChart({ width, height, entries, fieldName, periodDescription, graphDescription }: Props) {
    const padding = 30;

    const cellWidth = (width - 2 * padding) / 31;
    const cellHeight = (height - 2 * padding) / 24;

    const dayPadding = 1;

    useEffect(() => {
        drawGraph(entries);
    }, [entries]);

    const drawGraph = (entries: MeasurementEntry[]) => {
        const data = entries.map((value) => truncate(value[fieldName], 3));

        const max: number = Math.max(...data.filter(isDefined));

        const colorScale = d3
            .scaleLinear()
            .domain([0, max])
            .range(["white", graphDescription.barColor as any]);

        const svg = d3.select(`#svg_carpet_${fieldName}`);
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        svg.attr("width", width).attr("height", height);

        const graph = svg.select(".graph");
        graph.html("");

        const maxData = d3.max(data) ?? 0;

        if (periodDescription.periodSize === "month") {
            for (let day = 1; day <= getDaysInMonth(periodDescription.startOfPeriod()); day++) {
                const dayMeasurements = entries.filter((entry) => entry.day === day);

                for (let hour = 0; hour < 24; hour++) {
                    const entry = dayMeasurements.find((m) => m.hour === hour);

                    const value = entry ? entry[fieldName] : 0;

                    drawSquare(day, hour, value, maxData, colorScale, svg);
                }
            }
        }
    };

    const drawSquare = (
        day: number,
        hour: number,
        value: number,
        maxValue: number,
        colorScale: d3.ScaleLinear<number, number, never>,
        graph: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    ) => {
        const color = !!value ? colorScale(value) : "white";

        graph
            .append("rect")
            .attr("x", padding + day * cellWidth)
            .attr("y", padding + hour * cellHeight)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("fill", color);
        // .attr("stroke-width", dataIsZero ? 0.5 : 0)
        // .attr("stroke", "#888");
    };

    return (
        <div className="radialGraphContainer">
            <svg id={`svg_carpet_${fieldName}`}>
                <g className="graph" />
            </svg>
        </div>
    );
}

function truncate(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

function isDefined<T>(x: T): x is T {
    return x !== undefined && x !== null;
}
