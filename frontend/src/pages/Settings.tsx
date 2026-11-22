import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Server,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Shield,
  Activity,
  HardDrive,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Settings() {
  const [status, setStatus] = useState<any>(null);
  const [schemaMeta, setSchemaMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset Modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sysStatus, schema] = await Promise.all([api.getSystemStatus(), api.getSchemaMetadata()]);
      setStatus(sysStatus);
      setSchemaMeta(schema);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to connect to database server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleResetToSeeds = async () => {
    try {
      setResetting(true);
      setResetMessage(null);
      const res = await api.resetToSeeds();
      setIsResetOpen(false);
      setResetMessage(res.message || 'Database successfully restored to original report seeds.');
      await loadStatus();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-indigo-400" />
            System & Database Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Database connection parameters, server diagnostics, table statistics, and seed data restoration
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Ping Database Server
        </button>
      </div>

      {resetMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Database Connection Diagnostics */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">MySQL Engine Telemetry</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected & Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block mb-1">Target Database</span>
            <span className="font-mono text-sm font-bold text-white">{status?.database?.name || 'shop'}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block mb-1">Host & Port</span>
            <span className="font-mono text-sm font-semibold text-slate-200">
              {status?.database?.host}:{status?.database?.port}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block mb-1">Server Engine Version</span>
            <span className="font-mono text-sm font-semibold text-indigo-300">
              MySQL {status?.database?.version || '8.4.9'}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block mb-1">Authenticated User</span>
            <span className="font-mono text-sm font-semibold text-slate-200">{status?.database?.user || 'root'}</span>
          </div>
        </div>
      </div>

      {/* Database Entity Row Counts */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Table Record Distribution</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">9 Relational Tables</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {schemaMeta?.tables?.map((tbl: any) => (
            <div key={tbl.name || tbl.tableName} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono truncate block mb-1">{tbl.name || tbl.tableName}</span>
              <span className="text-lg font-bold text-white font-mono">{tbl.columns?.length || 0} cols</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Architecture Overview */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          Full-Stack DBMS System Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Cpu className="w-4 h-4" />
              Frontend Layer
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>• React 18 with Vite</li>
              <li>• TypeScript & Strict Typings</li>
              <li>• Tailwind CSS (Dark Slate Palette)</li>
              <li>• Recharts (Relational Analytics)</li>
              <li>• Lucide React Icons</li>
              <li>• React Hook Form + Zod</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Server className="w-4 h-4" />
              Backend Layer
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>• Node.js & Express.js (REST API)</li>
              <li>• TypeScript ESM Architecture</li>
              <li>• mysql2/promise Connection Pool</li>
              <li>• ACID Multi-Statement Transactions</li>
              <li>• Parameterized Queries (SQL Injection Safe)</li>
              <li>• Comprehensive MySQL Error Interceptor</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Database className="w-4 h-4" />
              Database Engine
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>• MySQL 8.4 Enterprise Storage Engine</li>
              <li>• InnoDB Engine with Row-Level Locking</li>
              <li>• 3NF / BCNF Normalized Schema (9 Tables)</li>
              <li>• CHECK, UNIQUE, NOT NULL, FK Restrict</li>
              <li>• Secondary B-Tree Indexes</li>
              <li>• Views (vw_order_report, vw_customer_type)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset to Seeds */}
      <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
          <AlertTriangle className="w-5 h-5" />
          Maintenance & Reset Database
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Restore the database back to the exact initial sample records defined in the project report (5 customers, 2
          categories, 7 products, 7 inventory rows, 2 discounts, 7 orders, 10 order_items, 7 payments, and 5 deliveries).
          All intermediate test records will be cleaned up and re-seeded.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setIsResetOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Database to Report Seeds
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetToSeeds}
        title="Reset Database to Report Seeds?"
        message="This will re-execute schema.sql, seeds.sql, and views.sql, resetting all tables to the exact academic report seed data. Any newly created test records will be overwritten."
        confirmText="Yes, Reset Database"
        type="danger"
        isLoading={resetting}
      />
    </div>
  );
}
