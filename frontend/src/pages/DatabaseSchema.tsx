import React, { useEffect, useState } from 'react';
import {
  Network,
  Database,
  Key,
  Link2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  Maximize2,
  Table as TableIcon,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { TableMetadata, RelationshipMetadata } from '../types';
import Modal from '../components/Modal';

export default function DatabaseSchema() {
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [relationships, setRelationships] = useState<RelationshipMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSchemaMetadata();
      setTables(res.tables || []);
      setRelationships(res.relationships || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to introspect database schema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  const openInspector = (t: TableMetadata) => {
    setSelectedTable(t);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Network className="w-7 h-7 text-indigo-400" />
            Database Architecture & Schema Visualizer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Introspected MySQL 8.4 schema, 3NF/BCNF entity relationships, cardinalities, constraints, and data dictionaries
          </p>
        </div>

        <button
          onClick={loadSchema}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-introspect Schema
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Normalization & Academic Context Banner */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-white">
          <Info className="w-4 h-4 text-indigo-400" />
          Normalization Proof (3NF & BCNF Compliance)
        </div>
        <p className="text-slate-300 leading-relaxed">
          The database schema is strictly normalized across 9 distinct entities:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">1NF (First Normal Form):</strong>
            <span className="text-slate-400">All attributes contain atomic values; every table possesses a primary key.</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">2NF (Second Normal Form):</strong>
            <span className="text-slate-400">
              No partial dependency. In composite table <code>order_items(order_id, product_id)</code>, non-key attributes
              depend on the entire composite key.
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">3NF & BCNF:</strong>
            <span className="text-slate-400">
              Zero transitive dependencies. Categories, stock levels, and tracking are isolated into dedicated tables with
              enforced foreign keys.
            </span>
          </div>
        </div>
      </div>

      {/* Relational Cardinalities Matrix */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-400" />
          Entity Relationships & Cardinalities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {relationships.map((rel, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-slate-200">{rel.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-indigo-300">{rel.to}</span>
                </div>
                <div className="text-[11px] text-slate-400">{rel.label || `${rel.fromCol} -> ${rel.toCol}`}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  rel.cardinality === '1:1'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : rel.cardinality === 'M:N'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {rel.cardinality}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 9 Entity Table Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Database Entities & Data Dictionary ({tables.length} Tables)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((tbl) => {
            return (
              <div
                key={tbl.name}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden hover:border-slate-500 transition shadow-sm flex flex-col justify-between"
              >
                {/* Table Header */}
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono text-sm font-bold text-white">{tbl.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {tbl.columns.length} columns
                  </span>
                </div>

                {/* Columns Preview */}
                <div className="p-3.5 space-y-1.5 flex-1 max-h-60 overflow-y-auto">
                  {tbl.columns.map((col) => {
                    const isPk = col.isPrimary;
                    const isFk = tbl.foreignKeys?.some((fk) => fk.column === col.name);
                    const isUni = col.isUnique;

                    return (
                      <div
                        key={col.name}
                        className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-700/20 font-mono"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isPk && <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                          {isFk && <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                          <span
                            className={
                              isPk
                                ? 'text-amber-300 font-semibold truncate'
                                : isFk
                                ? 'text-indigo-300 font-semibold truncate'
                                : 'text-slate-300 truncate'
                            }
                          >
                            {col.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500">{col.type}</span>
                          {isPk && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                              PK
                            </span>
                          )}
                          {isFk && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                              FK
                            </span>
                          )}
                          {isUni && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                              UNI
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table Footer */}
                <div className="bg-slate-900/40 px-4 py-2.5 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>{tbl.columns.length} cols</span>
                    <span>{tbl.foreignKeys?.length || 0} FKs</span>
                  </div>
                  <button
                    onClick={() => openInspector(tbl)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Details Inspector Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Table Definition: ${selectedTable?.name}`}
        size="lg"
      >
        {selectedTable && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Table:</span>
                <span className="font-mono font-bold text-white">shop.{selectedTable.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Attributes:</span>
                <span className="font-mono font-semibold text-emerald-400">{selectedTable.columns.length} columns</span>
              </div>
            </div>

            {/* Column Attributes Table */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">Column Specifications:</span>
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                      <th className="px-3 py-2">Column</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Nullable</th>
                      <th className="px-3 py-2">Key Role</th>
                      <th className="px-3 py-2">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-semibold text-slate-200">{col.name}</td>
                        <td className="px-3 py-2 text-indigo-300">{col.type}</td>
                        <td className="px-3 py-2 text-slate-400">{col.isNullable ? 'YES' : 'NO'}</td>
                        <td className="px-3 py-2 text-amber-300">
                          {col.isPrimary ? 'PRIMARY' : col.isUnique ? 'UNIQUE' : '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{col.default ?? 'NULL'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Foreign Keys & Constraints */}
            {selectedTable.foreignKeys && selectedTable.foreignKeys.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">Foreign Key Dependencies:</span>
                <div className="space-y-1.5">
                  {selectedTable.foreignKeys.map((fk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 font-mono"
                    >
                      <span className="text-indigo-300 font-semibold">{fk.column}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">
                        {fk.refTable}.{fk.refColumn}
                      </span>
                      <span className="text-[10px] text-slate-500">{fk.constraintName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
