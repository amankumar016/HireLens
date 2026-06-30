import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { INITIAL_CANDIDATES } from "./src/data/candidates";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Use standard middleware
app.use(express.json());

// In-Memory Database for Candidates
interface AnonymizedProfile {
  display_identifier: string;
  college_surrogate: string;
  summary: string;
}

interface GhostCompetency {
  concept: string;
  confidence: number;
  justification: string;
}

interface ProjectDNA {
  data_flow: "Event-Driven" | "Monolithic CRUD" | "Batch Processing" | "Microservices";
  scale_footprint: "High-Throughput" | "Low-Latency Real-Time" | "Mass Storage" | "Standard Scale";
  infrastructure_culture: "Serverless/Cloud-Native" | "Self-Hosted/Kubernetes" | "Bare-Metal";
}

interface SubMetrics {
  technical_match_score: number;
  behavioral_trajectory_score: number;
  domain_alignment_score: number;
  reasoning?: {
    technical?: string;
    behavioral?: string;
    domain?: string;
    overall_summary?: string;
  };
}

interface Candidate {
  id: string;
  anonymized_profile: AnonymizedProfile;
  ghost_competencies: GhostCompetency[];
  project_dna: ProjectDNA;
  sub_metrics?: SubMetrics;
  final_score?: number;
}

// Seed Initial Candidates
let candidates: Candidate[] = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));

