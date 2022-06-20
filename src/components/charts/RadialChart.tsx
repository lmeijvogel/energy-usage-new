import * as d3 from "d3";

import React from "react";
import { GraphDescription } from "../../models/GraphDescription";
import { UsageField } from "../../models/UsageData";

type Props = {
    series: number[];
    fieldName: UsageField;
    graphDescription: GraphDescription;
};

export class RadialGraph extends React.Component<Props> {
    readonly width = 300;
    readonly height = 300;

    readonly padding = 30;

    readonly dayRadius = (this.width - 2 * this.padding) / 2 / 10;
    readonly dayPadding = 1;

    readonly hourAngle = (Math.PI * 2) / 24;
    readonly hourPadding = (Math.PI * 2) / 300;

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        this.drawGraph();
        console.log({ props: this.props });
    }

    componentDidUpdate() {
        this.drawGraph();
    }

    drawGraph() {
        const data = this.props.series.map((value) => truncate(value, 3));

        const max: number = Math.max(...data.filter(isDefined));
        const colorScale = d3
            .scaleLinear()
            .domain([0, max])
            .range(["white", this.props.graphDescription.barColor as any]);

        const svg = d3.select(`#svg_radial_${this.props.fieldName}`);

        svg.attr("width", this.width).attr("height", this.height);

        const graph = svg.select(".graph");
        graph.html("");

        const maxData = d3.max(data);

        for (let day = 6; day >= 0; day--) {
            for (let hour = 0; hour < 24; hour++) {
                this.drawSegment(data, day, hour, maxData!, colorScale, graph);
            }
        }

        const axisContainer = svg.select(".axes");
        axisContainer.html("");

        this.drawHourLines(axisContainer);

        this.addHourLabel(axisContainer, "0", "top");
        this.addHourLabel(axisContainer, "6", "right");
        this.addHourLabel(axisContainer, "12", "bottom");
        this.addHourLabel(axisContainer, "18", "left");
    }

    private drawSegment(
        data: number[],
        day: number,
        hour: number,
        maxData: number,
        colorScale: d3.ScaleLinear<number, number, never>,
        graph: d3.Selection<d3.BaseType, unknown, HTMLElement, any>
    ): void {
        const currentData = data[day * 24 + hour];

        const color = !!currentData ? colorScale(currentData) : "white";
        const hourArc = d3
            .arc()
            .innerRadius((day + 2 + hour / 24) * this.dayRadius + this.dayPadding)
            .outerRadius((day + 3 + hour / 24) * this.dayRadius - this.dayPadding)
            .startAngle(hour * this.hourAngle + this.hourPadding)
            .endAngle((hour + 1) * this.hourAngle - this.hourPadding);

        const path = graph.append("path");

        const dataIsZero = !isDefined(currentData) || currentData / maxData < 0.01;

        path.attr("transform", `translate(${this.width / 2}, ${this.height / 2})`)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", color)
            .attr("stroke-width", dataIsZero ? 0.5 : 0)
            .attr("stroke", "#888")
            .attr("d", hourArc as any);
    }

    private drawHourLines(axisContainer: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const color = "#999999";

        axisContainer
            .append("line")
            .attr("x1", this.width / 2)
            .attr("y1", this.padding)
            .attr("x2", this.width / 2)
            .attr("y2", this.height - this.padding)
            .attr("stroke", color)
            .attr("stroke-width", 0.5);

        axisContainer
            .append("line")
            .attr("x1", this.padding)
            .attr("y1", this.height / 2)
            .attr("x2", this.width - this.padding)
            .attr("y2", this.height / 2)
            .attr("stroke", color)
            .attr("stroke-width", 0.5);
    }

    private addHourLabel(
        axisContainer: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
        text: string,
        position: "top" | "right" | "bottom" | "left"
    ) {
        const x = position === "left" ? this.padding / 2 : position === "right" ? this.width - this.padding / 2 : "50%";
        const y = position === "top" ? this.padding / 2 : position === "bottom" ? this.width - this.padding / 2 : "50%";

        axisContainer
            .append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .text(text);
    }

    render() {
        return (
            <div className="radialGraphContainer">
                <svg id={`svg_radial_${this.props.fieldName}`}>
                    <g className="graph" />
                    <g className="axes" />
                </svg>
            </div>
        );
    }
}

function truncate(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

function isDefined<T>(x: T): x is T {
    return x !== undefined && x !== null;
}
