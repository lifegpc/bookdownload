import { HTMLProps } from "react";
import styles from "./Icon.module.css";

export interface IconProps extends HTMLProps<HTMLSpanElement> {
    cls?: string;
}

export default function Icon(props: IconProps) {
    return (
        <span {...props} className={`${styles.icon}${props.cls ? ` ${props.cls}` : ''}`}>{props.children}</span>
    )
}
