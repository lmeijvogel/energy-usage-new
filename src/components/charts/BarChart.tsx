import * as d3 from "d3";

import { ChartWithAxes, ChartWithAxesProps } from "./ChartWithAxes";

type SpecificProps = {
    series: number[];
};

export class BarChart extends ChartWithAxes<SpecificProps> {
    constructor(props: ChartWithAxesProps & SpecificProps) {
        super(props);
    }

    override get elementCount() {
        return this.props.series.length;
    }

    override initializeScaleX() {
        return d3.scaleBand<number>().padding(0.15);
    }

    override get elementId() {
        return `BarChart_${this.props.label}`;
    }

    override componentDidUpdate() {
        const domain = d3.range(0, this.props.series.length, 1);

        (this.scaleX as d3.ScaleBand<number>)
            .domain(domain)
            .range([this.padding.left + this.axisWidth, this.width - this.padding.right]);

        super.componentDidUpdate();
    }

    override drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        svg.select("g.values")
            .selectAll("rect")
            .data(this.props.series)
            .join("rect")
            .on("click", this.onValueClick)
            .on("mouseenter", this.showTooltip)
            .on("mouseleave", this.hideTooltip)

            .attr("y", (el: number) => this.scaleY(el))
            .attr("height", (el: number) => this.scaleY(0) - this.scaleY(el))
            .attr("x", (_val: number, i: number) => this.calculateBarXPosition(i))
            .attr("width", (this.scaleX as d3.ScaleBand<number>).bandwidth())
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

    protected override renderXAxis(xAxisBase: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
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
            .domain([0, this.elementCount])
            .range([this.padding.left + this.axisWidth, this.width - this.padding.right]);

        let xAxis: any;
        if (this.props.graphTickPositions === "on_value") {
            xAxis = d3
                .axisBottom(this.scaleX as any)
                .tickValues(this.props.graphDescription.displayedTickIndices)
                .tickFormat((n: any) => this.props.periodDescription.formatTick(n as number));
        } else {
            xAxis = d3.axisBottom(scaleXForXAxis).tickSizeOuter(0);
        }

        const renderedXAxis = xAxisBase.call(xAxis).selectAll("text").style("font-size", "13pt");

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
    }

    private calculateBarXPosition(i: number) {
        const pos = this.scaleX(i);

        return !!pos ? pos : 0;
    }
}
