import type React from "react";
import styles from "./Form.module.css";

interface FormProps {
	children: React.ReactNode;
	onSubmit: (e: React.FormEvent) => void;
	className?: string;
}

interface FormFieldProps {
	label: string;
	children: React.ReactNode;
	error?: string;
	required?: boolean;
	className?: string;
}

interface FormActionsProps {
	children: React.ReactNode;
	align?: "left" | "center" | "right";
	className?: string;
}

export const Form: React.FC<FormProps> & {
	Field: React.FC<FormFieldProps>;
	Actions: React.FC<FormActionsProps>;
} = ({ children, onSubmit, className = "" }) => {
	return (
		<form className={`${styles.form} ${className}`} onSubmit={onSubmit}>
			{children}
		</form>
	);
};

const FormField: React.FC<FormFieldProps> = ({
	label,
	children,
	error,
	required,
	className = "",
}) => {
	return (
		<div className={`${styles.field} ${className}`}>
			<label className={styles.label}>
				{label}
				{required && <span className={styles.required}>*</span>}
			</label>
			{children}
			{error && <span className={styles.error}>{error}</span>}
		</div>
	);
};

const FormActions: React.FC<FormActionsProps> = ({
	children,
	align = "right",
	className = "",
}) => {
	return (
		<div
			className={`${styles.actions} ${styles[`align-${align}`]} ${className}`}
		>
			{children}
		</div>
	);
};

Form.Field = FormField;
Form.Actions = FormActions;
