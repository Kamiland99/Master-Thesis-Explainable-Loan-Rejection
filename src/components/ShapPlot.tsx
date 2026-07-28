import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Applicant, APPLICANTS } from '../data';

interface ShapPlotProps {
  applicant: Applicant;
}

const PREVIEW_COUNT = 12;

// Calculate global max so plot scales are identical across all applicants,
// preventing small values from expanding to 100% width on certain applicants
const GLOBAL_MAX_SHAP = APPLICANTS.reduce((globalMax, a) => {
  const localMax = Math.max(...a.features.map(f => Math.abs(f.shap)));
  return Math.max(globalMax, localMax);
}, 0);

export const ShapPlot: React.FC<ShapPlotProps> = ({ applicant }) => {
  const [showAll, setShowAll] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const sortedFeatures = useMemo(() => {
    return [...applicant.features].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));
  }, [applicant.features]);

  const maxAbsShap = GLOBAL_MAX_SHAP;

  const displayedFeatures = showAll ? sortedFeatures : sortedFeatures.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h3 className="text-3xl font-serif italic text-slate-900 mb-2">Risk Impact Analysis</h3>
          <p className="text-m text-slate-500 max-w-fit-content">
            This visualization shows how each feature of the application contributed to the final decision. 
            Features on the right increased rejection risk, while features on the left lowered it.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Higher Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lower Risk</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative pt-8">
        {/* Central Spine Label */}
        <div className="absolute top-0 left-[200px] right-0 flex justify-between px-4 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-300">
          <span>Approval Push</span>
          <span>Rejection Push</span>
        </div>

        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {displayedFeatures.map((feature, index) => {
              const isPositive = feature.shap > 0;
              const widthPct = (Math.abs(feature.shap) / maxAbsShap) * 90;

              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  onMouseEnter={() => setHoveredFeature(feature.name)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="grid grid-cols-[minmax(160px,220px)_minmax(0,1fr)_2px_minmax(0,1fr)] items-center group relative"
                >
                  {/* Feature Label */}
                  <div className="text-right pr-6 py-2 min-w-0">
                    <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors break-words" title={feature.name}>
                      {feature.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium break-words" title={feature.value}>
                      {feature.value}
                    </div>
                  </div>

                  {/* Negative Bar */}
                  <div className="h-10 flex items-center justify-end pr-0.5">
                    {!isPositive && (
                      <div className="flex items-center justify-end w-full">
                        <span className="font-mono text-[10px] font-bold text-blue-400 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(feature.shap * 100).toFixed(1)}%
                        </span>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          className="h-6 rounded-l-sm bg-gradient-to-l from-blue-500 to-blue-600 group-hover:from-blue-400 group-hover:to-blue-500 transition-all shadow-[-2px_0_10px_rgba(59,130,246,0.1)]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Spine */}
                  <div className="w-[2px] h-10 bg-slate-100 group-hover:bg-slate-200 transition-colors" />

                  {/* Positive Bar */}
                  <div className="h-10 flex items-center justify-start pl-0.5">
                    {isPositive && (
                      <div className="flex items-center justify-start w-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          className="h-6 rounded-r-sm bg-gradient-to-r from-red-500 to-red-600 group-hover:from-red-400 group-hover:to-red-500 transition-all shadow-[2px_0_10px_rgba(239,68,68,0.1)]"
                        />
                        <span className="font-mono text-[10px] font-bold text-red-400 pl-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          +{(feature.shap * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tooltip on Hover */}
                  <AnimatePresence>
                    {hoveredFeature === feature.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-[210px] bottom-full mb-2 z-50 w-64 p-3 bg-slate-900 text-white rounded-xl text-[11px] shadow-2xl pointer-events-none"
                      >
                        <div className="flex items-center gap-2 mb-1 text-indigo-300 font-bold uppercase tracking-widest text-[9px]">
                          <Info size={10} /> Feature Detail
                        </div>
                        {feature.description}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* See More Button */}
        {sortedFeatures.length > PREVIEW_COUNT && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-xl"
            >
              {showAll ? (
                <>
                  <span>Collapse Features</span>
                  <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <span>Analyze All {sortedFeatures.length} Features</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
