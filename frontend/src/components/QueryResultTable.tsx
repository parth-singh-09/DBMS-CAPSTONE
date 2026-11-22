import React from 'react';
import { Download, Clock, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { QueryResult } from '../types';

export interface QueryResultTableProps {
  result?: QueryResult | null;
  columns?: string[];
  rows?: any[];
  executionTimeMs?: number;
  rowCount?: number;
  isLoading?: boolean;
}

export const QueryResultTable: React.FC<QueryResultTableProps> = ({
  result,
  columns: propColumns,
  rows: propRows,
  executionTimeMs: propTime,
  rowCount: propCount,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Executing SQL query against MySQL 8.4 engine...</p>
      </div>
    );
  }

  // Support both result object or direct props
  const columns = result ? result.columns : propColumns || [];
  const rows = result ? result.rows : propRows || [];
  const timeMs = result ? result.executionTimeMs : propTime ?? 0;
  const count = result ? result.rowCount : propCount ?? rows.length;
  const isSuccess = result ? result.success : true;
  const error = result?.error;

  if (!result && (!columns || columns.length === 0)) {
    return (
      <div className="bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
        <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-300">No query executed yet</p>
        <p className="text-xs text-slate-500 mt-1">Select a query from the catalog or write SQL and click "Run Query"</p>
      </div>
    );
  }

  const exportToCsv = () => {
    if (!rows || rows.length === 0) return;
    const headers = columns.join(',');
    const csvRows = rows
      .map((row) =>
        columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\n');

    const csvContent = headers + '\n' + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Result Metrics Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isSuccess
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
            {isSuccess ? 'SUCCESS' : 'FAILED'}
          </span>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Time: <strong className="text-slate-200">{timeMs} ms</strong></span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Returned Rows: <strong className="text-slate-200">{count}</strong></span>
          </div>
        </div>

        {isSuccess && count > 0 && (
          <button
            onClick={exportToCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {!isSuccess && error && (
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-sm">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error.code}</p>
              <p className="text-xs font-mono mt-1 text-rose-300 leading-relaxed">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Data Table */}
      {isSuccess && (
        <div className="overflow-x-auto max-h-[480px]">
          {count === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Query executed successfully, but 0 rows matched the condition.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-slate-500 font-normal">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 border-l border-slate-800/80">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                    {columns.map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className="py-2 px-3 border-l border-slate-800/60 font-mono">
                          {val === null || val === undefined ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryResultTable;
