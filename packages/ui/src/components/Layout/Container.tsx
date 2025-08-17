import type React from "react";
import styles from "./Container.module.css";

interface ContainerProps {
	children: React.ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
	padding?: boolean;
	className?: string;
}

export const Container: React.FC<ContainerProps> = ({
	children,
	maxWidth = "lg",
	padding = true,
	className = "",
}) => {
	return (
		<div
			className={`${styles.container} ${styles[`max-${maxWidth}`]} ${padding ? styles.padding : ""} ${className}`}
		>
			{children}
		</div>
	);
};
