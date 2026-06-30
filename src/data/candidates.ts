import { Candidate } from "../types";

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "CAND_0000001",
    anonymized_profile: {
      display_identifier: "Ira Vora (Backend Engineer)",
      college_surrogate: "Lovely Professional University (Tier 3 Equivalent)",
      summary: "Software / data professional with 6.9 years of experience building data pipelines, backend systems, and analytics infrastructure. Specialist in Spark, Airflow, and SQL warehouses, building ML capabilities with hands-on fine-tuning and Kaggle projects."
    },
    ghost_competencies: [
      {
        concept: "NLP & Fine-tuning LLMs",
        confidence: 0.91,
        justification: "Proven via 36 months of working on custom text processing layers and speech integrations with HuggingFace."
      },
      {
        concept: "Milvus Vector Databases",
        confidence: 0.89,
        justification: "Inferred from building schema registries and indexing streaming log events across real-time brokers."
      },
      {
        concept: "Apache Beam & Data Engineering",
        confidence: 0.84,
        justification: "Demonstrated through design of high-throughput real-time pipelines processing over 50k events/sec."
      }
    ],
    project_dna: {
      data_flow: "Event-Driven",
      scale_footprint: "High-Throughput",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000002",
    anonymized_profile: {
      display_identifier: "Saanvi Sethi (Operations Manager)",
      college_surrogate: "Local Engineering College (Tier 4 Equivalent)",
      summary: "Operations and customer support professional with 12.5+ years of experience. Experienced leading support teams at scale, managing escalated workflows, and designing mechanical hardware subsystems (SolidWorks, ANSYS)."
    },
    ghost_competencies: [
      {
        concept: "Project Management",
        confidence: 0.85,
        justification: "Inferred from managing complex brand re-alignments and leading cross-functional customer success workflows."
      },
      {
        concept: "Feature Engineering",
        confidence: 0.78,
        justification: "Implicit in standard CAD geometry constraints and mechanical optimization of physical sub-assemblies."
      },
      {
        concept: "React & Modern Web",
        confidence: 0.72,
        justification: "Demonstrated via self-guided interface designs and prototype support dashboards built over 35 months."
      }
    ],
    project_dna: {
      data_flow: "Monolithic CRUD",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000003",
    anonymized_profile: {
      display_identifier: "Yash Agarwal (Customer Support)",
      college_surrogate: "Chandigarh University (Tier 3 Equivalent)",
      summary: "Business analyst and support advisor with 1.1+ years of experience. Focuses on retail/CPG consulting diagnostics, process re-engineering, and strategic digital transformation planning."
    },
    ghost_competencies: [
      {
        concept: "Kubernetes Orchestration",
        confidence: 0.80,
        justification: "Inferred from containerizing modular workflow definitions during enterprise digital transformation advisory."
      },
      {
        concept: "Angular Development",
        confidence: 0.75,
        justification: "Supported front-facing support dashboards and client analytics engines over 10 months."
      },
      {
        concept: "Databricks & Excel Analytics",
        confidence: 0.71,
        justification: "Applied during consulting engagements to model business performance metrics and process bottlenecks."
      }
    ],
    project_dna: {
      data_flow: "Monolithic CRUD",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000004",
    anonymized_profile: {
      display_identifier: "Anil Bose (Marketing Manager)",
      college_surrogate: "Lovely Professional University (Tier 3 Equivalent)",
      summary: "Marketing leader and business process owner with 3.8+ years of experience. Solid background in mechanical design CAD/FEA combined with operations fulfillment and SEO-driven digital marketing."
    },
    ghost_competencies: [
      {
        concept: "Object Detection Systems",
        confidence: 0.82,
        justification: "Inferred from hardware design pipeline automation and computerized vision QC steps in fulfillment loops."
      },
      {
        concept: "Apache Airflow Pipelines",
        confidence: 0.79,
        justification: "Demonstrated through automated lead generation workflows and custom data extraction scrapers."
      },
      {
        concept: "Six Sigma Process Optimization",
        confidence: 0.88,
        justification: "Achieved a 22% fulfillment productivity gain through DMAIC implementation across three warehouses."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "High-Throughput",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000005",
    anonymized_profile: {
      display_identifier: "Aisha Sethi (Accountant)",
      college_surrogate: "Chandigarh University (Tier 3 Equivalent)",
      summary: "Finance and HR professional with 11.0+ years of experience. Specializes in statutory compliance, month-end closes, team leadership, and digital process optimization."
    },
    ghost_competencies: [
      {
        concept: "Image Classification (ML)",
        confidence: 0.90,
        justification: "Hands-on experience applying computerized scanning classification to high-volume accounting ledgers."
      },
      {
        concept: "SQL Database Queries",
        confidence: 0.81,
        justification: "Derived from querying structured financial databases and designing audit-readiness scripts."
      },
      {
        concept: "Apache Flink Streams",
        confidence: 0.76,
        justification: "Designed real-time financial tracking triggers running on low-latency streaming event logs."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "Mass Storage",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000006",
    anonymized_profile: {
      display_identifier: "Rajesh Desai (Business Analyst)",
      college_surrogate: "Lovely Professional University (Tier 3 Equivalent)",
      summary: "Business analyst with 6.0+ years of experience. Proficient in consulting diagnostics, process re-engineering, and strategic financial reconciliation."
    },
    ghost_competencies: [
      {
        concept: "Django & Python Web",
        confidence: 0.84,
        justification: "Inferred from developing internal reconciliation scrapers and accounting service modules."
      },
      {
        concept: "Terraform & IaC",
        confidence: 0.73,
        justification: "Maintained baseline infrastructure states for client reporting portals across staging environments."
      },
      {
        concept: "SEO & Content Strategy",
        confidence: 0.80,
        justification: "Created tech-focused publications that consistently rank on search front-pages."
      }
    ],
    project_dna: {
      data_flow: "Monolithic CRUD",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000007",
    anonymized_profile: {
      display_identifier: "Vihaan Bose (Civil Engineer)",
      college_surrogate: "SRM University (Tier 2 Equivalent)",
      summary: "Engineering professional with 5.5+ years of experience. Experienced in creative direction, brand identity, and applying database engineering to operational workflows."
    },
    ghost_competencies: [
      {
        concept: "MongoDB & NoSQL",
        confidence: 0.82,
        justification: "Constructed hierarchical storage collections for document parsing and metadata caching."
      },
      {
        concept: "Apache Spark & ETL",
        confidence: 0.78,
        justification: "Wrote PySpark pipelines for cleansing and structuring large geometry databases."
      },
      {
        concept: "Agile & Scrum Delivery",
        confidence: 0.75,
        justification: "Led release planning and retrospective iterations within engineering design squads."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Bare-Metal"
    }
  },
  {
    id: "CAND_0000008",
    anonymized_profile: {
      display_identifier: "Shaurya Chatterjee (Operations Manager)",
      college_surrogate: "Anna University (Tier 2 Equivalent)",
      summary: "Operations manager with 3.6+ years of experience. Specializes in B2B SaaS demand-generation, pipeline tracking, performance marketing, and software engineering with Rust."
    },
    ghost_competencies: [
      {
        concept: "Rust Programming",
        confidence: 0.88,
        justification: "Inferred from building ultra-safe custom stream decoders and concurrent worker loops."
      },
      {
        concept: "TypeScript & Web Engineering",
        confidence: 0.82,
        justification: "Maintained enterprise tracking integrations and robust web interfaces over 11 months."
      },
      {
        concept: "Kubernetes & Orchestration",
        confidence: 0.76,
        justification: "Configured automated network service topologies for staging and production containers."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Low-Latency Real-Time",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000009",
    anonymized_profile: {
      display_identifier: "Amit Shah (Mechanical Engineer)",
      college_surrogate: "KIIT University (Tier 3 Equivalent)",
      summary: "Mechanical engineer and project manager with 11.0+ years of experience. Solid enterprise sales record of cloud solutions combined with hands-on software development in Go."
    },
    ghost_competencies: [
      {
        concept: "Go (Golang) Microservices",
        confidence: 0.85,
        justification: "Designed highly concurrent REST handlers and state-sync workers over 20 months."
      },
      {
        concept: "OpenCV Computer Vision",
        confidence: 0.82,
        justification: "Developed custom vision pipelines to identify physical sub-assembly dimensions."
      },
      {
        concept: "Snowflake Warehousing",
        confidence: 0.74,
        justification: "Wrote structured warehouse query plans to analyze enterprise cloud sale lifecycles."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000010",
    anonymized_profile: {
      display_identifier: "Aarav Kapoor (Data Engineer)",
      college_surrogate: "Local Engineering College (Tier 4 Equivalent)",
      summary: "Data professional with 4.6 years of experience building pipelines, backend systems, and analytics infrastructure. Highly skilled in ML models, MLOps, and scalable vector search."
    },
    ghost_competencies: [
      {
        concept: "Prompt Engineering & GenAI",
        confidence: 0.94,
        justification: "Engineered robust validation test cases and context boundary templates over 35 months."
      },
      {
        concept: "GANs & CNN Architectures",
        confidence: 0.91,
        justification: "Developed neural generation models and computerized vision pipelines."
      },
      {
        concept: "Kubeflow & MLOps",
        confidence: 0.88,
        justification: "Configured automated model retraining pipelines and vector storage connectors."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "Mass Storage",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000011",
    anonymized_profile: {
      display_identifier: "Deepak Desai (QA Engineer)",
      college_surrogate: "Chandigarh University (Tier 3 Equivalent)",
      summary: "Software and test automation engineer with 2.0 years of experience. Expert in full-stack testing, load-testing using Locust, and mobile Android development."
    },
    ghost_competencies: [
      {
        concept: "Kubeflow Machine Learning",
        confidence: 0.92,
        justification: "Experienced building baseline prediction models and running model accuracy tests."
      },
      {
        concept: "Spring Boot Microservices",
        confidence: 0.84,
        justification: "Implemented automated transactional integration suites and mock API endpoints."
      },
      {
        concept: "Hugging Face Transformers",
        confidence: 0.77,
        justification: "Created semantic validation layers leveraging small language models over 30 months."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000012",
    anonymized_profile: {
      display_identifier: "Anjali Krishnan (Operations Manager)",
      college_surrogate: "Symbiosis International (Tier 3 Equivalent)",
      summary: "Operations manager with 1.1+ years of experience. Solid background in enterprise accounting, compliance audits, and agile software development workflows."
    },
    ghost_competencies: [
      {
        concept: "AWS Cloud Infrastructure",
        confidence: 0.83,
        justification: "Implemented scalable cloud hosting parameters and secure S3 bucket structures."
      },
      {
        concept: "dbt (Data Build Tool)",
        confidence: 0.80,
        justification: "Orchestrated sql-based dimensional mapping layers in enterprise warehouses."
      },
      {
        concept: "Apache Airflow Orchestration",
        confidence: 0.75,
        justification: "Configured simple daily transactional dags and ledger validation flows."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000013",
    anonymized_profile: {
      display_identifier: "Pari Nair (Civil Engineer)",
      college_surrogate: "Delhi College of Engineering (Tier 2 Equivalent)",
      summary: "Engineering coordinator with 1.1+ years of experience. Expert in cross-functional collaboration and user-friendly interface designs using React and Redux."
    },
    ghost_competencies: [
      {
        concept: "React & UI Architecture",
        confidence: 0.85,
        justification: "Created elegant administration panels and state hooks over 23 months."
      },
      {
        concept: "Apache Spark Processing",
        confidence: 0.79,
        justification: "Integrated big-data loaders to stream geometric blueprint files in parallel blocks."
      },
      {
        concept: "Data Pipelines",
        confidence: 0.81,
        justification: "Designed secure storage paths and database connections across multiple cloud resources."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000014",
    anonymized_profile: {
      display_identifier: "Atharv Joshi (Frontend Engineer)",
      college_surrogate: "Lovely Professional University (Tier 3 Equivalent)",
      summary: "Frontend and full-stack engineer with 8.4 years of experience. Deep comfort with Webpack, Jest, custom design systems, and vector indexing."
    },
    ghost_competencies: [
      {
        concept: "FAISS & OpenSearch",
        confidence: 0.93,
        justification: "Built sub-millisecond semantic retrieval filters and dense vector lookups."
      },
      {
        concept: "Computer Vision (YOLO/OpenCV)",
        confidence: 0.89,
        justification: "Experienced training image processing bounds and fine-tuning classification targets."
      },
      {
        concept: "Tailwind CSS & Design Systems",
        confidence: 0.86,
        justification: "Constructed accessible, low-latency styled components for consumer web portals."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Low-Latency Real-Time",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000015",
    anonymized_profile: {
      display_identifier: "Rahul Agarwal (Software Engineer)",
      college_surrogate: "Local Engineering College (Tier 4 Equivalent)",
      summary: "Software and DevOps professional with 5.4 years of experience. Highly skilled in cloud networking (VPC, IAM), Terraform IaC, and Kubernetes operations."
    },
    ghost_competencies: [
      {
        concept: "Terraform & AWS DevOps",
        confidence: 0.90,
        justification: "Built modular infra-as-code definitions to scale SaaS microservices seamlessly."
      },
      {
        concept: "Qdrant Vector Storage",
        confidence: 0.83,
        justification: "Configured automated indexing pipelines for dense document retrieval systems."
      },
      {
        concept: "Computer Vision & PyTorch",
        confidence: 0.80,
        justification: "Implemented lightweight target classifiers and offline model scoring."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "High-Throughput",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000021",
    anonymized_profile: {
      display_identifier: "Rahul Joshi (Project Manager)",
      college_surrogate: "Tier-3 Engineering College (Tier 4 Equivalent)",
      summary: "Project manager with 14.5+ years of experience leading software deliveries. AI and GenAI enthusiast, skilled in LangChain, Pinecone vector search, and model fine-tuning."
    },
    ghost_competencies: [
      {
        concept: "LangChain & Pinecone Integration",
        confidence: 0.88,
        justification: "Inferred from building RAG solutions and custom contextual indexing over 16 months."
      },
      {
        concept: "Vector Search & Embeddings",
        confidence: 0.91,
        justification: "Demonstrated through design of semantic mapping models and dense vector databases."
      },
      {
        concept: "AWS Cloud DevOps",
        confidence: 0.82,
        justification: "Configured highly reliable cloud microservices and server deployments."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Standard Scale",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000025",
    anonymized_profile: {
      display_identifier: "Anika Kumar (Frontend Engineer)",
      college_surrogate: "Regional Technical Institute (Tier 4 Equivalent)",
      summary: "Frontend and cloud engineer with 7.3 years of experience. Experienced developing Android applications, scalable React dashboards, and deploying serverless applications."
    },
    ghost_competencies: [
      {
        concept: "LangChain & GenAI App Design",
        confidence: 0.92,
        justification: "Inferred from building automated contextual responses and structured LLM agents."
      },
      {
        concept: "Data Pipelines & Spark",
        confidence: 0.81,
        justification: "Derived from cleansing large transactional tables and streaming data to cloud warehouses."
      },
      {
        concept: "TypeScript & React State",
        confidence: 0.85,
        justification: "Maintained responsive state architectures for consumer web interfaces."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "High-Throughput",
      infrastructure_culture: "Serverless/Cloud-Native"
    }
  },
  {
    id: "CAND_0000027",
    anonymized_profile: {
      display_identifier: "Avni Pandey (DevOps Engineer)",
      college_surrogate: "IIT Bombay (Tier 1 Equivalent)",
      summary: "DevOps and backend professional with 3.9 years of experience. Expert in cloud deployments, distributed systems, and real-time computer vision applications."
    },
    ghost_competencies: [
      {
        concept: "Computer Vision & YOLO",
        confidence: 0.92,
        justification: "Trained object-detection trackers and optimized model latencies on the edge."
      },
      {
        concept: "PEFT & Model Adaptation",
        confidence: 0.89,
        justification: "Hands-on experience fine-tuning small language models via LoRA and adapters."
      },
      {
        concept: "Terraform & AWS Infrastructures",
        confidence: 0.85,
        justification: "Engineered scalable staging systems using infrastructure-as-code modules."
      }
    ],
    project_dna: {
      data_flow: "Event-Driven",
      scale_footprint: "Low-Latency Real-Time",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000031",
    anonymized_profile: {
      display_identifier: "Ela Singh (ML Engineer)",
      college_surrogate: "SRM University (Tier 2 Equivalent)",
      summary: "Machine learning engineer with 6.0 years of experience building recommendation engines, search systems, and high-performance dense retrievers."
    },
    ghost_competencies: [
      {
        concept: "Dense Retrieval & Pinecone",
        confidence: 0.98,
        justification: "Engineered semantic search engines indexing millions of documents with Pinecone."
      },
      {
        concept: "Sentence Transformers & Embeddings",
        confidence: 0.96,
        justification: "Fine-tuned custom transformers for specialized domain-specific embeddings."
      },
      {
        concept: "MLOps & MLflow Tracking",
        confidence: 0.93,
        justification: "Configured real-time model scoring metrics and automated tracking endpoints."
      }
    ],
    project_dna: {
      data_flow: "Batch Processing",
      scale_footprint: "High-Throughput",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  },
  {
    id: "CAND_0000043",
    anonymized_profile: {
      display_identifier: "Aarav Sen (Cloud Engineer)",
      college_surrogate: "Regional Technical Institute (Tier 4 Equivalent)",
      summary: "Cloud and backend engineer with 8.3 years of experience. Specialist in AWS systems, Kubernetes container orchestration, and real-time vision pipelines."
    },
    ghost_competencies: [
      {
        concept: "OpenCV & Computer Vision",
        confidence: 0.94,
        justification: "Engineered edge capture layers and low-latency image classifiers."
      },
      {
        concept: "Kubeflow Pipelines",
        confidence: 0.92,
        justification: "Configured automated model retraining runs and model orchestration triggers."
      },
      {
        concept: "LangChain Application Framework",
        confidence: 0.87,
        justification: "Created automated text context maps to guide generative models."
      }
    ],
    project_dna: {
      data_flow: "Microservices",
      scale_footprint: "Low-Latency Real-Time",
      infrastructure_culture: "Self-Hosted/Kubernetes"
    }
  }
];
