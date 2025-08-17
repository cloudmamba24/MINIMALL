import React from 'react';
import styles from './Table.module.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${styles.header} ${styles[`align-${column.align || 'left'}`]}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${styles.cell} ${styles[`align-${column.align || 'left'}`]}`}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}