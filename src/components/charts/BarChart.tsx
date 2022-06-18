import * as React from "react";
import { createRef } from "react";
import classNames from "classnames";
import * as d3 from "d3";

// import { getTimes } from "suncalc";

import { unitToString } from "../../helpers/unitToString";
import { GraphTickPositions, PeriodDescription } from "../../models/PeriodDescription";
import { GraphDescription } from "../../models/GraphDescription";
// import { drawTimeBands } from "./drawTimeBands";

type Props = {
    className?: string;
    label: string;
    periodDescription: PeriodDescription;
    graphDescription: GraphDescription;
    series: number[];
    // colorIntense: string;
    onBarClick: (index: number) => void;
    tooltipLabelBuilder: (title: number) => string;
    graphTickPositions: GraphTickPositions;
};

const width = 480;
const height = 240;
const padding = {
    top: 10,
    right: 30,
    bottom: 10,
    left: 10
};

const axisWidth = 30;

export class BarChart extends React.Component<Props> {
    private readonly elementRef = createRef<SVGSVGElement>();

    private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | null = null;

    private readonly scaleX: d3.ScaleBand<number>;

    /* When the user drags to select a number of bars,
     * it's necessary to find the bars corresponding to the
     * coordinates on-screen. Sadly, the BandScale that we use for
     * positioning the bars does not have an `inverse(x)` method,
     * so we build a second (linear) scale that matches the BandScale
     * and use that for finding the current bar for given x-coordinates.
     */
    // private readonly scaleXForInversion: d3.ScaleLinear<number, number, never>;

    private readonly scaleY: d3.ScaleLinear<number, number, never>;
    private readonly yAxis: d3.Axis<d3.NumberValue>;

    constructor(props: Props) {
        super(props);

        this.scaleX = d3.scaleBand<number>().padding(0.15);
        // this.scaleXForInversion = d3.scaleLinear();

        this.scaleY = d3.scaleLinear().clamp(true);
        this.yAxis = d3.axisLeft(this.scaleY);
    }

    componentDidMount() {
        this.initializeGraph();
        this.renderGraph(this.svg!);
    }

    componentDidUpdate() {
        this.renderGraph(this.svg!);
    }

    render() {
        // Values are rendered above the selection for the tooltip
        return (
            <svg
                className={classNames(this.props.className, "periodUsageGraph")}
                id={`chart_${this.props.label}`}
                ref={this.elementRef}
            >
                <g className="xAxis" />
                <g className="yAxis" />
                <g className="gridLines" />
                <g className="additionalInfo" />
                <g className="values" />
                <g className="selection">
                    <rect />
                </g>
            </svg>
        );
    }

    private initializeGraph() {
        const id = this.elementRef.current!.id;

        this.svg = d3.select("#" + id).attr("viewBox", `0 0 ${width} ${height}`);
    }

    private renderGraph(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const domain = d3.range(0, this.props.series.length, 1);

        this.scaleX.domain(domain).range([padding.left + axisWidth, width - padding.right]);

        // this.scaleXForInversion.domain(domain).range([padding.left + axisWidth, width - padding.right]);

        const xAxisHeight = this.props.graphDescription.xLabelHeight;
        this.scaleY
            .domain([0, this.props.graphDescription.maxY])
            .range([height - padding.bottom - xAxisHeight, padding.top]);

        this.updateAxes(svg);

        this.drawBars(svg, this.props.series);

        // if (this.props.fieldName === "stroom") {
        // const { periodDescription } = this.props;

        // if (periodDescription instanceof DayDescription) {
        // this.drawTimesOfDay(svg, periodDescription.toDate());
        // } else {
        // const g = svg.select("g.additionalInfo");

        // g.selectChildren().remove();
        // }
        // }
    }

    private onBarClick = ({ target }: { target: SVGRectElement }) => {
        const index = parseInt(target.attributes.getNamedItem("index")!.value, 10);
        this.props.onBarClick(index);
    };

