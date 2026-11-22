import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Pagination } from '../types';

export interface Column<T> {
  key?: string;
  accessor?: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (key: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  data,
  pagination,
  onPageChange,
  searchValue = '',
  onSearchChange,
  sortBy,
  sortOrder = 'ASC',
  onSort,
  onAdd,
  addLabel = 'Add Record',
  onRefresh,
  isLoading,
  loading,
  emptyMessage = 'No records found in this table.',
  actions,
}: DataTableProps<T>) {
  const isTableLoading = isLoading !== undefined ? isLoading : Boolean(loading);

  const getColKey = (col: Column<T>, index: number) => {
    return col.key || col.accessor || `col-${index}`;
  };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-sm overflow-hidden">
      {/* Top Header Bar (if title or search or add is provided) */}
      {(title || onSearchChange || onRefresh || onAdd) && (
        <div className="p-3.5 sm:p-4 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60">
          <div>
            {title && <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {onSearchChange && (
              <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search records..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-60 transition"
                />
              </div>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}

            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
          <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              {columns.map((col, idx) => {
                const key = getColKey(col, idx);
                const isSorted = sortBy === key;
                return (
                  <th
                    key={key}
                    style={{ width: col.width }}
                    className={`py-3 px-4 ${col.className || ''} ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-800/60 select-none' : ''
                    }`}
                    onClick={() => col.sortable && onSort && onSort(key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortOrder === 'ASC' ? (
                              <ArrowUp className="w-3 h-3 text-indigo-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-indigo-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 hover:text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {actions && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/40 text-slate-300">
            {isTableLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-700 border-t-indigo-500 mb-2" />
                  <p className="text-xs">Loading database records...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-12 text-center text-slate-500 text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-700/20 transition-colors">
                  {columns.map((col, colIdx) => {
                    const key = getColKey(col, colIdx);
                    return (
                      <td key={key} className={`py-3 px-4 align-middle ${col.className || ''}`}>
                        {col.render ? col.render(item) : (item as any)[key] ?? '—'}
                      </td>
                    );
                  })}
                  {actions && (
                    <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="p-3 border-t border-slate-700/60 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="text-center sm:text-left">
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {data.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{pagination.total}</span> records
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 font-medium text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
