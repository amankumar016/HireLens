import React from "react";
import { motion } from "motion/react";
import { Cpu, Database, Network, ShieldAlert, Award, AlertCircle } from "lucide-react";
import { Candidate } from "../types";

interface DNAClusterViewProps {
  candidate: Candidate;
}

export default function DNAClusterView({ candidate }: DNAClusterViewProps) {
  const dna = candidate.project_dna;
  const competencies = candidate.ghost_competencies;

  // Helpers to assign matching style tags based on DNA
  const getDataFlowColor = (val: string) => {
    switch (val) {
      case "Event-Driven":
        return "bg-amber-100 text-amber-900 border-amber-200";
      case "Microservices":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "Batch Processing":
        return "bg-purple-100 text-purple-900 border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
    }
  };

  const getScaleColor = (val: string) => {
    switch (val) {
      case "High-Throughput":
        return "bg-rose-100 text-rose-900 border-rose-200";
      case "Low-Latency Real-Time":
        return "bg-cyan-100 text-cyan-900 border-cyan-200";
      case "Mass Storage":
        return "bg-indigo-100 text-indigo-900 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-900 border-slate-200";
    }
  };

  const getInfraColor = (val: string) => {
    switch (val) {
      case "Serverless/Cloud-Native":
        return "bg-teal-100 text-teal-900 border-teal-200";
      case "Self-Hosted/Kubernetes":
        return "bg-orange-100 text-orange-900 border-orange-200";
      default:
        return "bg-stone-100 text-stone-900 border-stone-200";
    }
  };

  return (
    <div id="dna-cluster-root" className="space-y-6">
      {/* Visual DNA Tag Ribbon */}
      <div>
        <h4 className="text-xs uppercase tracking-wider font-mono text-sand-500 mb-3">
          Project DNA Signatures
        </h4>
        <div id="dna-tags-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div
            id="dna-tag-dataflow"
            whileHover={{ y: -2 }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${getDataFlowColor(
              dna.data_flow
            )}`}
          >
            <div className="p-1.5 rounded-lg bg-white/60">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-mono">
                Data Flow
              </div>
              <div className="font-display font-semibold">{dna.data_flow}</div>
            </div>
          </motion.div>

          <motion.div
            id="dna-tag-scale"
            whileHover={{ y: -2 }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${getScaleColor(
              dna.scale_footprint
            )}`}
          >
            <div className="p-1.5 rounded-lg bg-white/60">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-mono">
                Scale Footprint
              </div>
              <div className="font-display font-semibold">{dna.scale_footprint}</div>
            </div>
          </motion.div>

          <motion.div
            id="dna-tag-infra"
            whileHover={{ y: -2 }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${getInfraColor(
              dna.infrastructure_culture
            )}`}
          >
            <div className="p-1.5 rounded-lg bg-white/60">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-mono">
                Infrastructure Culture
              </div>
              <div className="font-display font-semibold">{dna.infrastructure_culture}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* The Ghost Competencies */}
      <div id="ghost-competencies-section">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase tracking-wider font-mono text-sand-500">
            The Ghost Competency Detector
          </h4>
          <span className="text-[10px] font-mono text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-500/20">
            Inferred CS Paradigms
          </span>
        </div>

        <div id="competencies-stack" className="space-y-3">
          {competencies && competencies.length > 0 ? (
            competencies.map((comp, idx) => (
              <motion.div
                key={idx}
                id={`competency-card-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-sand-50 border border-sand-200/60 hover:border-sand-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-sand-500" />
                    <span className="font-display font-semibold text-sand-900 text-sm">
                      {comp.concept}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-sand-500">Confidence</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        comp.confidence >= 0.9
                          ? "bg-emerald-50 text-emerald-700"
                          : comp.confidence >= 0.8
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {Math.round(comp.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-sand-700 leading-relaxed pl-6 italic">
                  &ldquo;{comp.justification}&rdquo;
                </p>

                {/* Micro Visual Bar */}
                <div className="w-full bg-sand-200 h-1 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      comp.confidence >= 0.9 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.confidence * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center gap-2 p-4 text-xs text-sand-500 bg-sand-100 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span>No competencies inferred. Ingest this candidate to process attributes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
