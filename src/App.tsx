import { useEffect, useState } from "react";
import { BarChart } from "./components/charts/BarChart";
import {
    DayDescription,
    LastHourDescription,
    MonthDescription,
    PeriodDescription,
    YearDescription
} from "./models/PeriodDescription";

import styles from "./App.module.css";
import { Card } from "./components/Card";
import { buildUsageCardTitle } from "./components/CardTitle";
import { NavigationButtons } from "./components/NavigationButtons";
import {
    BinnenTemperatuurGraphDescription,
    CurrentPowerUsageGraphDescription,
    GasGraphDescription,
    StroomGraphDescription,
    WaterGraphDescription
} from "./models/GraphDescription";
import { padData } from "./helpers/padData";
import { MeasurementEntry } from "./models/MeasurementEntry";
import { CarpetChart } from "./components/charts/CarpetChart";
import { Row } from "./components/Row";
import { LineChart } from "./components/charts/LineChart";
import { UsageField } from "./models/UsageData";

export type MeasurementResponse = [timestampString: string, value: number];
export type MinMaxMeasurementResponse = [timestampString: string, minValue: number, maxValue: number];

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
    const data = json.map(parseResponseRow);
    const paddedData = padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize);

    return paddedData;
}

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
        .then((json) => json.map(parseResponseRow));
}

export const App = () => {
    // const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(DayDescription.today().previous());
    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(
        MonthDescription.thisMonth().previous()
    );

    const [periodGasData] = usePeriodData("gas", periodDescription);
    const [periodStroomData] = usePeriodData("stroom", periodDescription);
    const [periodWaterData] = usePeriodData("water", periodDescription);

    const [livingRoomTemperatureData, setLivingRoomTemperatureData] = useState<Map<string, MeasurementEntry[]>>(
        new Map()
    );

    const [carpetGasData] = useCarpetData("gas");
    const [carpetStroomData] = useCarpetData("stroom");
    const [carpetWaterData] = useCarpetData("water");

    const [recentPowerUsageData, setRecentPowerUsageData] = useState<Map<string, MeasurementEntry[]>>(new Map());
    const [currentPowerUsageWatts, setCurrentPowerUsageWatts] = useState<number>(0);

    useEffect(() => {
        fetchTemperatureData(periodDescription).then(setLivingRoomTemperatureData);
    }, [periodDescription]);

    useEffect(() => {
        const updatePowerUsage = () => {
            fetch("/api/stroom/recent")
                .then((response) => response.json())
                .then((json) => json.map(parseResponseRow))
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

    const gasGraphDescription = new GasGraphDescription(periodDescription);
    const stroomGraphDescription = new StroomGraphDescription(periodDescription);
    const waterGraphDescription = new WaterGraphDescription(periodDescription);
    const currentPowerUsageGraphDescription = new CurrentPowerUsageGraphDescription(periodDescription);
    const temperatuurGraphDescription = new BinnenTemperatuurGraphDescription(periodDescription);

    const lastHourPeriodDescription = new LastHourDescription();

    return (
        <div className="app">
            <div className={styles.row}>
                <h1>{periodDescription.toTitle()}</h1>
            </div>
            <Row>
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
                        onBarClick={choosePeriod}
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
                        onBarClick={choosePeriod}
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
                        onBarClick={choosePeriod}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={periodDescription.graphTickPositions}
                    />
                </Card>
            </Row>
            <Row>
                <Card className={styles.wideCard} title="Gas (last 30 days)">
                    <CarpetChart
                        className={styles.carpetChart}
                        width={500}
                        height={300}
                        fieldName="gas"
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
                        fieldName="stroom"
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
                        fieldName="water"
                        graphDescription={waterGraphDescription}
                        periodDescription={MonthDescription.thisMonth()}
                        entries={carpetWaterData}
                    />
                </Card>
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
            <NavigationButtons periodDescription={periodDescription} onSelect={setPeriodDescription} />
        </div>
    );
};

async function fetchTemperatureData(periodDescription: PeriodDescription): Promise<Map<string, MeasurementEntry[]>> {
    const url = periodDescription.toUrl();

    const response = await fetch(`/api/temperature/living_room${url}`);
    const json = await response.json();
    const data = parseTemperatureResponse(json);

    return data;
}

function parseResponseRow(row: MeasurementResponse): MeasurementEntry {
    return {
        timestamp: new Date(Date.parse(row[0])),
        value: row[1]
    };
}

function parseTemperatureResponse(seriesResponse: any): Map<string, MeasurementEntry[]> {
    const result = new Map();

    Object.keys(seriesResponse).forEach((seriesName: string) => {
        const series: MeasurementResponse[] = seriesResponse[seriesName];

        result.set(seriesName, series.map(parseResponseRow));
    });

    return result;
}
export default App;