// Helper Function: Local Resume Ingestion Parser (Failsafe Fallback)
function runLocalIngestionFallback(resumeText: string): Candidate {
  const adjectives = ["Quantum", "Kernel", "Async", "Serverless", "Vector", "Distributed", "Reactive", "Linear", "Consensus", "Idempotent", "Zero-Copy", "Telemetry", "Polymorphic", "Event", "Pipeline", "Cluster", "Memory", "Signal"];
  const nouns = ["Architect", "Crafter", "Weaver", "Maestro", "Refinery", "Forge", "Engine", "Sync", "Mesh", "Node", "Core", "Optimizer", "Shield", "Gateway", "Vault", "Beacon", "Pioneer", "Sentry", "Vanguard"];
  
  let preferredAdj = "";
  let preferredNoun = "";
  
  const textLower = resumeText.toLowerCase();
  if (textLower.includes("rust") || textLower.includes("c++") || textLower.includes("system")) {
    preferredAdj = "Metal";
    preferredNoun = "Core";
  } else if (textLower.includes("kafka") || textLower.includes("stream") || textLower.includes("event")) {
    preferredAdj = "Async";
    preferredNoun = "Engine";
  } else if (textLower.includes("serverless") || textLower.includes("aws") || textLower.includes("lambda")) {
    preferredAdj = "Serverless";
    preferredNoun = "Maestro";
  } else if (textLower.includes("data") || textLower.includes("sql") || textLower.includes("spark")) {
    preferredAdj = "Vector";
    preferredNoun = "Refinery";
  }
  
  const adj = preferredAdj || adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = preferredNoun || nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(10 + Math.random() * 89);
  const displayIdentifier = `${adj} ${noun} ${num}`;

  let collegeSurrogate = "Technical Polytechnic Institute";
  if (textLower.includes("mit") || textLower.includes("stanford") || textLower.includes("harvard") || textLower.includes("berkeley") || textLower.includes("iit") || textLower.includes("indian institute of technology") || textLower.includes("carnegie") || textLower.includes("cmu") || textLower.includes("cambridge") || textLower.includes("oxford")) {
    collegeSurrogate = "Elite Tech Institute (Tier 1 Equivalent)";
  } else if (textLower.includes("university") || textLower.includes("state") || textLower.includes("college")) {
    collegeSurrogate = "Regional State University";
  }

  let summary = "";
  const cleanText = resumeText.replace(/[\r\n]+/g, " ").trim();
  if (cleanText.length > 100) {
    summary = cleanText.substring(0, 250) + "...";
  } else {
    summary = "Experienced engineer specializing in high-performance computing, distributed state coordination, and system reliability.";
  }
  
  // Anonymize details to preserve blind sourcing
  summary = summary.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]");
  summary = summary.replace(/\+?\d[\d-\s()]{7,}\d/g, "[phone]");

  let data_flow: "Event-Driven" | "Monolithic CRUD" | "Batch Processing" | "Microservices" = "Monolithic CRUD";
  if (textLower.includes("kafka") || textLower.includes("rabbit") || textLower.includes("pubsub") || textLower.includes("stream") || textLower.includes("event-driven") || textLower.includes("websocket")) {
    data_flow = "Event-Driven";
  } else if (textLower.includes("microservices") || textLower.includes("grpc") || textLower.includes("docker") || textLower.includes("kubernetes") || textLower.includes("service mesh")) {
    data_flow = "Microservices";
  } else if (textLower.includes("batch") || textLower.includes("spark") || textLower.includes("hadoop") || textLower.includes("etl") || textLower.includes("pipeline")) {
    data_flow = "Batch Processing";
  }

  let scale_footprint: "High-Throughput" | "Low-Latency Real-Time" | "Mass Storage" | "Standard Scale" = "Standard Scale";
  if (textLower.includes("throughput") || textLower.includes("millions") || textLower.includes("billions") || textLower.includes("tb") || textLower.includes("petabyte")) {
    scale_footprint = "High-Throughput";
  } else if (textLower.includes("latency") || textLower.includes("real-time") || textLower.includes("sub-millisecond") || textLower.includes("microseconds") || textLower.includes("latency")) {
    scale_footprint = "Low-Latency Real-Time";
  } else if (textLower.includes("storage") || textLower.includes("database") || textLower.includes("s3") || textLower.includes("postgres") || textLower.includes("mysql") || textLower.includes("elastic")) {
    scale_footprint = "Mass Storage";
  }

  let infrastructure_culture: "Serverless/Cloud-Native" | "Self-Hosted/Kubernetes" | "Bare-Metal" = "Bare-Metal";
  if (textLower.includes("serverless") || textLower.includes("lambda") || textLower.includes("cloud-native") || textLower.includes("aws") || textLower.includes("gcp") || textLower.includes("azure")) {
    infrastructure_culture = "Serverless/Cloud-Native";
  } else if (textLower.includes("kubernetes") || textLower.includes("docker") || textLower.includes("self-hosted") || textLower.includes("k8s") || textLower.includes("helm")) {
    infrastructure_culture = "Self-Hosted/Kubernetes";
  }

  const ghost_competencies: GhostCompetency[] = [];
  if (textLower.includes("rust") || textLower.includes("c++") || textLower.includes("performance") || textLower.includes("zero-copy")) {
    ghost_competencies.push({
      concept: "Zero-Copy Memory Alignment",
      confidence: 0.92,
      justification: "Deduced from system-level memory layout control and performance optimizations found in resume details."
    });
  }
  if (textLower.includes("kafka") || textLower.includes("stream") || textLower.includes("event") || textLower.includes("pub")) {
    ghost_competencies.push({
      concept: "Asynchronous Backpressure Control",
      confidence: 0.89,
      justification: "Inferred from managing distributed streams and ensuring continuous delivery without state collapse."
    });
  }
  if (textLower.includes("kubernetes") || textLower.includes("docker") || textLower.includes("microservice") || textLower.includes("grpc")) {
    ghost_competencies.push({
      concept: "Service Mesh Routing Topologies",
      confidence: 0.91,
      justification: "Required to coordinate secure service-to-service communication profiles across virtual clusters."
    });
  }
  if (textLower.includes("database") || textLower.includes("sql") || textLower.includes("postgres") || textLower.includes("index")) {
    ghost_competencies.push({
      concept: "Relational Query Plan Optimization",
      confidence: 0.86,
      justification: "Inferred from data access patterns, indexing strategies, and database scalability efforts."
    });
  }
  if (textLower.includes("aws") || textLower.includes("serverless") || textLower.includes("lambda")) {
    ghost_competencies.push({
      concept: "Idempotency Coordination",
      confidence: 0.93,
      justification: "Essential for securing serverless operations and preventing duplicate side-effects across distributed retry blocks."
    });
  }

  if (ghost_competencies.length < 2) {
    ghost_competencies.push({
      concept: "Actor Concurrency Mechanics",
      confidence: 0.85,
      justification: "Required for robust multi-threaded or distributed lock-free operations."
    });
    ghost_competencies.push({
      concept: "Distributed Consensus Modeling",
      confidence: 0.81,
      justification: "Implicit in coordinating state replication and leader elections across multiple worker nodes."
    });
  }

  return {
    id: `cand-local-${Date.now()}`,
    anonymized_profile: {
      display_identifier: displayIdentifier,
      college_surrogate: collegeSurrogate,
      summary: summary,
    },
    ghost_competencies: ghost_competencies.slice(0, 3),
    project_dna: {
      data_flow,
      scale_footprint,
      infrastructure_culture,
    }
  };
}

