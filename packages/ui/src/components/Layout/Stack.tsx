import type React from "react";
import styles from "./Stack.module.css";

interface StackProps {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  spacing?: "none" | "small" | "medium" | "large";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = "vertical",
  spacing = "medium",
  align = "stretch",
  justify = "start",
  wrap = false,
  className = "",
}) => {
  return (
    <div
      className={`
        ${styles.stack} 
        ${styles[direction]} 
        ${styles[`spacing-${spacing}`]} 
        ${styles[`align-${align}`]} 
        ${styles[`justify-${justify}`]} 
        ${wrap ? styles.wrap : ""} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};
