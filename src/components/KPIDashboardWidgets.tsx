import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Trophy, Activity, Flame, Loader2 } from "lucide-react";
import { Candidate } from "../types";
import AnimatedScore from "./AnimatedScore";

interface KPIDashboardWidgetsProps {
  candidates: Candidate[];
  loading: boolean;
  onFilterStrongFits: (active: boolean) => void;
  isStrongFitsFiltered: boolean;
  onSelectCandidateId: (id: string | null) => void;
  selectedCandidateId: string | null;
  onClearSearch: () => void;
}

export default function KPIDashboardWidgets({
  candidates,
  loading,
  onFilterStrongFits,
  isStrongFitsFiltered,
  onSelectCandidateId,
  selectedCandidateId,
  onClearSearch
}: KPIDashboardWidgetsProps) {
  
  // Calculate statistics
  const totalPool = candidates.length;
  
  const topFit = React.useMemo(() => {
    if (candidates.length === 0) return 0;
    return Math.max(...candidates.map((c) => c.final_score || 0));
  }, [candidates]);

  const avgFit = React.useMemo(() => {
    if (candidates.length === 0) return 0;
    const scored = candidates.filter((c) => typeof c.final_score === "number");
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, c) => acc + (c.final_score || 0), 0);
    return Math.round(sum / scored.length);
  }, [candidates]);

  const strongFitsCount = React.useMemo(() => {
    return candidates.filter((c) => (c.final_score || 0) >= 85).length;
  }, [candidates]);

  // Find candidate ID with highest score
  const topCandidateId = React.useMemo(() => {
    if (candidates.length === 0) return null;
    const sorted = [...candidates].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    return sorted[0]?.id || null;
  }, [candidates]);

  const handleTopCandidateClick = () => {
    if (topCandidateId) {
      onSelectCandidateId(topCandidateId);
      // Scroll to deep dive or leaderboard
      const el = document.getElementById("bento-leaderboard");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2"
    >
      {/* CARD 1: Total Talent Pool */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(2, 73, 80, 0.08)" }}
        whileTap={{ scale: 0.985 }}
        onClick={onClearSearch}
        className="group relative overflow-hidden bg-white border border-[#D0E4E7] rounded-2xl p-5 shadow-xs transition-all duration-300 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#024950]/3 rounded-full blur-xl group-hover:bg-[#024950]/6 transition-all duration-500" />
        
        {/* Animated Cybernetic Scan Overlay during loading */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-50/50 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-[#024950] animate-spin" />
                <span className="text-[9px] font-mono text-[#0FA4AF] tracking-wider uppercase animate-pulse">Processing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 group-hover:text-[#024950] transition-colors">
            Calibration Base
          </span>
          <div className="w-7 h-7 bg-[#024950]/5 group-hover:bg-[#024950]/10 rounded-xl flex items-center justify-center transition-colors">
            <Users className="w-3.5 h-3.5 text-[#024950]" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-[#003135] tracking-tight flex items-baseline gap-1">
            <AnimatedScore value={totalPool} />
            <span className="text-xs font-mono font-semibold text-[#0FA4AF]">profiles</span>
          </div>
          <h3 className="text-xs font-semibold text-[#003135] mt-1">Total Talent Assessed</h3>
          <p className="text-[10px] text-stone-400 leading-normal mt-0.5 group-hover:text-stone-500">
            Click this card to reset and show all candidates in the list.
          </p>
        </div>
      </motion.div>

      {/* CARD 2: Top Calibration Fit */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(2, 73, 80, 0.08)" }}
        whileTap={{ scale: 0.985 }}
        onClick={handleTopCandidateClick}
        className="group relative overflow-hidden bg-white border border-[#D0E4E7] rounded-2xl p-5 shadow-xs transition-all duration-300 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#964734]/3 rounded-full blur-xl group-hover:bg-[#964734]/6 transition-all duration-500" />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-50/50 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-[#964734] animate-spin" />
                <span className="text-[9px] font-mono text-[#964734] tracking-wider uppercase animate-pulse">Syncing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 group-hover:text-[#964734] transition-colors">
            Peak Performance
          </span>
          <div className="w-7 h-7 bg-[#964734]/5 group-hover:bg-[#964734]/10 rounded-xl flex items-center justify-center transition-colors">
            <Trophy className="w-3.5 h-3.5 text-[#964734]" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-[#003135] tracking-tight flex items-baseline">
            <AnimatedScore value={topFit} />
            <span className="text-sm font-mono font-semibold text-[#964734]">%</span>
          </div>
          <h3 className="text-xs font-semibold text-[#003135] mt-1">Elite Standard Fit</h3>
          <p className="text-[10px] text-stone-400 leading-normal mt-0.5 group-hover:text-stone-500">
            Click to focus and view details of the top-ranked candidate.
          </p>
        </div>
      </motion.div>

      {/* CARD 3: Average Alignment Fit */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(2, 73, 80, 0.08)" }}
        className="group relative overflow-hidden bg-white border border-[#D0E4E7] rounded-2xl p-5 shadow-xs transition-all duration-300"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#0FA4AF]/3 rounded-full blur-xl group-hover:bg-[#0FA4AF]/6 transition-all duration-500" />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-50/50 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-[#0FA4AF] animate-spin" />
                <span className="text-[9px] font-mono text-[#0FA4AF] tracking-wider uppercase animate-pulse">Recalculating</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 group-hover:text-[#0FA4AF] transition-colors">
            Cohort Suitability
          </span>
          <div className="w-7 h-7 bg-[#0FA4AF]/5 group-hover:bg-[#0FA4AF]/10 rounded-xl flex items-center justify-center transition-colors">
            <Activity className="w-3.5 h-3.5 text-[#0FA4AF]" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-[#003135] tracking-tight flex items-baseline">
            <AnimatedScore value={avgFit} />
            <span className="text-sm font-mono font-semibold text-[#0FA4AF]">%</span>
          </div>
          <h3 className="text-xs font-semibold text-[#003135] mt-1">Mean Pool Fit</h3>
          <p className="text-[10px] text-stone-400 leading-normal mt-0.5">
            Average alignment rate for currently calibrated weights matrix.
          </p>
        </div>
      </motion.div>

      {/* CARD 4: Strong Fits Ratio */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(15, 164, 175, 0.08)" }}
        whileTap={{ scale: 0.985 }}
        onClick={() => onFilterStrongFits(!isStrongFitsFiltered)}
        className={`group relative overflow-hidden border rounded-2xl p-5 shadow-xs transition-all duration-300 cursor-pointer ${
          isStrongFitsFiltered 
            ? "bg-[#EBF7F9] border-[#024950] shadow-md shadow-teal-900/5" 
            : "bg-white border-[#D0E4E7]"
        }`}
      >
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all duration-500 ${
          isStrongFitsFiltered ? "bg-[#024950]/8" : "bg-emerald-500/3 group-hover:bg-emerald-500/6"
        }`} />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-50/50 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-[#024950] animate-spin" />
                <span className="text-[9px] font-mono text-[#024950] tracking-wider uppercase animate-pulse">Filtering</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
            isStrongFitsFiltered ? "text-[#024950]" : "text-stone-400 group-hover:text-emerald-500"
          }`}>
            Target Threshold
          </span>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
            isStrongFitsFiltered ? "bg-[#024950]/10" : "bg-emerald-500/5 group-hover:bg-emerald-500/10"
          }`}>
            <Flame className={`w-3.5 h-3.5 ${isStrongFitsFiltered ? "text-[#024950]" : "text-emerald-500"}`} />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-[#003135] tracking-tight flex items-baseline gap-1">
            <AnimatedScore value={strongFitsCount} />
            <span className="text-xs font-mono font-semibold text-[#0FA4AF]">elite</span>
          </div>
          <h3 className="text-xs font-semibold text-[#003135] mt-1">
            {isStrongFitsFiltered ? "Showing Strong Fits (>=85%)" : "Calibrated Elite Fits"}
          </h3>
          <p className="text-[10px] text-stone-400 leading-normal mt-0.5 group-hover:text-stone-500">
            {isStrongFitsFiltered 
              ? "Click this card again to disable filter and show all." 
              : "Click to filter candidates list to scores of 85% and above."}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
