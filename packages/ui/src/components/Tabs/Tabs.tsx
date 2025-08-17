import type React from "react";
import { useState } from "react";
import styles from "./Tabs.module.css";

interface Tab {
	key: string;
	label: string;
	content: React.ReactNode;
	disabled?: boolean;
}

interface TabsProps {
	tabs: Tab[];
	defaultActiveKey?: string;
	onChange?: (key: string) => void;
	className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
	tabs,
	defaultActiveKey,
	onChange,
	className = "",
}) => {
	const [activeKey, setActiveKey] = useState(defaultActiveKey || tabs[0]?.key);

	const handleTabClick = (key: string) => {
		setActiveKey(key);
		onChange?.(key);
	};

	const activeTab = tabs.find((tab) => tab.key === activeKey);

	return (
		<div className={`${styles.tabs} ${className}`}>
			<div className={styles.tabList}>
				{tabs.map((tab) => (
					<button
						type="button"
						key={tab.key}
						className={`${styles.tab} ${activeKey === tab.key ? styles.active : ""} ${tab.disabled ? styles.disabled : ""}`}
						onClick={() => !tab.disabled && handleTabClick(tab.key)}
						disabled={tab.disabled}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className={styles.tabContent}>{activeTab?.content}</div>
		</div>
	);
};
