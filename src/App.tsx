// import formatInTimeZone from "date-fns-tz/formatInTimeZone";
// import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc";
import { useEffect, useState } from "react";
import { BarChart } from "./components/charts/BarChart";
import { DayDescription, MonthDescription, PeriodDescription, YearDescription } from "./models/PeriodDescription";

import styles from "./App.module.css";
import { Card } from "./components/Card";
import { buildUsageCardTitle, CardTitle } from "./components/CardTitle";
import { NavigationButtons } from "./components/NavigationButtons";
import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "./models/GraphDescription";
import { padData } from "./helpers/padData";
import { MeasurementEntry } from "./models/MeasurementEntry";
import { CarpetChart } from "./components/charts/CarpetChart";
import { Row } from "./components/Row";
import { LineChart } from "./components/charts/LineChart";

export type MeasurementResponse = [timestampString: string, value: number];

export const App = () => {
    const [periodGasData, setPeriodGasData] = useState<MeasurementEntry[]>([]);
    const [periodStroomData, setPeriodStroomData] = useState<MeasurementEntry[]>([]);
    const [periodWaterData, setPeriodWaterData] = useState<MeasurementEntry[]>([]);

    const [radialData, setRadialData] = useState<MeasurementEntry[]>([]);

    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(DayDescription.today().previous());
    useEffect(() => {
        const url = periodDescription.toUrl();

        fetch(`/api/gas${url}`)
            .then((response) => response.json())
            .then((json) => json.map(parseResponseRow))
            .then((data: MeasurementEntry[]) =>
                padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize)
            )
            .then(setPeriodGasData);

        fetch(`/api/stroom${url}`)
            .then((response) => response.json())
            .then((json) => json.map(parseResponseRow))
            .then((data: MeasurementEntry[]) =>
                padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize)
            )
            .then(setPeriodStroomData);

        fetch(`/api/water${url}`)
            .then((response) => response.json())
            .then((json) => json.map(parseResponseRow))
            .then((data: MeasurementEntry[]) =>
                padData(data, periodDescription.startOfPeriod(), periodDescription.periodSize)
            )
            .then(setPeriodWaterData);
    }, [periodDescription, setPeriodGasData, setPeriodStroomData, setPeriodStroomData]);

    // useEffect(() => {
    // fetch("/api/radial_data/last_30_days")
    // .then((response) => response.json())
    // .then((data: MeasurementEntry[]) => {
    // setRadialData(data);
    // });
    // }, []);

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
                        entries={radialData}
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
                        entries={radialData}
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
                        entries={radialData}
                    />
                </Card>
            </Row>
            <Row>
                <LineChart />
            </Row>
            <NavigationButtons periodDescription={periodDescription} onSelect={setPeriodDescription} />
        </div>
    );
};

function parseResponseRow(row: MeasurementResponse): MeasurementEntry {
    return {
        timestamp: new Date(Date.parse(row[0])),
        value: row[1]
    };
}
export default App;