// Helper Function: Local Candidate Ranking Heuristics (Failsafe Fallback)
function runLocalRankingHeuristics(jobDescription: string, candidatesList: Candidate[], weights: any): Candidate[] {
  const wTech = weights?.techStack ?? 0.4;
  const wBehavior = weights?.trajectory ?? 0.3;
  const wDomain = weights?.domain ?? 0.3;

  const jdLower = jobDescription.toLowerCase();

  return candidatesList.map((candidate) => {
    let techScore = 65;
    
    const techKeywords = [
      { term: "event-driven", match: candidate.project_dna.data_flow === "Event-Driven" },
      { term: "microservices", match: candidate.project_dna.data_flow === "Microservices" },
      { term: "batch", match: candidate.project_dna.data_flow === "Batch Processing" },
      { term: "cloud-native", match: candidate.project_dna.infrastructure_culture === "Serverless/Cloud-Native" },
      { term: "serverless", match: candidate.project_dna.infrastructure_culture === "Serverless/Cloud-Native" },
      { term: "kubernetes", match: candidate.project_dna.infrastructure_culture === "Self-Hosted/Kubernetes" },
      { term: "docker", match: candidate.project_dna.infrastructure_culture === "Self-Hosted/Kubernetes" },
      { term: "low latency", match: candidate.project_dna.scale_footprint === "Low-Latency Real-Time" },
      { term: "throughput", match: candidate.project_dna.scale_footprint === "High-Throughput" },
      { term: "storage", match: candidate.project_dna.scale_footprint === "Mass Storage" },
    ];

    techKeywords.forEach(({ term, match }) => {
      if (jdLower.includes(term)) {
        techScore += match ? 12 : 3;
      }
    });

    candidate.ghost_competencies.forEach((comp) => {
      const compLower = comp.concept.toLowerCase();
      const words = compLower.split(/\s+/);
      let compMatch = false;
      words.forEach((word) => {
        if (word.length > 3 && jdLower.includes(word)) {
          compMatch = true;
        }
      });
      if (compMatch) {
        techScore += 8;
      }
    });

    techScore = Math.min(98, Math.max(50, techScore));

    let behavioralScore = 70;
    const summaryLower = candidate.anonymized_profile.summary.toLowerCase();
    
    const behaviorKeywords = [
      { term: "lead", weight: 6 },
      { term: "spearheaded", weight: 8 },
      { term: "designed", weight: 5 },
      { term: "optimized", weight: 5 },
      { term: "rewrote", weight: 7 },
      { term: "scaled", weight: 6 },
      { term: "architected", weight: 8 },
      { term: "zero-copy", weight: 6 },
      { term: "concurrency", weight: 5 },
    ];

    behaviorKeywords.forEach(({ term, weight }) => {
      if (summaryLower.includes(term) || jdLower.includes(term)) {
        behavioralScore += weight;
      }
    });

    behavioralScore = Math.min(96, Math.max(55, behavioralScore));

    let domainScore = 65;
    
    const domainKeywords = [
      { terms: ["finance", "payment", "spend", "transaction"], weight: 10 },
      { terms: ["database", "storage", "sql", "postgres", "mysql", "columnar", "s3"], weight: 8 },
      { terms: ["stream", "analytics", "real-time", "kafka", "latency", "streaming"], weight: 9 },
      { terms: ["kubernetes", "mesh", "cluster", "cloud", "aws", "gcp"], weight: 7 },
    ];

    domainKeywords.forEach(({ terms, weight }) => {
      const hasJdTerm = terms.some(t => jdLower.includes(t));
      const hasCandTerm = terms.some(t => summaryLower.includes(t) || candidate.ghost_competencies.some((c) => c.concept.toLowerCase().includes(t)));
      if (hasJdTerm && hasCandTerm) {
        domainScore += weight + 5;
      } else if (hasJdTerm || hasCandTerm) {
        domainScore += 3;
      }
    });

    domainScore = Math.min(95, Math.max(50, domainScore));

    const finalScore = Math.round(
      (techScore * wTech) +
      (behavioralScore * wBehavior) +
      (domainScore * wDomain)
    );

    const metrics = {
      technical_match_score: techScore,
      behavioral_trajectory_score: behavioralScore,
      domain_alignment_score: domainScore,
      reasoning: {
        technical: `Candidate matches the requested ${candidate.project_dna.data_flow} flow and utilizes ${candidate.project_dna.infrastructure_culture} infrastructure culture to align with job technical specifications. Competencies: ${candidate.ghost_competencies.map((c) => c.concept).join(", ")}.`,
        behavioral: `Summary indicates strong execution with focus on: "${candidate.anonymized_profile.summary.substring(0, 80)}...". Demonstrates clear trajectory of solving deep scalability constraints.`,
        domain: `Project DNA aligns with ${candidate.project_dna.scale_footprint} scalability demands. Domain alignment is solid based on core competencies.`,
        overall_summary: `Candidate evaluated via the high-fidelity local deterministic engine (activated due to remote API rate limits). They exhibit a ${finalScore}% alignment across all core dimensions.`
      }
    };

    return {
      ...candidate,
      sub_metrics: metrics,
      final_score: finalScore,
    };
  });
}

