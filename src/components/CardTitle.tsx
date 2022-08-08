import { costsFor, PriceCategory } from "../helpers/PriceCalculator";
import { GraphDescription } from "../models/GraphDescription";
import { MeasurementEntry } from "../models/MeasurementEntry";
import { UsageField } from "../models/UsageData";

import styles from "./CardTitle.module.css";

type Props = {
    label: string;
    firstTimestamp: Date;
    fieldName: UsageField;
    graphDescription: GraphDescription;
    series: number[];
};

export function buildUsageCardTitle(
    label: string,
    firstTimestamp: Date,
    graphDescription: GraphDescription,
    series: MeasurementEntry[],
    fieldName: UsageField
) {
    const actualValues = series.filter(isNotNull);
    const totalUsage = actualValues.reduce((total, entry) => total + entry.value, 0);

    const chartTitle = buildChartTitle(label, totalUsage, fieldName, graphDescription, firstTimestamp);

    return chartTitle;
}

export function CardTitle({ label, firstTimestamp, fieldName, graphDescription, series }: Props) {
    const actualValues = series.filter(isNotNull);
    const totalUsage = actualValues.reduce((total, value) => total + value, 0);

    const chartTitle = buildChartTitle(label, totalUsage, fieldName, graphDescription, firstTimestamp);

    return <h3 className={styles.title}>{chartTitle}</h3>;
}

function isNotNull<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined;
}

function buildChartTitle(
    label: string,
    usage: number,
    fieldName: UsageField,
    graphDescription: GraphDescription,
    firstTimestamp: Date | null
): string {
    return `${label}: ${printableTotal(usage)} ${graphDescription.displayableUnit} (${printableCosts(
        usage,
        fieldName,
        firstTimestamp
    )})`;
}

function printableTotal(usage: number): string {
    return truncate(usage, 1).toString().replace(".", ",");
}

function truncate(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

function printableCosts(usage: number, fieldName: UsageField, firstTimestamp: Date | null): string {
    if (!firstTimestamp) {
        return "0";
    }

    const category = getCategory(fieldName);

    return costsFor(usage, category, firstTimestamp).toString();
}

function getCategory(fieldName: UsageField): PriceCategory {
    switch (fieldName) {
        case "gas":
            return PriceCategory.Gas;
        case "water":
            return PriceCategory.Water;
        case "stroom":
            return PriceCategory.Stroom;
    }
}
