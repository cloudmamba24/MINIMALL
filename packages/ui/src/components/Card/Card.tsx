import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'bordered' | 'shadow';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  onClick,
  className = '',
  variant = 'default',
}) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};