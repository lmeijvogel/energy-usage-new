import { useState, useEffect } from "react";

import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "../models/GraphDescription";
import { MeasurementEntry } from "../models/MeasurementEntry";
import { MonthDescription, PeriodDescription, YearDescription } from "../models/PeriodDescription";
import { UsageField } from "../models/UsageData";

import { Card } from "./Card";
import { CarpetChart } from "./charts/CarpetChart";

import { responseRowToMeasurementEntry } from "../helpers/responseRowToMeasurementEntry";

import styles from "../App.module.css";
import { Row } from "./Row";

function useCarpetData(fieldName: UsageField, period: "last_30_days" | "last_360_days") {
    const [carpetData, setCarpetData] = useState<MeasurementEntry[]>([]);

    const query = period === "last_30_days" ? `/api/${fieldName}/last_30_days` : `/api/${fieldName}/last_360_days`;

    useEffect(() => {
        fetchLastMonthCarpetData(query).then(setCarpetData);
    }, [fieldName]);

    return [carpetData];
}

async function fetchLastMonthCarpetData(query: string): Promise<MeasurementEntry[]> {
    return fetch(query)
        .then((response) => response.json())
        .then((json) => json.map(responseRowToMeasurementEntry));
}

type Props = {
    periodDescription: PeriodDescription;
};

export function CarpetCharts({ periodDescription }: Props) {
    const [lastMonthCarpetGasData] = useCarpetData("gas", "last_30_days");
    const [lastMonthCarpetStroomData] = useCarpetData("stroom", "last_30_days");
    const [lastMonthCarpetWaterData] = useCarpetData("water", "last_30_days");

    const [lastYearCarpetGasData] = useCarpetData("gas", "last_360_days");
    const [lastYearCarpetStroomData] = useCarpetData("stroom", "last_360_days");
    const [lastYearCarpetWaterData] = useCarpetData("water", "last_360_days");

    const gasGraphDescription = new GasGraphDescription(periodDescription);
    const stroomGraphDescription = new StroomGraphDescription(periodDescription);
    const waterGraphDescription = new WaterGraphDescription(periodDescription);

    return (
        <>
            <Row>
                <Card className={styles.wideCard} title="Gas (last 30 days)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={gasGraphDescription}
                        periodDescription={MonthDescription.thisMonth()}
                        entries={lastMonthCarpetGasData}
                    />
                </Card>
                <Card className={styles.wideCard} title="Stroom (last 30 days)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={stroomGraphDescription}
                        periodDescription={MonthDescription.thisMonth()}
                        entries={lastMonthCarpetStroomData}
                    />
                </Card>
                <Card className={styles.wideCard} title="Water (30 days)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={waterGraphDescription}
                        periodDescription={MonthDescription.thisMonth()}
                        entries={lastMonthCarpetWaterData}
                    />
                </Card>
            </Row>
            <Row>
                <Card className={styles.wideCard} title="Gas (last year)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={gasGraphDescription}
                        periodDescription={YearDescription.thisYear()}
                        entries={lastYearCarpetGasData}
                    />
                </Card>
                <Card className={styles.wideCard} title="Stroom (last year)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={stroomGraphDescription}
                        periodDescription={YearDescription.thisYear()}
                        entries={lastYearCarpetStroomData}
                    />
                </Card>
                <Card className={styles.wideCard} title="Water (last year)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        graphDescription={waterGraphDescription}
                        periodDescription={YearDescription.thisYear()}
                        entries={lastYearCarpetWaterData}
                    />
                </Card>
            </Row>
        </>
    );
}
