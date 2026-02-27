import { HTMLProps } from "react";
import styles from "./Icon.module.css";

export default function Icon(props: HTMLProps<HTMLSpanElement>) {
    return (
        <span {...props} className={`${styles.icon}${props.className ? ` ${props.className}` : ''}`}>{props.children}</span>
    )
}
