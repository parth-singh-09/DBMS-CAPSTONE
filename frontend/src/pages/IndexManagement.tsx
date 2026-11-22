import React, { useEffect, useState } from 'react';
import {
  Zap,
  Layers,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import SQLCodeEditor from '../components/SQLCodeEditor';

interface IndexRecord {
  table_name: string;
  index_name: string;
  columns: string;
  non_unique: number;
  is_unique: boolean;
  is_primary: boolean;
  index_type: string;
  metadata?: {
    purpose: string;
    benefit: string;
    impact: string;
  } | null;
}

const SAMPLE_EXPLAIN_QUERIES = [
  {
    name: '1. Index Seek using idx_orders_customer',
    description: 'Uses index idx_orders_customer on orders(customer_id) to rapidly fetch orders for a specific customer without scanning the entire table.',
    sql: 'SELECT * FROM orders WHERE customer_id = 1;',
  },
  {
    name: '2. Index Seek using idx_items_product',
    description: 'Uses index idx_items_product on order_items(product_id) to find sales lines for Product ID 1 (Laptop).',
    sql: 'SELECT * FROM order_items WHERE product_id = 1;',
  },
  {
    name: '3. Index Seek using idx_payments_order',
    description: 'Uses index idx_payments_order to quickly locate successful payment attempts for Order ID 2.',
    sql: "SELECT * FROM payments WHERE order_id = 2 AND status = 'SUCCESS';",
  },
  {
    name: '4. Index Seek using idx_products_cat',
    description: 'Uses index idx_products_cat on products(category_id) to filter all electronics products.',
    sql: 'SELECT * FROM products WHERE category_id = 1;',
  },
  {
    name: '5. Full Table Scan (ALL) — Unindexed Column',
    description: 'Demonstrates a full table scan (type = ALL) when querying by phone number (unindexed column on customers table).',
    sql: "SELECT * FROM customers WHERE phone = '9876543210';",
  },
];

export default function IndexManagement() {
  const [indexes, setIndexes] = useState<IndexRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableFilter, setTableFilter] = useState<string>('All');

  // EXPLAIN runner state
  const [explainSql, setExplainSql] = useState<string>(SAMPLE_EXPLAIN_QUERIES[0].sql);
  const [explainResult, setExplainResult] = useState<any[] | null>(null);
  const [explainTime, setExplainTime] = useState<number | null>(null);
  const [explainLoading, setExplainLoading] = useState<boolean>(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const loadIndexes = async () => {
    try {
      setLoading(true);
      const data = await api.getIndexes();
      setIndexes(data);
    } catch (err: any) {
      console.error('Failed to load indexes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndexes();
  }, []);

  const handleRunExplain = async () => {
    if (!explainSql.trim()) return;

    try {
      setExplainLoading(true);
      setExplainError(null);
      const res = await api.explainQuery(explainSql);
      const rows = res?.rows || res?.plan || (Array.isArray(res) ? res : []);
      setExplainResult(rows);
      setExplainTime(res?.executionTimeMs || 0);
    } catch (err: any) {
      setExplainError(err?.response?.data?.error || err.message || 'EXPLAIN execution failed');
      setExplainResult(null);
    } finally {
      setExplainLoading(false);
    }
  };

  const handleSelectSampleQuery = (sample: (typeof SAMPLE_EXPLAIN_QUERIES)[0]) => {
    setExplainSql(sample.sql);
    setExplainError(null);
    setExplainResult(null);
  };

  const uniqueTables = Array.from(new Set(indexes.map((idx) => idx.table_name)));

  const filteredIndexes = indexes.filter(
    (idx) => tableFilter === 'All' || idx.table_name === tableFilter
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-400" />
            Index Management & Query Optimizer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect B-Tree secondary indexes, examine index statistics, and analyze query execution plans with EXPLAIN
          </p>
        </div>
      </div>

      {/* Index Concepts & Academic Note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
            <TrendingUp className="w-4 h-4" />
            Read Acceleration: O(log N)
          </div>
          <p className="text-xs text-slate-400">
            Indexes replace costly full-table scans (O(N)) with balanced B-Tree traversal, dramatically cutting disk I/O for
            point lookups and foreign key joins.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <AlertTriangle className="w-4 h-4" />
            Write Overhead Trade-Off
          </div>
          <p className="text-xs text-slate-400">
            Every <code>INSERT</code>, <code>UPDATE</code>, or <code>DELETE</code> must keep both the table page and the index
            tree balanced. Indexes should target high-frequency join/filter columns.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            Enforcing Uniqueness
          </div>
          <p className="text-xs text-slate-400">
            Indexes serve dual purposes: performance optimization and database constraint integrity enforcement
            (Primary Key and UNIQUE keys).
          </p>
        </div>
      </div>

      {/* Database Indexes Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white">Active Database Indexes ({indexes.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter by Table:</span>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Tables</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/40 text-slate-400 font-medium">
                <th className="px-4 py-3">Table Name</th>
                <th className="px-4 py-3">Index Name</th>
                <th className="px-4 py-3">Indexed Column(s)</th>
                <th className="px-4 py-3">Index Type</th>
                <th className="px-4 py-3">Category / Role</th>
                <th className="px-4 py-3">Purpose & Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {filteredIndexes.map((idx, i) => {
                const isReportIndex = Boolean(idx.metadata);
                return (
                  <tr
                    key={`${idx.table_name}-${idx.index_name}-${i}`}
                    className={`hover:bg-slate-700/20 transition ${
                      isReportIndex ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-200">{idx.table_name}</td>
                    <td className="px-4 py-3 font-mono text-indigo-300 font-semibold flex items-center gap-1.5">
                      {idx.index_name}
                      {isReportIndex && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Report Index
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{idx.columns}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{idx.index_type}</td>
                    <td className="px-4 py-3">
                      {idx.is_primary ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          PRIMARY KEY
                        </span>
                      ) : idx.is_unique ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          UNIQUE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          SECONDARY INDEX
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs">
                      {idx.metadata ? (
                        <div>
                          <p className="text-slate-300 font-medium">{idx.metadata.benefit}</p>
                          <p className="text-[11px] text-slate-500">{idx.metadata.impact}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Enforces integrity and lookups</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive EXPLAIN Query Runner */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              Live EXPLAIN Query Execution Plan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Run MySQL's internal query optimizer against any SELECT query to inspect access types, evaluated keys, and row scans
            </p>
          </div>

          <button
            onClick={handleRunExplain}
            disabled={explainLoading || !explainSql.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${explainLoading ? 'animate-spin' : ''}`} />
            {explainLoading ? 'Analyzing...' : 'Run EXPLAIN'}
          </button>
        </div>

        {/* Quick Sample Selector */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">Select Test Scenarios:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {SAMPLE_EXPLAIN_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSampleQuery(sample)}
                className={`text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                  explainSql.trim() === sample.sql.trim()
                    ? 'bg-indigo-950/40 border-indigo-500 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-indigo-300 truncate">{sample.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sample.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2">
          <SQLCodeEditor value={explainSql} onChange={setExplainSql} minHeight="90px" />
        </div>

        {/* EXPLAIN Execution Error */}
        {explainError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            <strong>Error:</strong> {explainError}
          </div>
        )}

        {/* EXPLAIN Result Table */}
        {explainResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">Execution Plan Table:</span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {explainTime} ms
              </span>
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                    <th className="px-3 py-2">id</th>
                    <th className="px-3 py-2">select_type</th>
                    <th className="px-3 py-2">table</th>
                    <th className="px-3 py-2">type</th>
                    <th className="px-3 py-2">possible_keys</th>
                    <th className="px-3 py-2">key</th>
                    <th className="px-3 py-2">key_len</th>
                    <th className="px-3 py-2">ref</th>
                    <th className="px-3 py-2">rows</th>
                    <th className="px-3 py-2">filtered</th>
                    <th className="px-3 py-2">Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {explainResult.map((row: any, i: number) => {
                    const accessType = row.type || row.access_type || '';
                    const isScan = accessType.toUpperCase() === 'ALL';
                    const isGood = ['REF', 'EQ_REF', 'CONST'].includes(accessType.toUpperCase());

                    return (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2 text-slate-400">{row.select_type}</td>
                        <td className="px-3 py-2 text-indigo-300 font-semibold">{row.table}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              isGood
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isScan
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {accessType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{row.possible_keys || 'NULL'}</td>
                        <td className="px-3 py-2 text-amber-300 font-semibold">{row.key || 'NULL'}</td>
                        <td className="px-3 py-2 text-slate-400">{row.key_len || 'NULL'}</td>
                        <td className="px-3 py-2 text-slate-400">{row.ref || 'NULL'}</td>
                        <td className="px-3 py-2 text-slate-200">{row.rows}</td>
                        <td className="px-3 py-2 text-slate-400">{row.filtered ? `${row.filtered}%` : 'N/A'}</td>
                        <td className="px-3 py-2 text-slate-400">{row.Extra || row.extra || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Explanation of EXPLAIN output */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-300 block">Plan Diagnostics:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                <li>
                  <strong className="text-emerald-400">type = ref / eq_ref / const:</strong> The optimizer successfully used
                  a B-Tree index lookup. Only matching rows were read.
                </li>
                <li>
                  <strong className="text-rose-400">type = ALL:</strong> Full table scan performed. Every row on disk was read
                  because no suitable index exists for the predicate.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
