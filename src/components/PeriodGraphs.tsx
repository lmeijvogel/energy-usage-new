import { useState, useEffect } from "react";
import { padData } from "../helpers/padData";
import { responseRowToMeasurementEntry } from "../helpers/responseRowToMeasurementEntry";
import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "../models/GraphDescription";
import { MeasurementEntry } from "../models/MeasurementEntry";
import { PeriodDescription } from "../models/PeriodDescription";
import { UsageField } from "../models/UsageData";
import { Card } from "./Card";
import { buildUsageCardTitle } from "./CardTitle";
import { BarChart } from "./charts/BarChart";

import styles from "../App.module.css";

type Props = {
    periodDescription: PeriodDescription;
    onPeriodChosen: (date: Date) => void;
};

function usePeriodData(fieldName: UsageField, periodDescription: PeriodDescription) {
    const [periodData, setPeriodData] = useState<MeasurementEntry[]>([]);

    useEffect(() => {
        fetchPeriodData(fieldName, periodDescription).then(setPeriodData);
    }, [fieldName, periodDescription]);

    return [periodData];
}

async function fetchPeriodData(
    fieldName: UsageField,
    periodDescription: PeriodDescription
): Promise<MeasurementEntry[]> {
    const url = periodDescription.toUrl();

    const response = await fetch(`/api/${fieldName}${url}`);
    const json = await response.json();
    const data = json.map(responseRowToMeasurementEntry);
    const paddedData = padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize);

    return paddedData;
}

export function PeriodGraphs({ periodDescription, onPeriodChosen }: Props) {
    const [periodGasData] = usePeriodData("gas", periodDescription);
    const [periodStroomData] = usePeriodData("stroom", periodDescription);
    const [periodWaterData] = usePeriodData("water", periodDescription);

    const gasGraphDescription = new GasGraphDescription(periodDescription);
    const stroomGraphDescription = new StroomGraphDescription(periodDescription);
    const waterGraphDescription = new WaterGraphDescription(periodDescription);

    return (
        <>
            <Card
                title={buildUsageCardTitle(
                    "Gas",
                    periodDescription.startOfPeriod(),
                    gasGraphDescription,
                    periodGasData,
                    "gas"
                )}
            >
                <BarChart
                    label="Gas"
                    className={styles.mainGraph}
                    periodDescription={periodDescription}
                    graphDescription={gasGraphDescription}
                    series={periodGasData}
                    onBarClick={onPeriodChosen}
                    tooltipLabelBuilder={toString}
                    graphTickPositions={periodDescription.graphTickPositions}
                />
            </Card>
            <Card
                title={buildUsageCardTitle(
                    "Stroom",
                    periodDescription.startOfPeriod(),
                    stroomGraphDescription,
                    periodStroomData,
                    "stroom"
                )}
            >
                <BarChart
                    label="Stroom"
                    className={styles.mainGraph}
                    periodDescription={periodDescription}
                    graphDescription={stroomGraphDescription}
                    series={periodStroomData}
                    onBarClick={onPeriodChosen}
                    tooltipLabelBuilder={toString}
                    graphTickPositions={periodDescription.graphTickPositions}
                />
            </Card>
            <Card
                title={buildUsageCardTitle(
                    "Water",
                    periodDescription.startOfPeriod(),
                    waterGraphDescription,
                    periodWaterData,
                    "water"
                )}
            >
                <BarChart
                    label="Water"
                    className={styles.mainGraph}
                    periodDescription={periodDescription}
                    graphDescription={waterGraphDescription}
                    series={periodWaterData}
                    onBarClick={onPeriodChosen}
                    tooltipLabelBuilder={toString}
                    graphTickPositions={periodDescription.graphTickPositions}
                />
            </Card>
        </>
    );
}
