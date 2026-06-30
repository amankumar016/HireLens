import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll, AnimatePresence } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function TiltCard({ children, className = "", id }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D rotation
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 100, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 100, damping: 18 });

  // Spring scaling and elevation shadow
  const scale = useSpring(hovered ? 1.015 : 1, { stiffness: 140, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      id={id}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative transition-shadow duration-300 border bg-white ${
        hovered 
          ? "shadow-[0_0_0_1px_rgba(2,73,80,0.18),_0_25px_50px_-12px_rgba(2,73,80,0.18)] border-[#024950]/35" 
          : "shadow-[0_0_0_1px_rgba(2,73,80,0.08),_0_8px_30px_rgb(2,73,80,0.05)] border-[#D0E4E7]"
      } ${className}`}
    >
      <div 
        style={{ 
          transform: "translateZ(12px)", 
          transformStyle: "preserve-3d" 
        }} 
        className="h-full w-full"
      >
        {children}
      </div>
      
      {/* Dynamic glossy reflections glare layer */}
      <motion.div 
        style={{
          opacity: hovered ? 0.15 : 0,
          background: useTransform(
            [x, y],
            ([valX, valY]) => {
              const pX = ((valX as number) + 0.5) * 100;
              const pY = ((valY as number) + 0.5) * 100;
              return `radial-gradient(circle at ${pX}% ${pY}%, rgba(255,255,255,0.8) 0%, transparent 60%)`;
            }
          ),
          pointerEvents: "none"
        }}
        className="absolute inset-0 rounded-2xl z-30 transition-opacity duration-300"
      />
    </motion.div>
  );
}

interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  pullFactor?: number;
}

export function MagneticWrapper({ children, className = "", pullFactor = 0.35 }: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 80, damping: 15 });
  const springY = useSpring(y, { stiffness: 80, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic drift
    x.set(distanceX * pullFactor);
    y.set(distanceY * pullFactor);
  };

  const handleMouseLeave = () => {
    setActive(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
      }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface TextCharRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextCharReveal({ text, className = "", delay = 0 }: TextCharRevealProps) {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay || (0.05 * i) },
    }),
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      y: 25,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={`flex flex-wrap ${className}`}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] overflow-hidden whitespace-nowrap py-0.5">
          <motion.span
            variants={child}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

export function CursorSpotlight() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  
  const springX = useSpring(x, { stiffness: 50, damping: 16 });
  const springY = useSpring(y, { stiffness: 50, damping: 16 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  return (
    <motion.div
      style={{
        left: springX,
        top: springY,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
      className="fixed hidden md:block w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(2,73,80,0.06)_0%,_rgba(175,221,229,0.02)_40%,_transparent_70%)] rounded-full z-0 pointer-events-none mix-blend-multiply transition-opacity duration-300"
    />
  );
}

/**
 * 1. HIGH-END CALIBRATING TELEMETRY PRELOADER
 */
export function Preloader() {
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState("Initializing Core Engine...");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const stages = [
      "Booting DNA Parser...",
      "Syncing Biases Stripper...",
      "Mounting HireLens Matrix...",
      "Calibrating Ghost Competencies...",
      "System Operational."
    ];

    let currentPercent = 0;
    const interval = setInterval(() => {
      currentPercent += Math.floor(Math.random() * 5) + 2;
      if (currentPercent >= 100) {
        currentPercent = 100;
        clearInterval(interval);
        setTimeout(() => {
          setVisible(false);
        }, 800);
      }
      setPercent(currentPercent);
      
      // Update stages proportionally
      const stageIdx = Math.min(Math.floor((currentPercent / 100) * stages.length), stages.length - 1);
      setStage(stages[stageIdx]);
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 bg-[#001D1F] text-white z-50 flex flex-col justify-between p-8 sm:p-12 font-mono selection:bg-white/10"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#0FA4AF] rounded-lg animate-pulse" />
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-white">HireLens</span>
                <span className="text-[10px] text-[#AFDDE5] block">TALENT INTELLIGENCE HUB</span>
              </div>
            </div>
            <div className="text-[10px] text-[#AFDDE5] text-right">
              SYSTEM RE-CALIBRATION<br />
              VERSION 2.6.4_PRO
            </div>
          </div>

          {/* Center loaded percent & animation */}
          <div className="max-w-2xl w-full mx-auto my-auto space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider text-[#AFDDE5] font-medium">{stage}</span>
                <span className="text-5xl sm:text-7xl font-sans font-light tracking-tighter text-white">{percent}%</span>
              </div>
              <div className="h-[2px] bg-white/10 rounded-full overflow-hidden w-full relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0FA4AF] to-[#964734]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Matrix logs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[9px] text-[#AFDDE5]/75 border-t border-white/5 pt-6">
              <div>
                <span className="text-white/40 block mb-0.5">MATRIX BIAS-STRIP</span>
                <span className="font-semibold text-green-400">ACTIVE [100%]</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">COMPETENCY RESOLUTION</span>
                <span>8-AXIS HIGH PRECISION</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">LOCAL FALLBACK DB</span>
                <span>FAILSAFE ONLINE</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">GEO REGION STATUS</span>
                <span className="text-[#964734]">SECURE SANDBOXED</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end text-[9px] text-[#AFDDE5]/50 border-t border-white/5 pt-4">
            <span>© HIRELENS CALIBRATION SYSTEMS DEEP REACTION</span>
            <span>PROPRIETARY COGNITIVE LOGIC ENG</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 2. BUTTERY MOUSE CURSOR WITH SPRING INERTIA AND CONTEXT HOVER
 */
export function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const [hoverState, setHoverState] = useState<"none" | "hover" | "view" | "drag">("none");
  const [labelText, setLabelText] = useState("");

  const ringSize = hoverState === "none" ? 20 : hoverState === "hover" ? 48 : 72;
  const ringScale = useSpring(ringSize, { stiffness: 180, damping: 20 });

  const springX = useSpring(mouseX, { stiffness: 220, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 24 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Identify triggers
      const isInteractive = target.closest("a, button, input, select, textarea, [role='button'], .cursor-pointer");
      const labelAttr = target.closest("[data-cursor-label]")?.getAttribute("data-cursor-label");
      const isDraggable = target.closest("[data-cursor-drag]");

      if (labelAttr) {
        setHoverState("view");
        setLabelText(labelAttr);
      } else if (isDraggable) {
        setHoverState("drag");
      } else if (isInteractive) {
        setHoverState("hover");
      } else {
        setHoverState("none");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    // Append CSS to hide default cursor in desktop
    const style = document.createElement("style");
    style.innerHTML = `@media (min-width: 768px) {
      a, button, select, input, [role='button'], .cursor-pointer {
        cursor: none !important;
      }
      body {
        cursor: none;
      }
    }`;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.head.removeChild(style);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 hidden md:block">
      {/* Outer Spring Ring */}
      <motion.div
        style={{
          left: springX,
          top: springY,
          width: ringScale,
          height: ringScale,
          transform: "translate(-50%, -50%)",
        }}
        className={`absolute rounded-full border flex items-center justify-center transition-colors duration-300 ${
          hoverState === "none"
            ? "border-[#024950]/45 bg-transparent"
            : hoverState === "hover"
            ? "border-[#0FA4AF] bg-[#0FA4AF]/10"
            : hoverState === "view"
            ? "border-[#964734] bg-[#964734]/15"
            : "border-[#024950] bg-[#024950]/20"
        }`}
      >
        <AnimatePresence>
          {hoverState === "view" && labelText && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[9px] font-mono tracking-tighter text-[#964734] font-extrabold whitespace-nowrap bg-[#001D1F] px-2 py-0.5 rounded border border-[#964734]/30 shadow-md"
            >
              {labelText}
            </motion.span>
          )}
          {hoverState === "drag" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[8px] font-mono text-[#024950] font-bold"
            >
              ↔ CALIBRATE
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Center Precision Dot */}
      <motion.div
        style={{
          left: mouseX,
          top: mouseY,
          transform: "translate(-50%, -50%)",
        }}
        className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          hoverState === "none"
            ? "bg-[#024950]"
            : hoverState === "view"
            ? "bg-[#964734]"
            : "bg-[#0FA4AF] scale-125"
        }`}
      />
    </div>
  );
}

