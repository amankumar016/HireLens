import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Sparkles, TrendingUp, Cpu, Award, GitPullRequest } from "lucide-react";
import { Candidate } from "../types";

interface ComparisonVisualizerProps {
  candidates: Candidate[];
}

export default function ComparisonVisualizer({ candidates }: ComparisonVisualizerProps) {
  const [activeTab, setActiveTab] = useState<"radar" | "diverging" | "multibar">("radar");
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const colors = [
    { primary: "#964734", bg: "rgba(150, 71, 52, 0.15)", glowId: "mesh-glow-0", label: "A" },
    { primary: "#0FA4AF", bg: "rgba(15, 164, 175, 0.15)", glowId: "mesh-glow-1", label: "B" },
    { primary: "#9B5DE5", bg: "rgba(155, 93, 229, 0.15)", glowId: "mesh-glow-2", label: "C" },
    { primary: "#2D6A4F", bg: "rgba(45, 106, 79, 0.15)", glowId: "mesh-glow-3", label: "D" }
  ];

  // Standardize scores for all candidates
  const candidateScores = candidates.map((cand, index) => ({
    candidate: cand,
    color: colors[index % colors.length],
    tech: cand.sub_metrics?.technical_match_score ?? 75,
    trajectory: cand.sub_metrics?.behavioral_trajectory_score ?? 80,
    domain: cand.sub_metrics?.domain_alignment_score ?? 70,
    final: cand.final_score ?? 75
  }));

  const metrics = [
    { 
      id: "tech", 
      name: "Technical Match", 
      description: "Match with target stack, architecture knowledge, and precision programming assessments.",
      icon: Cpu
    },
    { 
      id: "trajectory", 
      name: "Behavioral Trajectory", 
      description: "Leadership indicators, adaptability indices, communication styles, and trajectory rating.",
      icon: TrendingUp
    },
    { 
      id: "domain", 
      name: "Domain Alignment", 
      description: "Industry sector expertise, target business vertical familiarity, and experience depth.",
      icon: Award
    }
  ];

  // SVG Center, Radius, Angles for Trigonometric plotting of the 3 key dimensions
  const width = 240;
  const height = 240;
  const cx = width / 2;
  const cy = height / 2;
  const rMax = 80;

  // 3-axis angles: 0 deg (Up), 120 deg, 240 deg
  const angleTech = -Math.PI / 2; // Up
  const angleTrajectory = -Math.PI / 2 + (2 * Math.PI) / 3; // Bottom Right
  const angleDomain = -Math.PI / 2 + (4 * Math.PI) / 3; // Bottom Left

  // Helper to convert polar coordinates to Cartesian
  const getCoordinates = (scores: { tech: number; trajectory: number; domain: number }) => {
    const rTech = (scores.tech / 100) * rMax;
    const rTrajectory = (scores.trajectory / 100) * rMax;
    const rDomain = (scores.domain / 100) * rMax;

    return {
      ptA: {
        x: cx + rTech * Math.cos(angleTech),
        y: cy + rTech * Math.sin(angleTech)
      },
      ptB: {
        x: cx + rTrajectory * Math.cos(angleTrajectory),
        y: cy + rTrajectory * Math.sin(angleTrajectory)
      },
      ptC: {
        x: cx + rDomain * Math.cos(angleDomain),
        y: cy + rDomain * Math.sin(angleDomain)
      }
    };
  };

  // Grid background triangles/circles
  const levels = [25, 50, 75, 100];

  // Compute Legend Dimensions Dynamically
  const maxLabelLength = Math.max(...candidateScores.map((score) => {
    const label = `${score.color.label}: ${score.candidate.anonymized_profile.display_identifier}`;
    return label.length;
  }));
  const legendWidth = Math.max(130, maxLabelLength * 6.6 + 34);
  const legendHeight = 12 + candidateScores.length * 14;

  // Find Leader
  const sortedByFinal = [...candidateScores].sort((a, b) => b.final - a.final);
  const leader = sortedByFinal[0];
  const runnerUp = sortedByFinal[1] || leader;
  const isTie = leader.final === runnerUp.final && candidateScores.length > 1;

  // Determine actual tab options. If there are > 2 candidates, "diverging" doesn't make sense,
  // so we'll dynamically show "multibar" track instead.
  const isDual = candidates.length === 2;
  const tabToUse = activeTab === "diverging" && !isDual ? "multibar" : activeTab;

  return (
    <div className="w-full bg-[#FDFCF8] border border-[#D0E4E7] rounded-2xl p-5 shadow-xs flex flex-col gap-5 mt-4">
      {/* Visual Header with switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D0E4E7] pb-4">
        <div>
          <h4 className="text-sm font-bold font-display text-[#003135] flex items-center gap-1.5">
            <GitPullRequest className="w-4 h-4 text-[#0FA4AF]" />
            Vector Variance & Comparative Biplots
          </h4>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Analyzing dimension disparity between selected matching candidates.
          </p>
        </div>

        {/* Dynamic Interactive Tab Controls */}
        <div className="flex bg-[#EBF7F9] p-1 rounded-xl border border-[#D0E4E7] self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={`px-3 py-1 text-[10px] font-bold font-display rounded-lg transition-all cursor-pointer ${
              tabToUse === "radar"
                ? "bg-white text-[#024950] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Symmetrical Radar
          </button>
          {isDual ? (
            <button
              type="button"
              onClick={() => setActiveTab("diverging")}
              className={`px-3 py-1 text-[10px] font-bold font-display rounded-lg transition-all cursor-pointer ${
                tabToUse === "diverging"
                  ? "bg-white text-[#024950] shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Divergence Track
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("multibar")}
              className={`px-3 py-1 text-[10px] font-bold font-display rounded-lg transition-all cursor-pointer ${
                tabToUse === "multibar"
                  ? "bg-white text-[#024950] shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Performance Track
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
        {/* Left Side: Dynamic Visualization Chamber */}
        <div className="lg:col-span-5 flex justify-center items-center relative bg-stone-50/40 border border-[#D0E4E7]/60 rounded-xl p-3 h-[290px] overflow-hidden">
          
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-mono text-stone-400 font-bold uppercase bg-white/70 px-2 py-0.5 rounded border border-[#D0E4E7]/50">
            <Sparkles className="w-2.5 h-2.5 text-[#0FA4AF]" /> Active Matrix
          </div>

          <AnimatePresence mode="wait">
            {tabToUse === "radar" ? (
              <motion.div
                key="radar-pane"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-[240px] h-[240px]"
              >
                <svg width={width} height={height} className="overflow-visible">
                  <defs>
                    {colors.map((color) => (
                      <filter key={color.glowId} id={color.glowId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    ))}
                  </defs>

                  {/* Concentric grid lines representing scales */}
                  {levels.map((level) => {
                    const r = (level / 100) * rMax;
                    const gridPtA = { x: cx, y: cy - r };
                    const gridPtB = {
                      x: cx + r * Math.cos(angleTrajectory),
                      y: cy + r * Math.sin(angleTrajectory)
                    };
                    const gridPtC = {
                      x: cx + r * Math.cos(angleDomain),
                      y: cy + r * Math.sin(angleDomain)
                    };

                    return (
                      <g key={level} id={`grid-${level}`}>
                        <polygon
                          points={`${gridPtA.x},${gridPtA.y} ${gridPtB.x},${gridPtB.y} ${gridPtC.x},${gridPtC.y}`}
                          fill="none"
                          stroke="#D0E4E7"
                          strokeWidth="0.8"
                          strokeDasharray={level === 100 ? "none" : "2, 3"}
                        />
                        <text
                          x={cx + 3}
                          y={cy - r + 8}
                          className="text-[7.5px] font-mono fill-stone-400 font-bold"
                        >
                          {level}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axes lines */}
                  <line x1={cx} y1={cy} x2={cx} y2={cy - rMax} stroke="#D0E4E7" strokeWidth="1.2" />
                  <line x1={cx} y1={cy} x2={cx + rMax * Math.cos(angleTrajectory)} y2={cy + rMax * Math.sin(angleTrajectory)} stroke="#D0E4E7" strokeWidth="1.2" />
                  <line x1={cx} y1={cy} x2={cx + rMax * Math.cos(angleDomain)} y2={cy + rMax * Math.sin(angleDomain)} stroke="#D0E4E7" strokeWidth="1.2" />

                  {/* Labels at the apex of axes */}
                  <text
                    x={cx}
                    y={cy - rMax - 10}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-stone-600 uppercase tracking-wider"
                  >
                    Technical Match
                  </text>
                  <text
                    x={cx + rMax * Math.cos(angleTrajectory) + 12}
                    y={cy + rMax * Math.sin(angleTrajectory) + 10}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-stone-600 uppercase tracking-wider"
                  >
                    Trajectory
                  </text>
                  <text
                    x={cx + rMax * Math.cos(angleDomain) - 12}
                    y={cy + rMax * Math.sin(angleDomain) + 10}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-stone-600 uppercase tracking-wider"
                  >
                    Domain
                  </text>

                  {/* Polygons */}
                  {candidateScores.map((score, index) => {
                    const coords = getCoordinates(score);
                    const pointsString = `${coords.ptA.x},${coords.ptA.y} ${coords.ptB.x},${coords.ptB.y} ${coords.ptC.x},${coords.ptC.y}`;
                    const opacityList = [0.25, 0.22, 0.20, 0.18];
                    const opacity = opacityList[index % opacityList.length];

                    return (
                      <g key={`poly-group-${score.candidate.id}`}>
                        <motion.polygon
                          initial={{ 
                            points: `${cx},${cy} ${cx},${cy} ${cx},${cy}`,
                            opacity: 0 
                          }}
                          animate={{ 
                            points: pointsString,
                            opacity: opacity 
                          }}
                          transition={{ type: "spring", stiffness: 70, damping: 15, delay: index * 0.1 }}
                          fill={score.color.primary}
                          stroke={score.color.primary}
                          strokeWidth="2.5"
                          className="transition-all duration-300"
                          filter={`url(#${score.color.glowId})`}
                        />
                        <motion.polygon
                          initial={{ 
                            points: `${cx},${cy} ${cx},${cy} ${cx},${cy}`
                          }}
                          animate={{ 
                            points: pointsString
                          }}
                          transition={{ type: "spring", stiffness: 70, damping: 15, delay: index * 0.1 }}
                          fill="none"
                          stroke={score.color.primary}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}

                  {/* Vertex Markers */}
                  {candidateScores.map((score, index) => {
                    const coords = getCoordinates(score);
                    return (
                      <g key={`markers-${score.candidate.id}`}>
                        <motion.circle
                          initial={{ cx: cx, cy: cy, opacity: 0 }}
                          animate={{ cx: coords.ptA.x, cy: coords.ptA.y, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 70, damping: 13, delay: 0.1 + index * 0.05 }}
                          r="4.5"
                          className="stroke-white stroke-2 shadow-xs cursor-pointer animate-pulse"
                          style={{ fill: score.color.primary }}
                          whileHover={{ scale: 1.8 }}
                          onMouseEnter={() => setHoveredMetric("tech")}
                          onMouseLeave={() => setHoveredMetric(null)}
                        />
                        <motion.circle
                          initial={{ cx: cx, cy: cy, opacity: 0 }}
                          animate={{ cx: coords.ptB.x, cy: coords.ptB.y, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 70, damping: 13, delay: 0.15 + index * 0.05 }}
                          r="4.5"
                          className="stroke-white stroke-2 shadow-xs cursor-pointer animate-pulse"
                          style={{ fill: score.color.primary }}
                          whileHover={{ scale: 1.8 }}
                          onMouseEnter={() => setHoveredMetric("trajectory")}
                          onMouseLeave={() => setHoveredMetric(null)}
                        />
                        <motion.circle
                          initial={{ cx: cx, cy: cy, opacity: 0 }}
                          animate={{ cx: coords.ptC.x, cy: coords.ptC.y, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 70, damping: 13, delay: 0.2 + index * 0.05 }}
                          r="4.5"
                          className="stroke-white stroke-2 shadow-xs cursor-pointer animate-pulse"
                          style={{ fill: score.color.primary }}
                          whileHover={{ scale: 1.8 }}
                          onMouseEnter={() => setHoveredMetric("domain")}
                          onMouseLeave={() => setHoveredMetric(null)}
                        />
                      </g>
                    );
                  })}

                  {/* Dynamic interactive legend overlap inside SVG */}
                  <g transform="translate(10, 10)">
                    <rect x="0" y="0" width={legendWidth} height={legendHeight} rx="6" fill="#FDFCF8" stroke="#D0E4E7" strokeWidth="1" opacity="0.9" />
                    {candidateScores.map((score, index) => {
                      const cyOffset = 14 + index * 14;
                      const label = `${score.color.label}: ${score.candidate.anonymized_profile.display_identifier}`;
                      return (
                        <g key={score.candidate.id}>
                          <circle cx="10" cy={cyOffset} r="3.5" fill={score.color.primary} />
                          <text x="20" y={cyOffset + 3} className="text-[8px] font-mono font-bold fill-stone-700">{label}</text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </motion.div>
            ) : tabToUse === "diverging" ? (
              <motion.div
                key="heatmap-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full flex flex-col justify-center gap-6 px-4"
              >
                {/* Visual metric difference list for Dual (A vs B) comparison */}
                {metrics.map((metric) => {
                  const valA = metric.id === "tech" ? candidateScores[0].tech : metric.id === "trajectory" ? candidateScores[0].trajectory : candidateScores[0].domain;
                  const valB = metric.id === "tech" ? candidateScores[1].tech : metric.id === "trajectory" ? candidateScores[1].trajectory : candidateScores[1].domain;
                  const variance = valA - valB;
                  const absVariance = Math.abs(variance);
                  
                  return (
                    <div 
                      key={metric.id}
                      className="space-y-1.5"
                      onMouseEnter={() => setHoveredMetric(metric.id)}
                      onMouseLeave={() => setHoveredMetric(null)}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-700">{metric.name}</span>
                        <span className="font-mono text-[10px] text-stone-500">
                          Diff: <span className={`font-bold ${variance > 0 ? "text-[#964734]" : variance < 0 ? "text-[#0FA4AF]" : "text-stone-400"}`}>
                            {variance > 0 ? `+${absVariance} pts (A Leads)` : variance < 0 ? `+${absVariance} pts (B Leads)` : "Parity"}
                          </span>
                        </span>
                      </div>

                      {/* Diverging Bar Track */}
                      <div className="relative w-full h-8 bg-stone-100 rounded-xl overflow-hidden border border-stone-200/50 flex">
                        
                        {/* Left Half (Candidate A Domain) */}
                        <div className="w-1/2 h-full border-r border-stone-300 relative flex items-center justify-end pr-2">
                          {variance > 0 && (
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(absVariance / 100) * 100}%` }}
                              className="absolute right-0 top-0 bottom-0 bg-[#964734]/15 border-r-2 border-[#964734]"
                            />
                          )}
                          <span className="text-[10px] font-mono font-bold text-stone-600 relative z-10">{valA}</span>
                        </div>

                        {/* Right Half (Candidate B Domain) */}
                        <div className="w-1/2 h-full relative flex items-center justify-start pl-2">
                          {variance < 0 && (
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(absVariance / 100) * 100}%` }}
                              className="absolute left-0 top-0 bottom-0 bg-[#0FA4AF]/15 border-l-2 border-[#0FA4AF]"
                            />
                          )}
                          <span className="text-[10px] font-mono font-bold text-stone-600 relative z-10">{valB}</span>
                        </div>

                        {/* Center zero line marker */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-stone-400 z-10 pointer-events-none" />
                      </div>
                    </div>
                  );
                })}

                <div className="text-[9px] font-mono text-stone-400 text-center bg-stone-50 p-2 rounded-lg border border-stone-100">
                  Bars represent divergence from central parity. Terracotta shades reflect Candidate A leads; Turquoise shades represent Candidate B leads.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="multibar-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full flex flex-col justify-center gap-3.5 px-2 py-3 overflow-y-auto"
              >
                {/* Visual multibar track for 3+ candidates */}
                {metrics.map((metric) => (
                  <div 
                    key={metric.id}
                    className="space-y-1"
                    onMouseEnter={() => setHoveredMetric(metric.id)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <span className="text-[10px] font-semibold text-stone-700 block">{metric.name}</span>
                    <div className="bg-stone-100 border border-stone-200/50 rounded-xl p-2 space-y-1.5">
                      {candidateScores.map((score) => {
                        const val = metric.id === "tech" ? score.tech : metric.id === "trajectory" ? score.trajectory : score.domain;
                        return (
                          <div key={score.candidate.id} className="flex items-center gap-2">
                            <span className="w-3 text-[8px] font-mono font-bold text-stone-500">{score.color.label}</span>
                            <div className="flex-grow bg-stone-200/60 h-2 rounded-full overflow-hidden relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: score.color.primary }}
                              />
                            </div>
                            <span className="w-8 text-right text-[9px] font-mono font-bold text-stone-700">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating vector tooltip overlay */}
          <AnimatePresence>
            {hoveredMetric && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute bottom-3 left-3 right-3 bg-[#003135]/95 backdrop-blur-md text-white p-3 rounded-xl shadow-lg border border-white/10 z-20"
              >
                <div className="flex justify-between items-center mb-1.5 border-b border-white/10 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#AFDDE5]">
                    {hoveredMetric === "tech" ? "Technical Match" : hoveredMetric === "trajectory" ? "Behavioral Trajectory" : "Domain Alignment"}
                  </span>
                  <span className="text-[8px] font-mono text-stone-300 bg-white/10 px-1.5 py-0.5 rounded uppercase">Vector Focus</span>
                </div>
                <div className={`grid ${candidateScores.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"} gap-3 text-xs`}>
                  {candidateScores.map((score) => {
                    const val = hoveredMetric === "tech" ? score.tech : hoveredMetric === "trajectory" ? score.trajectory : score.domain;
                    return (
                      <div key={score.candidate.id} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: score.color.primary }} />
                        <span className="truncate text-stone-200 text-[10px]">
                          {score.color.label}: <strong className="text-white text-xs font-display font-black">{val}%</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Informative Metric Explanatory Panel */}
        <div className="lg:col-span-6 flex flex-col gap-4 self-stretch justify-between">
          <div className="space-y-3">
            <h5 className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold">
              Metric Specifics & Vector Weights
            </h5>
            
            <div className="space-y-2.5">
              {metrics.map((metric) => (
                <div 
                  key={metric.id}
                  onClick={() => setHoveredMetric(metric.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    hoveredMetric === metric.id
                      ? "bg-[#EBF7F9] border-[#024950] shadow-2xs"
                      : "bg-stone-50/50 border-stone-200/60 hover:bg-stone-100/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-stone-800">{metric.name}</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold">
                      {candidateScores.map((score) => {
                        const val = metric.id === "tech" ? score.tech : metric.id === "trajectory" ? score.trajectory : score.domain;
                        return (
                          <span 
                            key={score.candidate.id}
                            className="px-1.5 py-0.5 rounded border"
                            style={{ 
                              color: score.color.primary, 
                              backgroundColor: `${score.color.primary}10`, 
                              borderColor: `${score.color.primary}30` 
                            }}
                          >
                            {score.color.label}: {val}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal mt-1">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick takeaway summary callout */}
          <div className="p-3 bg-[#EBF7F9]/40 border border-[#024950]/10 rounded-xl text-xs flex gap-2.5 items-start">
            <HelpCircle className="w-4 h-4 text-[#024950] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800 block">Alignment Verdict</span>
              <p className="text-[10px] text-stone-500 leading-normal mt-0.5">
                {isDual ? (
                  candidateScores[0].final > candidateScores[1].final ? (
                    <><strong>{candidateScores[0].candidate.anonymized_profile.display_identifier} (Candidate A)</strong> holds an overall alignment advantage of <strong>{candidateScores[0].final - candidateScores[1].final}%</strong> over Candidate B, primarily driven by stronger alignment across key metrics.</>
                  ) : candidateScores[1].final > candidateScores[0].final ? (
                    <><strong>{candidateScores[1].candidate.anonymized_profile.display_identifier} (Candidate B)</strong> holds an overall alignment advantage of <strong>{candidateScores[1].final - candidateScores[0].final}%</strong> over Candidate A, exhibiting higher performance in core requested dimensions.</>
                  ) : (
                    <>Both candidates represent perfectly symmetrical scores of <strong>{candidateScores[0].final}%</strong> overall alignment under the active calibration weights model.</>
                  )
                ) : isTie ? (
                  <>There is a tie for the top alignment spot between multiple candidates with a score of <strong>{leader.final}%</strong> overall alignment.</>
                ) : (
                  <><strong>{leader.candidate.anonymized_profile.display_identifier} (Candidate {leader.color.label})</strong> leads this comparison cohort with an overall alignment score of <strong>{leader.final}%</strong>, leading by <strong>{leader.final - runnerUp.final}%</strong> over the next best profile in this grid.</>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
