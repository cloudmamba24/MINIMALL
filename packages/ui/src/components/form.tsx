/**
 * Form Components
 * Comprehensive form controls with validation and accessibility
 */

import React, {
	forwardRef,
	useState,
	useId,
	createContext,
	useContext,
} from "react";
import { cn } from "../lib/utils";

// Form Context
const FormContext = createContext<{
	errors: Record<string, string>;
	isSubmitting: boolean;
}>({
	errors: {},
	isSubmitting: false,
});

// Button Component
export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			loading,
			children,
			disabled,
			...props
		},
		ref,
	) => {
		return (
			<button
				className={cn(
					"inline-flex items-center justify-center rounded-md font-medium transition-colors",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
					"disabled:pointer-events-none disabled:opacity-50",
					{
						"bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary":
							variant === "primary",
						"bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary":
							variant === "secondary",
						"bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive":
							variant === "danger",
						"hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent":
							variant === "ghost",
					},
					{
						"h-8 px-3 text-sm": size === "sm",
						"h-10 px-4": size === "md",
						"h-12 px-6 text-lg": size === "lg",
					},
					`btn-${variant}`,
					`btn-${size}`,
					className,
				)}
				ref={ref}
				disabled={disabled || loading}
				{...props}
			>
				{loading ? "Loading..." : children}
			</button>
		);
	},
);
Button.displayName = "Button";

// Input Component
export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helpText?: string;
	validate?: (value: string) => string | null;
	debounceMs?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			label,
			error,
			helpText,
			required,
			id,
			validate,
			debounceMs,
			name,
			...props
		},
		ref,
	) => {
		const [validationError, setValidationError] = useState<string | null>(null);
		const { errors: formErrors } = useContext(FormContext);
		const inputId = useId();
		const finalId = id || inputId;
		const errorId = `${finalId}-error`;
		const helpId = `${finalId}-help`;
		const formError = name ? formErrors[name] : null;
		const displayError = error || validationError || formError;

		// Debounced validation
		React.useEffect(() => {
			if (!validate || !props.value || typeof props.value !== "string") return;

			const timeoutId = setTimeout(() => {
				const result = validate(props.value as string);
				setValidationError(result);
			}, debounceMs || 0);

			return () => clearTimeout(timeoutId);
		}, [props.value, validate, debounceMs]);

		return (
			<div className="space-y-2">
				{label && (
					<label htmlFor={finalId} className="text-sm font-medium">
						{label}
						{required && <span className="text-destructive ml-1">*</span>}
					</label>
				)}
				<input
					id={finalId}
					name={name}
					required={required}
					ref={ref}
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
						"text-sm ring-offset-background file:border-0 file:bg-transparent",
						"file:text-sm file:font-medium placeholder:text-muted-foreground",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						"focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						displayError && "border-destructive input-error",
						className,
					)}
					aria-describedby={cn(displayError && errorId, helpText && helpId)}
					aria-invalid={!!displayError}
					{...props}
				/>
				{helpText && (
					<p id={helpId} className="text-sm text-muted-foreground">
						{helpText}
					</p>
				)}
				{displayError && (
					<p id={errorId} className="text-sm text-destructive" role="alert">
						{displayError}
					</p>
				)}
			</div>
		);
	},
);
Input.displayName = "Input";

// TextArea Component
export interface TextAreaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helpText?: string;
	showCharCount?: boolean;
	maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	(
		{
			className,
			label,
			error,
			helpText,
			showCharCount,
			maxLength,
			required,
			id,
			value,
			...props
		},
		ref,
	) => {
		const inputId = useId();
		const finalId = id || inputId;
		const charCount = typeof value === "string" ? value.length : 0;

		return (
			<div className="space-y-2">
				{label && (
					<label htmlFor={finalId} className="text-sm font-medium">
						{label}
						{required && <span className="text-destructive ml-1">*</span>}
					</label>
				)}
				<textarea
					id={finalId}
					ref={ref}
					className={cn(
						"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
						"text-sm ring-offset-background placeholder:text-muted-foreground",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						"focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-destructive",
						className,
					)}
					maxLength={maxLength}
					value={value}
					{...props}
				/>
				<div className="flex justify-between">
					<div>
						{helpText && (
							<p className="text-sm text-muted-foreground">{helpText}</p>
						)}
						{error && (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</div>
					{showCharCount && maxLength && (
						<p className="text-sm text-muted-foreground">
							{charCount}/{maxLength}
						</p>
					)}
				</div>
			</div>
		);
	},
);
TextArea.displayName = "TextArea";

// Select Component
export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps
	extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
	label?: string;
	error?: string;
	options: SelectOption[];
	placeholder?: string;
	onChange?: (value: string | string[]) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			className,
			label,
			error,
			options,
			placeholder,
			required,
			id,
			onChange,
			...props
		},
		ref,
	) => {
		const inputId = useId();
		const finalId = id || inputId;

		const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
			if (props.multiple) {
				const values = Array.from(
					e.target.selectedOptions,
					(option) => option.value,
				);
				onChange?.(values);
			} else {
				onChange?.(e.target.value);
			}
		};

		return (
			<div className="space-y-2">
				{label && (
					<label htmlFor={finalId} className="text-sm font-medium">
						{label}
						{required && <span className="text-destructive ml-1">*</span>}
					</label>
				)}
				<select
					id={finalId}
					ref={ref}
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
						"text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2",
						"focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-destructive",
						className,
					)}
					onChange={handleChange}
					{...props}
				>
					{placeholder && <option value="">{placeholder}</option>}
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{error && (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				)}
			</div>
		);
	},
);
Select.displayName = "Select";

