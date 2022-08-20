import * as d3 from "d3";
import { StroomGraphDescription } from "../../models/GraphDescription";

import { ChartWithAxes, ChartWithAxesProps } from "./ChartWithAxes";

type ValueWithTimestamp = {
    value: number;
    timestamp: Date;
};

type Series = ValueWithTimestamp[];
type SeriesCollection = Map<string, Series>;

type SpecificProps = {
    allSeries: SeriesCollection;
};

type scale = d3.ScaleTime<number, number, never>;

export class LineChart extends ChartWithAxes<SpecificProps> {
    protected readonly scaleX: d3.ScaleTime<number, number, never>;

    constructor(props: ChartWithAxesProps & SpecificProps) {
        super(props);

        this.scaleX = d3.scaleTime();
    }

    override componentDidUpdate() {
        const { allSeries } = this.props;

        if (allSeries.size > 0) {
            const firstSeries = this.firstSeries!;

            if (firstSeries.length > 0) {
                const domain = [
                    this.props.periodDescription.startOfPeriod(),
                    this.props.periodDescription.endOfPeriod()
                ];

                (this.scaleX as scale)
                    .domain(domain)
                    .range([this.padding.left + this.axisWidth, this.width - this.padding.right]);
            }
        }

        super.componentDidUpdate();
    }

    override get elementId() {
        return `LineChart_${this.props.label}`;
    }

    private get firstSeries(): ValueWithTimestamp[] | undefined {
        const firstKey = Array.from(this.props.allSeries.keys())[0];

        return this.props.allSeries.get(firstKey);
    }

    override drawValues(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const { allSeries, graphDescription } = this.props;

        console.log("drawValues: ", allSeries);
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
        svg.select("g.values").html("");

        const valuesSvg = svg.select("g.values");

        const areaSvg = valuesSvg.append("g").attr("class", "area");

        allSeries.forEach((series, key) => {
            const lineSvg = valuesSvg.append("g").attr("class", `line_${key}`);
            lineSvg
                .append("path")
                .attr("fill", "none")
                .attr("stroke", graphDescription.barColor)
                .attr("stroke-width", 4)
                .attr("d", lineGenerator(series))
                .on("click", this.onValueClick);
        });

        if (allSeries.size === 1) {
            const series = allSeries.values().next().value;

            areaSvg
                .append("path")
                .attr("fill", graphDescription.lightColor)
                .attr("stroke", graphDescription.barColor)
                .attr("stroke-width", 0)
                .attr("d", areaGenerator(series))
                .on("click", this.onValueClick);
        }
        //
        // .on("mouseenter", this.showTooltip)
        // .on("mouseleave", this.hideTooltip)
    }

    protected override renderXAxis(xAxisBase: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        const { periodDescription } = this.props;
        const ticks = periodDescription.getChartTicks();
        const xAxis = d3
            .axisBottom(this.scaleX as any)
            .ticks(ticks, d3.timeFormat(periodDescription.timeFormatString()));

        xAxisBase.call(xAxis);
    }
}