    private showTooltip = (event: any, value: number) => {
        const index = parseInt(event.target.attributes.getNamedItem("index")!.value, 10);
        const contents = this.buildTooltipContents(index, value);
        const tooltip = d3.select("#tooltip");

        tooltip
            .html(contents)
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY - 58 + "px")
            .style("display", "block");
    };

    private hideTooltip = () => {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "none");
    };

    private updateAxes(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        /* The reasonable assumption would be that creating a scale for a bar chart
         * would just reuse the band scale, but that has the downside that the ticks will
         * always end up in the middle of the bars. For the year and month charts that is fine:
         * A bar represents the usage for a given day or month.
         *
         * For the day chart, it feels better to have the bars *between* the axis ticks,
         * since the graph shows the usage between e.g. 09:00 and 10:00. And we need a linear
         * scale to do that: I can't persuade an xAxis based on a band scale to put the ticks
         * between the bands.
         */
        const scaleXForXAxis = d3
            .scaleLinear()
            .domain([0, this.props.series.length])
            .range([padding.left + axisWidth, width - padding.right]);

        let xAxis: any;
        if (this.props.graphTickPositions === "on_value") {
            xAxis = d3
                .axisBottom(this.scaleX as any)
                .tickValues(this.props.graphDescription.displayedTickIndices)
                .tickFormat((n: any) => this.props.periodDescription.formatTick(n as number));
        } else {
            xAxis = d3.axisBottom(scaleXForXAxis).tickSizeOuter(0);
        }

        /* Remove and repaint the axis: When switching between scales (or formatting, not sure),
         * the first tick kept getting painted wrong (shifted to the left).
         *
         * Starting clean fixes this.
         */
        svg.select("g.xAxis").remove();

        const renderedXAxis = svg
            .append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0, ${this.scaleY(0)})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "13pt");

        if (this.props.graphDescription.hasTextLabels) {
            renderedXAxis
                .style("text-anchor", "end")
                .attr("dy", "-.2em")
                .attr("dx", "-1em")
                .attr("transform", "rotate(-65)");
        } else {
            // Got the 0.71em from the browser
            renderedXAxis.style("text-anchor", null).attr("dy", "0.71em").attr("transform", null);
        }

        svg.select(".yAxis")
            .attr("transform", `translate(${padding.left + axisWidth}, 0)`)
            .style("font-size", "13pt")
            .call(this.yAxis as any);
    }

    private drawBars(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, relativeData: number[]) {
        svg.select("g.values")
            .selectAll("rect")
            .data(relativeData)
            .join("rect")
            .on("click", this.onBarClick)
            .on("mouseenter", this.showTooltip)
            .on("mouseleave", this.hideTooltip)

            .attr("y", (el: number) => this.scaleY(el))
            .attr("height", (el: number) => this.scaleY(0) - this.scaleY(el))
            .attr("x", (_val: number, i: number) => this.calculateBarXPosition(i))
            .attr("width", this.scaleX.bandwidth())
            .attr("fill", this.props.graphDescription.barColor)
            .attr("index", (_d: any, i: number) => i);
    }

    // private drawTimesOfDay(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, date: Date) {
    // const [latitude, longitude] = [51.922909, 4.47059];

    // const times = getTimes(date, latitude, longitude);

    // const g = svg.select("g.additionalInfo");
    // const bandHeight = this.scaleY(0) - padding.top;

    // drawTimeBands(g, times, this.scaleX, padding.top, bandHeight, padding.left + axisWidth, width - padding.right);
    // }

    private calculateBarXPosition(i: number) {
        const pos = this.scaleX(i);

        return !!pos ? pos : 0;
    }

    private buildTooltipContents(index: number, value: number) {
        const formattedValue = d3.format(this.props.graphDescription.tooltipValueFormat)(value);

        return `${this.props.periodDescription.atIndex(index).toShortTitle()}:<br />${formattedValue} ${unitToString(
            this.props.graphDescription.fieldName
        )}`;
    }
}
