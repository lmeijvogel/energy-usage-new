import { costsFor, PriceCategory } from "../helpers/PriceCalculator";
import { unitToString } from "../helpers/unitToString";
import { assertNever } from "../lib/assertNever";
import { UsageField } from "../models/UsageData";

import styles from "./CardTitle.module.css";

type Props = {
    label: string;
    labels: Date[];
    fieldName: UsageField;
    series: number[];
};

export function CardTitle({ label, labels, fieldName, series }: Props) {
    const firstTimestamp = labels[0];

    function totalUsage() {
        const actualValues = series.filter(isNotNull);

        return Math.max(...actualValues) - Math.min(...actualValues);
    }

    const chartTitle = buildChartTitle(label, totalUsage(), fieldName, firstTimestamp);

    return <h3 className={styles.title}>{chartTitle}</h3>;
}

function isNotNull<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined;
}

function buildChartTitle(label: string, usage: number, fieldName: UsageField, firstTimestamp: Date | null): string {
    return `${label}: ${printableTotal(usage)} ${unitToString(fieldName)} (${printableCosts(
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
