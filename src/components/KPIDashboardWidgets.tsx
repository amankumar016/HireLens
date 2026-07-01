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
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(2, 73, 80, 0.25)" }}
        whileTap={{ scale: 0.985 }}
        onClick={onClearSearch}
        className="group relative overflow-hidden bg-gradient-to-br from-[#024950] via-[#024950] to-[#0FA4AF] border border-[#024950]/30 rounded-2xl p-5 shadow-sm transition-all duration-300 cursor-pointer text-white"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500" />
        
        {/* Animated Cybernetic Scan Overlay during loading */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#024950]/80 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-[9px] font-mono text-teal-200 tracking-wider uppercase animate-pulse">Processing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-100 group-hover:text-white transition-colors">
            Calibration Base
          </span>
          <div className="w-7 h-7 bg-white/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <Users className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-white tracking-tight flex items-baseline gap-1">
            <AnimatedScore value={totalPool} />
            <span className="text-xs font-mono font-semibold text-teal-200">profiles</span>
          </div>
          <h3 className="text-xs font-semibold text-white mt-1">Total Talent Assessed</h3>
          <p className="text-[10px] text-teal-100/85 leading-normal mt-0.5 group-hover:text-white">
            Click this card to reset and show all candidates in the list.
          </p>
        </div>
      </motion.div>

      {/* CARD 2: Top Calibration Fit */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(150, 71, 52, 0.25)" }}
        whileTap={{ scale: 0.985 }}
        onClick={handleTopCandidateClick}
        className="group relative overflow-hidden bg-gradient-to-br from-[#964734] via-[#964734] to-[#B85C43] border border-[#964734]/30 rounded-2xl p-5 shadow-sm transition-all duration-300 cursor-pointer text-white"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500" />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#964734]/80 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-[9px] font-mono text-amber-200 tracking-wider uppercase animate-pulse">Syncing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-100 group-hover:text-white transition-colors">
            Peak Performance
          </span>
          <div className="w-7 h-7 bg-white/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-white tracking-tight flex items-baseline">
            <AnimatedScore value={topFit} />
            <span className="text-sm font-mono font-semibold text-amber-200">%</span>
          </div>
          <h3 className="text-xs font-semibold text-white mt-1">Elite Standard Fit</h3>
          <p className="text-[10px] text-amber-100/85 leading-normal mt-0.5 group-hover:text-white">
            Click to focus and view details of the top-ranked candidate.
          </p>
        </div>
      </motion.div>

      {/* CARD 3: Average Alignment Fit */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(61, 82, 160, 0.25)" }}
        className="group relative overflow-hidden bg-gradient-to-br from-[#3D52A0] via-[#3D52A0] to-[#7091E6] border border-[#3D52A0]/30 rounded-2xl p-5 shadow-sm transition-all duration-300 text-white"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500" />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#3D52A0]/80 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-[9px] font-mono text-indigo-200 tracking-wider uppercase animate-pulse">Recalculating</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-100 group-hover:text-white transition-colors">
            Cohort Suitability
          </span>
          <div className="w-7 h-7 bg-white/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-white tracking-tight flex items-baseline">
            <AnimatedScore value={avgFit} />
            <span className="text-sm font-mono font-semibold text-indigo-200">%</span>
          </div>
          <h3 className="text-xs font-semibold text-white mt-1">Mean Pool Fit</h3>
          <p className="text-[10px] text-indigo-100/85 leading-normal mt-0.5">
            Average alignment rate for currently calibrated weights matrix.
          </p>
        </div>
      </motion.div>

      {/* CARD 4: Strong Fits Ratio */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.25)" }}
        whileTap={{ scale: 0.985 }}
        onClick={() => onFilterStrongFits(!isStrongFitsFiltered)}
        className={`group relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 cursor-pointer text-white ${
          isStrongFitsFiltered 
            ? "bg-gradient-to-br from-[#E65C00] to-[#F9D423] border-[#E65C00]/30 shadow-md shadow-orange-900/10" 
            : "bg-gradient-to-br from-[#0FA4AF] to-[#024950] border-[#0FA4AF]/30"
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500" />
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-50/50 backdrop-blur-2xs flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-[9px] font-mono text-white tracking-wider uppercase animate-pulse">Filtering</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-100 group-hover:text-white transition-colors">
            Target Threshold
          </span>
          <div className="w-7 h-7 bg-white/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-display font-black text-white tracking-tight flex items-baseline gap-1">
            <AnimatedScore value={strongFitsCount} />
            <span className="text-xs font-mono font-semibold text-teal-200">elite</span>
          </div>
          <h3 className="text-xs font-semibold text-white mt-1">
            {isStrongFitsFiltered ? "Showing Strong Fits (>=85%)" : "Calibrated Elite Fits"}
          </h3>
          <p className="text-[10px] text-teal-100/85 leading-normal mt-0.5 group-hover:text-white">
            {isStrongFitsFiltered 
              ? "Click this card again to disable filter and show all." 
              : "Click to filter candidates list to scores of 85% and above."}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
