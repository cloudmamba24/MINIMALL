import React from 'react';
import styles from './Divider.module.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'medium',
  className = '',
}) => {
  return (
    <div 
      className={`
        ${styles.divider} 
        ${styles[orientation]} 
        ${styles[variant]} 
        ${styles[`spacing-${spacing}`]} 
        ${className}
      `}
    />
  );
};