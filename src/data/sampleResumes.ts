import { ResumeData } from "../types";

export const SAMPLE_SOFTWARE_ENGINEER: ResumeData = {
  contact: {
    fullName: "Alex Rivera",
    jobTitle: "",
    email: "alex.rivera@example.com",
    phone: "+1 (415) 555-0192",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera-dev",
    github: "github.com/alexrivera",
    website: "alexrivera.dev",
  },
  summary:
    "High-impact software engineer with 6+ years designing resilient distributed systems and responsive modern web applications. Proven track record architecting microservices that scale to 5M+ monthly users while reducing cloud infrastructure overhead by 32%.",
  experiences: [
    {
      id: "exp-1",
      jobTitle: "Senior Software Engineer",
      company: "Apex Cloud Technologies",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "Present",
      isCurrent: true,
      rawNotes: "Built real-time telemetry pipeline with Kafka and Go. Cut database latency and led team of 5 devs.",
      bullets: [
        "Architected an event-driven telemetry pipeline processing 45M+ daily events with sub-50ms latency using Go and Apache Kafka.",
        "Spearheaded database query optimization and Redis multi-tier caching, reducing 99th-percentile API response times by 48%.",
        "Mentored a team of 6 engineers across distributed systems best practices, improving sprint velocity by 24%.",
      ],
    },
    {
      id: "exp-2",
      jobTitle: "Software Engineer",
      company: "Starlight SaaS Labs",
      location: "San Jose, CA",
      startDate: "2020",
      endDate: "2022",
      rawNotes: "Worked on customer dashboard in React and Node. Automated CI/CD deployments.",
      bullets: [
        "Engineered full-stack analytics dashboards in React, TypeScript, and Node.js adopted by 8,500+ enterprise customers.",
        "Automated CI/CD deployment pipelines using GitHub Actions and Docker, cutting average release cycles from 4 days to 45 minutes.",
        "Refactored legacy REST endpoints into typed GraphQL resolvers, shrinking client payload sizes by 35%.",
      ],
    },
    {
      id: "exp-3",
      jobTitle: "Associate Software Developer",
      company: "Nexis Interactive",
      location: "Oakland, CA",
      startDate: "2018",
      endDate: "2020",
      rawNotes: "Built responsive frontend UI and integrated payment webhooks with Stripe.",
      bullets: [
        "Developed modular UI component libraries adhering to WCAG 2.1 AA accessibility standards.",
        "Integrated robust Stripe subscription billing and automated invoice generation for 12,000+ active recurring subscribers.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. in Computer Science",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      graduationYear: "2018",
      gpaOrHonors: "Dean's Honor List • Magna Cum Laude",
    },
  ],
  skills: [
    "TypeScript & JavaScript",
    "React & Next.js",
    "Node.js & Express",
    "Go (Golang)",
    "PostgreSQL & Redis",
    "AWS & Docker",
    "GraphQL & REST APIs",
    "Kafka & Distributed Systems",
    "CI/CD & DevOps",
  ],
  projects: [
    {
      id: "proj-1",
      title: "FlowState — Realtime Collaboration Engine",
      role: "Creator",
      link: "github.com/alexrivera/flowstate",
      bullets: [
        "Open-source CRDT document sync library with over 1.8k GitHub stars and 50k weekly downloads.",
      ],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      year: "2023",
    },
  ],
};

export const SAMPLE_MARKETING_LEAD: ResumeData = {
  contact: {
    fullName: "Elena Rostova",
    jobTitle: "",
    email: "elena.rostova@example.com",
    phone: "+1 (212) 555-8391",
    location: "New York, NY",
    linkedin: "linkedin.com/in/elenarostova",
    website: "elenarostova.co",
  },
  summary:
    "Data-driven growth marketing leader with 7+ years orchestrating high-ROI acquisition strategies and GTM product launches. Scaled B2B SaaS ARR from $4M to $22M while decreasing customer acquisition cost by 28% through lifecycle experimentation.",
  experiences: [
    {
      id: "exp-m1",
      jobTitle: "Head of Growth Marketing",
      company: "Vanguard Analytics",
      location: "New York, NY",
      startDate: "2022",
      endDate: "Present",
      isCurrent: true,
      rawNotes: "Led paid ads, product onboarding funnels, and enterprise demand gen. Managed $3M annual budget.",
      bullets: [
        "Orchestrated cross-channel GTM campaigns that accelerated qualified pipeline by $14.5M within 12 months.",
        "Overhauled product-led onboarding conversion flows, lifting free-to-paid subscription conversions from 3.2% to 6.8%.",
        "Managed an annual $3.2M performance marketing budget across search, social, and programmatic with a 4.1x blended ROAS.",
      ],
    },
    {
      id: "exp-m2",
      jobTitle: "Senior Product Marketing Manager",
      company: "Kinetix Software",
      location: "Boston, MA",
      startDate: "2019",
      endDate: "2022",
      rawNotes: "Launched 4 flagship enterprise products. Created competitive battlecards and sales enablement content.",
      bullets: [
        "Spearheaded 4 global tier-1 enterprise feature launches generating over 120 press mentions and 45k demo signups.",
        "Produced comprehensive sales enablement battlecards and customer case studies, elevating enterprise sales win rates by 19%.",
      ],
    },
  ],
  education: [
    {
      id: "edu-m1",
      degree: "B.A. in Strategic Communications & Economics",
      school: "New York University",
      location: "New York, NY",
      graduationYear: "2019",
      gpaOrHonors: "Summa Cum Laude",
    },
  ],
  skills: [
    "Go-To-Market Strategy",
    "Performance Marketing & Paid Acquisition",
    "Funnel Optimization & A/B Testing",
    "HubSpot, Marketo & Salesforce",
    "Product Analytics (Mixpanel, Amplitude)",
    "Customer Retention & LTV Modeling",
    "SEO & Content Strategy",
  ],
};

export const BLANK_RESUME: ResumeData = {
  contact: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  experiences: [
    {
      id: "exp-empty-1",
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: true,
      rawNotes: "",
      bullets: [],
    },
  ],
  education: [
    {
      id: "edu-empty-1",
      degree: "",
      school: "",
      location: "",
      graduationYear: "",
      gpaOrHonors: "",
    },
  ],
  skills: [],
  projects: [],
  certifications: [],
};
