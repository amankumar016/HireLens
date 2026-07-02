import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

import { INITIAL_CANDIDATES } from "./src/data/candidates";
import type { Candidate, GhostCompetency, ProjectDNA, SubMetrics, Weights } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper: robust text-to-JSON generation with auto-retry and exponential backoff
async function generateContentWithRetry(options: any, maxRetries = 3, initialDelay = 500): Promise<any> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(options);
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
 fix-HireLens
      const isRetryable =
        errorMessage.includes("503") ||
        errorMessage.includes("500") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("demand") ||
        errorMessage.includes("temporary");

      
      // Determine if this is a permanent billing/plan limit error
      const errLower = errorMessage.toLowerCase();
      const isPermanentLimit = 
        errLower.includes("billing") || 
        errLower.includes("plan") || 
        errLower.includes("quota") || 
        errLower.includes("exceeded your current quota") ||
        errLower.includes("free-tier limit") ||
        errLower.includes("free tier");

      const isRetryable = 
        !isPermanentLimit && (
          errorMessage.includes("503") || 
          errorMessage.includes("500") || 
          errorMessage.includes("UNAVAILABLE") || 
          errorMessage.includes("429") || 
          errorMessage.includes("RESOURCE_EXHAUSTED") || 
          errorMessage.includes("demand") ||
          errorMessage.includes("temporary")
        );
 main

      if (isRetryable && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4); // exponential backoff with jitter
        console.warn(`[Gemini API] Attempt ${attempt} failed with retryable error: ${errorMessage.substring(0, 150)}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Use standard middleware
app.use(express.json({ limit: "1mb" }));

// Seed Initial Candidates
let candidates: Candidate[] = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));

const TECH_KEYWORDS = [
  "react", "typescript", "javascript", "node", "express", "python", "django", "fastapi",
  "java", "spring", "go", "golang", "rust", "sql", "postgres", "mysql", "mongodb",
  "redis", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "spark",
  "airflow", "flink", "beam", "ml", "machine learning", "llm", "genai", "rag",
  "vector", "langchain", "pinecone", "qdrant", "opencv", "pytorch", "huggingface"
];

const DOMAIN_KEYWORDS = [
  "finance", "accounting", "retail", "ecommerce", "support", "operations", "marketing",
  "analytics", "data", "cloud", "devops", "frontend", "backend", "full-stack",
  "machine learning", "customer", "compliance", "sales", "saas", "consulting"
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeWeights(weights?: Partial<Weights>): Weights {
  const raw = {
    techStack: Number(weights?.techStack ?? 0.4),
    trajectory: Number(weights?.trajectory ?? 0.3),
    domain: Number(weights?.domain ?? 0.3),
  };
  const total = raw.techStack + raw.trajectory + raw.domain;

  if (!Number.isFinite(total) || total <= 0) {
    return { techStack: 0.4, trajectory: 0.3, domain: 0.3 };
  }

  return {
    techStack: raw.techStack / total,
    trajectory: raw.trajectory / total,
    domain: raw.domain / total,
  };
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((total, keyword) => total + (lower.includes(keyword) ? 1 : 0), 0);
}

function getMatchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword));
}

function buildCandidateCorpus(candidate: Candidate): string {
  return [
    candidate.anonymized_profile.display_identifier,
    candidate.anonymized_profile.college_surrogate,
    candidate.anonymized_profile.summary,
    candidate.project_dna.data_flow,
    candidate.project_dna.scale_footprint,
    candidate.project_dna.infrastructure_culture,
    ...candidate.ghost_competencies.map((item) => `${item.concept} ${item.justification}`),
  ].join(" ");
}

function inferProjectDNA(text: string): ProjectDNA {
  const lower = text.toLowerCase();

  const data_flow: ProjectDNA["data_flow"] =
    /microservice|service mesh|distributed/.test(lower) ? "Microservices" :
    /stream|event|kafka|realtime|real-time|queue/.test(lower) ? "Event-Driven" :
    /batch|etl|warehouse|airflow|spark/.test(lower) ? "Batch Processing" :
    "Monolithic CRUD";

  const scale_footprint: ProjectDNA["scale_footprint"] =
    /latency|real-time|realtime|edge/.test(lower) ? "Low-Latency Real-Time" :
    /warehouse|lake|storage|terabyte|million|mass/.test(lower) ? "Mass Storage" :
    /scale|throughput|distributed|kafka|spark|high-volume/.test(lower) ? "High-Throughput" :
    "Standard Scale";

  const infrastructure_culture: ProjectDNA["infrastructure_culture"] =
    /kubernetes|k8s|helm|self-hosted/.test(lower) ? "Self-Hosted/Kubernetes" :
    /bare.?metal|on-prem|datacenter/.test(lower) ? "Bare-Metal" :
    "Serverless/Cloud-Native";

  return { data_flow, scale_footprint, infrastructure_culture };
}

function extractCompetencies(text: string): GhostCompetency[] {
  const lower = text.toLowerCase();
  const matches = TECH_KEYWORDS
    .filter((keyword) => lower.includes(keyword))
    .slice(0, 3)
    .map((keyword, index) => ({
      concept: keyword.replace(/\b\w/g, (char) => char.toUpperCase()),
      confidence: Math.max(0.72, 0.9 - index * 0.05),
      justification: `Inferred from explicit resume evidence mentioning ${keyword} and related delivery context.`,
    }));

  if (matches.length > 0) {
    return matches;
  }

  return [
    {
      concept: "Structured Problem Solving",
      confidence: 0.76,
      justification: "Inferred from the candidate narrative and project-oriented experience details.",
    },
    {
      concept: "Cross-Functional Execution",
      confidence: 0.72,
      justification: "Inferred from responsibilities spanning stakeholders, delivery, and operational outcomes.",
    },
    {
      concept: "Systems Thinking",
      confidence: 0.7,
      justification: "Inferred from end-to-end ownership language in the submitted profile.",
    },
  ];
}

function runLocalIngestionFallback(resumeText: string): Candidate {
  const words = resumeText.trim().split(/\s+/);
  const competencies = extractCompetencies(resumeText);
  const primaryConcept = competencies[0]?.concept || "Systems";
  const suffix = Math.abs([...resumeText].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 100;

  return {
    id: `cand-${Date.now()}`,
    anonymized_profile: {
      display_identifier: `${primaryConcept.replace(/[^A-Za-z]/g, "").slice(0, 10) || "Signal"} Builder ${suffix}`,
      college_surrogate: /iit|nit|bits|stanford|mit|tier.?1/i.test(resumeText)
        ? "Tier-1 Technical Institute"
        : /university|college|institute/i.test(resumeText)
          ? "Regional Technical Institute"
          : "Experience-Led Talent Profile",
      summary: words.slice(0, 55).join(" ") + (words.length > 55 ? "..." : ""),
    },
    ghost_competencies: competencies,
    project_dna: inferProjectDNA(resumeText),
  };
}

function evaluateCandidateLocally(candidate: Candidate, jobDescription: string, weights?: Partial<Weights>): Candidate {
  const normalizedWeights = normalizeWeights(weights);
  const candidateCorpus = buildCandidateCorpus(candidate);
  const jobTechKeywords = getMatchedKeywords(jobDescription, TECH_KEYWORDS);
  const candidateTechKeywords = getMatchedKeywords(candidateCorpus, TECH_KEYWORDS);
  const jobDomainKeywords = getMatchedKeywords(jobDescription, DOMAIN_KEYWORDS);
  const candidateDomainKeywords = getMatchedKeywords(candidateCorpus, DOMAIN_KEYWORDS);
  const technicalOverlap = candidateTechKeywords.filter((keyword) => jobTechKeywords.includes(keyword));
  const domainOverlap = candidateDomainKeywords.filter((keyword) => jobDomainKeywords.includes(keyword));

  const avgConfidence = candidate.ghost_competencies.length
    ? candidate.ghost_competencies.reduce((sum, item) => sum + item.confidence, 0) / candidate.ghost_competencies.length
    : 0.72;

  const dnaBonus = /event|stream|queue|real.?time/i.test(jobDescription) && candidate.project_dna.data_flow === "Event-Driven"
    ? 7
    : /microservice|distributed|service/i.test(jobDescription) && candidate.project_dna.data_flow === "Microservices"
      ? 7
      : /batch|etl|warehouse|pipeline/i.test(jobDescription) && candidate.project_dna.data_flow === "Batch Processing"
        ? 6
        : 0;

  const infraBonus = /kubernetes|k8s|container/i.test(jobDescription) && candidate.project_dna.infrastructure_culture === "Self-Hosted/Kubernetes"
    ? 6
    : /aws|cloud|serverless/i.test(jobDescription) && candidate.project_dna.infrastructure_culture === "Serverless/Cloud-Native"
      ? 5
      : 0;

  const technical = clampScore(45 + technicalOverlap.length * 10 + candidateTechKeywords.length * 2 + avgConfidence * 10 + dnaBonus + infraBonus);
  const behavioral = clampScore(
    58 +
    (/lead|owner|managed|architect|senior|scale|stakeholder|delivered/i.test(candidateCorpus) ? 14 : 5) +
    (/year|yrs|experience|\d\+/.test(candidateCorpus) ? 8 : 0)
  );
  const domain = clampScore(48 + domainOverlap.length * 11 + candidateDomainKeywords.length * 2 + dnaBonus);

  const sub_metrics: SubMetrics = {
    technical_match_score: technical,
    behavioral_trajectory_score: behavioral,
    domain_alignment_score: domain,
    reasoning: {
      technical: `Local heuristic matched ${technicalOverlap.length} requested technical signal(s): ${technicalOverlap.join(", ") || "none"}.`,
      behavioral: "Local heuristic estimated ownership and execution maturity from experience and responsibility signals.",
      domain: `Local heuristic matched ${domainOverlap.length} requested domain signal(s): ${domainOverlap.join(", ") || "none"}.`,
      overall_summary: "Generated by the deterministic fallback evaluator because the AI service was unavailable or returned no usable scores.",
    },
  };

  return {
    ...candidate,
    sub_metrics,
    final_score: clampScore(
      technical * normalizedWeights.techStack +
      behavioral * normalizedWeights.trajectory +
      domain * normalizedWeights.domain
    ),
  };
}

function runLocalRankingHeuristics(jobDescription: string, targetCandidates: Candidate[], weights?: Partial<Weights>): Candidate[] {
  return targetCandidates.map((candidate) => evaluateCandidateLocally(candidate, jobDescription, weights));
}

// Endpoint: Return the active in-memory candidate set
app.get("/api/candidates", (req, res) => {
  res.json({ success: true, candidates });
});

// Endpoint: Basic server status for smoke checks and hosting probes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    candidates: candidates.length,
    aiConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
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
    const prompt = `Analyze the following candidate resume or biography. Perform structural extraction, sanitization of brand identifiers (blind sourcing), taxonomy parsing, and schema generation.

    CANDIDATE TEXT:
    ${resumeText}`;

 fix-HireLens
    // Agent 1 asks Gemini for structured JSON; local fallback handles unavailable AI.

    // Agent 1 uses 'gemini-3.5-flash' with low temperature for high precision extraction
 main
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are Agent 1: Ingestion Engine. Your job is low-latency structural extraction, sanitization of brand identifiers (blind sourcing), taxonomy parsing, and schema generation. Ensure Reverse Anonymization (Blind Sourcing) is strictly active: replace the candidate's real name/identifiers with a creative and highly technical Display Identifier like 'Quantum Sync 24', 'Kernel Crafter 99', 'Async Weaver 51', etc.; replace universities with broad surrogates like 'Tier-1 Regional Academy', 'State Poly-Tech', etc.; replace specific company names with generalized equivalents (e.g., 'MNC Social Network', 'High-Frequency Trading House'). Deduce 'Ghost Competencies' - deep computer science paradigms and architectural principles structurally or mathematically mandatory to complete the projects outlined. Classify the 'Project DNA' fields mapping to the strict Enums.",
        temperature: 0.1,
        topP: 0.95,
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
      const evaluationPrompt = `Evaluate how well each of the listed candidates matches the Job Specification across the three specialized virtual expert dimensions. Let the sub-agents debate and reach a consensus score.

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

 fix-HireLens
      OUTPUT REQUISITES:
      Evaluate and return consensus scores from 0 to 100 for each candidate across the three agent dimensions.
      Provide precise structural justifications drafted by the respective virtual agent for their rating. Output strict JSON format with an array of evaluations, one for each candidate ID listed above.`;

      const response = await generateContentWithRetry({
        model: GEMINI_MODEL,
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

      Evaluate and return consensus scores from 0 to 100 for each candidate across the three agent dimensions (technical, behavioral, domain).
      Provide precise structural justifications drafted by the respective virtual agent for their rating.`;

      let responseText = "";
      let usedModel = "gemini-3.5-flash";

      const systemInstructionText = "You are the Coordinator of a Collaborative Consensus Panel of Virtual Specialized Sub-Agents. Your job is deep multi-axis reasoning, cross-verification, conceptual alignment scoring (0-100), and dynamic ranking based on three distinct expert personas:\n\n1. Virtual Agent A: Chief Systems Architect (Focuses strictly on Tech Stack Compatibility, software complexity, architectural maturity, and the 'Ghost Competencies' parsed during ingestion).\n2. Virtual Agent B: Talent & Behavioral Trajectory Analyst (Focuses strictly on execution velocity, career trajectory, ownership scale, leadership maturity, and project progression).\n3. Virtual Agent C: Domain Subject Matter Expert (Focuses strictly on industry alignment, business-domain fit, regulatory/technical domain nuance, and practical product-market experience).\n\nRate candidate fit objectively using detailed consensus math. Provide constructive, precise justifications for all sub-scores, and keep your overall evaluations highly logical, strict, and precise. Return a JSON object with an evaluations array, one element for each candidate ID evaluated.";

      const responseSchemaConfig = {
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
 main
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
      };

      try {
        console.log("[Ranking] Starting consensus panel evaluation using gemini-3.5-flash...");
        const response = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: evaluationPrompt,
          config: {
            systemInstruction: systemInstructionText,
            temperature: 0.1,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: responseSchemaConfig,
          },
        });
        responseText = response.text || "{}";
        console.log("[Ranking] Consensus panel evaluation completed successfully using gemini-3.5-flash.");
      } catch (err: any) {
        console.warn("[Ranking] Consensus panel failed on gemini-3.5-flash. Details:", err?.message || err);
        throw err; // Trigger outer catch to run local ranking heuristics fallback
      }

      const parsedRes = JSON.parse(responseText);
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

 app.listen(PORT, "127.0.0.1", () => {
  console.log(`[HireLens Server] active on http://localhost:${PORT}`);
});
}

startServer();
