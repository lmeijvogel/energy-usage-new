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

// import {     zonedTimeToUtc } from 'date-fns';

export const App = () => {
    const [gasData, setGasData] = useState<number[]>([]);
    const [stroomData, setStroomData] = useState<number[]>([]);
    const [waterData, setWaterData] = useState<number[]>([]);
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
                setGasData(data.map((row) => row.gas));
                setStroomData(data.map((row) => row.stroom));
                setWaterData(data.map((row) => row.water));
            });
    }, [periodDescription, setGasData]);

    const choosePeriod = (index: number) => {
        if (periodDescription instanceof MonthDescription || periodDescription instanceof YearDescription) {
            setPeriodDescription(periodDescription.atIndex(index));
        }
    };

    const toString = (el: any) => el.toString();

    return (
        <div className="app">
            <div className={styles.row}>
                <h1>{periodDescription.toTitle()}</h1>
            </div>
            <div className={styles.row}>
                <Card>
                    <CardTitle label="Gas" labels={labels} series={gasData} fieldName="gas" />
                    <BarChart
                        label="Gas"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        graphDescription={new GasGraphDescription(periodDescription)}
                        series={gasData}
                        onBarClick={choosePeriod}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={periodDescription.graphTickPositions}
                    />
                </Card>
                <Card>
                    <CardTitle label="Stroom" labels={labels} series={stroomData} fieldName="stroom" />
                    <BarChart
                        label="Stroom"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        graphDescription={new StroomGraphDescription(periodDescription)}
                        series={stroomData}
                        onBarClick={choosePeriod}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={periodDescription.graphTickPositions}
                    />
                </Card>
                <Card>
                    <CardTitle label="Water" labels={labels} series={waterData} fieldName="water" />
                    <BarChart
                        label="Water"
                        className={styles.mainGraph}
                        periodDescription={periodDescription}
                        graphDescription={new WaterGraphDescription(periodDescription)}
                        series={waterData}
                        onBarClick={choosePeriod}
                        tooltipLabelBuilder={toString}
                        graphTickPositions={periodDescription.graphTickPositions}
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
