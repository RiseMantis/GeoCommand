import React from 'react';
import { RISK_MODELS } from '../data/mockData';
import { Brain, Cpu, BarChart3, Gauge, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const RiskModelsView: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <span>AI Risk Models & SHAP Explainability Engine</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Hazard-specific spatial inference pipelines, feature attribution weights, and orbital compute benchmarks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono-code text-zinc-300">Mean Latency: 122ms</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono-code text-emerald-200">Mean ROC-AUC: 0.950</span>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {RISK_MODELS.map((model) => (
          <div
            key={model.id}
            className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                    <span>{model.name}</span>
                  </h3>
                  <div className="text-xs font-mono-code text-blue-400 mt-0.5">
                    Target: {model.targetHazard}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#09090B] text-zinc-300 border border-[#27272A] font-mono-code">
                  {model.framework}
                </span>
              </div>

              <div className="text-xs text-zinc-300 bg-[#09090B] p-3 rounded-xl border border-[#27272A] font-mono-code leading-relaxed">
                <span className="text-zinc-500 font-semibold">Architecture: </span>
                {model.architecture}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono-code text-xs">
                <div className="bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] text-center">
                  <div className="text-zinc-500 text-[10px]">ROC-AUC</div>
                  <div className="text-base font-bold text-emerald-400">{model.rocAuc}</div>
                </div>
                <div className="bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] text-center">
                  <div className="text-zinc-500 text-[10px]">F1-SCORE</div>
                  <div className="text-base font-bold text-blue-400">{model.f1Score}</div>
                </div>
                <div className="bg-[#09090B] p-2.5 rounded-xl border border-[#27272A] text-center">
                  <div className="text-zinc-500 text-[10px]">LATENCY</div>
                  <div className="text-base font-bold text-zinc-200">{model.inferenceLatencyMs}ms</div>
                </div>
              </div>

              {/* SHAP Feature Importance Chart */}
              <div className="pt-2">
                <div className="text-[10px] font-bold font-mono-code text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>SHAP Feature Attribution Weights</span>
                  <span className="text-[10px] text-blue-400 font-bold">Explainable AI</span>
                </div>
                <div className="h-32 w-full bg-[#09090B] p-2 rounded-xl border border-[#27272A]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={model.shapWeights}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 0.5]} stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#a1a1aa"
                        fontSize={10}
                        tickLine={false}
                        width={130}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', fontSize: '11px', borderRadius: '8px' }}
                      />
                      <Bar dataKey="weight" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {model.shapWeights.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#3b82f6' : index === 1 ? '#60a5fa' : '#93c5fd'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400 font-mono-code">
              <span>Checkpoint: {model.lastTrained}</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validated in Hardware TEE</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
