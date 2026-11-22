import React, { useState } from 'react';
import { Copy, Check, Play, RotateCcw } from 'lucide-react';

export interface SQLCodeEditorProps {
  sql?: string;
  value?: string;
  onChange?: (val: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  isLoading?: boolean;
  title?: string;
  minHeight?: string;
}

export const SQLCodeEditor: React.FC<SQLCodeEditorProps> = ({
  sql,
  value,
  onChange,
  onRun,
  onReset,
  readOnly = false,
  isLoading = false,
  title,
  minHeight = '120px',
}) => {
  const content = value !== undefined ? value : sql || '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950 font-mono text-xs overflow-hidden shadow-inner">
      {/* Optional Top bar if title or actions provided */}
      {(title || onRun || onReset) && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
          <span className="font-semibold text-slate-300">{title || 'SQL Statement'}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            {onRun && (
              <button
                type="button"
                onClick={onRun}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-white" />
                Execute
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor text area or display */}
      <div className="relative">
        {readOnly ? (
          <pre
            className="p-3 text-indigo-300 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-indigo-900"
            style={{ minHeight }}
          >
            {content}
          </pre>
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange && onChange(e.target.value)}
            spellCheck={false}
            className="w-full p-3 bg-transparent text-indigo-200 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500 selection:bg-indigo-900 font-mono"
            style={{ minHeight }}
          />
        )}

        {!title && !onRun && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default SQLCodeEditor;
