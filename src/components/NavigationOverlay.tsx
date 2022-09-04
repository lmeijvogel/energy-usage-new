import classNames from "classnames";
import { PropsWithChildren, useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";

import { DayDescription, PeriodDescription } from "../models/PeriodDescription";

import styles from "./NavigationOverlay.module.css";

type Edge = "top" | "left" | "right";

type Props = {
    periodDescription: PeriodDescription;
    onSelect: (periodDescription: PeriodDescription) => void;
};

function getWindowWidth() {
    const rects = document.body.getClientRects();
    return rects[0].width;
}

function useDetectMouseAtWindowEdge(displayThresholdInPx: number): [Edge[], (x: number, y: number) => void] {
    const [windowWidth, setWindowWidth] = useState(getWindowWidth());
    const [activeEdges, setActiveEdges] = useState<Edge[]>([]);

    useEffect(() => {
        const onResize = () => {
            setWindowWidth(getWindowWidth());
        };
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
        };
    });

    const setMouseCoords = (x: number, y: number) => {
        const mouseAtLeftEdge = x <= displayThresholdInPx;
        const mouseAtRightEdge = x >= windowWidth - displayThresholdInPx;
        const mouseAtTopEdge = y <= displayThresholdInPx;

        const activeEdges: Edge[] = [];
        if (mouseAtTopEdge) activeEdges.push("top");
        if (mouseAtLeftEdge) activeEdges.push("left");
        if (mouseAtRightEdge) activeEdges.push("right");

        setActiveEdges(activeEdges);
    };

    return [activeEdges, setMouseCoords];
}

export function NavigationOverlay({ periodDescription, onSelect, children }: PropsWithChildren<Props>) {
    const [activeEdges, setMouseCoords] = useDetectMouseAtWindowEdge(60);

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
        setMouseCoords(event.clientX, event.pageY);
    };

    return (
        <>
            <div className={styles.navigationOverlay} {...handlers} onMouseMove={onMouseMove}>
                <div
                    className={classNames(styles.upButtonsContainer, { [styles.visible]: activeEdges.includes("top") })}
                    onClick={upClicked}
                >
                    up
                </div>
                <div className={styles.row}>
                    <h1 className={styles.title} onClick={upClicked}>
                        {periodDescription.toTitle()}
                    </h1>
                </div>
                <div
                    className={classNames(styles.button, styles.prevButton, {
                        [styles.visible]: activeEdges.includes("left")
                    })}
                    onClick={previousClicked}
                >
                    prev
                </div>
                {children}
                <div
                    className={classNames(styles.button, styles.nextButton, {
                        [styles.visible]: activeEdges.includes("right")
                    })}
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
