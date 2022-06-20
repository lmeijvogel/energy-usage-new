import classnames from "classnames";
import { ReactElement } from "react";
import styles from "./Card.module.css";

type Props = {
    className?: string;
    children: ReactElement | ReactElement[];
};

export function Card({ className, children }: Props) {
    return <div className={classnames(styles.card, className)}>{children}</div>;
}
