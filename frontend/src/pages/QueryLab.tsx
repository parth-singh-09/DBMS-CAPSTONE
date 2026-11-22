import React, { useEffect, useState, useMemo } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Download,
  Database,
  Code2,
  Table2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { PredefinedQuery, QueryResult } from '../types';
import SQLCodeEditor from '../components/SQLCodeEditor';
import QueryResultTable from '../components/QueryResultTable';

const CATEGORIES = [
  'All',
  'Joins',
  'Subqueries',
  'Set Operations',
  'Business Analytics',
  'Advanced SQL',
  'Aggregates',
  'Filtering',
] as const;

export default function QueryLab() {
  const [catalog, setCatalog] = useState<PredefinedQuery[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentSql, setCurrentSql] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const list = await api.getQueryCatalog();
        const safeList = Array.isArray(list) ? list : [];
        setCatalog(safeList);
        if (safeList.length > 0) {
          setSelectedQueryId(safeList[0].id);
          setCurrentSql(safeList[0].sql);
        }
      } catch (err: any) {
        setError('Failed to load SQL query catalog: ' + (err.message || 'Server error'));
        setCatalog([]);
      }
    };
    fetchCatalog();
  }, []);

  const activeQuery = useMemo(() => {
    return Array.isArray(catalog) ? catalog.find((q) => q.id === selectedQueryId) || null : null;
  }, [catalog, selectedQueryId]);

  const filteredCatalog = useMemo(() => {
    if (!Array.isArray(catalog)) return [];
    return catalog.filter((q) => {
      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.sqlConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  const handleSelectQuery = (query: PredefinedQuery) => {
    setSelectedQueryId(query.id);
    setCurrentSql(query.sql);
    setError(null);
    setResult(null);
  };

  const handleResetSql = () => {
    if (activeQuery) {
      setCurrentSql(activeQuery.sql);
      setError(null);
    }
  };

  const handleExecute = async () => {
    if (!currentSql.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // If the SQL is unchanged from the active predefined query, use the predefined endpoint; otherwise execute custom
      let res: QueryResult;
      if (activeQuery && currentSql.trim() === activeQuery.sql.trim()) {
        const fullRes = await api.executePredefinedQuery(activeQuery.id);
        res = fullRes;
      } else {
        res = await api.executeCustomQuery(currentSql);
      }

      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Execution error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!result || !result.rows || result.rows.length === 0) return;

    const headers = result.columns.join(',');
    const csvRows = result.rows.map((row) =>
      result.columns
        .map((col) => {
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
    link.setAttribute('download', `query_result_${activeQuery?.id || 'custom'}_${Date.now()}.csv`);
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
            <Terminal className="w-7 h-7 text-indigo-400" />
            SQL Query Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Interactive SQL execution lab featuring 20 curated report queries covering Joins, Subqueries, Set Operations,
            Window Functions, and Business Analytics
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExecute}
            disabled={loading || !currentSql.trim()}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Play className={`w-4 h-4 fill-white ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Executing...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Main Layout: Left catalog sidebar & Right editor/result workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Query Catalog Picker (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Query Categories</span>
              <span className="text-xs text-indigo-400 font-mono">{catalog.length} queries</span>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search catalog */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queries by concept, keyword..."
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Catalog Query List */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2 max-h-[640px] overflow-y-auto space-y-1.5">
            {filteredCatalog.map((item) => {
              const isSelected = item.id === selectedQueryId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectQuery(item)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-indigo-300 border border-indigo-500/20">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">{item.sqlConcept}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">No queries found matching criteria.</div>
            )}
          </div>
        </div>

        {/* Right Column: Active Query Info, Editor, and Results (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Query Metadata Card */}
          {activeQuery && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeQuery.category}
                  </span>
                  <h2 className="text-base font-bold text-white">{activeQuery.name}</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeQuery.tablesInvolved.map((tbl) => (
                    <span
                      key={tbl}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      <Database className="w-3 h-3 text-slate-500" />
                      {tbl}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    SQL Concept:
                  </span>
                  <p className="text-slate-400">{activeQuery.sqlConcept}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Business Utility:
                  </span>
                  <p className="text-slate-400">{activeQuery.businessUtility}</p>
                </div>
              </div>

              {activeQuery.expectedSummary && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg px-3 py-2 text-xs text-indigo-300 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                  <span>
                    <strong>Expected Benchmark:</strong> {activeQuery.expectedSummary}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SQL Editor Header & Toolbar */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">SQL Statement</span>
                <span className="text-[11px] text-slate-500 font-mono">(Editable Sandbox)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSql}
                  title="Reset to default predefined SQL"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading || !currentSql.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  Execute
                </button>
              </div>
            </div>

            {/* SQL Code Editor Component */}
            <div className="p-3">
              <SQLCodeEditor value={currentSql} onChange={setCurrentSql} readOnly={false} minHeight="160px" />
            </div>
          </div>

          {/* Execution Error Notice */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Query Execution Error</span>
                <p className="font-mono text-xs text-rose-300 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden space-y-0">
              {/* Results Top Bar */}
              <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <Table2 className="w-4 h-4 text-indigo-400" />
                    <span>Result Set</span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {result.executionTimeMs} ms
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!result.rows || result.rows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {/* Dynamic Result Table */}
              <div className="p-4">
                <QueryResultTable
                  columns={result.columns}
                  rows={result.rows}
                  executionTimeMs={result.executionTimeMs}
                  rowCount={result.rowCount}
                />
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="bg-slate-800/40 border border-dashed border-slate-700/60 rounded-xl p-10 text-center">
              <Terminal className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Query Ready for Execution</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select any predefined query from the catalog on the left, inspect its concept and SQL, then click "Run Query"
                to see live results from the database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