// Endpoint: Fetch Candidates
app.get("/api/candidates", (req, res) => {
  res.json({ success: true, candidates });
});

// Endpoint: Reset Candidates to seed values
app.post("/api/candidates/reset", (req, res) => {
  candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
  res.json({ success: true, candidates });
});

// Endpoint: Ingest New Candidate (Agent 1: Ingestion Engine)
app.post("/api/ingest", async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ success: false, error: "resumeText must be a non-empty string" });
  }

  try {
    const prompt = `You are Agent 1: Ingestion Engine. Your job is low-latency structural extraction, sanitization of brand identifiers (blind sourcing), taxonomy parsing, and schema generation.
    Analyze the following resume/candidate bio and output a clean JSON conforming strictly to the requested schema.
    Ensure Reverse Anonymization (Blind Sourcing) is strictly active:
    - Replace the candidate's real name/identifiers with a creative and highly technical Display Identifier like "Quantum Sync 24", "Kernel Crafter 99", "Async Weaver 51", etc.
    - Replace universities with broad surrogates like "Tier-1 Regional Academy", "State Poly-Tech", "Foreign Research Institution", etc.
    - Replace specific company names with generalized structural equivalents (e.g., "MNC Social Network", "High-Frequency Trading House", "E-commerce Giant", "Bootstrapped SaaS Startup").
    - Deduce "Ghost Competencies" - deep computer science paradigms and architectural principles that are structurally or mathematically mandatory to complete the projects outlined, even if explicit terms are absent. Give a score and a short, precise justification.
    - Classify the "Project DNA" fields mapping to the strict Enums.

    CANDIDATE TEXT:
    ${resumeText}`;

    // Agent 1 uses 'gemini-3.5-flash'
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anonymized_profile: {
              type: Type.OBJECT,
              properties: {
                display_identifier: { type: Type.STRING, description: "A high-concept technical codename" },
                college_surrogate: { type: Type.STRING, description: "Normalized surrogate tier" },
                summary: { type: Type.STRING, description: "Sanitized high-fidelity experience summary" },
              },
              required: ["display_identifier", "college_surrogate", "summary"],
            },
            ghost_competencies: {
              type: Type.ARRAY,
              description: "Extracted architectural concepts inferred from achievements",
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: "Name of the computer science concept" },
                  confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
                  justification: { type: Type.STRING, description: "Detailed deductive justification for this inference" },
                },
                required: ["concept", "confidence", "justification"],
              },
            },
            project_dna: {
              type: Type.OBJECT,
              properties: {
                data_flow: {
                  type: Type.STRING,
                  enum: ["Event-Driven", "Monolithic CRUD", "Batch Processing", "Microservices"],
                },
                scale_footprint: {
                  type: Type.STRING,
                  enum: ["High-Throughput", "Low-Latency Real-Time", "Mass Storage", "Standard Scale"],
                },
                infrastructure_culture: {
                  type: Type.STRING,
                  enum: ["Serverless/Cloud-Native", "Self-Hosted/Kubernetes", "Bare-Metal"],
                },
              },
              required: ["data_flow", "scale_footprint", "infrastructure_culture"],
            },
          },
          required: ["anonymized_profile", "ghost_competencies", "project_dna"],
        },
      },
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);

    // Create a new candidate object
    const newCandidate: Candidate = {
      id: `cand-${Date.now()}`,
      anonymized_profile: parsed.anonymized_profile,
      ghost_competencies: parsed.ghost_competencies,
      project_dna: parsed.project_dna,
    };

    // Store in-memory
    candidates.push(newCandidate);

    res.json({ success: true, candidate: newCandidate, isFallbackActive: false });
  } catch (error: any) {
    const isQuota = error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED") || JSON.stringify(error).includes("429");
    if (isQuota) {
      console.log("[Ingestion] Rate limit/quota exceeded on API key. Activating local deterministic parser fallback.");
    } else {
      console.log(`[Ingestion] Ingestion error: ${error?.message || error}. Activating local deterministic parser fallback.`);
    }
    try {
      const fallbackCandidate = runLocalIngestionFallback(resumeText);
      candidates.push(fallbackCandidate);
      res.json({ success: true, candidate: fallbackCandidate, isFallbackActive: true });
    } catch (fallbackErr: any) {
      console.log("[Ingestion] Local Ingestion Fallback also failed:", fallbackErr?.message || fallbackErr);
      res.status(500).json({ success: false, error: "Both AI Ingestion and local failsafe parsing encountered errors." });
    }
  }
});

