import type React from "react";
import styles from "./Grid.module.css";

interface GridProps {
	children: React.ReactNode;
	columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
	gap?: "small" | "medium" | "large";
	responsive?: boolean;
	className?: string;
}

export const Grid: React.FC<GridProps> = ({
	children,
	columns = 3,
	gap = "medium",
	responsive = true,
	className = "",
}) => {
	return (
		<div
			className={`${styles.grid} ${styles[`cols-${columns}`]} ${styles[`gap-${gap}`]} ${responsive ? styles.responsive : ""} ${className}`}
		>
			{children}
		</div>
	);
};
