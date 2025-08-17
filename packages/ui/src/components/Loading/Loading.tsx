import type React from "react";
import styles from "./Loading.module.css";

interface LoadingProps {
	size?: "small" | "medium" | "large";
	text?: string;
	fullScreen?: boolean;
	className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
	size = "medium",
	text,
	fullScreen = false,
	className = "",
}) => {
	const content = (
		<div className={`${styles.loading} ${className}`}>
			<div className={`${styles.spinner} ${styles[size]}`}>
				<div />
				<div />
				<div />
				<div />
			</div>
			{text && <p className={styles.text}>{text}</p>}
		</div>
	);

	if (fullScreen) {
		return <div className={styles.fullScreen}>{content}</div>;
	}

	return content;
};
