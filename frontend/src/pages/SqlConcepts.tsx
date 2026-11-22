import React, { useState } from 'react';
import {
  Code,
  Layers,
  Shield,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  Database,
  ArrowRight,
  UserCheck,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import SQLCodeEditor from '../components/SQLCodeEditor';

export default function SqlConcepts() {
  const [activeTab, setActiveTab] = useState<'DDL' | 'DML' | 'DCL'>('DDL');

  // DDL State
  const [ddlRunning, setDdlRunning] = useState(false);
  const [ddlSteps, setDdlSteps] = useState<any[]>([]);
  const [ddlError, setDdlError] = useState<string | null>(null);

  // DML State
  const [dmlRunning, setDmlRunning] = useState(false);
  const [dmlSteps, setDmlSteps] = useState<any[]>([]);
  const [dmlError, setDmlError] = useState<string | null>(null);

  // DCL State
  const [dclRunning, setDclRunning] = useState(false);
  const [dclData, setDclData] = useState<any | null>(null);
  const [dclError, setDclError] = useState<string | null>(null);

  const handleRunDdl = async () => {
    try {
      setDdlRunning(true);
      setDdlError(null);
      const res = await api.runDdlDemo();
      setDdlSteps(res.steps || []);
    } catch (err: any) {
      setDdlError(err?.response?.data?.error || err.message || 'DDL demo failed');
    } finally {
      setDdlRunning(false);
    }
  };

  const handleRunDml = async () => {
    try {
      setDmlRunning(true);
      setDmlError(null);
      const res = await api.runDmlDemo();
      setDmlSteps(res.steps || []);
    } catch (err: any) {
      setDmlError(err?.response?.data?.error || err.message || 'DML demo failed');
    } finally {
      setDmlRunning(false);
    }
  };

  const handleRunDcl = async () => {
    try {
      setDclRunning(true);
      setDclError(null);
      const res = await api.runDclDemo();
      setDclData(res);
    } catch (err: any) {
      setDclError(err?.response?.data?.error || err.message || 'DCL demo failed');
    } finally {
      setDclRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Code className="w-7 h-7 text-indigo-400" />
            SQL Concepts Lab (DDL, DML, DCL)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Safe live sandbox demonstrating Data Definition, Data Manipulation, and Data Control commands
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/60 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('DDL')}
          className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
            activeTab === 'DDL'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>DDL (Data Definition)</span>
        </button>

        <button
          onClick={() => setActiveTab('DML')}
          className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
            activeTab === 'DML'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>DML (Data Manipulation)</span>
        </button>

        <button
          onClick={() => setActiveTab('DCL')}
          className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
            activeTab === 'DCL'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>DCL (Data Control / Security)</span>
        </button>
      </div>

      {/* TAB 1: DDL */}
      {activeTab === 'DDL' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  DDL Demonstration: Schema Lifecycle
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  DDL statements define, modify, and destroy database schemas: <code>CREATE</code>, <code>ALTER</code> (ADD / DROP),{' '}
                  <code>TRUNCATE</code>, and <code>DROP</code>.
                </p>
              </div>

              <button
                onClick={handleRunDdl}
                disabled={ddlRunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-white ${ddlRunning ? 'animate-spin' : ''}`} />
                {ddlRunning ? 'Executing DDL Cycle...' : 'Execute DDL Sandbox Demo'}
              </button>
            </div>

            {ddlError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                {ddlError}
              </div>
            )}

            {ddlSteps.length > 0 ? (
              <div className="space-y-3 pt-2">
                {ddlSteps.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 font-mono">{step.type}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{step.description}</p>
                    <SQLCodeEditor value={step.sql} readOnly={true} minHeight="40px" />
                  </div>
                ))}
              </div>
            ) : (
              !ddlRunning && (
                <div className="text-center py-10 text-xs text-slate-500">
                  Click the button above to execute a full DDL lifecycle against a temporary sandbox table.
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DML */}
      {activeTab === 'DML' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  DML Demonstration: Row-Level Operations
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  DML statements manipulate data stored within tables: <code>INSERT</code> (create rows), <code>SELECT</code>{' '}
                  (query rows), <code>UPDATE</code> (modify rows), and <code>DELETE</code> (remove rows).
                </p>
              </div>

              <button
                onClick={handleRunDml}
                disabled={dmlRunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-white ${dmlRunning ? 'animate-spin' : ''}`} />
                {dmlRunning ? 'Executing DML Cycle...' : 'Execute DML Sandbox Demo'}
              </button>
            </div>

            {dmlError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                {dmlError}
              </div>
            )}

            {dmlSteps.length > 0 ? (
              <div className="space-y-3 pt-2">
                {dmlSteps.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 font-mono">{step.type}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{step.description}</p>
                    <SQLCodeEditor value={step.sql} readOnly={true} minHeight="40px" />
                    {step.result && (
                      <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-300">
                        Result: {JSON.stringify(step.result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !dmlRunning && (
                <div className="text-center py-10 text-xs text-slate-500">
                  Click the button above to execute an interactive DML CRUD sequence against a sandbox table.
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DCL */}
      {activeTab === 'DCL' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  DCL: Role-Based Access Control & Database Security
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  DCL governs user authorization and permissions using <code>CREATE USER</code>, <code>GRANT</code>,{' '}
                  <code>REVOKE</code>, and <code>SHOW GRANTS</code>.
                </p>
              </div>

              <button
                onClick={handleRunDcl}
                disabled={dclRunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-white ${dclRunning ? 'animate-spin' : ''}`} />
                {dclRunning ? 'Executing DCL Security...' : 'Execute DCL Security Setup'}
              </button>
            </div>

            {dclError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                {dclError}
              </div>
            )}

            {/* DCL Script from Report */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Role & Privilege Setup Script (Report Section 5.3)
              </span>
              <SQLCodeEditor
                value={`-- 1. Create limited user accounts
CREATE USER IF NOT EXISTS 'analyst'@'%' IDENTIFIED BY '********';
CREATE USER IF NOT EXISTS 'clerk'@'%'   IDENTIFIED BY '********';

-- 2. Grant read-only access to analyst on all tables in shop
GRANT SELECT ON shop.* TO 'analyst'@'%';

-- 3. Grant order creation and modification privileges to clerk
GRANT SELECT, INSERT, UPDATE ON shop.orders TO 'clerk'@'%';
GRANT SELECT, INSERT ON shop.order_items TO 'clerk'@'%';

-- 4. Revoke order editing permission from clerk (Demonstrating REVOKE)
REVOKE UPDATE ON shop.orders FROM 'clerk'@'%';
FLUSH PRIVILEGES;

-- 5. Inspect granted privileges
SHOW GRANTS FOR 'clerk'@'%';
SHOW GRANTS FOR 'analyst'@'%';`}
                readOnly={true}
                minHeight="220px"
              />
            </div>

            {/* Live SHOW GRANTS Output */}
            {dclData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      Active Grants: 'clerk'@'%'
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">Live MySQL Output</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-slate-300">
                    {dclData.clerkGrants?.map((grant: string, i: number) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800">
                        {grant}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      Active Grants: 'analyst'@'%'
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">Live MySQL Output</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-slate-300">
                    {dclData.analystGrants?.map((grant: string, i: number) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800">
                        {grant}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
