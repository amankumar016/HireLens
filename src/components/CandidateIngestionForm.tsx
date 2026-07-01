import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, CornerDownLeft, RefreshCw, Layers, Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Candidate } from "../types";

interface CandidateIngestionFormProps {
  onIngestSuccess: (candidate: Candidate, isFallbackActive?: boolean) => void;
}

const TEMPLATE_RESUMES = [
  {
    title: "Bare-Metal High Frequency Engineer",
    text: "Devon Reynolds. Lead low-latency developer. I wrote custom network drivers bypassing standard user-space context switches for high-performance packet analysis. Built real-time cache-aligned data matrices in pure Rust and C. Optimized thread synchronization and ring-buffers for extreme high-throughput pipelines, deploying directly on bare-metal racks."
  },
  {
    title: "Serverless Saga Choreographer",
    text: "Amara Okeke. Lead Solutions Engineer. Scaled massive e-commerce operations. Designed serverless function mesh coordinates that process transactions without centralized locking. Implemented distributed Saga pattern state coordinators, complete transaction rollbacks, and idempotency key caches using high-availability cloud storage."
  },
  {
    title: "Kubernetes Massive Batch Analyst",
    text: "Takeshi Sato. Distributed Systems Specialist. Managed exabyte-scale cold data structures. Designed parallel partitioning engines that execute vectorized block scans directly on block store clusters. Re-architected parallel job schedulers and de-duplication nodes running on hybrid multi-zone Kubernetes grids."
  }
];

const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error("Failed to load PDF parsing library. Check your network."));
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJS();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
};

