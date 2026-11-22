import React, { useEffect, useState } from 'react';
import {
  Eye,
  Table,
  Terminal,
  Code2,
  RefreshCw,
  Database,
  Download,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import SQLCodeEditor from '../components/SQLCodeEditor';
import QueryResultTable from '../components/QueryResultTable';
import StatusBadge from '../components/StatusBadge';

interface ViewColumn {
  name: string;
  type: string;
  description: string;
}

interface ViewMetadata {
  name: string;
  title: string;
  description: string;
  columns: ViewColumn[];
  definition: string;
}

export default function Views() {
  const [viewsMeta, setViewsMeta] = useState<ViewMetadata[]>([]);
  const [selectedViewName, setSelectedViewName] = useState<string>('vw_order_report');
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [viewData, setViewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setLoading(true);
        const meta = await api.getViewsMetadata();
        setViewsMeta(meta);
        if (meta.length > 0) {
          setSelectedViewName(meta[0].name);
        }
      } catch (err: any) {
        setError('Failed to load views metadata: ' + (err.message || 'Server error'));
      } finally {
        setLoading(false);
      }
    };
    loadMeta();
  }, []);

  const activeView = viewsMeta.find((v) => v.name === selectedViewName) || viewsMeta[0];

  const fetchViewData = async (name: string) => {
    try {
      setExecuting(true);
      setError(null);
      const res = await api.executeView(name);
      setViewData(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to query view');
      setViewData(null);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if (selectedViewName) {
      fetchViewData(selectedViewName);
    }
  }, [selectedViewName]);

  const handleExportCsv = () => {
    if (!viewData || !viewData.rows || viewData.rows.length === 0) return;

    const headers = viewData.columns.join(',');
    const csvRows = viewData.rows.map((row: any) =>
      viewData.columns
        .map((col: string) => {
          const val = row[col];
          if (val === null || val === undefined) return '""';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedViewName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Eye className="w-7 h-7 text-indigo-400" />
            Database Views Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Query and analyze stored SQL views providing abstraction, security, and precomputed joins
          </p>
        </div>

        <button
          onClick={() => fetchViewData(selectedViewName)}
          disabled={executing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${executing ? 'animate-spin' : ''}`} />
          {executing ? 'Refreshing...' : 'Refresh View'}
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-700/60 gap-2 sm:gap-4 overflow-x-auto pb-1">
        {viewsMeta.map((v) => (
          <button
            key={v.name}
            onClick={() => setSelectedViewName(v.name)}
            className={`pb-2.5 px-2 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
              selectedViewName === v.name
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{v.name}</span>
            <span className="text-[10px] sm:text-[11px] font-normal text-slate-500 hidden sm:inline">({v.title})</span>
          </button>
        ))}
      </div>

      {activeView && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{activeView.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    SQL View
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{activeView.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Columns: {activeView.columns.length}</span>
              </div>
            </div>

            {/* Schema definition table */}
            <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="px-3 py-2 font-medium">Column Name</th>
                    <th className="px-3 py-2 font-medium">Data Type</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activeView.columns.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2 font-mono text-indigo-300 font-medium">{c.name}</td>
                      <td className="px-3 py-2 font-mono text-slate-400">{c.type}</td>
                      <td className="px-3 py-2 text-slate-400">{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SQL Definition Accordion/Code */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Underlying CREATE VIEW SQL Definition
              </span>
              <SQLCodeEditor value={activeView.definition} readOnly={true} minHeight="120px" />
            </div>
          </div>

          {/* Academic Concept Note */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <strong className="block mb-0.5">Academic DBMS Concept — Why Use Views?</strong>
              <p className="text-slate-300 leading-relaxed">
                Views provide <em>logical data independence</em>. They encapsulate complex multi-table joins, aggregations,
                and business classifications behind a clean virtual table interface. Furthermore, database administrators can
                grant users read permissions on a view (such as <code>vw_order_report</code>) without exposing underlying sensitive
                payment or customer credential columns in base tables.
              </p>
            </div>
          </div>

          {/* View Live Data */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-indigo-400" />
                  Live View Query Result
                </span>

                {viewData && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {viewData.rowCount} {viewData.rowCount === 1 ? 'row' : 'rows'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {viewData.executionTimeMs} ms
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!viewData || !viewData.rows || viewData.rows.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="p-4">
              {viewData ? (
                <QueryResultTable
                  columns={viewData.columns}
                  rows={viewData.rows}
                  executionTimeMs={viewData.executionTimeMs}
                  rowCount={viewData.rowCount}
                />
              ) : executing ? (
                <div className="text-center py-12 text-slate-400 text-xs">Executing SELECT * FROM {selectedViewName}...</div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
