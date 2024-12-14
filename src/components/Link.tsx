import { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
    href: string;
    target: string;
    rel: string;
    className: string;
    style: CSSProperties;
    children: ReactNode;
}

export default function ({ href, target, rel, className, style, children }: Props) {
    return (
        <Link className={className} style={style} to={href} target={target} rel={rel}>
            {children}
        </Link>
    )
}