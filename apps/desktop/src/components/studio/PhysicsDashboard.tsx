import React from 'react';
import { Activity, Zap, ShieldCheck, Box, Info } from 'lucide-react';

interface PhysicsDashboardProps {
  data: any | null;
}

export const PhysicsDashboard: React.FC<PhysicsDashboardProps> = ({ data }) => {
  // Extract the learned parameters. Support both new V-NEXT format and legacy.
  const learnedParams = data?.learned_params || data || {};
  
  if (!learnedParams || Object.keys(learnedParams).length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-black/20 border border-white/5 rounded-2xl p-8 italic">
        <Activity className="w-8 h-8 mb-4 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Discovery</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Physical Telemetry</h3>
        </div>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black border border-emerald-500/20 rounded-full uppercase">
          <ShieldCheck className="w-2.5 h-2.5" /> MJX-RT Verified
        </span>
      </div>
      
      <div className="p-5 space-y-8">
        {Object.entries(learnedParams).map(([name, val]) => {
          // If val is a record of params (legacy/detailed format)
          const params = typeof val === 'object' && val !== null ? val : { [name]: val };
          
          return (
            <div key={name} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Box className="w-3 h-3" /> {name.replace(/_/g, ' ')}
                </span>
                <span className="text-[9px] font-mono text-slate-600">SYMPLECTIC SOLVER</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(params as Record<string, any>).map(([pName, pVal]) => {
                  if (pName === 'hamiltonian_loss' || pName === 'energy_drift') return null;
                  if (typeof pVal !== 'number') return null;

                  return (
                    <div key={pName} className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Info className="w-6 h-6" />
                      </div>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-2 tracking-tighter">{pName.replace(/_/g, ' ')}</p>
                      <p className="text-xl font-mono font-black text-cyan-400 leading-none">
                        {pVal > 1000 ? pVal.toExponential(2) : pVal.toFixed(3)}
                      </p>
                      <p className="text-[8px] text-slate-600 mt-2 font-black uppercase">Relative Unit</p>
                    </div>
                  );
                })}
              </div>

              {/* Universal Physics Metrics (Always relevant) */}
              {(params as any).hamiltonian_loss !== undefined && (
                <div className="bg-black/60 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Conservation Integrity</span>
                    <span className="text-[8px] font-mono text-emerald-400">Stable</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-[8px]">H-Variance</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">{(params as any).hamiltonian_loss.toExponential(2)}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                          style={{ width: `${Math.max(5, 100 - (params as any).hamiltonian_loss * 10000)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