// Checkbox Component
export interface CheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	label?: string;
	error?: string;
	indeterminate?: boolean;
	onChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, label, error, indeterminate, id, onChange, ...props }, ref) => {
		const inputId = useId();
		const finalId = id || inputId;

		React.useEffect(() => {
			if (ref && "current" in ref && ref.current) {
				ref.current.indeterminate = !!indeterminate;
			}
		}, [indeterminate, ref]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e.target.checked);
		};

		return (
			<div className="space-y-2">
				<div className="flex items-center space-x-2">
					<input
						type="checkbox"
						id={finalId}
						ref={ref}
						className={cn(
							"h-4 w-4 rounded border border-input ring-offset-background",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							"focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
							className,
						)}
						onChange={handleChange}
						{...props}
					/>
					{label && (
						<label htmlFor={finalId} className="text-sm font-medium">
							{label}
						</label>
					)}
				</div>
				{error && (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				)}
			</div>
		);
	},
);
Checkbox.displayName = "Checkbox";

// RadioGroup Component
export interface RadioOption {
	value: string;
	label: string;
}

export interface RadioGroupProps {
	label?: string;
	name: string;
	options: RadioOption[];
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
	label,
	name,
	options,
	value,
	onChange,
	error,
}) => {
	return (
		<div className="space-y-2">
			{label && <div className="text-sm font-medium">{label}</div>}
			<div className="space-y-2">
				{options.map((option) => (
					<div key={option.value} className="flex items-center space-x-2">
						<input
							type="radio"
							id={`${name}-${option.value}`}
							name={name}
							value={option.value}
							checked={value === option.value}
							onChange={(e) => onChange?.(e.target.value)}
							className="h-4 w-4 border border-input focus-visible:ring-2 focus-visible:ring-ring"
						/>
						<label htmlFor={`${name}-${option.value}`} className="text-sm">
							{option.label}
						</label>
					</div>
				))}
			</div>
			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};

// Form Component
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
	onSubmit?: (data: FormData | Record<string, any>) => void | Promise<void>;
	validateOnSubmit?: boolean;
}

export const Form: React.FC<FormProps> = ({
	children,
	onSubmit,
	validateOnSubmit = true,
	...props
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const validateForm = (formElement: HTMLFormElement): boolean => {
		if (!validateOnSubmit) return true;

		const errors: Record<string, string> = {};
		const formData = new FormData(formElement);

		// Check required fields
		const requiredFields = formElement.querySelectorAll("[required]");
		for (const field of requiredFields) {
			const input = field as HTMLInputElement;
			const name = input.name;
			const value = formData.get(name) as string;

			if (!value || value.trim() === "") {
				errors[name] = "This field is required";
			}
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!onSubmit) return;

		const isValid = validateForm(e.currentTarget);
		if (!isValid) return;

		setIsSubmitting(true);
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		try {
			await onSubmit(data);
			setFormErrors({});
		} catch (error) {
			console.error("Form submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReset = () => {
		setIsSubmitting(false);
	};

	return (
		<FormContext.Provider value={{ errors: formErrors, isSubmitting }}>
			<form onSubmit={handleSubmit} onReset={handleReset} {...props}>
				{isSubmitting && <div className="loading-overlay">Loading...</div>}
				{children}
				{Object.entries(formErrors).map(([field, error]) => (
					<div key={field} className="text-sm text-destructive" role="alert">
						{error}
					</div>
				))}
			</form>
		</FormContext.Provider>
	);
};

// FormField Component
export interface FormFieldProps {
	label?: string;
	name?: string;
	error?: string;
	helpText?: string;
	required?: boolean;
	children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
	label,
	name,
	error,
	helpText,
	required,
	children,
}) => {
	const fieldId = `form-field-${name || "unnamed"}-${Math.random().toString(36).substr(2, 9)}`;

	// Clone children and inject error prop
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			return React.cloneElement(child, {
				error: error || (child.props as any).error,
				name: name || (child.props as any).name,
				id: fieldId,
				required:
					required !== undefined ? required : (child.props as any).required,
			} as any);
		}
		return child;
	});

	return (
		<div className="space-y-2">
			{label && (
				<label className="text-sm font-medium" htmlFor={fieldId}>
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</label>
			)}
			<div className={error ? "has-error" : ""}>{childrenWithProps}</div>
			{helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};

// FormError Component
export interface FormErrorProps {
	children?: React.ReactNode;
}

export const FormError: React.FC<FormErrorProps> = ({ children }) => {
	if (!children) return null;

	return (
		<div className="text-sm text-destructive" role="alert">
			{children}
		</div>
	);
};

// FormSubmit Component
export interface FormSubmitProps extends ButtonProps {
	loading?: boolean;
}

export const FormSubmit: React.FC<FormSubmitProps> = ({
	children,
	loading,
	disabled,
	...props
}) => {
	return (
		<Button
			type="submit"
			disabled={disabled || loading}
			loading={loading ?? false}
			{...props}
		>
			{children}
		</Button>
	);
};
