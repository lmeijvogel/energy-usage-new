import * as d3 from "d3";
import { StroomGraphDescription } from "../../models/GraphDescription";

import { ChartWithAxes } from "./ChartWithAxes";

type ValueWithTimestamp = {
    value: number;
    timestamp: Date;
};

type SpecificProps = {
    valuesWithTimestamp: ValueWithTimestamp[];
};

type scale = d3.ScaleTime<number, number, never>;

export class LineChart extends ChartWithAxes<SpecificProps> {
    override initializeScaleX() {
        return d3.scaleTime();
    }

    override componentDidUpdate() {
        const { valuesWithTimestamp } = this.props;

        if (valuesWithTimestamp.length > 0) {
            const minDate = valuesWithTimestamp[0].timestamp;
            const maxDate = valuesWithTimestamp[valuesWithTimestamp.length - 1].timestamp;

            (this.scaleX as scale)
                .domain([minDate, maxDate])
                .range([this.padding.left + this.axisWidth, this.width - this.padding.right]);
        }

        super.componentDidUpdate();
    }

    override get elementId() {
        return `LineChart_${this.props.label}`;
    }

    override get elementCount() {
        return this.props.valuesWithTimestamp.length;
    }

    override drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const graphDescription = new StroomGraphDescription(this.props.periodDescription);

        const lineGenerator = d3
            .line<ValueWithTimestamp>()
            .x((d) => (this.scaleX as scale)(d.timestamp))
            .y((d) => this.scaleY(d.value));

        const areaGenerator = d3
            .area<ValueWithTimestamp>()
            .x((d) => (this.scaleX as scale)(d.timestamp))
            .y0(this.scaleY(0))
            .y1((d) => this.scaleY(d.value));

        // Add the line
        svg.select("g.values > g.line").remove();
        svg.select("g.values > g.area").remove();

        const valuesSvg = svg.select("g.values");

        const lineSvg = valuesSvg.append("g").attr("class", "line");
        const areaSvg = valuesSvg.append("g").attr("class", "area");

        lineSvg
            .append("path")
            .attr("fill", "none")
            .attr("stroke", graphDescription.barColor)
            .attr("stroke-width", 4)
            .attr("d", lineGenerator(this.props.valuesWithTimestamp))
            .on("click", this.onValueClick);

        areaSvg
            .append("path")
            .attr("fill", graphDescription.lightColor)
            .attr("stroke", graphDescription.barColor)
            .attr("stroke-width", 0)
            .attr("d", areaGenerator(this.props.valuesWithTimestamp))
            .on("click", this.onValueClick);
        //
        // .on("mouseenter", this.showTooltip)
        // .on("mouseleave", this.hideTooltip)
    }

    protected override renderXAxis(xAxisBase: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        const xAxis = d3.axisBottom(this.scaleX as any).ticks(d3.timeMinute.every(5), d3.timeFormat("%M"));

        xAxisBase.call(xAxis);
    }
}
