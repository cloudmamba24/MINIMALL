import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'medium',
  shape = 'circle',
  className = '',
}) => {
  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`${styles.avatar} ${styles[size]} ${styles[shape]} ${className}`}>
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className={styles.image} />
      ) : (
        <span className={styles.initials}>
          {name ? getInitials(name) : '?'}
        </span>
      )}
    </div>
  );
};