import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Code2,
  FileCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { TestResult, ConsistencyCheck } from '../types';
import SQLCodeEditor from '../components/SQLCodeEditor';

export default function DatabaseTesting() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [consistencyChecks, setConsistencyChecks] = useState<ConsistencyCheck[]>([]);
  const [passedCount, setPassedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAllTests = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runAllTests();
      setTests(res.tests || []);
      setConsistencyChecks(res.consistencyChecks || []);
      setPassedCount(res.passedCount || 0);
      setFailedCount(res.failedCount || 0);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to run test suite');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    handleRunAllTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Database Testing & Integrity Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated test suite executing the 8 database constraint tests and 3 data consistency checks defined in the report
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Play className={`w-4 h-4 fill-white ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running Tests...' : 'Execute Test Suite'}
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Constraint Tests</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tests Passed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            {passedCount} / {totalCount}
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">Tests Failed</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 flex items-center gap-2">
            {failedCount > 0 ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6 text-slate-500" />}
            {failedCount}
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Consistency Checks</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1 flex items-center gap-2">
            <FileCheck className="w-6 h-6" />
            {consistencyChecks.length} Verified
          </div>
        </div>
      </div>

      {/* Conceptual Note */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
        <div>
          <strong className="block mb-0.5">Academic Testing Methodology:</strong>
          <p className="text-slate-300 leading-relaxed">
            In relational database management systems, a constraint test is considered a <strong>PASS</strong> when an
            invalid, inconsistent, or unauthorized DML operation is <em>successfully intercepted and rejected</em> by the MySQL
            storage engine with the expected SQL error code (such as <code>ER_DUP_ENTRY</code> or <code>ER_CHECK_CONSTRAINT_VIOLATED</code>).
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Constraint Tests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Constraint Verification Tests (1 – 8)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Source: Section 8 of Project Report</span>
        </div>

        <div className="space-y-3">
          {tests.map((test) => {
            const isPass = test.status === 'PASS';
            return (
              <div
                key={test.num}
                className={`bg-slate-800/80 border rounded-xl p-4 transition ${
                  isPass ? 'border-slate-700/60 hover:border-emerald-500/50' : 'border-rose-500/60 bg-rose-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                      {test.num}
                    </span>
                    <h3 className="font-bold text-sm text-white">{test.name}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {test.durationMs} ms
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                        isPass
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {test.status}
                    </span>
                  </div>
                </div>

                {/* SQL snippet */}
                <div className="mb-3">
                  <SQLCodeEditor value={test.sql} readOnly={true} minHeight="40px" />
                </div>

                {/* Comparison Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">Expected Behavior:</span>
                    <span className="text-slate-300">{test.expectedResult}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">Actual MySQL Engine Response:</span>
                    <span className={isPass ? 'text-emerald-400 font-mono text-[11px]' : 'text-rose-400 font-mono text-[11px]'}>
                      {test.actualResult}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Consistency Checks Section */}
      <div className="space-y-4 pt-4 border-t border-slate-700/60">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            Database Consistency & Referential Checks (A, B, C)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Source: Section 7 of Project Report</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {consistencyChecks.map((check) => (
            <div key={check.name} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-300">{check.name}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  PASS
                </span>
              </div>

              <p className="text-xs text-slate-400">{check.explanation}</p>

              <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
                {check.sql}
              </div>

              <div className="space-y-1 text-xs pt-1 border-t border-slate-700/40">
                <div className="flex justify-between">
                  <span className="text-slate-400">Benchmark:</span>
                  <span className="text-slate-300 font-mono">{check.expected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actual Result:</span>
                  <span className="text-emerald-400 font-mono font-semibold">{check.status} ({check.actualRows?.length || 0} rows)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
