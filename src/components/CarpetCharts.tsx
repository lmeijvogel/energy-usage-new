import { useState, useEffect } from "react";

import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "../models/GraphDescription";
import { MeasurementEntry } from "../models/MeasurementEntry";
import { MonthDescription, PeriodDescription } from "../models/PeriodDescription";
import { UsageField } from "../models/UsageData";

import { Card } from "./Card";
import { CarpetChart } from "./charts/CarpetChart";

import { responseRowToMeasurementEntry } from "../helpers/responseRowToMeasurementEntry";

import styles from "../App.module.css";

function useCarpetData(fieldName: UsageField) {
    const [carpetData, setCarpetData] = useState<MeasurementEntry[]>([]);

    useEffect(() => {
        fetchCarpetData(fieldName).then(setCarpetData);
    }, [fieldName]);

    return [carpetData];
}

async function fetchCarpetData(fieldName: UsageField): Promise<MeasurementEntry[]> {
    return fetch(`/api/${fieldName}/last_30_days`)
        .then((response) => response.json())
        .then((json) => json.map(responseRowToMeasurementEntry));
}

type Props = {
    periodDescription: PeriodDescription;
};

export function CarpetCharts({ periodDescription }: Props) {
    const [carpetGasData] = useCarpetData("gas");
    const [carpetStroomData] = useCarpetData("stroom");
    const [carpetWaterData] = useCarpetData("water");

    const gasGraphDescription = new GasGraphDescription(periodDescription);
    const stroomGraphDescription = new StroomGraphDescription(periodDescription);
    const waterGraphDescription = new WaterGraphDescription(periodDescription);

    return (
        <>
            <Card className={styles.wideCard} title="Gas (last 30 days)">
                <CarpetChart
                    className={styles.carpetChart}
                    width={500}
                    height={300}
                    graphDescription={gasGraphDescription}
                    periodDescription={MonthDescription.thisMonth()}
                    entries={carpetGasData}
                />
            </Card>
            <Card className={styles.wideCard} title="Stroom (last 30 days)">
                <CarpetChart
                    className={styles.carpetChart}
                    width={500}
                    height={300}
                    graphDescription={stroomGraphDescription}
                    periodDescription={MonthDescription.thisMonth()}
                    entries={carpetStroomData}
                />
            </Card>
            <Card className={styles.wideCard} title="Water (30 days)">
                <CarpetChart
                    className={styles.carpetChart}
                    width={500}
                    height={300}
                    graphDescription={waterGraphDescription}
                    periodDescription={MonthDescription.thisMonth()}
                    entries={carpetWaterData}
                />
            </Card>
        </>
    );
}
