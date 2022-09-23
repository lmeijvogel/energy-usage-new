import { useEffect, useState } from "react";
import { MeasurementResponse } from "../App";
import { responseRowToMeasurementEntry } from "../helpers/responseRowToMeasurementEntry";
import { BinnenTemperatuurGraphDescription, CurrentPowerUsageGraphDescription } from "../models/GraphDescription";
import { MeasurementEntry } from "../models/MeasurementEntry";
import { LastHourDescription, PeriodDescription } from "../models/PeriodDescription";
import { Card } from "./Card";
import { Gauge } from "./charts/Gauge";
import { LineChart } from "./charts/LineChart";

import styles from "../App.module.css";
import { Row } from "./Row";

async function fetchTemperatureData(periodDescription: PeriodDescription): Promise<Map<string, MeasurementEntry[]>> {
    const url = periodDescription.toUrl();

    const response = await fetch(`/api/temperature/living_room${url}`);
    const json = await response.json();
    const data = parseTemperatureResponse(json);

    return data;
}

function parseTemperatureResponse(seriesResponse: any): Map<string, MeasurementEntry[]> {
    const result = new Map();

    Object.keys(seriesResponse).forEach((seriesName: string) => {
        const series: MeasurementResponse[] = seriesResponse[seriesName];

        result.set(seriesName, series.map(responseRowToMeasurementEntry));
    });

    return result;
}

type Props = {
    periodDescription: PeriodDescription;
};
export function LinesAndGauges({ periodDescription }: Props) {
    const [livingRoomTemperatureData, setLivingRoomTemperatureData] = useState<Map<string, MeasurementEntry[]>>(
        new Map()
    );

    const [recentPowerUsageData, setRecentPowerUsageData] = useState<Map<string, MeasurementEntry[]>>(new Map());
    const [currentPowerUsageWatts, setCurrentPowerUsageWatts] = useState<number>(0);

    useEffect(() => {
        fetchTemperatureData(periodDescription).then(setLivingRoomTemperatureData);
    }, [periodDescription]);

    useEffect(() => {
        const updatePowerUsage = () => {
            fetch("/api/stroom/recent")
                .then((response) => response.json())
                .then((json) => json.map(responseRowToMeasurementEntry))
                .then((dataInKW: MeasurementEntry[]) => {
                    const dataInW = dataInKW.map((entry) => ({ ...entry, value: entry.value * 1000 }));
                    setRecentPowerUsageData((existingData) => {
                        existingData.set("recentPowerUsage", dataInW);

                        return existingData;
                    });

                    setCurrentPowerUsageWatts(dataInW.length > 0 ? dataInW[dataInW.length - 1].value : 0);
                });
        };

        updatePowerUsage();

        const interval = setInterval(() => updatePowerUsage(), 15 * 1000);

        return () => clearInterval(interval);
    }, []);

    const toString = (el: any) => el.toString();

    const currentPowerUsageGraphDescription = new CurrentPowerUsageGraphDescription(periodDescription);
    const temperatuurGraphDescription = new BinnenTemperatuurGraphDescription(periodDescription);

    const lastHourPeriodDescription = new LastHourDescription();

    return (
        <>
            <Card title={`Huidig stroomverbruik (${currentPowerUsageWatts} W)`}>
                <LineChart
                    label="Stroom"
                    className={styles.mainGraph}
                    periodDescription={lastHourPeriodDescription}
                    graphDescription={currentPowerUsageGraphDescription}
                    allSeries={recentPowerUsageData}
                    tooltipLabelBuilder={toString}
                    graphTickPositions={periodDescription.graphTickPositions}
                />
            </Card>
            <Card className={styles.narrowGraph} title="Actueel verbruik">
                <Gauge
                    label="Gauge"
                    value={currentPowerUsageWatts}
                    okValue={500}
                    warnValue={2000}
                    maxValue={3000}
                    fieldName="current"
                />
            </Card>
            <Card title={`Temperatuur huiskamer`}>
                <LineChart
                    label="Temperatuur_Huiskamer"
                    className={styles.mainGraph}
                    periodDescription={periodDescription}
                    graphDescription={temperatuurGraphDescription}
                    allSeries={livingRoomTemperatureData}
                    tooltipLabelBuilder={toString}
                    graphTickPositions={periodDescription.graphTickPositions}
                />
            </Card>
        </>
    );
}
