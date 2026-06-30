import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  HelpCircle,
  Cpu,
  Users,
  Check
} from "lucide-react";
import { Candidate } from "../types";

interface InteractiveTalentChartProps {
  candidates: Candidate[];
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
}

export default function InteractiveTalentChart({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
}: InteractiveTalentChartProps) {
  // Chart Zoom and Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number } | null>(null);

  // Filters State
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedDataFlows, setSelectedDataFlows] = useState<string[]>([
    "Event-Driven",
    "Microservices",
    "Batch Processing",
    "Monolithic CRUD",
  ]);
  const [selectedInfra, setSelectedInfra] = useState<string[]>([
    "Serverless/Cloud-Native",
    "Self-Hosted/Kubernetes",
    "Bare-Metal",
  ]);

  // Hover Info State
  const [hoveredCandidate, setHoveredCandidate] = useState<Candidate | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; showBelow?: boolean }>({ x: 0, y: 0, showBelow: false });

  // Responsive container width tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset zoom behavior
  const handleResetZoom = () => {
    setZoomLevel(0.85);
    setZoomTarget(null);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.45));
  };

  // Zoom to candidate bubble coordinates
  const handleZoomToCandidate = (cand: Candidate) => {
    if (!cand.sub_metrics) return;
    onSelectCandidate(cand.id);
    
    // Zoom in and target the coordinates
    setZoomLevel(2);
    setZoomTarget({
      x: cand.sub_metrics.technical_match_score,
      y: cand.sub_metrics.behavioral_trajectory_score,
    });
  };

  // Toggle filtering tags
  const toggleDataFlow = (flow: string) => {
    setSelectedDataFlows((prev) =>
      prev.includes(flow) ? prev.filter((item) => item !== flow) : [...prev, flow]
    );
  };

  const toggleInfra = (infra: string) => {
    setSelectedInfra((prev) =>
      prev.includes(infra) ? prev.filter((item) => item !== infra) : [...prev, infra]
    );
  };

  // Filtered Candidates list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      // Must have scores calculated
      if (typeof cand.final_score !== "number") return false;
      if (cand.final_score < minScore) return false;

      // Filter by Data Flow
      if (!selectedDataFlows.includes(cand.project_dna.data_flow)) return false;

      // Filter by Infrastructure
      if (!selectedInfra.includes(cand.project_dna.infrastructure_culture)) return false;

      return true;
    });
  }, [candidates, minScore, selectedDataFlows, selectedInfra]);

  const isSmall = containerWidth < 600;

  // Dimensions of SVG canvas
  const padding = isSmall ? 35 : 65;
  const width = 500;
  const height = 340;

  // Coordinate mapping helper with Zoom integration
  const getCoordinates = (techScore: number, behavScore: number) => {
    // Standard mapping: X maps techScore (0-100), Y maps behavScore (0-100)
    let xPercent = techScore / 100;
    let yPercent = (100 - behavScore) / 100; // SVG 0,0 is top-left, so invert Y

    if (zoomLevel > 1 && zoomTarget) {
      // Shift viewport relative to the zoom target
      const targetXPercent = zoomTarget.x / 100;
      const targetYPercent = (100 - zoomTarget.y) / 100;

      // Calculate relative distance from target
      xPercent = (xPercent - targetXPercent) * zoomLevel + 0.5;
      yPercent = (yPercent - targetYPercent) * zoomLevel + 0.5;
    } else {
      // Zoom out from center
      xPercent = (xPercent - 0.5) * zoomLevel + 0.5;
      yPercent = (yPercent - 0.5) * zoomLevel + 0.5;
    }

    const cx = padding + xPercent * (width - padding * 2);
    const cy = padding + yPercent * (height - padding * 2);

    return { cx, cy };
  };

  const getDataFlowColorClass = (flow: string) => {
    switch (flow) {
      case "Event-Driven":
        return "#0FA4AF"; // Vibrant Turquoise/Teal
      case "Microservices":
        return "#024950"; // Spruce Teal
      case "Batch Processing":
        return "#964734"; // Terracotta
      default:
        return "#88C6CE"; // Muted turquoise-grey
    }
  };

  return (
    <div ref={containerRef} id="interactive-vis-root" className="p-6 rounded-3xl bg-white border border-[#D0E4E7] shadow-sm flex flex-col gap-6">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Interactive Analytics Stage
            </span>
            <span className="bg-[#024950]/10 text-[#024950] text-[9px] font-mono px-2 py-0.5 rounded-full border border-[#024950]/20">
              Agent 2 Scored Data
            </span>
          </div>
          <h2 className="text-base font-display font-bold text-[#003135] mt-0.5">
            Multi-Axis Talent Alignment Map
          </h2>
          <p className="text-xs text-stone-500">
            Interactive coordinates showcasing technical proficiency (X) vs. behavioral trajectory (Y). Bubble size represents domain depth.
          </p>
        </div>

        {/* Viewport controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            id="chart-zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 bg-stone-100 hover:bg-stone-200 border border-[#D0E4E7] rounded-lg text-stone-700 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="chart-zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 bg-stone-100 hover:bg-stone-200 border border-[#D0E4E7] rounded-lg text-stone-700 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="chart-zoom-reset"
            onClick={handleResetZoom}
            title="Reset View"
            className="flex items-center gap-1 px-2.5 py-2 bg-stone-100 hover:bg-[#024950]/10 hover:text-[#024950] border border-[#D0E4E7] rounded-lg text-xs font-mono text-stone-600 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Grid Layout containing chart canvas and parameter controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG Interactive Canvas: col-span-8 */}
        <div className="lg:col-span-8 bg-[#FDFCF8] border border-[#D0E4E7]/80 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
          
          {/* Axis Labels */}
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 ${isSmall ? "text-[8px] px-1.5 py-0" : "text-[9px] px-2 py-0.5"} font-mono text-stone-400 bg-white/80 rounded-full border border-stone-200 pointer-events-none`}>
            Behavioral Trajectory Target (Y)
          </div>
          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 ${isSmall ? "text-[8px] px-1.5 py-0" : "text-[9px] px-2 py-0.5"} font-mono text-stone-400 bg-white/80 rounded-full border border-stone-200 pointer-events-none`}>
            Technical Match Target (X)
          </div>

          {/* SVG Canvas wrapper with scroll/zoom feedback */}
          <div className="relative w-full aspect-[5/3.4]">
            <svg
              id="talent-alignment-svg"
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full select-none"
            >
              {/* Glow Filters for Selected Candidate bubble highlight */}
              <defs>
                <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="radar-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#D0E4E7" strokeWidth="1.5" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#D0E4E7" strokeWidth="1.5" />

              {/* Grid Subdivision helpers */}
              {[25, 50, 75].map((tick) => {
                const tickX = padding + (tick / 100) * (width - padding * 2);
                const tickY = padding + ((100 - tick) / 100) * (height - padding * 2);

                return (
                  <React.Fragment key={tick}>
                    {/* Vertical guideline */}
                    <line
                      x1={tickX}
                      y1={padding}
                      x2={tickX}
                      y2={height - padding}
                      stroke="#D0E4E7"
                      strokeWidth="0.75"
                      strokeDasharray="4 4"
                      className="opacity-60"
                    />
                    {/* Horizontal guideline */}
                    <line
                      x1={padding}
                      y1={tickY}
                      x2={width - padding}
                      y2={tickY}
                      stroke="#D0E4E7"
                      strokeWidth="0.75"
                      strokeDasharray="4 4"
                      className="opacity-60"
                    />

                    {/* Axis legends */}
                    <text x={tickX} y={height - padding + 12} textAnchor="middle" className={`${isSmall ? "text-[5.5px]" : "text-[8px]"} font-mono fill-stone-400`}>
                      {tick}
                    </text>
                    <text x={padding - 8} y={tickY + 2.5} textAnchor="end" className={`${isSmall ? "text-[5.5px]" : "text-[8px]"} font-mono fill-stone-400`}>
                      {tick}
                    </text>
                  </React.Fragment>
                );
              })}

              {/* Quadrant Titles */}
              <text x={padding + 10} y={padding + 15} className={`${isSmall ? "text-[5.5px]" : "text-[8px]"} font-mono fill-rose-900/40 font-bold uppercase tracking-wider`}>
                High Behavior / High Barrier
              </text>
              <text x={width - padding - 10} y={padding + 15} textAnchor="end" className={`${isSmall ? "text-[5.5px]" : "text-[8px]"} font-mono fill-emerald-900/40 font-bold uppercase tracking-wider`}>
                Optimal Core Fit (Elite)
              </text>

              {/* Interactive Bubbles */}
              {filteredCandidates.map((cand) => {
                if (!cand.sub_metrics) return null;

                const { cx, cy } = getCoordinates(
                  cand.sub_metrics.technical_match_score,
                  cand.sub_metrics.behavioral_trajectory_score
                );

                // Bubble radius derived from Domain Alignment score (max size: 16px, min size: 6px)
                const radiusBase = isSmall ? 4.5 : 6;
                const radiusMultiplier = isSmall ? 6.5 : 10;
                const radius = radiusBase + (cand.sub_metrics.domain_alignment_score / 100) * radiusMultiplier;
                const isSelected = cand.id === selectedCandidateId;
                const isHovered = hoveredCandidate?.id === cand.id;
                const bubbleColor = getDataFlowColorClass(cand.project_dna.data_flow);

                // Skip drawing if calculated coordinates fall outside the viewport with some extra padding
                // Allow up to 25px outside the padding grid lines so candidates close to the edges do not get abruptly clipped
                if (cx < padding - 25 || cx > width - padding + 25 || cy < padding - 25 || cy > height - padding + 25) {
                  return null;
                }

                return (
                  <g
                    key={cand.id}
                    className="cursor-pointer"
                    onClick={() => handleZoomToCandidate(cand)}
                    onMouseEnter={(e) => {
                      setHoveredCandidate(cand);
                      // Calculate coordinate relative to container
                      const bounds = e.currentTarget.getBoundingClientRect();
                      const parentBounds = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                      if (parentBounds) {
                        const halfTooltip = 104; // w-52 is 208px, so half is 104px
                        let x = bounds.left - parentBounds.left + bounds.width / 2;
                        x = Math.max(halfTooltip + 8, Math.min(parentBounds.width - halfTooltip - 8, x));
                        
                        const yFromTop = bounds.top - parentBounds.top;
                        const showBelow = yFromTop < 130;
                        
                        setTooltipPos({
                          x: x,
                          y: showBelow ? bounds.bottom - parentBounds.top + 8 : bounds.top - parentBounds.top - 8,
                          showBelow: showBelow
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCandidate(null)}
                  >
                    {/* Pulsing rings for selected candidate */}
                    {isSelected && (
                      <>
                        {/* Outermost sweeping radar glow pulse */}
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          animate={{
                            r: [radius + 4, radius + 22, radius + 4],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          fill="none"
                          stroke={bubbleColor}
                          strokeWidth="2"
                          filter="url(#radar-glow)"
                        />
                        {/* Inner tighter pulsing glow ring */}
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          animate={{
                            r: [radius + 2, radius + 12, radius + 2],
                            opacity: [0.8, 0.2, 0.8]
                          }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          fill="none"
                          stroke={bubbleColor}
                          strokeWidth="1.5"
                          filter="url(#bubble-glow)"
                        />
                      </>
                    )}

                    {/* Outer highlight circle on hover/selected */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 4}
                        fill="none"
                        stroke={bubbleColor}
                        strokeWidth={isSelected ? "2.5" : "1"}
                        className={`${isSelected ? "opacity-100" : "opacity-60"}`}
                        filter={isSelected ? "url(#bubble-glow)" : undefined}
                      />
                    )}

                    {/* Main solid bubble with micro-pulse when selected */}
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={bubbleColor}
                      stroke={isSelected ? "#003135" : "white"}
                      strokeWidth={isSelected ? 2 : 1}
                      animate={isSelected ? {
                        scale: [1, 1.1, 1],
                        strokeWidth: [2, 3, 2]
                      } : {}}
                      transition={isSelected ? {
                        type: "tween",
                        ease: "easeInOut",
                        duration: 1.6,
                        repeat: Infinity,
                      } : {}}
                      className="transition-all duration-300 opacity-90 hover:opacity-100"
                    />

                    {/* Numeric inner rating display inside bubble if space allows */}
                    {radius >= (isSmall ? 8.5 : 11) && (
                      <text
                        x={cx}
                        y={cy + 2.5}
                        textAnchor="middle"
                        className={`${isSmall ? "text-[6px]" : "text-[8px]"} font-mono font-extrabold fill-white`}
                      >
                        {cand.final_score}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip Portal Overlay */}
            <AnimatePresence>
              {hoveredCandidate && hoveredCandidate.sub_metrics && (
                <motion.div
                  id="chart-interactive-tooltip"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  style={{
                    position: "absolute",
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    transform: tooltipPos.showBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
                  }}
                  className="bg-[#003135] text-[#FDFCF8] p-3 rounded-xl shadow-xl z-30 w-52 pointer-events-none text-xs border border-teal-950"
                >
                  <div className="font-display font-bold border-b border-teal-900 pb-1 mb-1.5 flex justify-between items-center">
                    <span>{hoveredCandidate.anonymized_profile.display_identifier}</span>
                    <span className="font-mono text-[#0FA4AF] bg-[#0FA4AF]/10 px-1.5 py-0.2 rounded text-[10px]">
                      {hoveredCandidate.final_score}% Fit
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-teal-200/60">Technical Align:</span>
                      <span>{hoveredCandidate.sub_metrics.technical_match_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-200/60">Behavioral Align:</span>
                      <span>{hoveredCandidate.sub_metrics.behavioral_trajectory_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-200/60">Domain Align:</span>
                      <span>{hoveredCandidate.sub_metrics.domain_alignment_score}/100</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-teal-900">
                      <span className="text-teal-200/60">Flow Pattern:</span>
                      <span className="text-stone-200">{hoveredCandidate.project_dna.data_flow}</span>
                    </div>
                  </div>

                  <div className="text-[8px] text-teal-300/50 italic mt-2 text-center">
                    Click bubble to focus camera
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick instructions / legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D0E4E7]/40 mt-2">
            <div className="flex flex-wrap gap-3 items-center text-[10px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0FA4AF]" /> Event-Driven
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#024950]" /> Microservices
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#964734]" /> Batch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#88C6CE]" /> Monolithic CRUD
              </span>
            </div>

            <div className="text-[10px] font-mono text-stone-500 italic flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-stone-400" /> Hover for values, click to focus camera
            </div>
          </div>

        </div>

        {/* Filters Panel Configuration Controls: col-span-4 */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Bento Sub-Card: Dataset filters */}
          <div className="p-5 rounded-2xl bg-[#EBF7F9]/30 border border-[#D0E4E7] space-y-4">
            
            <div className="flex items-center gap-2 border-b border-[#D0E4E7] pb-3 mb-2">
              <Filter className="w-4 h-4 text-[#024950]" />
              <h3 className="font-display font-semibold text-sm text-[#003135]">
                Data Set Filters
              </h3>
            </div>

            {/* Slider: Match score threshold */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span>Minimum Composite Fit</span>
                <span className="font-mono text-[#024950] font-bold">{minScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-1 bg-[#EBF7F9] rounded-lg appearance-none cursor-pointer accent-[#024950]"
              />
            </div>

            {/* Checkboxes: Data flow */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                Project DNA Flow Patterns
              </span>
              <div className="space-y-1.5">
                {["Event-Driven", "Microservices", "Batch Processing", "Monolithic CRUD"].map((flow) => {
                  const active = selectedDataFlows.includes(flow);
                  return (
                    <button
                      key={flow}
                      type="button"
                      id={`filter-flow-${flow.replace(/\s+/g, "-")}`}
                      onClick={() => toggleDataFlow(flow)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                        active
                          ? "bg-[#024950]/10 border-[#024950]/30 text-stone-900"
                          : "bg-white border-stone-200/60 text-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getDataFlowColorClass(flow) }}
                        />
                        {flow}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-[#024950]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkboxes: Infrastructure culture */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                Infrastructure Culture alignment
              </span>
              <div className="space-y-1.5">
                {["Serverless/Cloud-Native", "Self-Hosted/Kubernetes", "Bare-Metal"].map((infra) => {
                  const active = selectedInfra.includes(infra);
                  return (
                    <button
                      key={infra}
                      type="button"
                      id={`filter-infra-${infra.replace(/\s+/g, "-")}`}
                      onClick={() => toggleInfra(infra)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                        active
                          ? "bg-[#024950] text-white border-[#024950]"
                          : "bg-white border-stone-200/60 text-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      <span>{infra}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#0FA4AF]" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Stats Summary Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#D0E4E7] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Visual Analytics Summary
              </span>
              <Users className="w-3.5 h-3.5 text-[#024950]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-2xl font-display font-extrabold text-[#003135]">
                  {filteredCandidates.length}
                </span>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-mono font-semibold mt-0.5">
                  Filtered Set
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-2xl font-display font-extrabold text-[#003135]">
                  {candidates.length > 0
                    ? Math.round(
                        candidates.reduce((acc, c) => acc + (c.final_score || 0), 0) /
                          candidates.length
                      )
                    : 0}
                  %
                </span>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-mono font-semibold mt-0.5">
                  Avg Cohort Score
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
