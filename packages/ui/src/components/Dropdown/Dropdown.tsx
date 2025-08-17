import type React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

interface DropdownItem {
	label: string;
	value: string;
	icon?: React.ReactNode;
	disabled?: boolean;
}

interface DropdownProps {
	items: DropdownItem[];
	onSelect: (value: string) => void;
	trigger: React.ReactNode;
	className?: string;
	align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({
	items,
	onSelect,
	trigger,
	className = "",
	align = "left",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (value: string) => {
		onSelect(value);
		setIsOpen(false);
	};

	return (
		<div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
			<div 
				className={styles.trigger} 
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setIsOpen(!isOpen);
					}
				}}
				role="button"
				tabIndex={0}
			>
				{trigger}
			</div>
			{isOpen && (
				<div className={`${styles.menu} ${styles[align]}`}>
					{items.map((item) => (
						<button
							type="button"
							key={item.value}
							className={`${styles.item} ${item.disabled ? styles.disabled : ""}`}
							onClick={() => !item.disabled && handleSelect(item.value)}
							disabled={item.disabled}
						>
							{item.icon && <span className={styles.icon}>{item.icon}</span>}
							<span>{item.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
