import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export const ConditionAIntro: React.FC<Props> = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex items-center justify-center p-6 bg-slate-50"
    >
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <BarChart3 size={40} />
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
            Condition A: <br/>
            <span className="text-indigo-600">Static Analysis</span>
          </h2>
          
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            In this condition, you will analyze 3 rejected loan applications using 
            <strong> SHAP visualizations</strong>. These plots show exactly which factors 
            contributed to the AI's decision.
          </p>
          
          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Analyze Risk Factors</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Red bars indicate factors that increased rejection risk. Blue bars indicate factors that improved the chances of approval.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Evaluate 3 Cases</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You will review three different applicants. Take your time to understand the visual breakdown for each one.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onStart}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
          >
            Begin Analysis <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