export default function CandidateIngestionForm({ onIngestSuccess }: CandidateIngestionFormProps) {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    "Agent 1: Ingestion Engine triggered...",
    "Executing Reverse Anonymization (Blind Sourcing)...",
    "Stripping explicit brand, gender, and regional identifiers...",
    "Parsing engineering experiences & taxonomy...",
    "Deducing 'Ghost Competencies' from abstract project outlines...",
    "Mapping raw structures to project DNA schema...",
    "Synthesizing anonymized profile display..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isSupported = fileExtension === "txt" || fileExtension === "md" || fileExtension === "json" || fileExtension === "pdf";

    if (!isSupported) {
      setError("Please upload a plain text (.txt), Markdown (.md), JSON (.json), or PDF (.pdf) resume file.");
      return;
    }

    setParsingFile(true);
    setError(null);

    try {
      if (fileExtension === "pdf") {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
          throw new Error("No readable text found in PDF. Make sure it is not scanned or empty.");
        }
        setResumeText(text);
        const sizeKB = (file.size / 1024).toFixed(1);
        setUploadedFile({ name: file.name, size: `${sizeKB} KB` });
      } else {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Empty file content."));
            }
          };
          reader.onerror = () => reject(new Error("Error reading file."));
          reader.readAsText(file);
        });
        setResumeText(text);
        const sizeKB = (file.size / 1024).toFixed(1);
        setUploadedFile({ name: file.name, size: `${sizeKB} KB` });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error reading or parsing file.");
      setUploadedFile(null);
    } finally {
      setParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setResumeText("");
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setLoading(true);
    setError(null);
    setStageIndex(0);

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();
      if (data.success && data.candidate) {
        onIngestSuccess(data.candidate, data.isFallbackActive);
        setResumeText("");
        setUploadedFile(null);
      } else {
        setError(data.error || "Failed to ingest candidate.");
      }
    } catch (err: any) {
      console.log("Candidate ingestion connection failed:", err);
      setError("Server connection failed. Ensure dev server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (text: string) => {
    setUploadedFile(null);
    setResumeText(text);
  };

  return (
    <div id="ingestion-form-container" className="p-6 rounded-2xl bg-white border border-sand-200 shadow-sm relative overflow-hidden">
      {/* Dynamic Background Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sand-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-sand-100 rounded-lg text-sand-700">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-base text-sand-950">
            The Ingestion Lab
          </h3>
          <p className="text-xs text-sand-500">
            Stage 1 — Abstract Taxonomy Parser & Reverse Anonymizer
          </p>
        </div>
      </div>

      {/* Pre-configured Templates */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider font-mono text-sand-500 mb-2">
          Paste a Candidate Scenario (Auto-Anonymized)
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_RESUMES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              id={`template-btn-${idx}`}
              onClick={() => handleLoadTemplate(tmpl.text)}
              className="text-xs bg-sand-50 hover:bg-sand-100 text-sand-800 px-3 py-1.5 rounded-lg border border-sand-200 transition-all font-sans font-medium"
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleIngest} className="space-y-4">
        {/* Drag & Drop File Zone */}
        <div
          id="file-dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-[#024950] bg-[#024950]/5 scale-[0.99]"
              : parsingFile
              ? "border-[#3D52A0] bg-[#3D52A0]/5"
              : uploadedFile
              ? "border-emerald-200 bg-emerald-50/10"
              : "border-sand-200 hover:border-sand-300 bg-sand-50/30 hover:bg-sand-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".txt,.md,.json,.pdf"
            className="hidden"
          />

          {parsingFile ? (
            <div className="flex flex-col items-center justify-center py-2" onClick={(e) => e.stopPropagation()}>
              <div className="p-2.5 bg-[#3D52A0]/10 rounded-xl text-[#3D52A0] mb-2 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-[#3D52A0] animate-pulse">
                Extracting text content from file...
              </p>
              <p className="text-[10px] text-sand-400 mt-1">
                Using client-side high-fidelity extractor
              </p>
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-between bg-white border border-emerald-100 p-2.5 rounded-lg shadow-2xs max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 text-left">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-sand-900 truncate max-w-[180px] md:max-w-[240px]">
                    {uploadedFile.name}
                  </div>
                  <div className="text-[10px] text-sand-400 font-mono">
                    {uploadedFile.size}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Loaded
                </span>
                <button
                  type="button"
                  id="clear-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUploadedFile();
                  }}
                  className="p-1 hover:bg-rose-50 rounded text-sand-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="p-2.5 bg-white border border-sand-200/60 rounded-xl text-sand-600 shadow-3xs mb-2">
                <Upload className="w-4 h-4 text-sand-500 animate-bounce" />
              </div>
              <p className="text-xs font-semibold text-sand-900">
                Drag and drop your resume file here, or <span className="text-[#024950] hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-sand-400 mt-1">
                Supports .txt, .md, .json, and .pdf (Automatic Text Extraction)
              </p>
            </div>
          )}
        </div>

        {/* Text Area Label or Separator */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-mono text-sand-500">
          <span>{uploadedFile ? "Parsed File Content Preview" : "Or Paste Resume Text Directly"}</span>
          {resumeText && (
            <button
              type="button"
              id="clear-text-btn"
              onClick={() => {
                setResumeText("");
                setUploadedFile(null);
              }}
              className="text-[9px] text-[#024950] hover:underline cursor-pointer lowercase font-medium"
            >
              clear content
            </button>
          )}
        </div>

        <div>
          <textarea
            id="resume-text-input"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            disabled={loading}
            rows={5}
            placeholder="Paste candidate bio, work achievements, or draft resume text here. Example: 'Worked at a major banking group. Rebuilt a parallel batch sync ledger...'"
            className="w-full p-3 text-xs bg-sand-50 text-sand-900 border border-sand-200 rounded-xl focus:ring-1 focus:ring-sand-400 focus:outline-none transition-all placeholder:text-sand-400 font-sans"
          />
        </div>

        {error && (
          <div id="ingest-error-alert" className="p-3 text-xs bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] text-sand-500 leading-tight">
            * Reverse Anonymization Mode is active. Identifiers like names, companies, and exact schools will be replaced by generalized structures.
          </p>

          <button
            type="submit"
            id="submit-ingest-btn"
            disabled={loading || !resumeText.trim()}
            className="flex items-center gap-2 bg-sand-900 hover:bg-sand-950 disabled:bg-sand-200 text-sand-50 hover:disabled:text-sand-400 px-4 py-2.5 rounded-xl text-xs font-medium transition-all shadow-sm font-display shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Extract with Agent 1
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Fancy Agent Loading Indicator */}
      <AnimatePresence>
        {loading && (
          <motion.div
            id="ingestion-stage-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sand-50/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-sand-200 border-t-sand-700 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-sand-600 animate-pulse" />
              </div>
            </div>

            <h4 className="font-display font-bold text-sm text-sand-950 mb-1">
              Analyzing Semantic footprint
            </h4>
            <p className="text-xs text-sand-500 max-w-xs h-8 overflow-hidden font-mono text-center">
              {stages[stageIndex]}
            </p>

            {/* Stage Progress Bar */}
            <div className="w-48 bg-sand-200 h-1 rounded-full mt-4 overflow-hidden">
              <motion.div
                className="bg-sand-700 h-full rounded-full"
                initial={{ width: "5%" }}
                animate={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
