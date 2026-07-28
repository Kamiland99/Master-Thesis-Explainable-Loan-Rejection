import React from 'react';
import { Applicant } from '../data';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApplicantOverviewProps {
  applicant: Applicant;
}

export const ApplicantOverview: React.FC<ApplicantOverviewProps> = ({ applicant }) => {
  const isRejected = applicant.totalRisk >= 0.5;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400 mb-3">
          Applicant Overview
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          {applicant.summary.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0">
              <span className="text-xs text-slate-500">{item.k}</span>
              <span className="text-xs font-medium text-slate-700 text-right max-w-[140px]">{item.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400 mb-3">
          Final Decision
        </h3>
        <div className="relative overflow-hidden group">
          <div className={`absolute inset-0 ${isRejected ? 'bg-red-500' : 'bg-emerald-500'} opacity-5 group-hover:opacity-10 transition-opacity`} />
          <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white border ${isRejected ? 'border-red-100' : 'border-emerald-100'} shadow-sm relative z-10`}>
            <div className={`w-12 h-12 rounded-full ${isRejected ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shadow-inner`}>
              {isRejected ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="text-center">
              <span className={`block text-lg font-black uppercase tracking-tight ${isRejected ? 'text-red-600' : 'text-emerald-600'}`}>
                {isRejected ? 'Loan Rejected' : 'Loan Approved'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Risk Score: {(applicant.totalRisk * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
