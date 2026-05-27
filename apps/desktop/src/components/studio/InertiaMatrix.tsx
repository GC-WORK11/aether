import React from 'react';
import { Box } from 'lucide-react';

interface BodyInertia {
  mass: number;
  com: number[];
  I: number[][];
  principal_moments: number[];
}

interface InertiaData {
  n_bodies: number;
  bodies: Record<string, BodyInertia>;
}

interface InertiaMatrixProps {
  data: InertiaData | null;
}

export const InertiaMatrix: React.FC<InertiaMatrixProps> = ({ data }) => {
  if (!data || Object.keys(data.bodies).length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-6">
        <Box className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wider">No Inertia Data</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Inertia Tensors</h3>
        <span className="text-[10px] font-mono text-slate-400">Exact Volumetric Extraction</span>
      </div>
      
      <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
        {Object.entries(data.bodies).map(([name, inertia]) => (
          <div key={name} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{name}</span>
              <span className="text-[10px] font-mono font-bold text-blue-600">{inertia.mass.toFixed(4)} kg</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {inertia.I.map((row, i) => (
                row.map((val, j) => (
                  <div key={`${i}-${j}`} className="bg-slate-50 border border-slate-100 p-1.5 text-center rounded">
                    <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">I{i}{j}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-700 leading-none">{val.toFixed(6)}</p>
                  </div>
                ))
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Center of Mass</p>
                <div className="flex gap-2 text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-100">
                  {inertia.com.map((c, i) => (
                    <span key={i} className="flex-1 text-center">
                      <span className="text-slate-400 mr-1">{['X','Y','Z'][i]}:</span>
                      {c.toFixed(3)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Principal Moments</p>
                <div className="flex gap-2 text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-100">
                  {inertia.principal_moments.map((m, i) => (
                    <span key={i} className="flex-1 text-center">
                      {m.toFixed(4)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