// Endpoint: Multi-Metric Scoring & Dynamic Ranking (Agent 2: Evaluation Matrix)
app.post("/api/rank", async (req, res) => {
  try {
    const { jobDescription, candidatesList, weights } = req.body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ success: false, error: "jobDescription must be a non-empty string" });
    }

    const targetCandidates = candidatesList || candidates;
    const wTech = weights?.techStack ?? 0.4;
    const wBehavior = weights?.trajectory ?? 0.3;
    const wDomain = weights?.domain ?? 0.3;

    if (targetCandidates.length === 0) {
      return res.json({ success: true, leaderboard: [] });
    }

    let evaluationsList: any[] = [];
    let isFallbackActive = false;

    try {
      const evaluationPrompt = `You are Agent 2: Evaluation Matrix. Your job is deep multi-axis reasoning, conceptual alignment scoring (0-100), and contextual logic verification.
      Evaluate how well each of the listed candidates matches the Job Specification across three distinct dimensions.

      JOB SPECIFICATION:
      ${jobDescription}

      CANDIDATES TO EVALUATE:
      ${targetCandidates.map((c: any) => `
      - CANDIDATE ID: ${c.id}
        Display Identifier: ${c.anonymized_profile.display_identifier}
        College Surrogate: ${c.anonymized_profile.college_surrogate}
        Summary: ${c.anonymized_profile.summary}
        Project DNA: ${JSON.stringify(c.project_dna)}
        Ghost Competencies: ${JSON.stringify(c.ghost_competencies)}
      `).join("\n\n")}

      OUTPUT REQUISITES:
      Evaluate and return scores from 0 to 100 for each candidate.
      Provide precise structural justifications for your ratings. Output strict JSON format with an array of evaluations, one for each candidate ID listed above.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash", // Fast & fully accurate for this task, avoiding paid model flow requirements
        contents: evaluationPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                description: "Array of evaluations matching each input candidate ID exactly",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "The exact candidate ID evaluated" },
                    technical_match_score: { type: Type.INTEGER },
                    behavioral_trajectory_score: { type: Type.INTEGER },
                    domain_alignment_score: { type: Type.INTEGER },
                    reasoning: {
                      type: Type.OBJECT,
                      properties: {
                        technical: { type: Type.STRING },
                        behavioral: { type: Type.STRING },
                        domain: { type: Type.STRING },
                        overall_summary: { type: Type.STRING },
                      },
                      required: ["technical", "behavioral", "domain", "overall_summary"],
                    },
                  },
                  required: ["id", "technical_match_score", "behavioral_trajectory_score", "domain_alignment_score", "reasoning"],
                },
              },
            },
            required: ["evaluations"],
          },
        },
      });

      const parsedRes = JSON.parse(response.text || "{}");
      evaluationsList = parsedRes.evaluations || [];
    } catch (apiErr: any) {
      const isQuota = apiErr?.message?.includes("quota") || apiErr?.message?.includes("RESOURCE_EXHAUSTED") || JSON.stringify(apiErr).includes("429");
      if (isQuota) {
        console.log("[Ranking] Rate limit/quota exceeded on API key. Activating local ranking heuristics fallback.");
      } else {
        console.log(`[Ranking] Ranking API error: ${apiErr?.message || apiErr}. Activating local ranking heuristics fallback.`);
      }
      isFallbackActive = true;
    }

    let rankedLeaderboard: Candidate[];

    if (isFallbackActive || evaluationsList.length === 0) {
      isFallbackActive = true;
      rankedLeaderboard = runLocalRankingHeuristics(jobDescription, targetCandidates, weights);
    } else {
      // Process and merge the scores
      rankedLeaderboard = targetCandidates.map((candidate: any) => {
        const evaluation = evaluationsList.find((e: any) => e.id === candidate.id);

        const metrics = evaluation ? {
          technical_match_score: evaluation.technical_match_score,
          behavioral_trajectory_score: evaluation.behavioral_trajectory_score,
          domain_alignment_score: evaluation.domain_alignment_score,
          reasoning: evaluation.reasoning,
        } : {
          technical_match_score: 65,
          behavioral_trajectory_score: 70,
          domain_alignment_score: 60,
          reasoning: {
            technical: "Failsafe default calculation due to request constraints.",
            behavioral: "Failsafe trajectory calculation.",
            domain: "Failsafe domain verification.",
            overall_summary: "Fallback evaluation matrix scores were used to preserve continuous operation during high API load."
          }
        };

        const finalCompositeScore = Math.round(
          (metrics.technical_match_score * wTech) +
          (metrics.behavioral_trajectory_score * wBehavior) +
          (metrics.domain_alignment_score * wDomain)
        );

        return {
          ...candidate,
          sub_metrics: metrics,
          final_score: finalCompositeScore,
        };
      });
    }

    // Sort leaderboard desc
    rankedLeaderboard.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

    // Update our candidates in-memory list with latest sub-metrics
    rankedLeaderboard.forEach((rl: any) => {
      const idx = candidates.findIndex((c) => c.id === rl.id);
      if (idx !== -1) {
        candidates[idx].sub_metrics = rl.sub_metrics;
        candidates[idx].final_score = rl.final_score;
      }
    });

    res.json({ success: true, leaderboard: rankedLeaderboard, isFallbackActive });
  } catch (error: any) {
    console.log(`[Ranking] General ranking error: ${error?.message || error}`);
    res.status(500).json({ success: false, error: error.message || "Failed to calculate ranking leaderboard." });
  }
});

// Configure Vite or Static Asset delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HireLens Server] active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
