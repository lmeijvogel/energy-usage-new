import { useEffect, useState } from "react";
import {
    DayDescription,
    LastHourDescription,
    MonthDescription,
    PeriodDescription,
    YearDescription
} from "./models/PeriodDescription";

import styles from "./App.module.css";
import { Card } from "./components/Card";
import { BinnenTemperatuurGraphDescription, CurrentPowerUsageGraphDescription } from "./models/GraphDescription";
import { MeasurementEntry } from "./models/MeasurementEntry";
import { Row } from "./components/Row";
import { LineChart } from "./components/charts/LineChart";
import { Gauge } from "./components/charts/Gauge";
import { NavigationOverlay } from "./components/NavigationOverlay";
import { PeriodGraphs } from "./components/PeriodGraphs";
import { responseRowToMeasurementEntry } from "./helpers/responseRowToMeasurementEntry";
import { CarpetCharts } from "./components/CarpetCharts";

export type MeasurementResponse = [timestampString: string, value: number];
export type MinMaxMeasurementResponse = [timestampString: string, minValue: number, maxValue: number];

const collapsePeriods = false;
const collapseCarpets = false;

export const App = () => {
    // const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(DayDescription.today().previous());
    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(
        MonthDescription.thisMonth().previous()
    );

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

    const choosePeriod = (date: Date) => {
        const newPeriod = periodDescription.atIndex(date);

        if (
            newPeriod instanceof DayDescription ||
            newPeriod instanceof MonthDescription ||
            newPeriod instanceof YearDescription
        ) {
            setPeriodDescription(newPeriod);
        }
    };

    const toString = (el: any) => el.toString();

    const currentPowerUsageGraphDescription = new CurrentPowerUsageGraphDescription(periodDescription);
    const temperatuurGraphDescription = new BinnenTemperatuurGraphDescription(periodDescription);

    const lastHourPeriodDescription = new LastHourDescription();

    return (
        <NavigationOverlay periodDescription={periodDescription} onSelect={setPeriodDescription}>
            <div className="app">
                <Row collapsed={collapsePeriods}>
                    <PeriodGraphs periodDescription={periodDescription} onPeriodChosen={choosePeriod} />
                </Row>
                <Row>
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
                    <Card className={styles.wideCard} title="Actueel verbruik">
                        <Gauge
                            label="Gauge"
                            value={currentPowerUsageWatts}
                            okValue={500}
                            warnValue={2000}
                            maxValue={3000}
                            fieldName="current"
                        />
                    </Card>
                    <Row>
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
                    </Row>
                </Row>
                <Row collapsed={collapseCarpets}>
                    <CarpetCharts periodDescription={periodDescription} />
                </Row>
            </div>
        </NavigationOverlay>
    );
};

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
export default App;
