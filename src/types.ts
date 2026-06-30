export interface AnonymizedProfile {
  display_identifier: string;
  college_surrogate: string;
  summary: string;
}

export interface GhostCompetency {
  concept: string;
  confidence: number;
  justification: string;
}

export interface ProjectDNA {
  data_flow: "Event-Driven" | "Monolithic CRUD" | "Batch Processing" | "Microservices";
  scale_footprint: "High-Throughput" | "Low-Latency Real-Time" | "Mass Storage" | "Standard Scale";
  infrastructure_culture: "Serverless/Cloud-Native" | "Self-Hosted/Kubernetes" | "Bare-Metal";
}

export interface SubMetrics {
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

export interface Candidate {
  id: string;
  anonymized_profile: AnonymizedProfile;
  ghost_competencies: GhostCompetency[];
  project_dna: ProjectDNA;
  sub_metrics?: SubMetrics;
  final_score?: number;
}

export interface Weights {
  techStack: number;
  trajectory: number;
  domain: number;
}
