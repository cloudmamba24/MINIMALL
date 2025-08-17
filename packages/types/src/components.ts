/**
 * Shared component prop types
 */

import type { CSSProperties, ReactNode } from "react";

// Base component props
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  "data-testid"?: string;
}

// Button variants
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
}

// Input types
export interface InputProps extends BaseComponentProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

// Modal props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

// Card props
export interface CardProps extends BaseComponentProps {
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

// Grid props
export interface GridProps extends BaseComponentProps {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

// Loading states
export interface LoadingProps extends BaseComponentProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  text?: string;
}

// Alert props
export interface AlertProps extends BaseComponentProps {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Badge props
export interface BadgeProps extends BaseComponentProps {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  count?: number;
  maxCount?: number;
}

// Avatar props
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  status?: "online" | "offline" | "away" | "busy";
}

// Dropdown props
export interface DropdownProps extends BaseComponentProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}
