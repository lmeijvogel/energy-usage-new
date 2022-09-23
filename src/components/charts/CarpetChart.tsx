import classNames from "classnames";
import * as d3 from "d3";
import {
    addHours,
    differenceInDays,
    endOfToday,
    format,
    isMonday,
    isSaturday,
    set,
    startOfDay,
    startOfToday
} from "date-fns";

import { useEffect, useRef } from "react";
import { GraphDescription } from "../../models/GraphDescription";
import { MeasurementEntry } from "../../models/MeasurementEntry";
import { PeriodDescription } from "../../models/PeriodDescription";

type Props = {
    className?: string;
    width: number;
    height: number;
    entries: MeasurementEntry[];
    periodDescription: PeriodDescription;
    graphDescription: GraphDescription;
};

const borderGrey = "#ccc";
type MySvgType = d3.Selection<SVGSVGElement, unknown, null, undefined>;

export function CarpetChart({ className, width, height, entries, periodDescription, graphDescription }: Props) {
    const padding = 30;
    const axisWidth = 40;

    let numberOfRows: number = 20;
    let numberOfColumns: number = 20;

    let cellWidth: number = 10;
    let cellHeight: number = 10;

    useEffect(() => {
        if (periodDescription.periodSize === "month") {
            numberOfColumns = 30;
            numberOfRows = 24;
        } else {
            numberOfRows = 12;
            numberOfColumns = 30;
        }
        cellWidth = (width - 2 * padding - axisWidth) / numberOfColumns;
        cellHeight = (height - 2 * padding) / numberOfRows;
    }, [periodDescription]);

    const dayPadding = 0;

    useEffect(() => {
        const element = svgRef.current;

        if (element === null) return;

        const svg: MySvgType = d3.select(element);

        drawGraph(entries, svg);
    }, [entries]);

    const svgRef = useRef<SVGSVGElement>(null);

    const drawGraph = (entries: MeasurementEntry[], svg: MySvgType) => {
        const data = entries.map((entry) => truncate(entry.value, 3));

        const max: number = Math.max(...data.filter(isDefined));

        const colorScale = d3
            .scaleLinear()
            .domain([0, max])
            .range(["white", graphDescription.barColor as any]);

        svg.attr("class", classNames(className));
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const graph = svg.select(".values");
        graph.attr("width", width).attr("height", height);

        graph
            .append("rect")
            .attr("x", padding + axisWidth)
            .attr("y", padding)
            .attr("width", width - 2 * padding - axisWidth)
            .attr("height", height - 2 * padding)
            .attr("fill", "none")
            .attr("stroke", borderGrey)
            .attr("stroke-width", "1px");

        const axisContainer = svg.select("g.axes");

        axisContainer.attr("transform", `translate(${padding + axisWidth}, 0)`).style("font-size", "10pt");

        if (entries.length === 0) {
            return;
        }

        /* The `cellWidth / 2` is there to make the scale return the centerpoints of
         * the squares. We can then offset the squares so they end up in the right place.
         */
        let scaleX: d3.ScaleTime<number, number, never> | d3.ScaleLinear<number, number, never>;
        let scaleY: d3.ScaleTime<number, number, never> | d3.ScaleLinear<number, number, never>;

        switch (periodDescription.periodSize) {
            case "month":
                scaleX = d3
                    .scaleTime()
                    .domain([startOfDay(entries[0].timestamp), startOfToday()])
                    .range([padding + axisWidth + cellWidth / 2, width - padding - cellWidth / 2]);

                scaleY = d3
                    .scaleTime()
                    .domain([startOfToday(), endOfToday()])
                    .range([height - padding, padding]);

                let lastDate: number | undefined;

                for (const entry of entries) {
                    if (entry.timestamp.getDate() !== lastDate) {
                        drawWeekendMarker(entry.timestamp, scaleX, graph!);
                        lastDate = entry.timestamp.getDate();
                    }

                    drawHourSquare(
                        entry,
                        colorScale,
                        scaleX,
                        scaleY as d3.ScaleTime<number, number, never>,
                        svg,
                        graph!
                    );
                }
                const xAxis = d3.axisLeft(scaleY).ticks(d3.timeHour.every(3), d3.timeFormat("%H:%M"));

                axisContainer.call(xAxis as any);

                break;
            case "year":
                scaleX = d3
                    .scaleLinear()
                    .domain([numberOfColumns - 1, 0])
                    .range([padding + axisWidth + cellWidth / 2, width - padding - cellWidth / 2]);

                scaleY = d3
                    .scaleLinear()
                    .domain([0, numberOfRows])
                    .range([height - padding, padding]);
                for (const entry of entries) {
                    drawDaySquare(
                        entry,
                        colorScale,
                        scaleX as d3.ScaleLinear<number, number, never>,
                        scaleY as d3.ScaleLinear<number, number, never>,
                        svg,
                        graph!
                    );
                }

                break;
            default:
                throw new Error("Unsupported periodSize " + periodDescription.periodSize);
        }
    };

    const drawWeekendMarker = (
        date: Date,
        scaleX: d3.ScaleTime<number, number, never>,
        container: d3.Selection<d3.BaseType, unknown, null, undefined>
    ) => {
        if (isSaturday(date) || isMonday(date)) {
            let startX = scaleX(startOfDay(date)) - cellWidth / 2 - dayPadding;

            container
                .append("path")
                .attr("d", `M${startX} ${padding} v${height - 2 * padding}`)
                .attr("stroke-width", "1px")
                .attr("stroke", borderGrey);
        }
    };

    const drawHourSquare = (
        entry: MeasurementEntry,
        colorScale: d3.ScaleLinear<number, number, never>,
        scaleX: d3.ScaleTime<number, number, never>,
        scaleY: d3.ScaleTime<number, number, never>,
        svg: MySvgType,
        container: d3.Selection<d3.BaseType, unknown, HTMLElement | null, any>
    ) => {
        const value = entry.value;
        const color = !!value ? colorScale(value) : "white";

        const now = new Date();

        const timestampMappedToToday = set(entry.timestamp, {
            year: now.getFullYear(),
            month: now.getMonth(),
            date: now.getDate()
        });

        const timeStampMappedToMidnight = startOfDay(entry.timestamp);

        /* Add 1 hour to the y scale value, since the graph is read from bottom to top.
         * For example, the square for hour 1 to 2 is received as hour 1. We must draw it from the top down,
         * so that would be hour 2.
         */
        container
            .append("rect")
            .attr("x", scaleX(timeStampMappedToMidnight) - cellWidth / 2)
            .attr("y", scaleY(addHours(timestampMappedToToday, 1)))
            .attr("width", cellWidth - 2 * dayPadding)
            .attr("height", cellHeight - 2 * dayPadding)
            .attr("fill", color)
            .on("mouseenter", (event: any) => showTooltip(event, entry, value, graphDescription, svg))
            .on("mouseleave", () => hideTooltip(svg))
            .attr(
                "title",
                `${timestampMappedToToday.getDate()}-${timestampMappedToToday.getMonth()} ${timestampMappedToToday.getHours()}:00 ${value}`
            );
    };

    const drawDaySquare = (
        entry: MeasurementEntry,
        colorScale: d3.ScaleLinear<number, number, never>,
        scaleX: d3.ScaleLinear<number, number, never>,
        scaleY: d3.ScaleLinear<number, number, never>,
        svg: MySvgType,
        container: d3.Selection<d3.BaseType, unknown, HTMLElement | null, any>
    ) => {
        const value = entry.value;
        const color = !!value ? colorScale(value) : "white";

        const now = new Date();

        const timestampMappedToToday = set(entry.timestamp, {
            year: now.getFullYear(),
            month: now.getMonth(),
            date: now.getDate()
        });

        const today = startOfToday();
        const startOfEntryDate = startOfDay(entry.timestamp);

        const index = differenceInDays(today, startOfEntryDate);
        const x = scaleX(Math.floor(index / numberOfRows));
        const y = scaleY(index % numberOfRows);

        container
            .append("rect")
            .attr("x", x - cellWidth / 2)
            .attr("y", y - cellHeight)
            .attr("width", cellWidth - 2 * dayPadding)
            .attr("height", cellHeight - 2 * dayPadding)
            .attr("fill", color)
            .on("mouseenter", (event: any) => showTooltip(event, entry, value, graphDescription, svg))
            .on("mouseleave", () => hideTooltip(svg))
            .attr(
                "title",
                `${timestampMappedToToday.getDate()}-${timestampMappedToToday.getMonth()} ${timestampMappedToToday.getHours()}:00 ${value}`
            );
    };

    // TODO: Maybe also use mousemove event so that there's always an element selected
    // even when the mouse is between squares?
    function showTooltip(
        event: any,
        entry: MeasurementEntry,
        value: number,
        graphDescription: GraphDescription,
        svg: MySvgType
    ) {
        const timestamp = entry.timestamp;

        const dateString = format(timestamp, "eee yyyy-MM-dd HH:00");
        const contents = `${dateString}<br />value: <b>${d3.format(".2f")(value)}</b> ${
            graphDescription.displayableUnit
        }`;

        const tooltip = d3.select("#tooltip");

        tooltip
            .html(contents)
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 58 + "px")
            .style("display", "block");

        svg.select("g.crosshairs")
            .style("display", "block")
            .selectAll("path.horizontal")
            .data([event.target.y])
            .join("path")
            .attr("class", "horizontal")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", (y) => `M${padding + axisWidth},${y.baseVal.value + cellHeight / 2} H ${width - padding}`);

        svg.select("g.crosshairs")
            .selectAll("path.vertical")
            .data([event.target.x])
            .join("path")
            .attr("class", "vertical")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", (x) => `M${x.baseVal.value + cellWidth / 2},${padding} V ${height - padding}`);
    }

    function hideTooltip(svg: MySvgType) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "none");

        const crosshairs = svg.select("g.crosshairs");
        crosshairs.style("display", "none");
    }

    return (
        <div className="radialGraphContainer">
            <svg ref={svgRef}>
                <g className="values" />
                <g className="weekendMarkers" />
                <g className="axes" />
                <g className="crosshairs" />
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
