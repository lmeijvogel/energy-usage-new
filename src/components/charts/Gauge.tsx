import * as React from "react";
import { createRef } from "react";
import classNames from "classnames";
import * as d3 from "d3";

import styles from "./Gauge.module.css";

export type Props = {
    fieldName: string;
    value: number;
    okValue?: number;
    warnValue?: number;
    maxValue: number;
    className?: string;
    label: string;
    // colorIntense: string;
};

export class Gauge extends React.Component<Props> {
    get elementId(): string {
        return `gauge_${this.props.fieldName}`;
    }

    readonly scale: d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    readonly startAngleFromBottom = Math.PI / 3;

    readonly width = 480;
    readonly height = 240;
    readonly padding = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    };
    private readonly elementRef = createRef<SVGSVGElement>();

    protected svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any> | null = null;

    private readonly valueArc: d3.Arc<any, d3.DefaultArcObject>;
    private readonly guideArc: d3.Arc<any, d3.DefaultArcObject>;
    private readonly scaleArcGreen: d3.Arc<any, d3.DefaultArcObject>;
    private readonly scaleArcYellow: d3.Arc<any, d3.DefaultArcObject>;
    private readonly scaleArcRed: d3.Arc<any, d3.DefaultArcObject>;

    constructor(props: Props) {
        super(props);

        this.valueArc = d3.arc();
        this.guideArc = d3.arc();
        this.scaleArcGreen = d3.arc();
        this.scaleArcYellow = d3.arc();
        this.scaleArcRed = d3.arc();
    }

    componentDidMount() {
        this.initializeGraph();

        this.renderGraph(this.svg!);
    }

    componentDidUpdate() {
        this.renderGraph(this.svg!);
    }

    render() {
        const transform = `translate(${this.width / 2}, ${this.height / 2})`;

        return (
            <svg
                className={classNames(this.props.className, "periodUsageGraph")}
                id={this.elementId}
                ref={this.elementRef}
            >
                <path className="guide" transform={transform} />
                <g className="gauge" transform={transform} />
                <path className="scaleGreen" transform={transform} />
                <path className="scaleYellow" transform={transform} />
                <path className="scaleRed" transform={transform} />
                <g className="number" transform={transform} />
            </svg>
        );
    }

    protected initializeGraph() {
        const id = this.elementRef.current!.id;

        const bottom = Math.PI;

        this.scale
            .domain([0, this.props.maxValue])
            .range([bottom + this.startAngleFromBottom, bottom + 2 * Math.PI - this.startAngleFromBottom])
            .clamp(true);

        this.valueArc.startAngle(this.scale(0));
        this.guideArc.startAngle(this.scale(0));
        this.scaleArcGreen.startAngle(this.scale(0));

        const outerSize = 110;
        const scaleWidth = outerSize * 0.05;

        const gaugeOuterRadius = outerSize * 0.92;
        const gaugeWidth = outerSize * 0.3;

        this.svg = d3.select("#" + id).attr("viewBox", `0 0 ${this.width} ${this.height}`);
        this.valueArc.innerRadius(gaugeOuterRadius - gaugeWidth).outerRadius(gaugeOuterRadius);
        this.guideArc.innerRadius(gaugeOuterRadius - gaugeWidth).outerRadius(gaugeOuterRadius);
        this.scaleArcGreen.innerRadius(outerSize - scaleWidth).outerRadius(outerSize);
        this.scaleArcYellow.innerRadius(outerSize - scaleWidth).outerRadius(outerSize);
        this.scaleArcRed.innerRadius(outerSize - scaleWidth).outerRadius(outerSize);
    }

    private renderGraph(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        this.renderScale(svg);

        this.valueArc.endAngle(this.scale(this.props.value));
        this.guideArc.endAngle(this.scale(this.props.maxValue));

        svg.select("path.guide")
            .attr("width", 100)
            .attr("height", 100)
            .attr("class", styles.guide)
            .attr("d", this.guideArc as any);

        const gaugeClassName = this.getGaugeClassName();

        svg.select("g.gauge")
            .selectAll("path")
            .data([this.props.value])
            .join("path")
            .attr("class", gaugeClassName)
            .attr("d", this.valueArc as any);

        svg.select("g.number")
            .selectAll("text")
            .data([this.props.value])
            .join("text")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text(this.formatNumeric);
    }

    private renderScale(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
        const { okValue, warnValue, maxValue } = this.props;

        if (!!okValue) {
            this.scaleArcGreen.endAngle(this.scale(okValue));

            svg.select("path.scaleGreen")
                .attr("class", styles.scaleOk)
                .attr("d", this.scaleArcGreen as any);
        }

        this.scaleArcYellow.startAngle(this.scale(okValue ?? 0));
        this.scaleArcYellow.endAngle(this.scale(warnValue ?? maxValue));

        svg.select("path.scaleYellow")
            .attr("class", styles.scaleRegular)
            .attr("d", this.scaleArcYellow as any);

        if (!!warnValue) {
            this.scaleArcRed.startAngle(this.scale(warnValue)).endAngle(this.scale(this.props.maxValue));
            svg.select("path.scaleRed")
                .attr("class", styles.scaleWarn)
                .attr("d", this.scaleArcRed as any);
        }
    }

    private formatNumeric = (value: number) => {
        const trimmedValue = d3.format("d")(value);

        return `${trimmedValue} W`;
    };

    private getGaugeClassName(): string {
        const { value, okValue, warnValue, maxValue } = this.props;

        if (value > maxValue) {
            return styles.gaugeOverflow;
        }

        if (warnValue && value > warnValue) {
            return styles.gaugeBad;
        }

        if (okValue && value > okValue) {
            return styles.gaugeRegular;
        }

        if (!okValue) {
            return styles.gaugeRegular;
        }

        return styles.gaugeOk;
    }
}
