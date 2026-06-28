import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Send,
  Bot,
  HelpCircle,
  Loader2,
  ArrowRight,
  FileText,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { Event, Client, Vendor } from '../types';

interface AIAnalysisViewProps {
  events: Event[];
  clients: Client[];
  vendors: Vendor[];
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const SUGGESTIONS = [
  { chip: 'What drove Q2 revenue?', prompt: 'What drove Q2 revenue and which event types contributed most?' },
  { chip: 'Which clients are at risk?', prompt: 'Which clients are at risk of churning and what should we do about it?' },
  { chip: 'Who are my best vendors?', prompt: 'Who are our best and worst performing vendors and what action should we take?' },
  { chip: 'Improve profitability', prompt: 'What are the top 3 actions we can take to improve profitability this quarter?' },
];

export default function AIAnalysisView({ events, clients, vendors, addActivity }: AIAnalysisViewProps) {
  const [question, setQuestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportState, setReportState] = useState<'idle' | 'generating' | 'completed'>('idle');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleAsk = async (query: string) => {
    if (!query.trim() || isStreaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setResponse('');
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, events, clients, vendors }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setResponse(accumulated);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') throw parseErr;
          }
        }
      }

      addActivity?.('AI Analysis: Insight generated from live business data.', 'success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Could not reach the AI engine: ${msg}. Ensure the server is running with \`npm run dev\`.`);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleGenerateReport = () => {
    setReportState('generating');
    setTimeout(() => {
      setReportState('completed');
      setShowPrintModal(true);
      addActivity?.('Executive Reporting: H1 2026 performance briefing compiled.', 'info');
    }, 1200);
  };

  const totalRevenue = events
    .filter((e) => e.status !== 'Cancelled')
    .reduce((s, e) => s + e.revenue, 0);
  const totalProfit = events
    .filter((e) => e.status !== 'Cancelled')
    .reduce((s, e) => s + e.profit, 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
  const avgVendorScore =
    vendors.length > 0
      ? (vendors.reduce((s, v) => s + v.reliabilityScore, 0) / vendors.length).toFixed(1)
      : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Context bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs text-slate-500 font-medium">
          Natural language analysis powered by Claude — answers use live dashboard data
        </span>
        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold flex items-center gap-1">
          <Zap className="h-3 w-3" />
          LIVE · CLAUDE AI
        </span>
      </div>

      {/* Main console */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-slate-50/50">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Ops Intelligence AI</h3>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              STREAMING · ANTHROPIC CLAUDE · LIVE BUSINESS DATA
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Suggestion chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Suggested Questions</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  id={`ai-chip-${idx}`}
                  onClick={() => {
                    setQuestion(s.prompt);
                    handleAsk(s.prompt);
                  }}
                  disabled={isStreaming}
                  className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  {s.chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <textarea
              id="ai-console-textarea"
              rows={3}
              placeholder="Ask a question about your business data (e.g. 'What drove Q2 revenue?', 'Who are my best vendors?')..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk(question);
              }}
              className="w-full p-4 pr-12 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 leading-relaxed resize-none shadow-2xs"
            />
            <button
              id="ai-console-submit-btn"
              disabled={isStreaming || !question.trim()}
              onClick={() => handleAsk(question)}
              className="absolute right-3.5 bottom-4 p-2 bg-indigo-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg transition-colors cursor-pointer"
              title="Send (or Ctrl+Enter)"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Response panel */}
          {(isStreaming || response !== null || error) && (
            <div className="p-5 border border-indigo-100 bg-indigo-50/15 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1 bg-indigo-100 rounded text-indigo-700">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-indigo-900">Claude AI Response</span>
                </div>
                <div className="flex items-center gap-2">
                  {isStreaming && (
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block"></span>
                      STREAMING
                    </span>
                  )}
                </div>
              </div>

              {error ? (
                <p className="text-xs text-rose-600 font-mono">{error}</p>
              ) : isStreaming && !response ? (
                <div className="flex items-center space-x-3 py-4 text-gray-400">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-600" />
                  <span className="text-xs font-mono">Analyzing your business data...</span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-700 leading-relaxed space-y-3"
                >
                  {response &&
                    response.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="text-sm font-extrabold text-indigo-950 mt-2">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h3 key={pIdx} className="text-sm font-extrabold text-slate-900 mt-2 border-b border-slate-100 pb-1">
                            {paragraph.replace('## ', '')}
                          </h3>
                        );
                      }
                      if (/^[*-] /.test(paragraph)) {
                        return (
                          <ul key={pIdx} className="list-disc pl-5 space-y-1.5">
                            {paragraph.split('\n').map((li, liIdx) => (
                              <li key={liIdx} className="text-gray-600">
                                {li.replace(/^[*-]\s*/, '').split('**').map((chunk, cIdx) =>
                                  cIdx % 2 === 1 ? (
                                    <strong key={cIdx} className="font-bold text-slate-800">
                                      {chunk}
                                    </strong>
                                  ) : (
                                    chunk
                                  ),
                                )}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      if (/^\d+\./.test(paragraph)) {
                        return (
                          <ol key={pIdx} className="list-decimal pl-5 space-y-1.5">
                            {paragraph.split('\n').map((li, liIdx) => (
                              <li key={liIdx} className="text-gray-600">
                                {li.replace(/^\d+\.\s*/, '').split('**').map((chunk, cIdx) =>
                                  cIdx % 2 === 1 ? (
                                    <strong key={cIdx} className="font-bold text-slate-800">
                                      {chunk}
                                    </strong>
                                  ) : (
                                    chunk
                                  ),
                                )}
                              </li>
                            ))}
                          </ol>
                        );
                      }
                      return (
                        <p key={pIdx} className="text-gray-600">
                          {paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? (
                              <strong key={cIdx} className="font-bold text-slate-800">
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            ),
                          )}
                        </p>
                      );
                    })}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Executive report generator */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span>Generate Executive Monthly Performance Report</span>
          </h3>
          <p className="text-xs text-gray-400">
            Creates a printable financial and operational summary of all H1 2026 milestones.
          </p>
        </div>
        <div>
          {reportState === 'idle' && (
            <button
              id="ai-btn-generate-report"
              onClick={handleGenerateReport}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Compile Executive Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {reportState === 'generating' && (
            <div className="flex items-center space-x-3 text-xs bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
              <span>Compiling report...</span>
            </div>
          )}
          {reportState === 'completed' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold"
            >
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Report Ready</span>
              <button
                onClick={() => setReportState('idle')}
                className="text-emerald-900 underline text-[10px] pl-2 font-medium"
              >
                Reset
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Print modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fcfbf9] border-2 border-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans p-8 space-y-6 text-slate-800"
          >
            <div className="border-b-4 border-slate-900 pb-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded font-bold">
                  Document ID: #OPS-2026-H1
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  CLASSIFICATION: EXECUTIVE
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                H1 2026 Operations Briefing
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                COMPILED:{' '}
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                · RECIPIENT: OPS INTELLIGENCE BOARD
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 font-mono">
                I. Executive Summary
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All-In-1 Events LLC has realized sustained margin velocity across the YTD portfolio.
                Realized margins stand at <strong>{margin}%</strong> on{' '}
                <strong>${totalRevenue.toLocaleString()}</strong> gross revenue with{' '}
                <strong>${totalProfit.toLocaleString()}</strong> in net profit. Vendor reliability
                index averages <strong>{avgVendorScore}/100</strong> across {vendors.length} active
                suppliers.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 font-mono">
                II. Performance Diagnostics
              </h3>
              <div className="grid grid-cols-4 gap-4 py-2">
                <div className="border border-slate-200 p-2.5 rounded bg-white text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
                    Gross Revenue
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ${totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded bg-white text-center font-mono">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Net Profit
                  </span>
                  <span className="text-sm font-black text-indigo-700">
                    ${totalProfit.toLocaleString()}
                  </span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded bg-white text-center font-mono">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Net Margin
                  </span>
                  <span className="text-sm font-black text-emerald-700">{margin}%</span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded bg-white text-center font-mono">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Vendor Index
                  </span>
                  <span className="text-sm font-black text-slate-800">{avgVendorScore}%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  addActivity?.('Executive Reporting: Print portal dismissed.', 'info');
                }}
                className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded cursor-pointer transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addActivity?.('Executive Reporting: System print triggered.', 'success');
                  window.print();
                }}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer shadow transition-all flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Print Report</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
