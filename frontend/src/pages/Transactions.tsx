import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import SQLCodeEditor from '../components/SQLCodeEditor';

interface TransactionStep {
  stepNumber: number;
  title: string;
  sql: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  message: string;
  resultData?: any;
}

export default function Transactions() {
  const [running, setRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<TransactionStep[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunDemo = async () => {
    try {
      setRunning(true);
      setError(null);
      setSteps([]);
      setSummary(null);

      const res = await api.runTransactionDemo();
      setSteps(res.steps || res.data?.steps || []);
      setSummary(res.summary || res.data?.summary || 'Transaction completed successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Transaction execution failed');
    } finally {
      setRunning(false);
    }
  };

  const getStepBadge = (status: TransactionStep['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            FAILED (EXPECTED)
          </span>
        );
      case 'ROLLED_BACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
            ROLLED BACK TO SAVEPOINT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-indigo-400" />
            Transaction Management (ACID & TCL)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Interactive demonstration of database transactions, savepoints, partial rollbacks, and ACID consistency
          </p>
        </div>

        <button
          onClick={handleRunDemo}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Play className={`w-4 h-4 fill-white ${running ? 'animate-spin' : ''}`} />
          {running ? 'Executing Transaction...' : 'Run Live Transaction Demo'}
        </button>
      </div>

      {/* ACID Principles Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-indigo-400 font-bold text-sm mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">A</span>
            Atomicity
          </div>
          <p className="text-xs text-slate-400">
            "All or nothing." If any part of a multi-item order fails, all changes are undone unless protected by a SAVEPOINT.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">C</span>
            Consistency
          </div>
          <p className="text-xs text-slate-400">
            Database constraints (CHECK <code>qty_on_hand &gt;= 0</code>, FK integrity) are strictly validated before committing.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-amber-400 font-bold text-sm mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">I</span>
            Isolation
          </div>
          <p className="text-xs text-slate-400">
            Concurrent transactions cannot observe uncommitted intermediate states. Uses InnoDB row-level locking.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-purple-400 font-bold text-sm mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">D</span>
            Durability
          </div>
          <p className="text-xs text-slate-400">
            Once <code>COMMIT</code> is acknowledged, updates are written to the Write-Ahead Log (WAL) and survive system crashes.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Transaction Failed:</span>
            <span className="font-mono text-xs">{error}</span>
          </div>
        </div>
      )}

      {/* Execution Results / Steps Timeline */}
      {steps.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm text-white">Demonstration Summary</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ACID Verified
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-3 transition hover:border-slate-600"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      {step.stepNumber}
                    </span>
                    <h3 className="font-bold text-sm text-white">{step.title}</h3>
                  </div>
                  {getStepBadge(step.status)}
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {step.message}
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Executed SQL
                  </span>
                  <SQLCodeEditor value={step.sql} readOnly={true} minHeight="45px" />
                </div>
              </div>
            ))}
          </div>

          {summary && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 leading-relaxed">
              <strong>Academic Takeaway:</strong> {summary}
            </div>
          )}
        </div>
      ) : (
        !running && (
          <div className="bg-slate-800/40 border border-dashed border-slate-700/60 rounded-xl p-12 text-center space-y-3">
            <Lock className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Transaction Workbench Ready</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Click the "Run Live Transaction Demo" button above to initiate a real MySQL transaction demonstrating
              <code>START TRANSACTION</code>, safe item insertion, <code>SAVEPOINT</code> creation, intentional constraint
              violation handling, <code>ROLLBACK TO SAVEPOINT</code>, and final <code>COMMIT</code>.
            </p>
          </div>
        )
      )}
    </div>
  );
}
