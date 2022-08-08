import classnames from "classnames";
import { ReactElement } from "react";
import styles from "./Card.module.css";

type Props = {
    className?: string;
    title?: string;
    children: JSX.Element | JSX.Element[];
};

export const Card = ({ className, title, children }: Props) => {
    return (
        <div className={classnames(styles.card, className)}>
            {!!title && <h3 className={styles.title}>{title}</h3>}
            {children}
        </div>
    );
};
