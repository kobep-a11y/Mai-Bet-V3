import React from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  hover?: boolean;
  striped?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, hover = true, striped = false, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn(
            'w-full text-sm text-left',
            hover && '[&_tbody_tr]:hover:bg-gray-50 [&_tbody_tr]:transition-colors',
            striped && '[&_tbody_tr:nth-child(even)]:bg-gray-50',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-gray-50 border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('divide-y divide-gray-200', className)}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn('border-b border-gray-200 last:border-0', className)}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable, sorted, onSort, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
          sortable && 'cursor-pointer select-none hover:text-gray-700',
          className
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && (
            <span className="inline-flex flex-col">
              <svg
                className={cn(
                  'w-3 h-3',
                  sorted === 'asc' ? 'text-sky-600' : 'text-gray-400'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 10l5-5 5 5H5z" />
              </svg>
              <svg
                className={cn(
                  'w-3 h-3 -mt-1',
                  sorted === 'desc' ? 'text-sky-600' : 'text-gray-400'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M15 10l-5 5-5-5h10z" />
              </svg>
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('px-6 py-4 whitespace-nowrap', className)}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children: React.ReactNode;
}

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-gray-500', className)}
        {...props}
      >
        {children}
      </caption>
    );
  }
);

TableCaption.displayName = 'TableCaption';

export default Table;
