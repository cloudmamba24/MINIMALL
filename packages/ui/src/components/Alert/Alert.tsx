import type React from "react";
import styles from "./Alert.module.css";

interface AlertProps {
  children: React.ReactNode;
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  type = "info",
  title,
  onClose,
  className = "",
}) => {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  return (
    <div className={`${styles.alert} ${styles[type]} ${className}`} role="alert">
      <div className={styles.icon}>{icons[type]}</div>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
};
