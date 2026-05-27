import React from 'react';
import { Share2, Zap, Activity } from 'lucide-react';

interface Joint {
  type: string;
  confidence: number;
}

interface KinematicDiscovery {
  n_bodies: number;
  n_joints: number;
  joints: Joint[];
}

interface KinematicTreeProps {
  data: KinematicDiscovery | null;
}

export const KinematicTree: React.FC<KinematicTreeProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-black/20 border border-white/5 rounded-2xl p-8 italic">
        <Share2 className="w-8 h-8 mb-4 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Structure Hidden</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Kinematic Tree</h3>
        </div>
        <div className="flex gap-2">
           <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black border border-blue-500/20 rounded-full uppercase">
            {data.n_bodies} Bodies
          </span>
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8px] font-black border border-purple-500/20 rounded-full uppercase">
            {data.n_joints} Joints
          </span>
        </div>
      </div>
      
      <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
        {data.joints.length > 0 ? (
          data.joints.map((joint, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Connection {idx}</p>
                <p className="text-xs font-bold text-slate-200 capitalize">{joint.type} Joint</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-500 uppercase">Certainty</p>
                <p className="text-xs font-mono font-bold text-emerald-400">{(joint.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest italic">No Articulation</p>
          </div>
        )}
      </div>
    </div>
  );
};

