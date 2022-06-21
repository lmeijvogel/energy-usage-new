// import formatInTimeZone from "date-fns-tz/formatInTimeZone";
// import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc";
import { useEffect, useState } from "react";
import { BarChart } from "./components/charts/BarChart";
import { DayDescription, MonthDescription, PeriodDescription, YearDescription } from "./models/PeriodDescription";

import styles from "./App.module.css";
import { Card } from "./components/Card";
import { CardTitle } from "./components/CardTitle";
import { NavigationButtons } from "./components/NavigationButtons";
import { GasGraphDescription, StroomGraphDescription, WaterGraphDescription } from "./models/GraphDescription";
import { padData } from "./helpers/padData";
import { MeasurementEntry } from "./models/MeasurementEntry";
import { RadialGraph } from "./components/charts/RadialChart";
import { CarpetChart } from "./components/charts/CarpetChart";

// import {     zonedTimeToUtc } from 'date-fns';

export const App = () => {
    const [periodGasData, setPeriodGasData] = useState<number[]>([]);
    const [periodStroomData, setPeriodStroomData] = useState<number[]>([]);
    const [periodWaterData, setPeriodWaterData] = useState<number[]>([]);

    const [radialData, setRadialData] = useState<MeasurementEntry[]>([]);

    const [labels, setLabels] = useState<Date[]>([]);

    // const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(new MonthDescription(2022, 3));
    // const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(new YearDescription(2021));
    const [periodDescription, setPeriodDescription] = useState<PeriodDescription>(new DayDescription(2022, 5, 1));
    useEffect(() => {
        const url = periodDescription.toUrl();

        fetch(`/api/${url}`)
            .then((response) => response.json())
            .then((json) => padData(json, periodDescription.startOfPeriod(), periodDescription.periodSize))
            .then((data: MeasurementEntry[]) => {
                console.log({ data });
                setLabels(data.map((row) => new Date(row.year, row.month + 1, row.day)));
                setPeriodGasData(data.map((row) => row.gas));
                setPeriodStroomData(data.map((row) => row.stroom));
                setPeriodWaterData(data.map((row) => row.water));
            });
    }, [periodDescription, setPeriodGasData]);

    useEffect(() => {
        fetch(`/api/radial_data/month`)
            .then((response) => response.json())
            .then((data: MeasurementEntry[]) => {
                setRadialData(data);
            });
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
            <div className={styles.row}>
                <Card>
                    <CardTitle
                        label="Gas"
                        firstTimestamp={labels[0]}
                        graphDescription={gasGraphDescription}
                        series={periodGasData}
                        fieldName="gas"
                    />
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
                <Card>
                    <CardTitle
                        label="Stroom"
                        firstTimestamp={labels[0]}
                        graphDescription={stroomGraphDescription}
                        series={periodStroomData}
                        fieldName="stroom"
                    />
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
                <Card>
                    <CardTitle
                        label="Water"
                        firstTimestamp={labels[0]}
                        graphDescription={waterGraphDescription}
                        series={periodWaterData}
                        fieldName="water"
                    />
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
            </div>
            <div className={styles.row}>
                <Card>
                    <CardTitle
                        label="Water (radial)"
                        firstTimestamp={labels[0]}
                        labels={labels}
                        graphDescription={waterGraphDescription}
                        series={periodWaterData}
                        fieldName="water"
                    />
                    <RadialGraph
                        graphDescription={waterGraphDescription}
                        series={radialData.map((entry) => entry.water)}
                        fieldName={"water"}
                    />
                </Card>
                <Card className={styles.wideCard}>
                    <CardTitle
                        label="Water (last month)"
                        firstTimestamp={labels[0]}
                        graphDescription={waterGraphDescription}
                        series={periodWaterData}
                        fieldName="water"
                    />
                    <CarpetChart
                        width={300}
                        height={300}
                        fieldName="water"
                        graphDescription={waterGraphDescription}
                        periodDescription={MonthDescription.thisMonth()}
                        entries={radialData}
                    />
                </Card>
            </div>
            <NavigationButtons periodDescription={periodDescription} onSelect={setPeriodDescription} />
        </div>
    );
};

function round(v: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(v * factor) / factor;
}

export default App;
