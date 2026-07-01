import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Sparkles,
  Sliders,
  Award,
  Layers,
  Search,
  User,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Briefcase,
  ExternalLink,
  HelpCircle,
  FileText,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RotateCcw,
  Download,
  Heart,
  X,
  Eye,
  EyeOff,
  Cpu,
  Activity,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Candidate, Weights } from "./types";
import DNAClusterView from "./components/DNAClusterView";
import CandidateIngestionForm from "./components/CandidateIngestionForm";
import InteractiveTalentChart from "./components/InteractiveTalentChart";
import AnimatedScore from "./components/AnimatedScore";
import KPIDashboardWidgets from "./components/KPIDashboardWidgets";
import ComparisonVisualizer from "./components/ComparisonVisualizer";
import { TiltCard, MagneticWrapper, TextCharReveal, CursorSpotlight, Preloader, CustomCursor, ScrollEngine3D, DynamicMetricsAccordion, InteractiveNavLink } from "./components/KineticInteractions";

export default function App() {
  // Application State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [ghostMode, setGhostMode] = useState(false);

  const processedCandidates = useMemo(() => {
    if (!ghostMode) return candidates;
    return candidates.map((cand, index) => ({
      ...cand,
      anonymized_profile: {
        ...cand.anonymized_profile,
        display_identifier: `Candidate ${index + 1}`
      }
    }));
  }, [candidates, ghostMode]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [weights, setWeights] = useState<Weights>({
    techStack: 0.4,
    trajectory: 0.3,
    domain: 0.3,
  });
  const [jobDescription, setJobDescription] = useState(
    "Senior Distributed Systems Engineer. Experience building high-throughput streaming pipelines, low latency state machines, zero-copy socket performance, and orchestration across hybrid multi-zone Kubernetes grids."
  );
  
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [rankingInProgress, setRankingInProgress] = useState(false);
  const [rankingStep, setRankingStep] = useState("");
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  // Search & Compare State
  const [searchQuery, setSearchQuery] = useState("");
  const [strongFitsFiltered, setStrongFitsFiltered] = useState(false);
  const [compareCandidateIds, setCompareCandidateIds] = useState<string[]>([]);
  const [expandedCandidateIds, setExpandedCandidateIds] = useState<string[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Bulk Processing State
  const [bulkProcessMode, setBulkProcessMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStep, setBulkStep] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showIngestionSidebar, setShowIngestionSidebar] = useState(false);

  const toggleBulkSelect = (id: string) => {
    setBulkSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBulk = () => {
    const allFilteredIds = filteredCandidates.map((c) => c.id);
    setBulkSelectedIds(allFilteredIds);
  };

  const handleDeselectAllBulk = () => {
    setBulkSelectedIds([]);
  };

  const toggleDetails = (id: string) => {
    setExpandedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCompare = (id: string) => {
    setCompareCandidateIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cId) => cId !== id);
      } else {
        if (prev.length >= 4) {
          // Keep at most 4, replace the first with the new one
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  // Real-time keyword filter (Search Bar)
  const filteredCandidates = processedCandidates.filter((cand) => {
    if (strongFitsFiltered && (cand.final_score || 0) < 85) {
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const idMatch = cand.anonymized_profile.display_identifier.toLowerCase().includes(query);
    const collegeMatch = cand.anonymized_profile.college_surrogate.toLowerCase().includes(query);
    const summaryMatch = cand.anonymized_profile.summary.toLowerCase().includes(query);
    const flowMatch = cand.project_dna.data_flow.toLowerCase().includes(query);
    const infraMatch = cand.project_dna.infrastructure_culture.toLowerCase().includes(query);
    const scaleMatch = cand.project_dna.scale_footprint.toLowerCase().includes(query);
    
    const compMatch = cand.ghost_competencies?.some(comp => 
      comp.concept.toLowerCase().includes(query) || 
      comp.justification.toLowerCase().includes(query)
    );
    
    return idMatch || collegeMatch || summaryMatch || flowMatch || infraMatch || scaleMatch || compMatch;
  });

  // Export current filtered and ranked candidate list as CSV
  const exportToCSV = () => {
    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return "";
      const s = String(str);
      if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      "Rank",
      "Candidate ID",
      "Codename",
      "College Surrogate",
      "Summary",
      "Data Flow",
      "Scale Footprint",
      "Infrastructure Culture",
      "Composite Score",
      "Technical Match Score",
      "Behavioral Trajectory Score",
      "Domain Alignment Score",
      "Ghost Competencies"
    ];

    const rows = filteredCandidates.map((cand) => {
      const originalRank = processedCandidates.findIndex((c) => c.id === cand.id) + 1;
      
      const competenciesString = (cand.ghost_competencies || [])
        .map((comp) => `${comp.concept} (${Math.round(comp.confidence * 100)}%)`)
        .join("; ");

      return [
        originalRank || "-",
        cand.id,
        cand.anonymized_profile.display_identifier,
        cand.anonymized_profile.college_surrogate,
        cand.anonymized_profile.summary,
        cand.project_dna.data_flow,
        cand.project_dna.scale_footprint,
        cand.project_dna.infrastructure_culture,
        cand.final_score !== undefined ? cand.final_score : "Not Calibrated",
        cand.sub_metrics?.technical_match_score !== undefined ? cand.sub_metrics.technical_match_score : "-",
        cand.sub_metrics?.behavioral_trajectory_score !== undefined ? cand.sub_metrics.behavioral_trajectory_score : "-",
        cand.sub_metrics?.domain_alignment_score !== undefined ? cand.sub_metrics.domain_alignment_score : "-",
        competenciesString
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `calibrated_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  // Exit fullscreen on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const response = await fetch("/api/candidates");
      const data = await response.json();
      if (data.success && data.candidates) {
        setCandidates(data.candidates);
        if (data.candidates.length > 0) {
          // Select first candidate by default
          setSelectedCandidateId(data.candidates[0].id);
        }
      }
    } catch (error) {
      console.log("Failed to load candidates:", error);
      setSystemMessage("Could not retrieve candidates. Ensure backend server is running.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Perform Agent 2 Multi-Metric scoring across all candidates
  const runEvaluation = async (customWeights = weights) => {
    setRankingInProgress(true);
    setRankingStep("Agent 2: Evaluation Matrix initializing...");
    
    try {
      // Simulate pipeline steps for deep aesthetic feedback
      await new Promise((r) => setTimeout(r, 600));
      setRankingStep("Extracting candidate profiles from stream...");
      await new Promise((r) => setTimeout(r, 600));
      setRankingStep("Evaluating alignment with Job Specification...");
      
      const response = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          candidatesList: candidates,
          weights: {
            techStack: customWeights.techStack,
            trajectory: customWeights.trajectory,
            domain: customWeights.domain,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.leaderboard) {
        setCandidates(data.leaderboard);
        if (data.isFallbackActive) {
          setFallbackActive(true);
          setSystemMessage("Failsafe dynamic calibration active (AI free-tier limit reach).");
        } else {
          setFallbackActive(false);
          setSystemMessage("Reranking complete. Leaderboard sorted!");
        }
        // Keep selected candidate or select the top performer
        if (data.leaderboard.length > 0 && (!selectedCandidateId || !data.leaderboard.find((c: any) => c.id === selectedCandidateId))) {
          setSelectedCandidateId(data.leaderboard[0].id);
        }
      } else {
        setSystemMessage(data.error || "Reranking process encountered an issue.");
      }
    } catch (error) {
      console.log("Evaluation matrix failed:", error);
      setSystemMessage("Evaluation failed. Verify system endpoints.");
    } finally {
      setRankingInProgress(false);
      setRankingStep("");
      setTimeout(() => setSystemMessage(null), 4000);
    }
  };

  const runBulkEvaluation = async () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkProcessing(true);
    setBulkProgress(5);
    setBulkStep("Initializing Bulk Evaluation Matrix...");
    
    // Set up a dynamic visual progress increment
    const progressInterval = setInterval(() => {
      setBulkProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        const increment = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + increment, 90);
      });
    }, 350);

    const steps = [
      "Isolating selected candidate vector representations...",
      "Querying Gemini 3.5 Flash for multi-axis reasoning...",
      "Evaluating alignment vectors with Job Specification...",
      "Calibrating weighted composite scoring grids...",
      "Updating database states with newly compiled matrix evaluations..."
    ];

    let stepIndex = 0;
    setBulkStep(steps[stepIndex]);
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setBulkStep(steps[stepIndex]);
      }
    }, 1000);

    try {
      const selectedCandidates = candidates.filter(c => bulkSelectedIds.includes(c.id));

      const response = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          candidatesList: selectedCandidates,
          weights: {
            techStack: weights.techStack,
            trajectory: weights.trajectory,
            domain: weights.domain,
          },
        }),
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      const data = await response.json();
      if (response.ok && data.success && data.leaderboard) {
        setBulkProgress(95);
        setBulkStep("Finalizing ranking tables...");
        await new Promise((r) => setTimeout(r, 400));

        setCandidates((prevCandidates) => {
          const updatedCandidatesMap = new Map(data.leaderboard.map((c: any) => [c.id, c]));
          const merged = prevCandidates.map((c) => {
            if (updatedCandidatesMap.has(c.id)) {
              return updatedCandidatesMap.get(c.id);
            }
            return c;
          });
          
          return merged.sort((a, b) => {
            const scoreA = a.final_score ?? -1;
            const scoreB = b.final_score ?? -1;
            return scoreB - scoreA;
          });
        });

        setBulkProgress(100);
        setBulkStep("Batch evaluation completed!");
        setSystemMessage(`Successfully batch-evaluated ${bulkSelectedIds.length} candidate profiles.`);
        setBulkSelectedIds([]);
      } else {
        setSystemMessage(data.error || "Batch reranking process encountered an issue.");
      }
    } catch (error) {
      console.log("Bulk evaluation failed:", error);
      setSystemMessage("Bulk evaluation failed. Verify system endpoints.");
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    } finally {
      setTimeout(() => {
        setBulkProcessing(false);
        setBulkProgress(0);
        setBulkStep("");
      }, 800);
      setTimeout(() => setSystemMessage(null), 4000);
    }
  };

  const [pdfExporting, setPdfExporting] = useState(false);

  const exportComparisonPDF = async (compCandidates: Candidate[]) => {
    if (compCandidates.length < 2) return;
    const element = document.getElementById("compare-matrix-panel");
    if (!element) {
      setSystemMessage("Could not locate the comparison matrix element.");
      return;
    }

    setPdfExporting(true);
    setSystemMessage("Rendering comparison matrix to PDF... Please wait.");

    try {
      // Allow a brief moment for state and style updates
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const isLandscape = compCandidates.length >= 3;
      
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;
      const margin = 10;
      const contentWidth = pdfWidth - 2 * margin;
      const contentHeight = pdfHeight - 2 * margin;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      // Draw first page
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Draw subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      pdf.save(`Candidate_Comparison_Matrix_${new Date().toISOString().slice(0, 10)}.pdf`);
      setSystemMessage("PDF report exported successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setSystemMessage("Failed to export PDF. Please try again.");
    } finally {
      setPdfExporting(false);
      setTimeout(() => setSystemMessage(null), 4000);
    }
  };

  // Trigger evaluation automatically when the page loads with initial candidates
  useEffect(() => {
    if (candidates.length > 0 && !candidates[0].final_score) {
      runEvaluation();
    }
  }, [candidates]);

  // Handle Dynamic Weight Calibration with 1.0 total constraint
  const handleWeightChange = (key: keyof Weights, value: number) => {
    const otherKeys = (["techStack", "trajectory", "domain"] as const).filter((k) => k !== key);
    const currentVal = weights[key];
    const delta = value - currentVal;

    let newWeights = { ...weights };
    newWeights[key] = parseFloat(value.toFixed(2));

    // Distribute negative delta to other two weights
    let remainingDelta = -delta;
    const key1 = otherKeys[0];
    const key2 = otherKeys[1];

    let val1 = weights[key1];
    let val2 = weights[key2];

    let share = remainingDelta / 2;
    let newVal1 = val1 + share;
    let newVal2 = val2 + share;

    // Constrain boundaries to [0.0, 1.0]
    if (newVal1 < 0) {
      newVal2 += newVal1;
      newVal1 = 0;
    } else if (newVal1 > 1) {
      newVal2 += newVal1 - 1;
      newVal1 = 1;
    }

    if (newVal2 < 0) {
      newVal1 += newVal2;
      newVal2 = 0;
    } else if (newVal2 > 1) {
      newVal1 += newVal2 - 1;
      newVal2 = 1;
    }

    newWeights[key1] = parseFloat(Math.max(0, Math.min(1, newVal1)).toFixed(2));
    newWeights[key2] = parseFloat(Math.max(0, Math.min(1, newVal2)).toFixed(2));

    // Ensure sum is absolute 1.0
    const sum = newWeights.techStack + newWeights.trajectory + newWeights.domain;
    if (sum !== 1.0) {
      const diff = 1.0 - sum;
      newWeights[key1] = parseFloat((newWeights[key1] + diff).toFixed(2));
    }

    setWeights(newWeights);
  };

  // Quick preset calibration
  const setPresetWeights = (tech: number, traj: number, dom: number) => {
    const newW = { techStack: tech, trajectory: traj, domain: dom };
    setWeights(newW);
    runEvaluation(newW);
  };

  const resetDatabase = async () => {
    setLoadingCandidates(true);
    try {
      const response = await fetch("/api/candidates/reset", { method: "POST" });
      const data = await response.json();
      if (data.success && data.candidates) {
        setCandidates(data.candidates);
        setSelectedCandidateId(data.candidates[0]?.id || null);
        setSystemMessage("Database reset to base seed profiles successfully.");
      }
    } catch (err) {
      console.log("Database reset failed:", err);
      setSystemMessage("Failed to reset database.");
    } finally {
      setLoadingCandidates(false);
      setTimeout(() => setSystemMessage(null), 4000);
    }
  };

  const handleNewCandidateIngested = (newCandidate: Candidate, isFallbackActive?: boolean) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setSelectedCandidateId(newCandidate.id);
    if (isFallbackActive) {
      setFallbackActive(true);
      setSystemMessage("Profile ingested via local failsafe engine (AI quota limit reached). Re-evaluating...");
    } else {
      setSystemMessage("Candidate successfully anonymized & ingested! Re-evaluating...");
    }
    // Run evaluation so they get ranked instantly
    setTimeout(() => runEvaluation(), 100);
  };

  const selectedCandidate = processedCandidates.find((c) => c.id === selectedCandidateId) || processedCandidates[0];

  const getRankingStatus = () => {
    if (!selectedCandidate) {
      return {
        label: "Under Review",
        bg: "bg-stone-500/10 text-stone-600 border-stone-500/20 border backdrop-blur-xs",
        badgeText: "Rank --",
        icon: "📋"
      };
    }
    const sorted = [...processedCandidates].sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
    const idx = sorted.findIndex(c => c.id === selectedCandidate.id);
    const score = selectedCandidate.final_score ?? 85;
    
    if (idx === 0) {
      return {
        label: "Top Performer",
        bg: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border backdrop-blur-xs shadow-xs",
        badgeText: "Rank #1",
        icon: "🏆"
      };
    } else if (idx > 0 && idx <= 2) {
      return {
        label: "Rising Star",
        bg: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 border backdrop-blur-xs shadow-xs",
        badgeText: `Rank #${idx + 1}`,
        icon: "⭐"
      };
    } else if (score >= 75) {
      return {
        label: "Strong Match",
        bg: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 border backdrop-blur-xs shadow-xs",
        badgeText: `Rank #${idx + 1}`,
        icon: "⚡"
      };
    } else {
      return {
        label: "Rising Talent",
        bg: "bg-amber-500/15 text-amber-700 border-amber-500/30 border backdrop-blur-xs shadow-xs",
        badgeText: `Rank #${idx + 1}`,
        icon: "📈"
      };
    }
  };

  const rankingStatus = getRankingStatus();

  const podiumContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const podiumCardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3F7] text-[#1B244A] flex flex-col font-sans selection:bg-[#3D52A0]/10 selection:text-[#1B244A] relative overflow-hidden">
      <Preloader />
      <CustomCursor />
      <CursorSpotlight />
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {systemMessage && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1B244A] text-[#EDE8F5] px-4 py-3 rounded-full text-xs font-mono tracking-tight flex items-center gap-2.5 shadow-xl border border-stone-800"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{systemMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar - Styled like clean Editions Bar */}
      <nav id="navbar-main" className="border-b border-[#E5E2D9] px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-[#F4F3F7]/80 backdrop-blur sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#3D52A0] rounded-xl flex items-center justify-center shadow-md shadow-blue-950/20">
            <div className="w-4 h-4 border-2 border-[#EDE8F5] rounded-md rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-sm tracking-tight uppercase text-[#1B244A]">
                HireLens
              </span>
            </div>
            <p className="text-[10px] text-[#8697C4] font-sans tracking-wide">
              Architectural Candidate Assessment & Alignment Hub
            </p>
          </div>
        </div>

        {/* Navigation Center Links */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#8697C4]">
          <InteractiveNavLink href="#bento-weights">Calibration Matrix</InteractiveNavLink>
          <InteractiveNavLink href="#bento-jobspec">Job Spec Context</InteractiveNavLink>
          <InteractiveNavLink href="#dna-cluster-root">DNA Signatures</InteractiveNavLink>
          <InteractiveNavLink href="#leaderboard-table">Ranked Talents</InteractiveNavLink>
          <span className="text-stone-300">|</span>
          <span className="text-[10px] bg-[#3D52A0]/5 text-[#3D52A0] border border-[#3D52A0]/10 px-2 py-0.5 rounded font-mono font-bold">
            FOUNDATIONS RELEASE ACTIVE
          </span>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            id="reset-db-btn"
            onClick={resetDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 border border-[#E5E2D9] active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Seed
          </button>
          
          <div className="h-4 w-[1px] bg-stone-300" />

          <div className="flex items-center gap-2 text-[10px] font-mono bg-[#024950]/5 border border-[#024950]/20 px-3 py-1.5 rounded-xl text-[#024950]">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-bold">{processedCandidates.length}</span> Active Profiles
          </div>
        </div>
      </nav>

      {/* Immersive Landing Header */}
      <header className="relative w-full overflow-hidden bg-gradient-to-b from-[#EBF7F9]/40 via-[#F4F3F7] to-[#F4F3F7] border-b border-[#E5E2D9] pb-16 pt-8">
        <ScrollEngine3D />
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0FA4AF]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-[#D0E4E7]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Top Info Tag */}
          <div className="flex items-center gap-2 mb-6 animate-slide-in">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#0FA4AF] font-bold">
              HireLens-First Talent Ingestion & Calibration Release
            </span>
          </div>

          {/* Massive Display Title */}
          <div className="relative z-10 select-none">
            <motion.div 
              className="flex flex-col cursor-default origin-left"
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <TextCharReveal 
                text="CALIBRATE"
                className="text-[11vw] sm:text-[9vw] font-display font-extrabold leading-none tracking-tighter text-[#1B244A] drop-shadow-sm"
                delay={0.1}
              />
              <TextCharReveal 
                text="FOUNDATIONS"
                className="text-[11vw] sm:text-[9vw] font-display font-extrabold leading-none tracking-tighter text-[#024950] drop-shadow-xs -mt-2 sm:-mt-4"
                delay={0.3}
              />
            </motion.div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 gap-4">
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3 }}
                className="text-xs sm:text-sm text-[#003135]/75 max-w-xl font-sans leading-relaxed cursor-default"
              >
                Elevate your talent engineering and calibration with 100+ deep architectural signatures, automatic ghost competency indexing, and dynamic bias-stripped screening parameters.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-center gap-3"
              >
                <MagneticWrapper pullFactor={0.25}>
                  <a 
                    href="#dashboard-section"
                    className="px-6 py-3 bg-[#024950] text-white hover:bg-[#003135] text-xs font-bold font-display rounded-full shadow-lg shadow-teal-900/15 active:scale-95 transition-all inline-block"
                  >
                    Configure Parameters
                  </a>
                </MagneticWrapper>
                <MagneticWrapper pullFactor={0.25}>
                  <button
                    onClick={() => {
                      const el = document.getElementById("bento-ingestion");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3 bg-white text-[#024950] border border-[#024950]/20 hover:bg-[#EBF7F9] text-xs font-bold font-display rounded-full shadow-sm active:scale-95 transition-all inline-block cursor-pointer"
                  >
                    Ingest Resume
                  </button>
                </MagneticWrapper>
                <MagneticWrapper pullFactor={0.25}>
                  <div className="flex items-center gap-2.5">
                    <button
                      id="hero-ghost-mode-toggle"
                      onClick={() => setGhostMode(!ghostMode)}
                      className={`px-6 py-3 rounded-full shadow-sm text-xs font-bold font-display border active:scale-95 transition-all flex items-center gap-2 cursor-pointer relative ${
                        ghostMode
                          ? "bg-[#3D52A0] text-white border-[#3D52A0] hover:bg-[#2C3E82] shadow-md shadow-[#3D52A0]/20"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                      title="Toggle Ghost Mode to anonymize candidate identities across the entire platform"
                    >
                      {ghostMode ? <EyeOff className="w-3.5 h-3.5 text-white animate-pulse" /> : <Eye className="w-3.5 h-3.5 text-stone-500" />}
                      <span>Ghost Mode: {ghostMode ? "ON" : "OFF"}</span>
                    </button>
                    
                    {/* Visual Indicator of Anonymization State */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                      ghostMode
                        ? "border-emerald-200 bg-emerald-50/50 shadow-xs shadow-emerald-500/10"
                        : "border-stone-200 bg-stone-50"
                    }`}>
                      <span className="relative flex h-2 w-2">
                        {ghostMode && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${ghostMode ? "bg-emerald-500" : "bg-stone-300"}`}></span>
                      </span>
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase transition-colors duration-300 ${ghostMode ? "text-emerald-700" : "text-stone-400"}`}>
                        {ghostMode ? "ANON ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </MagneticWrapper>
              </motion.div>
            </div>
          </div>

          {/* Professional real-time live telemetry metrics strip */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-white/45 backdrop-blur-md border border-[#E5E2D9] shadow-xs relative z-10"
          >
            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#E5E2D9]/40 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#024950]/5 flex items-center justify-center text-[#024950]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">Bias Stripper</span>
                <span className="text-xs font-bold text-[#003135] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Enabled
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#E5E2D9]/40 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#024950]/5 flex items-center justify-center text-[#024950]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">Calibrators</span>
                <span className="text-xs font-bold text-[#003135]">3 Dynamic Axes</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#E5E2D9]/40 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#024950]/5 flex items-center justify-center text-[#024950]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">System Sandbox</span>
                <span className="text-xs font-bold text-[#003135] text-emerald-700 font-mono">Isolated Core</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#024950]/5 flex items-center justify-center text-[#024950]">
                <Sparkles className="w-4 h-4 animate-spin [animation-duration:8s]" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">Role Presets</span>
                <span className="text-xs font-bold text-[#003135]">3 Calibration Profiles</span>
              </div>
            </div>
          </motion.div>

          {/* Stepped 3D Podium Stage Container */}
          <div className="mt-12 relative w-full min-h-[380px] flex items-end justify-center py-10">
            
            {/* The 3D Block Platform Pedestals */}
            <div className="absolute inset-0 w-full h-full flex items-end justify-center select-none pointer-events-none">
              <div className="relative w-full max-w-5xl h-[260px] flex items-end justify-between px-4 gap-4">
                
                {/* Block 1 (Left - Lowest) */}
                <div className="podium-block w-full h-[90px] bg-gradient-to-t from-[#D0E4E7]/30 to-[#EBF7F9]/80 rounded-2xl border-t border-r border-[#D0E4E7]/20" />
                
                {/* Block 2 (Middle-Left - Medium) */}
                <div className="podium-block w-full h-[150px] bg-gradient-to-t from-[#AFDDE5]/30 to-[#EBF7F9]/90 rounded-2xl border-t border-r border-[#AFDDE5]/20" />
                
                {/* Block 3 (Center - Highest) */}
                <div className="podium-block w-full h-[220px] bg-gradient-to-t from-[#024950]/20 to-[#EBF7F9] rounded-2xl border-t border-r border-[#024950]/10" />
                
                {/* Block 4 (Middle-Right - Medium High) */}
                <div className="podium-block w-full h-[180px] bg-gradient-to-t from-[#AFDDE5]/20 to-[#EBF7F9]/90 rounded-2xl border-t border-r border-[#AFDDE5]/10" />
                
                {/* Block 5 (Right - Medium Low) */}
                <div className="podium-block w-full h-[120px] bg-gradient-to-t from-[#D0E4E7]/20 to-[#EBF7F9]/80 rounded-2xl border-t border-r border-[#D0E4E7]/10" />
                
              </div>
            </div>

            {/* Interactive Cards Resting / Floating on Podiums */}
            <motion.div
              id="header-podium-cards-container"
              className="relative z-20 w-full max-w-5xl grid grid-cols-1 sm:grid-cols-5 gap-4 px-2 items-end cursor-pointer"
              variants={podiumContainerVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ 
                y: -12,
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(2, 73, 80, 0.12)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 240, 
                damping: 20 
              }}
            >
              
              {/* Card 1: Live Candidate Bio Video Feed Card wrapped with Floating Label */}
              <motion.div className="relative sm:col-span-1 group flex flex-col pt-6" variants={podiumCardVariants}>
                {/* Dynamic Floating Category Badge */}
                <motion.div 
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border ${rankingStatus.bg}`}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.1 }}
                >
                  <span>{rankingStatus.icon}</span>
                  <span>{rankingStatus.label}</span>
                </motion.div>

                <TiltCard className="w-full bg-white rounded-2xl p-3 h-[210px] flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#AFDDE5] font-bold">
                      Interactive Stream
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  
                  {/* Mock Video Portrait */}
                  <div className="relative w-full h-20 bg-[#024950]/10 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#024950]/40 to-transparent z-10" />
                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[6px] px-1 py-0.5 rounded font-bold font-mono">
                      LIVE
                    </div>
                    <User className="w-8 h-8 text-[#024950]/30" />
                    <div className="absolute bottom-1 left-2 z-20 text-[9px] font-bold text-white font-display">
                      {selectedCandidate?.anonymized_profile?.display_identifier || "Quantum Architect 81"}
                    </div>
                  </div>

                  <div className="mt-1">
                    <p className="text-[9px] text-[#003135]/80 font-mono line-clamp-2 leading-tight">
                      {selectedCandidate?.anonymized_profile?.summary || "Distributed systems architect with streaming log log buffers."}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[8px] bg-[#024950]/10 text-[#024950] px-1 py-0.5 rounded font-mono font-bold">
                        {selectedCandidate?.project_dna?.data_flow || "Event-Driven"}
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Card 2: Helmet / Ghost Competency Card wrapped with Floating Label */}
              <motion.div className="relative sm:col-span-1 group flex flex-col pt-6" variants={podiumCardVariants}>
                {/* Dynamic Floating Category Badge */}
                <motion.div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border bg-[#024950] text-[#AFDDE5] border-[#024950]/40"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.3 }}
                >
                  <span>✨</span>
                  <span>{selectedCandidate?.ghost_competencies?.[0]?.paradigm_alignment || "Core Ghost Paradigm"}</span>
                </motion.div>

                <TiltCard className="w-full bg-[#024950] text-white rounded-2xl p-3 h-[240px] flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/70 font-semibold">
                      BIAS-STRIPPED DNA
                    </span>
                    <Award className="w-3.5 h-3.5 text-white/80" />
                  </div>

                  {/* Rotating Orb Graphic */}
                  <div className="my-2 flex items-center justify-center relative h-16">
                    <div className="absolute w-12 h-12 bg-white/10 rounded-full animate-ping" />
                    <div className="absolute w-14 h-14 border border-white/20 border-dashed rounded-full animate-spin [animation-duration:10s]" />
                    <div className="w-8 h-8 bg-[#EBF7F9] rounded-full flex items-center justify-center shadow-lg relative z-10 animate-float-slow">
                      <Sparkles className="w-4 h-4 text-[#024950]" />
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-white/70 font-mono">
                      Primary Paradigm
                    </div>
                    <div className="font-display font-bold text-xs line-clamp-1 leading-tight">
                      {selectedCandidate?.ghost_competencies?.[0]?.concept || "Actor Model Concurrency"}
                    </div>
                    <div className="mt-1.5 bg-white/20 rounded-lg p-1 text-[8px] font-mono leading-tight">
                      Confidence: {Math.round((selectedCandidate?.ghost_competencies?.[0]?.confidence || 0.95) * 100)}%
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Card 3: Dynamic Calibration Dials wrapped with Floating Label */}
              <motion.div className="relative sm:col-span-1 group flex flex-col pt-6" variants={podiumCardVariants}>
                {/* Floating Category Badge */}
                <motion.div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border bg-stone-100 text-stone-700 border-stone-200"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.5 }}
                >
                  <span>🎛️</span>
                  <span>Weights Console</span>
                </motion.div>

                <TiltCard className="w-full bg-white rounded-2xl p-3 h-[300px] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#0FA4AF] font-bold">
                        Dynamic Matrix
                      </span>
                      <Sliders className="w-3 h-3 text-[#024950]" />
                    </div>
                    <h3 className="font-display font-extrabold text-xs text-[#003135] leading-tight">
                      Calibration Core
                    </h3>
                    <p className="text-[8px] text-stone-400 mt-0.5 leading-tight">
                      Balanced scoring matrix weights updated live.
                    </p>
                  </div>

                  {/* Micro interactive sliders */}
                  <div className="space-y-3 my-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <div className="flex justify-between items-center text-[8px] mb-0.5 font-mono text-[#003135]">
                        <span>W_tech</span>
                        <span className="font-bold">{Math.round(weights.techStack * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.techStack}
                        onChange={(e) => handleWeightChange("techStack", parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#EBF7F9] rounded-lg appearance-none cursor-pointer accent-[#024950]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[8px] mb-0.5 font-mono text-[#003135]">
                        <span>W_trajectory</span>
                        <span className="font-bold">{Math.round(weights.trajectory * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.trajectory}
                        onChange={(e) => handleWeightChange("trajectory", parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#EBF7F9] rounded-lg appearance-none cursor-pointer accent-[#024950]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[8px] mb-0.5 font-mono text-[#003135]">
                        <span>W_domain</span>
                        <span className="font-bold">{Math.round(weights.domain * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights.domain}
                        onChange={(e) => handleWeightChange("domain", parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#EBF7F9] rounded-lg appearance-none cursor-pointer accent-[#024950]"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#EBF7F9] pt-1.5 flex items-center justify-between">
                    <span className="text-[8px] font-mono text-[#AFDDE5]">ACTIVE RERANK</span>
                    <span className="text-[9px] font-mono font-bold text-[#024950]">SUM: 1.00</span>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Card 4: Wave DNA Surfer Graphic Card wrapped with Floating Label */}
              <motion.div className="relative sm:col-span-1 group flex flex-col pt-6" variants={podiumCardVariants}>
                {/* Dynamic Floating Category Badge */}
                <motion.div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border bg-cyan-50/90 text-cyan-700 border-cyan-200"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.9, ease: "easeInOut", delay: 0.2 }}
                >
                  <span>🎯</span>
                  <span>Fit: {selectedCandidate?.final_score || 85}%</span>
                </motion.div>

                <TiltCard className="w-full bg-white rounded-2xl p-3 h-[250px] flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#AFDDE5] font-bold">
                      Cluster Map
                    </span>
                    <Layers className="w-3 h-3 text-[#024950]" />
                  </div>

                  {/* Abstract Line / Surfer wave representing the cluster */}
                  <div className="h-20 bg-gradient-to-br from-[#EBF7F9] to-white rounded-xl border border-[#EBF7F9] flex items-center justify-center relative overflow-hidden my-1">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#024950] via-transparent to-transparent" />
                    <svg className="absolute bottom-0 w-full h-12 text-[#024950]/20" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,80 C30,40 70,100 100,50 L100,100 L0,100 Z" fill="currentColor" />
                      <path d="M0,60 C40,90 60,30 100,70 L100,100 L0,100 Z" fill="currentColor" className="opacity-40" />
                    </svg>
                    <div className="absolute w-1.5 h-1.5 bg-[#0FA4AF] rounded-full animate-ping top-8 left-10" />
                    <span className="text-[8px] font-mono text-[#024950] font-bold bg-[#EBF7F9] px-1 rounded border border-[#024950]/10 z-10 animate-float-medium">
                      VECTOR
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9px] text-[#003135] font-semibold">
                      <span>Alignment Fit</span>
                      <span className="font-mono font-bold text-[#024950]">
                        <AnimatedScore value={selectedCandidate?.final_score || 85} />%
                      </span>
                    </div>
                    <div className="w-full bg-[#EBF7F9] h-1 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-[#024950] rounded-full" 
                        style={{ width: `${selectedCandidate?.final_score || 85}%` }}
                      />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Card 5: Interactive Mobile Widget / Active Ingest wrapped with Floating Label */}
              <motion.div className="relative sm:col-span-1 group flex flex-col pt-6" variants={podiumCardVariants}>
                {/* Dynamic Floating Category Badge */}
                <motion.div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider whitespace-nowrap shadow-md border bg-stone-900/90 text-emerald-400 border-stone-800"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3.1, ease: "easeInOut", delay: 0.4 }}
                >
                  <span>📡</span>
                  <span>{rankingStatus.badgeText} Status</span>
                </motion.div>

                <TiltCard className="w-full bg-[#001D1F] text-white rounded-2xl p-3 h-[180px] flex flex-col justify-between overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono text-[#D0E4E7] uppercase font-bold">
                      System Hub
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>

                  <div className="my-1.5 bg-white/5 rounded-lg p-1.5 border border-white/10">
                    <p className="text-[8px] font-mono text-white/80 leading-normal">
                      Node: HireLens-01<br />
                      Active Weights: Tech {Math.round(weights.techStack*100)}%
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        const el = document.getElementById("dashboard-section");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-1 bg-[#024950] hover:bg-[#0FA4AF] text-white text-[8px] font-bold rounded-lg transition-colors font-display"
                    >
                      Enter Console &rarr;
                    </button>
                  </div>
                </TiltCard>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </header>

      {/* Anchor point to scroll down to */}
      <div id="dashboard-section" className="h-2" />

      {fallbackActive && (
        <div id="failsafe-banner" className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs max-w-7xl lg:mx-auto w-[calc(100%-3rem)] md:w-full">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-display">Local Deterministic Heuristic Engine Active</h4>
              <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                The AI free-tier daily requests limit has been reached on this API key. The system has automatically activated high-speed local parsing & alignment matrices to keep operations completely seamless.
              </p>
            </div>
          </div>
          <span className="text-[9px] bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase flex-shrink-0">
            Failsafe Active
          </span>
        </div>
      )}

      {/* Dashboard Main Bento Area */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Animated & Interactive KPI Dashboard Widgets */}
        <div className="lg:col-span-12">
          <KPIDashboardWidgets
            candidates={processedCandidates}
            loading={loadingCandidates || rankingInProgress}
            onFilterStrongFits={setStrongFitsFiltered}
            isStrongFitsFiltered={strongFitsFiltered}
            onSelectCandidateId={setSelectedCandidateId}
            selectedCandidateId={selectedCandidateId}
            onClearSearch={() => {
              setSearchQuery("");
              setStrongFitsFiltered(false);
            }}
          />
        </div>

        {/* Interactive Bubble Chart Map */}
        <div className="lg:col-span-12 animate-slide-in">
          <InteractiveTalentChart
            candidates={processedCandidates}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={(id) => setSelectedCandidateId(id)}
          />
        </div>

        {/* LEFT COLUMN (Width: 5/12) — Ingestion, Job Spec, Weight sliders */}
        <section className="lg:col-span-5 space-y-5 flex flex-col">
          
          {/* BENTO CARD 1: Weight Calibration sliders */}
          <div id="bento-weights" className="p-6 rounded-3xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#024950]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Parameter Calibration
                </span>
                <span className="text-xs font-mono font-bold text-[#024950] bg-[#024950]/10 px-2 py-0.5 rounded">
                  Sum: 1.00
                </span>
              </div>
              <h2 className="text-base font-display font-bold text-[#003135] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#024950]" />
                Dynamic Slider Ranking
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Recruiter preference vectors distribute weight in real-time. Adjusting one slider balances the others automatically.
              </p>
            </div>

            {/* Slider Controls */}
            <div className="space-y-4 my-2">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-stone-800 flex items-center gap-1.5">
                    Technical Stack Alignment (W_tech)
                  </span>
                  <span className="font-mono font-bold text-[#024950]">
                    {Math.round(weights.techStack * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.techStack}
                  onChange={(e) => handleWeightChange("techStack", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#024950]"
                />
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-stone-800">
                    Behavioral Trajectory (W_behav)
                  </span>
                  <span className="font-mono font-bold text-[#024950]">
                    {Math.round(weights.trajectory * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.trajectory}
                  onChange={(e) => handleWeightChange("trajectory", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#024950]"
                />
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-stone-800">
                    Domain & Focus Alignment (W_domain)
                  </span>
                  <span className="font-mono font-bold text-[#024950]">
                    {Math.round(weights.domain * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.domain}
                  onChange={(e) => handleWeightChange("domain", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#024950]"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-4 border-t border-[#E5E2D9] mt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                Role Calibration Presets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="preset-hard-core"
                  onClick={() => setPresetWeights(0.7, 0.15, 0.15)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    Math.abs(weights.techStack - 0.7) < 0.01 && Math.abs(weights.trajectory - 0.15) < 0.01 && Math.abs(weights.domain - 0.15) < 0.01
                      ? "bg-[#024950] text-white border-[#024950] shadow-sm"
                      : "bg-stone-50 hover:bg-[#024950]/10 hover:text-[#024950] text-stone-700 border-[#E5E2D9]"
                  }`}
                >
                  ⚡ Hardcore Infrastructure (70:15:15)
                </button>
                <button
                  type="button"
                  id="preset-balanced"
                  onClick={() => setPresetWeights(0.34, 0.33, 0.33)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    Math.abs(weights.techStack - 0.34) < 0.02 && Math.abs(weights.trajectory - 0.33) < 0.02 && Math.abs(weights.domain - 0.33) < 0.02
                      ? "bg-[#024950] text-white border-[#024950] shadow-sm"
                      : "bg-stone-50 hover:bg-[#024950]/10 hover:text-[#024950] text-stone-700 border-[#E5E2D9]"
                  }`}
                >
                  ⚖️ Balanced Generalist (34:33:33)
                </button>
                <button
                  type="button"
                  id="preset-domain"
                  onClick={() => setPresetWeights(0.2, 0.2, 0.6)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    Math.abs(weights.techStack - 0.2) < 0.01 && Math.abs(weights.trajectory - 0.2) < 0.01 && Math.abs(weights.domain - 0.6) < 0.01
                      ? "bg-[#024950] text-white border-[#024950] shadow-sm"
                      : "bg-stone-50 hover:bg-[#024950]/10 hover:text-[#024950] text-stone-700 border-[#E5E2D9]"
                  }`}
                >
                  🎯 High-Value Domain Expert (20:20:60)
                </button>
              </div>
            </div>
          </div>

          {/* BENTO CARD 2: Job Specification Context */}
          <div id="bento-jobspec" className="p-6 rounded-3xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Active Context Guard
              </span>
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
                Semantic Matrix Ready
              </span>
            </div>
            <h2 className="text-base font-display font-bold text-[#003135] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#024950]" />
              Job Specification Spec
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Agent 2 uses this criteria to score candidates across all 3 vectors with reasoning.
            </p>

            <div className="my-3">
              <textarea
                id="job-spec-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={3}
                placeholder="Describe the technical requirements, architecture stack, expected engineering trajectory, and domain scope..."
                className="w-full p-3 text-xs bg-stone-50 text-[#003135] border border-[#E5E2D9] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#024950] placeholder:text-stone-400 transition-all font-sans"
              />
            </div>

            <button
              type="button"
              id="trigger-evaluation-btn"
              disabled={rankingInProgress || !jobDescription.trim()}
              onClick={() => runEvaluation()}
              className="w-full flex items-center justify-center gap-2 bg-[#024950] hover:bg-[#003135] disabled:bg-stone-200 text-white hover:disabled:text-stone-400 py-3 rounded-2xl text-xs font-bold font-display shadow-md shadow-teal-950/10 active:scale-[0.98] transition-all"
            >
              {rankingInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Leaderboard...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Calibrate & Rerank via Agent 2</span>
                </>
              )}
            </button>

            {rankingInProgress && (
              <div className="mt-3 text-center text-[10px] font-mono text-stone-500 italic animate-pulse">
                {rankingStep}
              </div>
            )}
          </div>

          {/* BENTO CARD 3: Ingestion Lab Form */}
          <div id="bento-ingest" className="flex-grow">
            <CandidateIngestionForm onIngestSuccess={handleNewCandidateIngested} />
          </div>

        </section>

        {/* RIGHT COLUMN (Width: 7/12) — Leaderboard and Detailed selected card */}
        <section className="lg:col-span-7 space-y-5 flex flex-col">
          
          {/* BENTO CARD 4: Live Leaderboard standings */}
          <div 
            id="bento-leaderboard" 
            className={`transition-all duration-300 relative ${
              isFullScreen
                ? "fixed inset-0 z-50 bg-[#FDFCF8] p-6 md:p-8 flex flex-col md:flex-row gap-6 overflow-hidden"
                : "p-6 rounded-3xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between"
            }`}
          >
            <div className={isFullScreen ? (showIngestionSidebar ? "flex-grow flex flex-col gap-4 overflow-hidden h-full w-full md:w-[65%] lg:w-[70%]" : "flex-grow flex flex-col gap-4 overflow-hidden h-full w-full") : "w-full flex flex-col h-full justify-between"}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      Evaluation Scoreboard
                    </div>
                    {isFullScreen && (
                      <span className="bg-[#3D52A0]/10 text-[#3D52A0] text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide animate-pulse">
                        IMMEDIATE DIAGNOSTIC VIEW ACTIVE
                      </span>
                    )}
                  </div>
                  <h2 className={`font-display font-bold text-[#2D2926] ${isFullScreen ? "text-2xl" : "text-base"}`}>
                    Talent Leaderboard Alignment Standings
                  </h2>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    id="bulk-process-mode-btn"
                    onClick={() => {
                      setBulkProcessMode(!bulkProcessMode);
                      if (!bulkProcessMode) {
                        setBulkSelectedIds([]);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border active:scale-95 transition-all shadow-xs cursor-pointer ${
                      bulkProcessMode
                        ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700"
                        : "text-stone-600 bg-stone-50 hover:bg-stone-100 border-stone-200"
                    }`}
                    title="Toggle Bulk Process Mode to select and run evaluation for multiple candidates at once"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bulk Process Mode: {bulkProcessMode ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    id="ghost-mode-btn"
                    onClick={() => setGhostMode(!ghostMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border active:scale-95 transition-all shadow-xs cursor-pointer ${
                      ghostMode
                        ? "bg-[#3D52A0] text-white border-[#3D52A0] hover:bg-[#2C3E82]"
                        : "text-stone-600 bg-stone-50 hover:bg-stone-100 border-stone-200"
                    }`}
                    title="Toggle Ghost Mode to hide candidate names and view them anonymously"
                  >
                    {ghostMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Ghost Mode: {ghostMode ? "ON" : "OFF"}</span>
                  </button>

                  <span className="text-xs text-stone-400 font-mono hidden sm:inline">
                    Sorted by Rank desc
                  </span>
                  
                  <button
                    id="export-csv-btn"
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#024950] bg-[#024950]/5 hover:bg-[#024950]/10 border border-[#024950]/20 active:scale-95 transition-all shadow-xs cursor-pointer"
                    title="Export currently filtered candidates to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  {isFullScreen && (
                    <button
                      id="toggle-ingestion-sidebar-btn"
                      onClick={() => setShowIngestionSidebar(!showIngestionSidebar)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border active:scale-95 transition-all shadow-xs cursor-pointer ${
                        showIngestionSidebar
                          ? "bg-teal-700 text-white border-teal-600 hover:bg-teal-800"
                          : "text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200"
                      }`}
                      title="Toggle Ingestion Lab Sidebar"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{showIngestionSidebar ? "Hide Ingestion Lab" : "Open Ingestion Lab"}</span>
                    </button>
                  )}

                  <button
                    id="fullscreen-mode-btn"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border active:scale-95 transition-all shadow-xs cursor-pointer ${
                      isFullScreen
                        ? "bg-rose-600 text-white border-rose-500 hover:bg-rose-700"
                        : "text-stone-600 bg-stone-50 hover:bg-stone-100 border-stone-200"
                    }`}
                    title="Toggle Full Screen Mode"
                  >
                    {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullScreen ? "Exit Full Screen" : "Full Screen"}</span>
                  </button>
                  {isFullScreen && (
                    <span className="text-[10px] text-stone-400 font-mono hidden md:inline bg-stone-100 px-2 py-1 rounded border border-stone-200">
                      Press <kbd className="font-bold">Esc</kbd>
                    </span>
                  )}
                </div>
              </div>

            {/* Real-time Search Input & Compare Info */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="leaderboard-search"
                  type="text"
                  placeholder="Filter by name, college surrogate, summary or competencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white text-stone-900 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/20 focus:border-[#3D52A0] placeholder:text-stone-400 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2 text-xs text-stone-400 hover:text-stone-700 font-mono bg-transparent cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {compareCandidateIds.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 bg-[#F1EFE9] px-3 py-1 rounded-xl border border-[#E5E2D9] text-xs">
                  <span className="font-mono text-stone-700 font-bold text-[10px]">
                    Compare ({compareCandidateIds.length}/4)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompareCandidateIds([])}
                    className="text-[9px] bg-white border border-[#E5E2D9] hover:bg-stone-50 px-1.5 py-0.5 rounded font-mono text-stone-600 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Processing Action Panel & Combined Progress Bar */}
            <AnimatePresence>
              {bulkProcessMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-3 text-xs overflow-hidden"
                >
                  {!bulkProcessing ? (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-950 font-display">Bulk Selection Panel</span>
                          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                            {bulkSelectedIds.length} Selected
                          </span>
                        </div>
                        <p className="text-stone-500 text-[11px]">
                          Select multiple candidate profiles using the checkboxes below, then trigger the evaluation matrix to process them in batch.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllBulk}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                        >
                          Select All Filtered
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllBulk}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                        >
                          Deselect All
                        </button>
                        <button
                          type="button"
                          id="trigger-bulk-evaluate-btn"
                          disabled={bulkSelectedIds.length === 0}
                          onClick={runBulkEvaluation}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-200 border border-indigo-500 text-white font-bold rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run Batch Evaluation ({bulkSelectedIds.length})</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          <span className="font-bold text-indigo-950 font-display">Agent 2: Batch Processing Evaluations...</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          {bulkProgress}%
                        </span>
                      </div>

                      {/* Progress Bar Track */}
                      <div className="w-full bg-indigo-100/60 h-2.5 rounded-full overflow-hidden border border-indigo-200/50">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${bulkProgress}%` }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                      </div>

                      {/* Description steps & items info */}
                      <div className="flex justify-between items-center text-[11px] text-stone-500 font-mono">
                        <span>{bulkStep}</span>
                        <span>Processing {bulkSelectedIds.length} Profiles</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {loadingCandidates ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-[#3D52A0] animate-spin" />
                <p className="text-xs font-mono text-stone-500">Retrieving system index...</p>
              </div>
            ) : (
              <>
                {/* Mobile Breakpoint Card-Based View */}
                <div className={`block md:hidden space-y-3 ${isFullScreen ? "overflow-y-auto max-h-[60vh] pb-4" : ""}`}>
                  {filteredCandidates.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400 font-sans italic bg-[#FDFCF8]/50 border border-stone-100 rounded-2xl">
                      No candidates match current filter.
                    </div>
                  ) : (
                    filteredCandidates.map((cand, index) => {
                      const isSelected = cand.id === selectedCandidateId;
                      const hasCalculated = typeof cand.final_score === "number";
                      const isComparing = compareCandidateIds.includes(cand.id);
                      const originalRank = candidates.findIndex((c) => c.id === cand.id) + 1;
                      const isExpanded = expandedCandidateIds.includes(cand.id);

                      return (
                        <motion.div
                          key={cand.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            opacity: { duration: 0.3, ease: "easeOut" },
                            y: { type: "spring", stiffness: 100, damping: 15, delay: Math.min(index * 0.04, 0.3) }
                          }}
                          onClick={() => setSelectedCandidateId(cand.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected 
                              ? "bg-[#EDE8F5]/60 border-[#3D52A0] shadow-sm" 
                              : "bg-[#FDFCF8]/70 border-stone-150 hover:border-stone-200"
                          }`}
                        >
                          {/* Header Line */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              {bulkProcessMode && (
                                <div 
                                  className="flex items-center justify-center p-1 -m-1" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    toggleBulkSelect(cand.id); 
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={bulkSelectedIds.includes(cand.id)}
                                    onChange={() => {}} 
                                    className="w-4 h-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                  />
                                </div>
                              )}

                              <div className="flex-shrink-0">
                                {originalRank === 1 ? (
                                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-xs font-bold shadow-xs">
                                    1
                                  </span>
                                ) : originalRank === 2 ? (
                                  <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 border border-stone-300 flex items-center justify-center text-xs font-bold">
                                    2
                                  </span>
                                ) : originalRank === 3 ? (
                                  <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-900/60 border border-amber-100 flex items-center justify-center text-xs font-bold">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-stone-400 text-xs font-mono font-bold">#{originalRank || "-"}</span>
                                )}
                              </div>

                              <div>
                                <div className="font-display font-bold text-xs text-[#1B244A] flex items-center gap-1.5">
                                  <span>{cand.anonymized_profile.display_identifier}</span>
                                  {(cand.id.startsWith("cand-17") || cand.id.startsWith("cand-16")) && (
                                    <span className="text-[7px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono uppercase font-bold">
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.8 }}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                                  isComparing
                                    ? "bg-red-50 text-red-500 border-red-200"
                                    : "bg-stone-50/50 text-stone-400 border-stone-200/60 hover:text-stone-600"
                                }`}
                                onClick={() => toggleCompare(cand.id)}
                                title={isComparing ? "Remove from comparison" : "Add to comparison"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isComparing ? "fill-red-500 text-red-500" : "fill-transparent text-stone-400"}`} />
                              </motion.button>

                              {hasCalculated ? (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                                      cand.final_score! >= 85
                                        ? "bg-[#3D52A0] text-[#FDFCF8]"
                                        : cand.final_score! >= 70
                                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                                        : "bg-stone-100 text-stone-600"
                                    }`}
                                  >
                                    <AnimatedScore value={cand.final_score!} />%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleDetails(cand.id)}
                                    className="p-1 hover:bg-[#3D52A0]/10 rounded-lg text-stone-400 hover:text-[#3D52A0] transition-colors cursor-pointer"
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                                        isExpanded ? "rotate-180 text-[#3D52A0]" : ""
                                      }`}
                                    />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 animate-pulse">
                                  Pending Match
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Profile Summary & Project DNA */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                              {cand.anonymized_profile.summary}
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px] font-mono text-stone-600 bg-stone-50/60 p-2 rounded-xl border border-stone-100/50">
                              <div>
                                <span className="text-stone-400">Flow:</span> {cand.project_dna.data_flow}
                              </div>
                              <div className="border-l border-stone-200 pl-3">
                                <span className="text-stone-400">Footprint:</span> {cand.project_dna.scale_footprint}
                              </div>
                            </div>
                          </div>

                          {/* Mobile Dropdown Sub-Metrics */}
                          <AnimatePresence initial={false}>
                            {isExpanded && hasCalculated && cand.sub_metrics && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-stone-150 space-y-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="grid grid-cols-1 gap-2 text-[11px]">
                                  {/* Technical */}
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-100">
                                    <div className="flex justify-between items-center font-mono font-bold text-stone-500 mb-1">
                                      <span>Technical Match</span>
                                      <span className="text-[#3D52A0]">{cand.sub_metrics.technical_match_score}/100</span>
                                    </div>
                                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#3D52A0] rounded-full" style={{ width: `${cand.sub_metrics.technical_match_score}%` }} />
                                    </div>
                                  </div>

                                  {/* Behavioral */}
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-100">
                                    <div className="flex justify-between items-center font-mono font-bold text-stone-500 mb-1">
                                      <span>Behavioral Trajectory</span>
                                      <span className="text-[#7091E6]">{cand.sub_metrics.behavioral_trajectory_score}/100</span>
                                    </div>
                                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#7091E6] rounded-full" style={{ width: `${cand.sub_metrics.behavioral_trajectory_score}%` }} />
                                    </div>
                                  </div>

                                  {/* Domain */}
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-100">
                                    <div className="flex justify-between items-center font-mono font-bold text-stone-500 mb-1">
                                      <span>Domain Alignment</span>
                                      <span className="text-[#8697C4]">{cand.sub_metrics.domain_alignment_score}/100</span>
                                    </div>
                                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#8697C4] rounded-full" style={{ width: `${cand.sub_metrics.domain_alignment_score}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Desktop & Tablet Table with Horizontal Scrolling wrapper */}
                <div className={`hidden md:block overflow-x-hidden overflow-y-auto rounded-2xl border border-stone-200/90 bg-[#FDFCF8]/30 p-2 shadow-sm transition-all duration-300 ${
                  isFullScreen ? "flex-1 min-h-0" : "max-h-[62vh]"
                }`}>
                  <table className="w-full text-left border-collapse table-auto bg-white rounded-xl overflow-hidden border border-stone-150/60">
                    <thead className={isFullScreen ? "sticky top-0 z-10 bg-stone-50 shadow-xs" : "bg-stone-50/80"}>
                      <tr className="text-stone-500 text-[10px] font-mono uppercase tracking-wider border-b border-[#E5E2D9]">
                        {bulkProcessMode && (
                          <th className="py-3 px-4 text-center w-14 select-none">Select</th>
                        )}
                        <th className="py-3 px-4 text-center w-16 select-none">Rank</th>
                        <th className="py-3 px-3 text-center w-16 select-none">Compare</th>
                        <th className="py-3 px-5 select-none text-left">Codename / Target Profile</th>
                        <th className="py-3 px-5 select-none text-left">Project DNA Shape & Telemetry</th>
                        <th className="py-3 px-5 text-right w-36 select-none">
                          <span className="flex items-center justify-end gap-1">
                            Composite Score
                            <span className="text-[8px] bg-[#3D52A0]/10 text-[#3D52A0] px-1.5 py-0.5 rounded font-bold">Sorted ↓</span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={bulkProcessMode ? 6 : 5} className="py-12 text-center text-xs text-stone-400 font-sans italic">
                            No candidates match current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((cand, index) => {
                          const isSelected = cand.id === selectedCandidateId;
                          const hasCalculated = typeof cand.final_score === "number";
                          const isComparing = compareCandidateIds.includes(cand.id);
                          const originalRank = candidates.findIndex((c) => c.id === cand.id) + 1;
                          const isExpanded = expandedCandidateIds.includes(cand.id);

                          // Tier classification
                          const scoreTier = cand.final_score 
                            ? cand.final_score >= 85 
                              ? { name: "S-Tier", desc: "Excellent Fit", color: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-xs", border: "border-indigo-100/30" }
                              : cand.final_score >= 70 
                                ? { name: "A-Tier", desc: "Strong Alignment", color: "bg-blue-50 text-blue-700 border-blue-200/60 shadow-3xs", border: "border-blue-100/20" }
                                : { name: "B-Tier", desc: "Compatible", color: "bg-slate-50 text-slate-600 border-slate-200/70 shadow-4xs", border: "border-slate-100/10" }
                            : null;

                          const dataFlowStyles = {
                            "Event-Driven": { bg: "bg-indigo-50/80 text-indigo-700 border-indigo-200/55", label: "Event-Driven", dot: "bg-indigo-500" },
                            "Batch Processing": { bg: "bg-sky-50/80 text-sky-700 border-sky-200/55", label: "Batch", dot: "bg-sky-500" },
                            "Microservices": { bg: "bg-emerald-50/80 text-emerald-700 border-emerald-200/55", label: "Microservices", dot: "bg-emerald-500" },
                            "Monolithic CRUD": { bg: "bg-stone-50/80 text-stone-700 border-stone-200/55", label: "Monolithic", dot: "bg-stone-500" }
                          }[cand.project_dna.data_flow] || { bg: "bg-stone-50/80 text-stone-700 border-stone-200/55", label: "Monolithic", dot: "bg-stone-400" };

                          const scaleFootprintStyles = {
                            "High-Throughput": "bg-rose-50/80 text-rose-700 border-rose-200/50",
                            "Low-Latency Real-Time": "bg-amber-50/80 text-amber-800 border-amber-200/50",
                            "Mass Storage": "bg-blue-50/80 text-blue-700 border-blue-200/50",
                            "Standard Scale": "bg-stone-50/80 text-stone-600 border-stone-200/50"
                          }[cand.project_dna.scale_footprint] || "bg-stone-50/80 text-stone-600 border-stone-100";

                          const cultureStyles = {
                            "Serverless/Cloud-Native": "bg-violet-50/80 text-violet-700 border-violet-200/50",
                            "Self-Hosted/Kubernetes": "bg-cyan-50/80 text-cyan-700 border-cyan-200/50",
                            "Bare-Metal": "bg-orange-50/80 text-orange-700 border-orange-200/50"
                          }[cand.project_dna.infrastructure_culture] || "bg-stone-50/80 text-stone-600 border-stone-100";

                          return (
                            <React.Fragment key={cand.id}>
                              <motion.tr
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{
                                  opacity: { duration: 0.35, ease: "easeOut" },
                                  y: { type: "spring", stiffness: 100, damping: 15, delay: Math.min(index * 0.05, 0.4) },
                                  layout: { type: "spring", stiffness: 300, damping: 30 }
                                }}
                                onClick={() => setSelectedCandidateId(cand.id)}
                                className={`group cursor-pointer border-b border-stone-100 transition-all ${
                                  isSelected 
                                    ? "bg-[#EDE8F5]/60 hover:bg-[#EDE8F5]/75 shadow-xs" 
                                    : "bg-white hover:bg-indigo-50/20"
                                }`}
                              >
                                {/* Bulk Select Checkbox Column */}
                                {bulkProcessMode && (
                                  <td className="py-3.5 px-4 text-center" onClick={(e) => { e.stopPropagation(); toggleBulkSelect(cand.id); }}>
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={bulkSelectedIds.includes(cand.id)}
                                        onChange={() => {}} // event handled by onClick on td to prevent react warning
                                        className="w-4 h-4 rounded border-stone-300 text-[#3D52A0] focus:ring-[#3D52A0] cursor-pointer accent-[#3D52A0]"
                                      />
                                    </div>
                                  </td>
                                )}

                                {/* Premium Rank Medallions */}
                                <td className={`py-3.5 px-4 text-center border-l-4 transition-all ${isSelected ? "border-[#3D52A0]" : "border-transparent"}`}>
                                  <div className="flex items-center justify-center">
                                    {originalRank === 1 ? (
                                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 text-amber-950 border border-amber-300 flex items-center justify-center text-xs font-black shadow-xs tracking-tight relative group-hover:scale-105 transition-transform">
                                        1
                                        <span className="absolute -top-1 -right-1 text-[8px]">👑</span>
                                      </span>
                                    ) : originalRank === 2 ? (
                                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-50 to-stone-200 text-stone-850 border border-stone-350 flex items-center justify-center text-xs font-black shadow-xs tracking-tight">
                                        2
                                      </span>
                                    ) : originalRank === 3 ? (
                                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-50 to-orange-150 text-orange-950 border border-orange-250/80 flex items-center justify-center text-xs font-black shadow-xs tracking-tight">
                                        3
                                      </span>
                                    ) : (
                                      <span className="font-mono text-xs font-bold text-stone-400 bg-stone-100/50 px-2 py-0.5 rounded-md border border-stone-200/50">
                                        #{originalRank || "-"}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Compare Selection Button */}
                                <td className="py-3.5 px-3 text-center" onClick={(e) => { e.stopPropagation(); toggleCompare(cand.id); }}>
                                  <div className="flex items-center justify-center">
                                    <motion.button
                                      type="button"
                                      whileTap={{ scale: 0.8 }}
                                      animate={{ 
                                        scale: isComparing ? 1.15 : 1,
                                        rotate: isComparing ? [0, 8, -8, 0] : 0
                                      }}
                                      transition={{ 
                                        scale: { type: "spring", stiffness: 400, damping: 15 },
                                        rotate: { type: "keyframes", duration: 0.35 }
                                      }}
                                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                                        isComparing
                                          ? "bg-red-50 text-red-500 border-red-200 shadow-xs"
                                          : "bg-stone-50 text-stone-400 border-stone-200/80 hover:text-stone-600 hover:bg-stone-100/80"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCompare(cand.id);
                                      }}
                                      title={isComparing ? "Remove from comparison" : "Add to comparison"}
                                    >
                                      <Heart className={`w-4 h-4 transition-colors ${isComparing ? "fill-red-500 text-red-500" : "fill-transparent text-stone-400"}`} />
                                    </motion.button>
                                  </div>
                                </td>

                                {/* Codename & Summary preview */}
                                <td className="py-3.5 px-5">
                                  <div className="flex flex-col gap-1 max-w-sm lg:max-w-md">
                                    <div className="flex items-center gap-2">
                                      <span className="font-display font-extrabold text-sm text-[#1B244A] tracking-tight">
                                        {cand.anonymized_profile.display_identifier}
                                      </span>
                                      {(cand.id.startsWith("cand-17") || cand.id.startsWith("cand-16")) && (
                                        <span className="text-[8px] tracking-wider uppercase bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                                          New Core
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                                      {cand.anonymized_profile.summary}
                                    </div>
                                  </div>
                                </td>

                                {/* DNA Signature summary (High-end badges) */}
                                <td className="py-3.5 px-5">
                                  <div className="flex flex-wrap gap-1.5 max-w-xs md:max-w-sm lg:max-w-md">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${dataFlowStyles.bg}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${dataFlowStyles.dot}`} />
                                      {dataFlowStyles.label}
                                    </span>
                                    <span className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${scaleFootprintStyles}`}>
                                      {cand.project_dna.scale_footprint}
                                    </span>
                                    <span className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${cultureStyles}`}>
                                      {cand.project_dna.infrastructure_culture}
                                    </span>
                                  </div>
                                </td>

                                {/* Composite Match alignment score */}
                                <td className="py-3.5 px-5 text-right">
                                  {hasCalculated ? (
                                    <div className="inline-flex items-center gap-2 justify-end select-none">
                                      <div className="flex flex-col items-end text-right">
                                        <span
                                          className={`font-mono text-sm font-extrabold px-3 py-1 rounded-full border shadow-2xs ${scoreTier?.color}`}
                                        >
                                          <AnimatedScore value={cand.final_score!} />%
                                        </span>
                                        <span className="text-[9px] font-mono text-stone-400 mt-1 uppercase font-bold tracking-wider">
                                          {scoreTier?.name} • {scoreTier?.desc}
                                        </span>
                                      </div>
                                      <button
                                        id={`toggle-details-${cand.id}`}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDetails(cand.id);
                                        }}
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          isExpanded 
                                            ? "bg-[#3D52A0] text-white border-[#3D52A0]" 
                                            : "hover:bg-[#3D52A0]/10 text-stone-400 hover:text-[#3D52A0] border-stone-200"
                                        }`}
                                        title={isExpanded ? "Hide detailed analytics" : "Show detailed analytics"}
                                      >
                                        <ChevronDown
                                          className={`w-4 h-4 transform transition-transform duration-300 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                                      Pending Agent 2
                                    </span>
                                  )}
                                </td>
                              </motion.tr>

                              <AnimatePresence initial={false}>
                                {isExpanded && hasCalculated && cand.sub_metrics && (
                                  <motion.tr
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-stone-50/50 border-b border-stone-200/80"
                                  >
                                    <td colSpan={bulkProcessMode ? 6 : 5} className="py-4 px-6 text-stone-700">
                                      <div className="mb-3.5 flex items-center justify-between border-b border-stone-200/60 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-[#3D52A0]" />
                                          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#1B244A]">
                                            AI-Router Multi-Axis Diagnostic Audit
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-stone-400 uppercase">
                                          Isolated Calibration Sandbox
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        {/* Technical Breakdown */}
                                        <div className="bg-white p-4 rounded-xl border border-stone-200/65 shadow-3xs flex flex-col justify-between space-y-3.5">
                                          <div>
                                            <div className="flex justify-between items-center text-[9px] font-mono text-[#3D52A0]/90 uppercase tracking-wider mb-1 font-bold">
                                              <span>Technical Match</span>
                                              <span>
                                                +{(cand.sub_metrics.technical_match_score * weights.techStack).toFixed(1)} pts
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-1.5">
                                              <span className="font-extrabold text-[#1B244A] text-sm">
                                                {cand.sub_metrics.technical_match_score}
                                                <span className="text-[10px] text-stone-400 font-normal">/100</span>
                                              </span>
                                              <span className="text-[10px] text-stone-400 font-mono">Weight: {Math.round(weights.techStack * 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-[#3D52A0] rounded-full transition-all duration-500"
                                                style={{ width: `${cand.sub_metrics.technical_match_score}%` }}
                                              />
                                            </div>
                                          </div>
                                          <div className="bg-[#3D52A0]/5 p-3 rounded-lg border border-[#3D52A0]/10 text-[10px] text-stone-600 leading-relaxed italic">
                                            &ldquo;{cand.sub_metrics.reasoning?.technical || "Pristine technical schema matching with zero manual developer bias."}&rdquo;
                                          </div>
                                        </div>

                                        {/* Behavioral Breakdown */}
                                        <div className="bg-white p-4 rounded-xl border border-stone-200/65 shadow-3xs flex flex-col justify-between space-y-3.5">
                                          <div>
                                            <div className="flex justify-between items-center text-[9px] font-mono text-[#7091E6]/95 uppercase tracking-wider mb-1 font-bold">
                                              <span>Behavioral Trajectory</span>
                                              <span>
                                                +{(cand.sub_metrics.behavioral_trajectory_score * weights.trajectory).toFixed(1)} pts
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-1.5">
                                              <span className="font-extrabold text-[#1B244A] text-sm">
                                                {cand.sub_metrics.behavioral_trajectory_score}
                                                <span className="text-[10px] text-stone-400 font-normal">/100</span>
                                              </span>
                                              <span className="text-[10px] text-stone-400 font-mono">Weight: {Math.round(weights.trajectory * 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-[#7091E6] rounded-full transition-all duration-500"
                                                style={{ width: `${cand.sub_metrics.behavioral_trajectory_score}%` }}
                                              />
                                            </div>
                                          </div>
                                          <div className="bg-[#7091E6]/5 p-3 rounded-lg border border-[#7091E6]/10 text-[10px] text-stone-600 leading-relaxed italic">
                                            &ldquo;{cand.sub_metrics.reasoning?.behavioral || "Exceptional project leadership telemetry scores compiled at runtime."}&rdquo;
                                          </div>
                                        </div>

                                        {/* Domain Breakdown */}
                                        <div className="bg-white p-4 rounded-xl border border-stone-200/65 shadow-3xs flex flex-col justify-between space-y-3.5">
                                          <div>
                                            <div className="flex justify-between items-center text-[9px] font-mono text-[#8697C4]/95 uppercase tracking-wider mb-1 font-bold">
                                              <span>Domain Alignment</span>
                                              <span>
                                                +{(cand.sub_metrics.domain_alignment_score * weights.domain).toFixed(1)} pts
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-1.5">
                                              <span className="font-extrabold text-[#1B244A] text-sm">
                                                {cand.sub_metrics.domain_alignment_score}
                                                <span className="text-[10px] text-stone-400 font-normal">/100</span>
                                              </span>
                                              <span className="text-[10px] text-stone-400 font-mono">Weight: {Math.round(weights.domain * 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-[#8697C4] rounded-full transition-all duration-500"
                                                style={{ width: `${cand.sub_metrics.domain_alignment_score}%` }}
                                              />
                                            </div>
                                          </div>
                                          <div className="bg-[#8697C4]/5 p-3 rounded-lg border border-[#8697C4]/10 text-[10px] text-stone-600 leading-relaxed italic">
                                            &ldquo;{cand.sub_metrics.reasoning?.domain || "Accurate domain alignment score reflecting production infrastructure demands."}&rdquo;
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            </div>

            {/* Right Portion of Fullscreen: Collapsible Ingestion Lab */}
            {isFullScreen && showIngestionSidebar && (
              <div className="w-full md:w-[35%] lg:w-[350px] flex-shrink-0 flex flex-col h-full overflow-hidden bg-white border border-[#E5E2D9] rounded-3xl p-5 shadow-lg animate-fade-in">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#024950] font-bold">
                      Ingested Resumes Feed
                    </div>
                    <h3 className="text-sm font-display font-bold text-[#003135]">
                      The Ingestion Lab (Stage 1)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowIngestionSidebar(false)}
                    className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-1">
                  <CandidateIngestionForm onIngestSuccess={handleNewCandidateIngested} />
                </div>
              </div>
            )}
          </div>

          {/* BENTO CARD 5: Selected Candidate Deep-Dive Verification Matrix */}
          <div id="bento-deepdive" className="p-6 rounded-3xl bg-white border border-[#E5E2D9] shadow-sm flex-grow">
            {compareCandidateIds.length >= 2 ? (
              (() => {
                const compCandidates = compareCandidateIds
                  .map(id => processedCandidates.find(c => c.id === id))
                  .filter((c): c is Candidate => !!c);
                if (compCandidates.length < 2) return null;
                
                const gridColsClass = 
                  compCandidates.length === 2 
                    ? "grid-cols-1 md:grid-cols-2" 
                    : compCandidates.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

                const tagStyles = [
                  "text-amber-600 bg-amber-50 border-amber-100",
                  "text-blue-600 bg-blue-50 border-blue-100",
                  "text-purple-600 bg-purple-50 border-purple-100",
                  "text-emerald-600 bg-emerald-50 border-emerald-100"
                ];

                return (
                  <div id="compare-matrix-panel" className="space-y-6">
                    {/* Header Information */}
                    <div className="flex justify-between items-center pb-4 border-b border-[#E5E2D9]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                            {compCandidates.length === 2 ? "Side-by-Side Evaluation" : `Multi-Candidate Comparison (${compCandidates.length} Selected)`}
                          </span>
                          <span className="text-[9px] bg-[#3D52A0]/10 text-[#3D52A0] border border-[#3D52A0]/20 px-2 py-0.5 rounded-full font-mono font-bold">
                            COMPARATIVE ANALYSIS ACTIVE
                          </span>
                        </div>
                        <h3 className="font-display font-extrabold text-lg text-stone-900 mt-1">
                          Candidate Comparison Matrix
                        </h3>
                      </div>

                      <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                        <button
                          type="button"
                          disabled={pdfExporting}
                          onClick={() => exportComparisonPDF(compCandidates)}
                          className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-100 text-white disabled:text-stone-400 px-3 py-1.5 rounded-xl border border-indigo-500 font-mono font-bold transition-all active:scale-[0.98] cursor-pointer"
                        >
                          {pdfExporting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Exporting...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Export PDF Report</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareCandidateIds([])}
                          className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl border border-[#E5E2D9] font-mono transition-colors cursor-pointer"
                        >
                          Exit Compare
                        </button>
                      </div>
                    </div>

                    {/* Vector Variance Radar Chart & Heatmap */}
                    <ComparisonVisualizer candidates={compCandidates} />

                    {/* Candidate Comparison Columns */}
                    <div className={`grid ${gridColsClass} gap-6`}>
                      {compCandidates.map((cand, idx) => {
                        const tagStyle = tagStyles[idx % tagStyles.length];
                        const candLetter = String.fromCharCode(65 + idx);
                        return (
                          <div key={cand.id} className="space-y-6 bg-stone-50/40 p-4 rounded-2xl border border-stone-100/80 flex flex-col justify-between">
                            <div className="space-y-6">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className={`text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border font-bold ${tagStyle}`}>
                                    Candidate {candLetter}
                                  </span>
                                  <h4 className="font-display font-extrabold text-base text-stone-900 mt-1">
                                    {cand.anonymized_profile.display_identifier}
                                  </h4>
                                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                                    {cand.anonymized_profile.college_surrogate}
                                  </p>
                                </div>
                                {cand.final_score && (
                                  <div className="text-right shrink-0 bg-[#F1EFE9] border border-[#E5E2D9] px-3 py-1.5 rounded-xl">
                                    <span className="text-xl font-display font-black text-stone-900">
                                      <AnimatedScore value={cand.final_score} />%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Summary */}
                              <div>
                                <h5 className="text-[10px] uppercase tracking-wider font-mono text-stone-400 mb-1">
                                  Anonymized Summary
                                </h5>
                                <p className="text-xs text-stone-700 leading-relaxed bg-[#FDFCF8] border border-stone-100 p-3 rounded-xl italic line-clamp-4 hover:line-clamp-none transition-all duration-300">
                                  &ldquo;{cand.anonymized_profile.summary}&rdquo;
                                </p>
                              </div>

                              {/* Metrics */}
                              {cand.sub_metrics ? (
                                <div className="space-y-4">
                                  <h5 className="text-[10px] uppercase tracking-wider font-mono text-stone-400">
                                    Alignment Vectors
                                  </h5>
                                  
                                  {/* Tech */}
                                  <div className="bg-[#FDFCF8] p-3 rounded-xl border border-stone-100 text-xs shadow-3xs">
                                    <div className="flex justify-between items-center mb-1 font-semibold text-stone-700">
                                      <span>Technical Match</span>
                                      <span className="font-mono font-bold text-[#3D52A0]">
                                        {cand.sub_metrics.technical_match_score}/100
                                      </span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                      <div
                                        className="h-full bg-[#3D52A0] rounded-full"
                                        style={{ width: `${cand.sub_metrics.technical_match_score}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-tight">
                                      {cand.sub_metrics.reasoning?.technical}
                                    </p>
                                  </div>

                                  {/* Trajectory */}
                                  <div className="bg-[#FDFCF8] p-3 rounded-xl border border-stone-100 text-xs shadow-3xs">
                                    <div className="flex justify-between items-center mb-1 font-semibold text-stone-700">
                                      <span>Behavioral Trajectory</span>
                                      <span className="font-mono font-bold text-[#7091E6]">
                                        {cand.sub_metrics.behavioral_trajectory_score}/100
                                      </span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                      <div
                                        className="h-full bg-[#7091E6] rounded-full"
                                        style={{ width: `${cand.sub_metrics.behavioral_trajectory_score}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-tight">
                                      {cand.sub_metrics.reasoning?.behavioral}
                                    </p>
                                  </div>

                                  {/* Domain */}
                                  <div className="bg-[#FDFCF8] p-3 rounded-xl border border-stone-100 text-xs shadow-3xs">
                                    <div className="flex justify-between items-center mb-1 font-semibold text-stone-700">
                                      <span>Domain Alignment</span>
                                      <span className="font-mono font-bold text-[#8697C4]">
                                        {cand.sub_metrics.domain_alignment_score}/100
                                      </span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                      <div
                                        className="h-full bg-[#8697C4] rounded-full"
                                        style={{ width: `${cand.sub_metrics.domain_alignment_score}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-tight">
                                      {cand.sub_metrics.reasoning?.domain}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs">
                                  Scoring data not generated.
                                </div>
                              )}
                            </div>

                            {/* DNA Signature summary */}
                            <div className="mt-4 pt-4 border-t border-stone-100">
                              <h5 className="text-[10px] uppercase tracking-wider font-mono text-stone-400 mb-2">
                                Project DNA Shape
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                <div className="bg-[#FDFCF8] p-2 rounded-xl border border-stone-100">
                                  <span className="text-stone-400 block text-[9px] uppercase">Data Flow</span>
                                  <span className="font-semibold text-stone-800 truncate block">{cand.project_dna.data_flow}</span>
                                </div>
                                <div className="bg-[#FDFCF8] p-2 rounded-xl border border-stone-100">
                                  <span className="text-stone-400 block text-[9px] uppercase">Infrastructure</span>
                                  <span className="font-semibold text-stone-800 truncate block">{cand.project_dna.infrastructure_culture}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              // STANDARD SINGLE CANDIDATE DEEP DIVE
              selectedCandidate ? (
                <div id="alignment-matrix-panel" className="space-y-6">
                  
                  {/* Inform user they can compare */}
                  {compareCandidateIds.length === 1 && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-[#3D52A0] rounded-2xl text-xs flex justify-between items-center gap-2 animate-pulse">
                      <span>
                        <strong>Compare Mode:</strong> 1 candidate selected ({processedCandidates.find(c => c.id === compareCandidateIds[0])?.anonymized_profile.display_identifier}). Select up to 3 more candidates from the leaderboard to compare simultaneously!
                      </span>
                      <button
                        onClick={() => setCompareCandidateIds([])}
                        className="text-[10px] underline font-mono text-stone-500 hover:text-stone-800 shrink-0 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {/* Header Information (Display Identifiers & Colleges) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-[#E5E2D9]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                          Blind Screening Profile
                        </span>
                        <span className="text-[9px] bg-[#3D52A0]/10 text-[#3D52A0] font-mono px-2 py-0.5 rounded-full border border-[#3D52A0]/20 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          BIAS STRIPPED ACTIVE
                        </span>
                      </div>
                      <h3 className="font-display font-extrabold text-lg text-[#1B244A] mt-1">
                        {selectedCandidate.anonymized_profile.display_identifier}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-stone-400" />
                        {selectedCandidate.anonymized_profile.college_surrogate}
                      </p>
                    </div>

                    {selectedCandidate.final_score && (
                      <div className="text-right sm:text-right shrink-0 bg-[#F1EFE9] border border-[#E5E2D9] px-4 py-3 rounded-2xl flex items-center gap-3">
                        <div>
                          <div className="text-[28px] font-display font-black leading-none text-[#1B244A]">
                            <AnimatedScore value={selectedCandidate.final_score} />%
                          </div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block mt-0.5">
                            Calculated Fit
                          </span>
                        </div>
                        <div className="w-[3px] h-8 bg-[#3D52A0] rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Resume Summary Outline */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-mono text-stone-400 mb-2">
                      Anonymized Experience Summary
                    </h4>
                    <p className="text-xs text-stone-700 leading-relaxed bg-[#FDFCF8] border border-stone-100 p-4 rounded-2xl italic">
                      &ldquo;{selectedCandidate.anonymized_profile.summary}&rdquo;
                    </p>
                  </div>

                  {/* Interactive Alignment Metrics Visualization */}
                  {selectedCandidate.sub_metrics ? (
                    <div id="data-vis-alignment-meters" className="space-y-4">
                      <h4 className="text-xs uppercase tracking-wider font-mono text-stone-400">
                        Multi-Axis Alignment Vectors
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Technical alignment vector */}
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-stone-700">Technical Match</span>
                            <span className="text-xs font-mono font-bold text-[#3D52A0]">
                              {selectedCandidate.sub_metrics.technical_match_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-[#3D52A0] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedCandidate.sub_metrics.technical_match_score}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <p className="text-[10px] text-stone-500 leading-tight">
                            {selectedCandidate.sub_metrics.reasoning?.technical || "Evaluated by Agent 2."}
                          </p>
                        </div>

                        {/* Behavioral Alignment Vector */}
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-stone-700">Behavioral Trajectory</span>
                            <span className="text-xs font-mono font-bold text-[#7091E6]">
                              {selectedCandidate.sub_metrics.behavioral_trajectory_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-[#7091E6] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedCandidate.sub_metrics.behavioral_trajectory_score}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                            />
                          </div>
                          <p className="text-[10px] text-stone-500 leading-tight">
                            {selectedCandidate.sub_metrics.reasoning?.behavioral || "Evaluated by Agent 2."}
                          </p>
                        </div>

                        {/* Domain Alignment Vector */}
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-stone-700">Domain Alignment</span>
                            <span className="text-xs font-mono font-bold text-[#8697C4]">
                              {selectedCandidate.sub_metrics.domain_alignment_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-[#8697C4] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedCandidate.sub_metrics.domain_alignment_score}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                          <p className="text-[10px] text-stone-500 leading-tight">
                            {selectedCandidate.sub_metrics.reasoning?.domain || "Evaluated by Agent 2."}
                          </p>
                        </div>
                      </div>

                      {/* Agent 2 Overall Evaluation Reasoning */}
                      {selectedCandidate.sub_metrics.reasoning?.overall_summary && (
                        <div className="bg-[#EDE8F5]/30 border border-[#E5E2D9] p-4 rounded-2xl">
                          <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#3D52A0] font-extrabold flex items-center gap-1 mb-1">
                            <Info className="w-3.5 h-3.5" />
                            Agent 2 Synthesis Reasoning
                          </h5>
                          <p className="text-xs text-[#1B244A] leading-relaxed italic">
                            &ldquo;{selectedCandidate.sub_metrics.reasoning.overall_summary}&rdquo;
                          </p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <h4 className="text-xs font-bold font-display">Reranking Scoring Required</h4>
                        <p className="text-[11px] leading-tight text-amber-700 mt-0.5">
                          Click &ldquo;Calibrate & Rerank via Agent 2&rdquo; to execute the evaluation engine on this profile for structured alignment metrics.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DNA Cluster View showing Project DNA & Ghost Competencies */}
                  <div className="pt-4 border-t border-[#E5E2D9]">
                    <DNAClusterView candidate={selectedCandidate} />
                  </div>

                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center text-stone-400 gap-2">
                  <User className="w-8 h-8 opacity-60" />
                  <p className="text-xs font-sans">No candidate selected. Ingest or select a candidate on the left to reveal deep-dive signatures.</p>
                </div>
              )
            )}
          </div>

        </section>

        {/* Full-Width TECHNICAL BLUEPRINT & SYSTEM SPECIFICATION */}
        <div className="lg:col-span-12 space-y-4 mt-6">
          <div className="pb-3 border-b border-[#E5E2D9]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8697C4] font-bold">
              Engineering Specs
            </span>
            <h3 className="font-display font-extrabold text-lg text-[#1B244A] mt-1">
              Active Evaluation Core Specifications & Parameters
            </h3>
            <p className="text-xs text-[#8697C4] mt-0.5">
              Deep architectural telemetry parameters executing inside the sandboxed candidate alignment matrices.
            </p>
          </div>
          <DynamicMetricsAccordion />
        </div>

      </main>

      {/* Footer System Architecture Info */}
      <footer className="border-t border-[#E5E2D9] py-8 px-6 bg-stone-50 text-center text-xs text-stone-500 font-mono mt-10" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#3D52A0] rounded-full" />
            <span>Operational System Topology: Node 'HireLens' Online</span>
          </div>
          
          {/* Privacy Policy & Terms Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-600">
            <button
              id="footer-privacy-link"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-[#3D52A0] transition-colors font-semibold cursor-pointer py-1 px-2 hover:bg-[#3D52A0]/5 rounded-lg"
            >
              Privacy Policy
            </button>
            <span className="text-stone-300">|</span>
            <button
              id="footer-terms-link"
              onClick={() => setShowTermsModal(true)}
              className="hover:text-[#3D52A0] transition-colors font-semibold cursor-pointer py-1 px-2 hover:bg-[#3D52A0]/5 rounded-lg"
            >
              Terms of Service
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>Agent 1: gemini-2.5-flash</span>
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
            <span>Agent 2: gemini-2.5-flash</span>
          </div>
          <div>
            <span>© 2026 HireLens. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Modal Overlays for Privacy & Terms */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyModal(false)}
              className="absolute inset-0 bg-[#1B244A]/60 backdrop-blur-sm"
              id="privacy-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-[#D0E4E7] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-10"
              id="privacy-modal-container"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E2D9] flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0FA4AF] rounded-full animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#0FA4AF] font-bold block">
                      Legal Documentation
                    </span>
                    <h2 className="font-display font-black text-xl text-[#1B244A]">
                      HireLens Privacy Policy
                    </h2>
                  </div>
                </div>
                <button
                  id="btn-close-privacy"
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1.5 hover:bg-stone-200/70 rounded-full transition-colors cursor-pointer text-stone-500 hover:text-[#1B244A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-600 leading-relaxed font-sans scrollbar-thin">
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">01</span>
                    <span>Introduction & Core Scope</span>
                  </div>
                  <p>
                    HireLens (“the Platform”) values and respects your organizational and candidate privacy. This Privacy Policy details the exact mechanisms through which we capture, process, process-anonymize, and utilize evaluation profiles, cognitive alignment metrics, and talent weights to provide context-aware candidate reranking.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">02</span>
                    <span>Vector Multi-Dimensional Processing</span>
                  </div>
                  <p>
                    Our core evaluation engine transforms candidate professional biographies, project descriptions, and structural DNA profiles into multi-dimensional semantic vector embeddings. All processing is heavily sandboxed. We do not expose candidate resume details or proprietary evaluation telemetry to public generative AI networks or third-party datasets.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">03</span>
                    <span>Data Retention & Enterprise Sandbox</span>
                  </div>
                  <p>
                    We guarantee that all candidate records submitted through our ingestion portal are housed inside isolated, non-overlapping sandboxes. These records are used exclusively to calculate real-time technical matches, behavioral trajectories, and domain alignments. Your organization retains absolute ownership and control over the submitted profiles and can clear or export them at any moment.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">04</span>
                    <span>No Demographics Profiling & Bias Stripper</span>
                  </div>
                  <p>
                    To ensure equal opportunity and objective merit-based calibration, HireLens contains specific semantic filters programmed to strip demographic markers, including age, gender, geographic origin, and institutional pedigree, from the ingest stream before vector ranking calculations take place.
                  </p>
                </section>
              </div>

              {/* Footer */}
              <div className="p-4 bg-stone-50 border-t border-[#E5E2D9] flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>Version 2.4.0 (Active Sandboxed Release)</span>
                <button
                  id="btn-agree-privacy"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-[#3D52A0] text-white rounded-lg hover:bg-[#2C3E82] transition-colors cursor-pointer font-bold font-sans"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showTermsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-[#1B244A]/60 backdrop-blur-sm"
              id="terms-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-[#D0E4E7] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-10"
              id="terms-modal-container"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E2D9] flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0FA4AF] rounded-full animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#0FA4AF] font-bold block">
                      Platform Terms
                    </span>
                    <h2 className="font-display font-black text-xl text-[#1B244A]">
                      HireLens Terms of Service
                    </h2>
                  </div>
                </div>
                <button
                  id="btn-close-terms"
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 hover:bg-stone-200/70 rounded-full transition-colors cursor-pointer text-stone-500 hover:text-[#1B244A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-600 leading-relaxed font-sans scrollbar-thin">
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">01</span>
                    <span>License & Acceptable Usage</span>
                  </div>
                  <p>
                    HireLens grants you a non-transferable, revocable license to access our talent reranking dashboard, adjust metric weight calibrations, and process candidate alignment schemas for corporate recruiting, alignment engineering, and performance auditing purposes.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">02</span>
                    <span>Interactive Calibrator Responsibilities</span>
                  </div>
                  <p>
                    Our dynamic sliding weight system allows users to allocate emphasis between Technical Match, Behavioral Trajectory, and Domain Alignment. Users agree to utilize these metrics with professional fairness and acknowledge that weight configurations directly govern computed ranking orders.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">03</span>
                    <span>AI-Assistive Calibration Disclaimer</span>
                  </div>
                  <p>
                    All computed scores, DNA clusters, alignment indexes, and ranking projections are generated using advanced assistive algorithmic architectures. HireLens serves strictly as an assistive evaluation coprocessor. Users acknowledge that final human review and expert validation are indispensable for all qualification evaluations.
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#3D52A0] font-bold font-mono text-xs uppercase tracking-wider">
                    <span className="bg-[#3D52A0]/10 px-2 py-0.5 rounded">04</span>
                    <span>No Web Scraping or Automated Integrity Violations</span>
                  </div>
                  <p>
                    Users are strictly prohibited from implementing custom automated scraping scripts, reverse engineering our calibration metrics algorithms, or utilizing the platform interface for systematic unauthorized telemetry extraction.
                  </p>
                </section>
              </div>

              {/* Footer */}
              <div className="p-4 bg-stone-50 border-t border-[#E5E2D9] flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>Last Updated: June 2026</span>
                <button
                  id="btn-agree-terms"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 bg-[#3D52A0] text-white rounded-lg hover:bg-[#2C3E82] transition-colors cursor-pointer font-bold font-sans"
                >
                  Accept Terms
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
