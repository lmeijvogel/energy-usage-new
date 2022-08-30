import classNames from "classnames";
import { PropsWithChildren } from "react";
import { useSwipeable } from "react-swipeable";

import { DayDescription, PeriodDescription } from "../models/PeriodDescription";

import styles from "./NavigationOverlay.module.css";

type Props = {
    periodDescription: PeriodDescription;
    onSelect: (periodDescription: PeriodDescription) => void;
};

// TODO: Swipe on mobile? https://www.npmjs.com/package/react-swipeable

export function NavigationOverlay({ periodDescription, onSelect, children }: PropsWithChildren<Props>) {
    const previousClicked = () => {
        onSelect(periodDescription.previous());
    };

    const nextClicked = () => {
        onSelect(periodDescription.next());
    };

    const upClicked = () => {
        const up = periodDescription.up();
        if (up) {
            onSelect(up);
        }
    };

    const todayClicked = () => {
        onSelect(DayDescription.today());
    };

    const handlers = useSwipeable({
        onSwipedLeft: nextClicked,
        onSwipedRight: previousClicked
    });

    return (
        <>
            <div {...handlers}>
                <div className={styles.row}>
                    <h1 className={styles.title} onClick={upClicked}>
                        {periodDescription.toTitle()}
                    </h1>
                </div>
                <div className={classNames(styles.button, styles.prevButton)} onClick={previousClicked}>
                    prev
                </div>
                {children}
                <div className={classNames(styles.button, styles.nextButton)} onClick={nextClicked}>
                    next
                </div>
            </div>
            <TodayButton onClick={todayClicked}>Today</TodayButton>
        </>
    );
}

type TodayButtonProps = {
    children: any;
    onClick: () => void;
};
function TodayButton({ children, onClick }: TodayButtonProps) {
    return (
        <button className={styles.todayButton} onClick={onClick}>
            {children}
        </button>
    );
}
