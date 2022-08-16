// import formatInTimeZone from "date-fns-tz/formatInTimeZone";
// import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc";
import { useEffect, useState } from "react";
import { BarChart } from "./components/charts/BarChart";
import { DayDescription, MonthDescription, PeriodDescription, YearDescription } from "./models/PeriodDescription";

import styles from "./App.module.css";
import { Card } from "./components/Card";
import { buildUsageCardTitle } from "./components/CardTitle";
import { NavigationButtons } from "./components/NavigationButtons";
import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "./models/GraphDescription";
import { padData } from "./helpers/padData";
import { MeasurementEntry } from "./models/MeasurementEntry";
import { CarpetChart } from "./components/charts/CarpetChart";
import { Row } from "./components/Row";
import { LineChart } from "./components/charts/LineChart";
import { UsageField } from "./models/UsageData";

export type MeasurementResponse = [timestampString: string, value: number];

export const App = () => {
    const [periodGasData, setPeriodGasData] = useState<MeasurementEntry[]>([]);
    const [periodStroomData, setPeriodStroomData] = useState<MeasurementEntry[]>([]);
    const [periodWaterData, setPeriodWaterData] = useState<MeasurementEntry[]>([]);

    const [carpetGasData, setCarpetGasData] = useState<MeasurementEntry[]>([]);
    const [carpetStroomData, setCarpetStroomData] = useState<MeasurementEntry[]>([]);
    const [carpetWaterData, setCarpetWaterData] = useState<MeasurementEntry[]>([]);

    const [recentPowerUsage, setRecentPowerUsage] = useState<any[]>([]);
    const [currentPowerUsageWatts, setCurrentPowerUsageWatts] = useState<number>(0);

    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(DayDescription.today().previous());
    useEffect(() => {
        fetchData("gas", periodDescription).then(setPeriodGasData);

        fetchData("stroom", periodDescription).then(setPeriodStroomData);

        fetchData("water", periodDescription).then(setPeriodWaterData);
    }, [periodDescription, setPeriodGasData, setPeriodStroomData, setPeriodWaterData]);

    useEffect(() => {
        fetchCarpetData("gas").then(setCarpetGasData);
        fetchCarpetData("stroom").then(setCarpetStroomData);
        fetchCarpetData("water").then(setCarpetWaterData);
    }, []);

    useEffect(() => {
        const updatePowerUsage = () => {
            fetch("/api/stroom/recent")
                .then((response) => response.json())
                .then((json) => json.map(parseResponseRow))
                .then((data: MeasurementEntry[]) => {
                    setRecentPowerUsage(data);

                    setCurrentPowerUsageWatts(data.length > 0 ? data[0].value * 1000 : 0);
                });
        };

        updatePowerUsage();

        const interval = setInterval(() => updatePowerUsage(), 15 * 1000);

        return () => clearInterval(interval);
    }, []);

    const choosePeriod = (index: number) => {
        const newPeriod = periodDescription.atIndex(index);

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
                        series={periodGasData.map((el) => el.value)}
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
                        series={periodStroomData.map((el) => el.value)}
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
                        series={periodWaterData.map((el) => el.value)}
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
                        periodDescription={periodDescription}
                        graphDescription={stroomGraphDescription}
                        valuesWithTimestamp={recentPowerUsage}
                        onBarClick={choosePeriod}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={periodDescription.graphTickPositions}
                    />
                </Card>
            </Row>
            <NavigationButtons periodDescription={periodDescription} onSelect={setPeriodDescription} />
        </div>
    );
};

async function fetchData(fieldName: UsageField, periodDescription: PeriodDescription): Promise<MeasurementEntry[]> {
    const url = periodDescription.toUrl();

    const response = await fetch(`/api/${fieldName}${url}`);
    const json = await response.json();
    const data = json.map(parseResponseRow);
    const paddedData = padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize);

    return paddedData;
}

async function fetchCarpetData(fieldName: UsageField): Promise<MeasurementEntry[]> {
    return fetch(`/api/${fieldName}/last_30_days`)
        .then((response) => response.json())
        .then((json) => json.map(parseResponseRow));
}
function parseResponseRow(row: MeasurementResponse): MeasurementEntry {
    return {
        timestamp: new Date(Date.parse(row[0])),
        value: row[1]
    };
}
export default App;
