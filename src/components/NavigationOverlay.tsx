import classNames from "classnames";
import { PropsWithChildren, useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";

import { DayDescription, PeriodDescription } from "../models/PeriodDescription";

import styles from "./NavigationOverlay.module.css";

type Props = {
    periodDescription: PeriodDescription;
    onSelect: (periodDescription: PeriodDescription) => void;
};

function getWindowWidth() {
    const rects = document.body.getClientRects();
    return rects[0].width;
}

function useDetectMouseAtWindowEdge(displayThresholdInPx: number): [boolean, (x: number) => void] {
    const [windowWidth, setWindowWidth] = useState(getWindowWidth());
    const [isMouseAtEdge, setMouseAtEdge] = useState(false);

    useEffect(() => {
        const onResize = () => {
            setWindowWidth(getWindowWidth());
        };
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
        };
    });

    const setMouseX = (x: number) => {
        const mouseAtEdge = x <= displayThresholdInPx || x >= windowWidth - displayThresholdInPx;

        setMouseAtEdge(mouseAtEdge);
    };

    return [isMouseAtEdge, setMouseX];
}

export function NavigationOverlay({ periodDescription, onSelect, children }: PropsWithChildren<Props>) {
    const [isMouseAtEdge, setMouseX] = useDetectMouseAtWindowEdge(60);

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

    const onMouseMove = (event: any) => {
        setMouseX(event.clientX);
    };

    return (
        <>
            <div className={styles.navigationOverlay} {...handlers} onMouseMove={onMouseMove}>
                <div className={styles.row}>
                    <h1 className={styles.title} onClick={upClicked}>
                        {periodDescription.toTitle()}
                    </h1>
                </div>
                <div
                    className={classNames(styles.button, styles.prevButton, { [styles.hidden]: !isMouseAtEdge })}
                    onClick={previousClicked}
                >
                    prev
                </div>
                {children}
                <div
                    className={classNames(styles.button, styles.nextButton, { [styles.hidden]: !isMouseAtEdge })}
                    onClick={nextClicked}
                >
                    next
                </div>
            </div>
            <div className={styles.buttonContainer}>
                <TodayButton onClick={todayClicked}>Today</TodayButton>
            </div>
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