/**
 * 3. SCROLL-DRIVEN 3D WIREFRAME SYSTEM ENGINE (CANVAS BASED FOR 60FPS)
 */
export function ScrollEngine3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // 3D Particle Nodes Definition
    const nodesCount = 100;
    const nodes: { x: number; y: number; z: number; baseColor: string }[] = [];
    for (let i = 0; i < nodesCount; i++) {
      // Helix structure or sphere coordinate generation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 160 + Math.random() * 50;

      nodes.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        baseColor: i % 3 === 0 ? "#024950" : i % 3 === 1 ? "#0FA4AF" : "#964734"
      });
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Render loop tracking motion value changes
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Get current scroll factor
      const scrollPercent = scrollYProgress.get();

      // Dynamically compute rotation matrices based on base spin + scroll position
      const scrollAngleX = scrollPercent * Math.PI * 2;
      const scrollAngleY = scrollPercent * Math.PI * 1.5;
      
      const cosX = Math.cos(scrollAngleX + Date.now() * 0.0003);
      const sinX = Math.sin(scrollAngleX + Date.now() * 0.0003);
      const cosY = Math.cos(scrollAngleY + Date.now() * 0.0004);
      const sinY = Math.sin(scrollAngleY + Date.now() * 0.0004);

      // Perspective projection values
      const fov = 350;
      const cx = width / 2;
      const cy = height / 2;

      // Draw structural grid / circular guides matching blueprint visual
      ctx.strokeStyle = "rgba(15, 164, 175, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 140 + scrollPercent * 60, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(150, 71, 52, 0.04)";
      ctx.beginPath();
      ctx.arc(cx, cy, 220 - scrollPercent * 40, 0, Math.PI * 2);
      ctx.stroke();

      // Transform, project, and store elements for connection lines drawing
      const projectedNodes: { x: number; y: number; z: number; color: string }[] = [];
      const explosion = 1 + scrollPercent * 1.35;

      nodes.forEach((node) => {
        let x1 = node.x * explosion;
        let y1 = node.y * explosion;
        let z1 = node.z;

        // Apply 3D Rotation Y
        let x2 = x1 * cosY - z1 * sinY;
        let z2 = x1 * sinY + z1 * cosY;

        // Apply 3D Rotation X
        let y3 = y1 * cosX - z2 * sinX;
        let z3 = y1 * sinX + z2 * cosX;

        // Distance / scale ratio
        const depthFactor = fov / (fov + z3);
        const screenX = cx + x2 * depthFactor;
        const screenY = cy + y3 * depthFactor;

        projectedNodes.push({
          x: screenX,
          y: screenY,
          z: z3,
          color: node.baseColor
        });
      });

      // Draw connection wires matching near points
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i++) {
        const p1 = projectedNodes[i];
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p2 = projectedNodes[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          // Only draw short paths to create network mesh
          if (dist < 65 + scrollPercent * 25) {
            const alpha = (1 - dist / (65 + scrollPercent * 25)) * 0.14;
            ctx.strokeStyle = `rgba(15, 164, 175, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      projectedNodes.forEach((node) => {
        const size = Math.max(1, (200 - node.z) / 80);
        ctx.fillStyle = node.color;
        // Glow on deep scroll
        ctx.shadowBlur = scrollPercent > 0.5 ? 4 : 0;
        ctx.shadowColor = node.color;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Technical circular calibration axis numbers overlay
      ctx.fillStyle = "rgba(136, 198, 206, 0.3)";
      ctx.font = "8px monospace";
      ctx.fillText(`AXIS_X_DEG: ${Math.round((scrollAngleX * 180) / Math.PI)}°`, 20, height - 30);
      ctx.fillText(`AXIS_Y_DEG: ${Math.round((scrollAngleY * 180) / Math.PI)}°`, 20, height - 15);
      ctx.fillText(`EXPLOSION_MULT: ${explosion.toFixed(2)}x`, width - 150, height - 15);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollYProgress]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full opacity-[0.45] mix-blend-darken"
      />
    </div>
  );
}

/**
 * 4. INTERACTIVE ACCORDION WITH STAGGERED REVEALS (METRICS BLUEPRINT)
 */
interface AccordionItem {
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
}

export function DynamicMetricsAccordion() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const items: AccordionItem[] = [
    {
      title: "COGNITIVE HIRELENS CLASSIFIER",
      subtitle: "Biometric & semantic vector mapping across 100+ standard architectural disciplines",
      details: [
        { label: "Vector Clustered Dimensions", value: "1,536 Dense Embeddings" },
        { label: "Anonymity Masking Delay", value: "0ms Real-Time Inline" },
        { label: "Syntactic Skill Inference", value: "Active Ghost Mapping Engine" },
        { label: "Cross-Industry Calibration", value: "Stripped demographic indices" }
      ]
    },
    {
      title: "GHOST COMPETENCY RESOLUTION",
      subtitle: "Uncovering unstated underlying technical proficiencies from project patterns",
      details: [
        { label: "Confidence Core Threshold", value: "0.85 Minimum Heuristic" },
        { label: "Semantic Inference Model", value: "Google Gemini 1.5 Pro Matrix" },
        { label: "Calibration Speed", value: "980ms / Candidate" },
        { label: "Deductive Resolution Scale", value: "Multi-axis deep validation" }
      ]
    },
    {
      title: "BIAS-STRIPED SCRUBBER MATRIX",
      subtitle: "Heuristics designed to protect candidate profiling and bypass demographic metadata",
      details: [
        { label: "Stripped Attributes", value: "Name, Location, Age, College Names" },
        { label: "Linguistic Neutralization", value: "Standardized Neutral Tone" },
        { label: "AI Safety Validation", value: "Zero bias-injection checks" },
        { label: "Failsafe Redirection", value: "Deterministic fallback parser" }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isExpanded = expandedIdx === idx;
        return (
          <div 
            key={idx} 
            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              isExpanded 
                ? "bg-[#EBF7F9]/30 border-[#024950]/35 shadow-lg shadow-blue-900/5" 
                : "bg-white border-[#D0E4E7] hover:border-[#024950]/20"
            }`}
          >
            {/* Header trigger */}
            <button
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 cursor-pointer focus:outline-none"
            >
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#AFDDE5] block font-bold mb-1">
                  MODULE_0{idx + 1}
                </span>
                <h4 className="text-sm font-display font-extrabold text-[#003135] tracking-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Icon toggle */}
              <div className={`w-8 h-8 rounded-full border border-[#D0E4E7] flex items-center justify-center text-xs font-mono text-[#024950] transition-transform duration-300 ${
                isExpanded ? "rotate-90 bg-[#024950] text-white border-transparent" : "bg-transparent"
              }`}>
                {isExpanded ? "−" : "+"}
              </div>
            </button>

            {/* Expanded panel details */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-5 pb-5 pt-1 border-t border-[#D0E4E7]/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.details.map((detail, dIdx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dIdx * 0.05 }}
                        key={dIdx}
                        className="bg-white/60 rounded-xl p-3 border border-[#D0E4E7]/40"
                      >
                        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-0.5">
                          {detail.label}
                        </span>
                        <span className="text-xs font-semibold text-[#003135]">
                          {detail.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface InteractiveNavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function InteractiveNavLink({ href, children }: InteractiveNavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative text-xs font-semibold text-stone-500 hover:text-[#024950] transition-colors duration-300 py-1 inline-block"
      animate={{
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20
      }}
    >
      <span>{children}</span>
      <motion.span
        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#024950] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      />
    </motion.a>
  );
}
