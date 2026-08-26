import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Generate Bullet Points from job title and 1-2 sentences of job description/summary
app.post("/api/generate-bullets", async (req, res) => {
  try {
    const { jobTitle, company, description, summary, targetRole, count = 3 } = req.body;
    if (!description && !jobTitle && !company) {
      return res.status(400).json({ error: "Job title, company, or description is required" });
    }

    const ai = getGeminiClient();
    const prompt = `You are a premier executive resume writer specializing in ATS-optimized, high-impact single-page resumes.
Task: Write exactly ${count} distinctive, highly relevant, metric-driven resume bullet points tailored SPECIFICALLY to this job title and experience summary.

Context:
- Job Title: "${jobTitle || "Professional"}"
- Company / Organization: "${company || "Company"}"
- Specific Experience Notes / Duties: "${description || ""}"
${summary ? `- Candidate Background / Summary: "${summary}"` : ""}
${targetRole ? `- Target Career Role: "${targetRole}"` : ""}

CRITICAL RELEVANCE & ACCURACY GUIDELINES:
1. STRICT ROLE ALIGNMENT:
   - Every single bullet point MUST be directly and realistically relevant to the specific job title ("${jobTitle || "this role"}").
   - If the job is in food service or retail (e.g. Cashier, Barista, Server, Store Associate): Focus on cash register throughput, register balancing, speed of service, customer de-escalation, sanitation/safety, and team shift support. Never use technical software buzzwords.
   - If the job is in customer service / support: Focus on ticket resolution rates (CSAT 95%+), call volume (60+ calls/day), empathy, CRM tools (Zendesk/Salesforce), and escalation handling.
   - If the job is in healthcare (Nurse, Medical Assistant): Focus on patient triage, vitals recording, EHR charting compliance, infection control, and physician coordination.
   - If the job is in software / IT: Focus on system architectures, performance optimizations, languages/frameworks, latency reduction, CI/CD, and scalability.
   - If the job is in sales / marketing: Focus on revenue generated, quota attainment (% to quota), lead generation, campaigns, and customer retention.
   - If the job is in logistics / warehouse: Focus on order picking accuracy (99.8%+), inventory staging, forklift safety, palletizing, and shipping schedules.

2. SPECIFICITY FROM NOTES:
   - If the user provided notes/description ("${description || ""}"), extract and elevate the exact accomplishments, tools, and achievements mentioned into executive-grade resume statements.

3. HIGH-IMPACT STRUCTURE & METRICS:
   - Begin with powerful active verbs (e.g., Spearheaded, Orchestrated, Optimized, Accelerated, Streamlined, Resolved, Coordinated, Reconciled, Engineered).
   - Integrate realistic, tangible quantitative metrics (e.g., %, $, throughput, time saved).
   - Word count: 14 to 22 words per bullet so each statement fits on 1-2 printed lines without wrapping awkwardly.
   - Return clean string array without bullet symbols, asterisks, or numbering.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of realistic, role-relevant resume bullet points",
            },
          },
          required: ["bullets"],
        },
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"bullets":[]}');
    res.json({ bullets: parsed.bullets || [] });
  } catch (error: any) {
    console.error("Error in /api/generate-bullets:", error);
    
    // Dynamic role-aware fallback generator for dozens of professions
    const title = `${req.body.jobTitle || ""} ${req.body.company || ""} ${req.body.description || ""}`.toLowerCase();
    let fallbackBullets: string[] = [];

    if (title.includes("cashier") || title.includes("cahsier") || title.includes("mcdonad") || title.includes("food") || title.includes("crew") || title.includes("barista") || title.includes("server") || title.includes("restaurant") || title.includes("fast food")) {
      fallbackBullets = [
        `Processed 120+ customer transactions per hour via POS registers with 99.9% cash-handling accuracy and daily drawer reconciliation.`,
        `Maintained an average order turnaround time under 85 seconds during peak volume rushes while exceeding customer satisfaction targets.`,
        `Ensured strict compliance with food safety, sanitation, and hygiene protocols while training 4 new team members.`,
      ];
    } else if (title.includes("retail") || title.includes("store") || title.includes("sales associate") || title.includes("merchandiser")) {
      fallbackBullets = [
        `Assisted 80+ customers daily on the sales floor, driving store revenue and achieving 115% of monthly sales targets.`,
        `Maintained pristine visual merchandising standards and managed accurate stock replenishment and inventory audits.`,
        `Resolved customer inquiries and product returns professionally, sustaining a 96% positive feedback rating.`,
      ];
    } else if (title.includes("support") || title.includes("customer service") || title.includes("help desk") || title.includes("call center")) {
      fallbackBullets = [
        `Resolved 65+ customer inquiries daily across phone, chat, and email channels while maintaining a 98% CSAT satisfaction score.`,
        `Documented troubleshooting workflows and created internal knowledge base guides, reducing first-contact resolution time by 22%.`,
        `De-escalated high-priority customer concerns calmly and collaborated with product teams to resolve recurring issues.`,
      ];
    } else if (title.includes("sales") || title.includes("account exec") || title.includes("bdr") || title.includes("sdr")) {
      fallbackBullets = [
        `Generated $450K+ in new pipeline revenue by qualifying outbound leads and closing key enterprise prospect contracts.`,
        `Consistently exceeded quarterly quota benchmarks by 120% through structured client discovery and tailored presentations.`,
        `Built and nurtured long-term client relationships, achieving an annual account renewal rate of 94%.`,
      ];
    } else if (title.includes("marketing") || title.includes("social media") || title.includes("content") || title.includes("growth")) {
      fallbackBullets = [
        `Spearheaded multi-channel digital marketing campaigns that increased organic traffic by 45% and qualified leads by 30%.`,
        `Produced engaging visual and written content across platforms, growing active social followers by 12,000+ in 6 months.`,
        `Analyzed CAC, CTR, and conversion metrics in Google Analytics to optimize ad spend ROI by 28%.`,
      ];
    } else if (title.includes("software") || title.includes("developer") || title.includes("engineer") || title.includes("programmer") || title.includes("frontend") || title.includes("backend") || title.includes("full stack")) {
      fallbackBullets = [
        `Architected and deployed responsive full-stack features, reducing API response times by 38% and supporting 50K+ active users.`,
        `Refactored mission-critical backend microservices, eliminating technical debt and increasing system reliability to 99.95%.`,
        `Collaborated in agile sprint cycles with cross-functional teams, shipping key product milestones 2 weeks ahead of schedule.`,
      ];
    } else if (title.includes("nurse") || title.includes("medical") || title.includes("healthcare") || title.includes("clinic") || title.includes("patient")) {
      fallbackBullets = [
        `Administered compassionate, high-quality patient care and monitored vital signs for 15+ acute care patients per shift.`,
        `Maintained meticulous electronic health records (EHR) in strict compliance with HIPAA and clinical quality standards.`,
        `Collaborated with interdisciplinary healthcare teams to develop and execute personalized patient recovery plans.`,
      ];
    } else if (title.includes("warehouse") || title.includes("logistics") || title.includes("forklift") || title.includes("shipping") || title.includes("inventory")) {
      fallbackBullets = [
        `Processed and staged 350+ shipments daily with a 99.8% order accuracy rate using handheld RF barcode scanners.`,
        `Operated forklift and pallet machinery safely, completing 500+ consecutive days with zero safety infractions.`,
        `Streamlined inbound inventory receiving workflows, reducing average dock-to-stock turnaround time by 25%.`,
      ];
    } else if (title.includes("manager") || title.includes("lead") || title.includes("director") || title.includes("supervisor")) {
      fallbackBullets = [
        `Directed daily operations and led a high-performing team of 12 employees, improving overall productivity by 24%.`,
        `Implemented standardized operational workflows and KPI tracking dashboards, cutting departmental overhead costs by 15%.`,
        `Mentored and upskilled team members through structured 1-on-1 coaching, leading to 4 internal promotions.`,
      ];
    } else {
      fallbackBullets = [
        `Executed core responsibilities with high attention to detail for ${req.body.company || "the organization"}, consistently exceeding quarterly performance benchmarks.`,
        `Optimized daily operational workflows and cross-departmental communication, reducing turnaround time by 20%.`,
        `Collaborated with team members and key stakeholders to maintain top-tier service standards and quality assurance.`,
      ];
    }

    res.status(500).json({
      error: error.message || "Failed to generate bullet points with AI",
      fallbackBullets,
    });
  }
});

// 2. Polish / Shorten / Quantify a single bullet point
app.post("/api/polish-bullet", async (req, res) => {
  try {
    const { bullet, action, jobTitle } = req.body;
    if (!bullet) {
      return res.status(400).json({ error: "Bullet text is required" });
    }

    const ai = getGeminiClient();
    let promptAction = "Refine this bullet point to be more professional, clear, and impactful while keeping it authentic to the role.";
    if (action === "quantify") {
      promptAction = "Enhance this bullet point with plausible, realistic quantified metrics, percentage improvements, dollar amounts, or throughput volume that makes sense for this specific job role.";
    } else if (action === "shorten") {
      promptAction = "Make this bullet point concise (between 12 to 16 words) while preserving maximum impact so it fits cleanly on a single printed line.";
    } else if (action === "strengthen") {
      promptAction = "Upgrade the opening verb to a strong, high-impact action verb suitable for this field, and emphasize tangible outcomes over passive duties.";
    }

    const prompt = `You are an expert resume editor.
Role / Position: ${jobTitle || "Professional"}
Original Bullet: "${bullet}"
Instruction: ${promptAction}

CRITICAL RULES:
1. Keep the content strictly authentic to the job title (${jobTitle || "this role"}). Do NOT invent unrelated corporate/tech duties if this is a service or retail position.
2. Return ONLY the polished single bullet point text without bullet symbols, quotes, or markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedBullet: { type: Type.STRING },
          },
          required: ["polishedBullet"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ polishedBullet: parsed.polishedBullet || bullet });
  } catch (error: any) {
    console.error("Error in /api/polish-bullet:", error);
    res.status(500).json({ error: error.message, polishedBullet: req.body.bullet });
  }
});

// 3. Generate 2-3 sentence Professional Summary tailored for 1-page layout
app.post("/api/generate-summary", async (req, res) => {
  try {
    const { fullName, targetRole, experiences, skills } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are an expert resume writer.
Write a punchy, authentic 2-3 sentence summary (45-65 words maximum) for a single-page resume.

Candidate Name: ${fullName || "Candidate"}
Target Role / Title: ${targetRole || "Professional"}
Experience History: ${JSON.stringify(experiences || [])}
Key Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "Relevant industry skills"}

Rules:
- Match the tone and vocabulary to the candidate's actual industry and experience level (e.g. food service, customer support, engineering, management).
- Highlight key strengths, core competencies, and career reliability.
- Avoid hollow clichés like "hardworking team player" or "motivated individual".
- Must fit in 2 to 3 printed lines on a standard US Letter resume page.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
          },
          required: ["summary"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ summary: parsed.summary || "" });
  } catch (error: any) {
    console.error("Error in /api/generate-summary:", error);
    res.status(500).json({
      error: error.message,
      summary: `Dedicated and results-oriented ${req.body.targetRole || "professional"} with a proven track record of operational excellence, team collaboration, and consistent performance. Skilled in delivering high customer satisfaction, optimizing daily workflows, and maintaining rigorous quality standards.`,
    });
  }
});

// 4. Suggest skills based on job history
app.post("/api/suggest-skills", async (req, res) => {
  try {
    const { targetRole, experiences } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze this candidate's target role and work experience to extract and recommend the top 10-14 most relevant, in-demand skills (technical skills, tools/software/equipment, and core competencies) that fit cleanly into a 1-page resume skills section.

Target Role: ${targetRole || "Professional"}
Experience History: ${JSON.stringify(experiences || [])}

CRITICAL RULES:
- The suggested skills MUST match the candidate's actual domain (e.g., if experience includes Cashier/McDonald's/Retail: include POS Systems, Cash Handling & Reconciliation, Customer Service, Food Safety & Sanitation, Order Accuracy, Inventory Restocking, Speed of Service).
- Do not suggest software engineering skills (like React or AWS) unless the candidate actually has software engineering experience.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            toolsAndPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            coreCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["technicalSkills", "toolsAndPlatforms", "coreCompetencies"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/suggest-skills:", error);
    const expText = JSON.stringify(req.body.experiences || "").toLowerCase();
    if (expText.includes("cashier") || expText.includes("cahsier") || expText.includes("mcdonad") || expText.includes("food") || expText.includes("retail")) {
      res.status(500).json({
        technicalSkills: ["POS Systems (NCR/Aloha)", "Cash Handling & Drawer Balancing", "Food Safety (HACCP/ServSafe)"],
        toolsAndPlatforms: ["Drive-Thru Order Systems", "Inventory Trackers", "Debit/Credit Terminals"],
        coreCompetencies: ["Customer Service Excellence", "Speed of Service", "Order Accuracy", "Conflict Resolution", "Teamwork"],
      });
    } else {
      res.status(500).json({
        technicalSkills: ["Project Management", "Data Analysis", "Process Optimization"],
        toolsAndPlatforms: ["MS Office / Google Workspace", "Slack", "Jira"],
        coreCompetencies: ["Cross-Functional Collaboration", "Problem Solving", "Quality Assurance"],
      });
    }
  }
});

// 5. Quick Auto-Generate Full Resume from brief notes / quick bio
app.post("/api/quick-generate-all", async (req, res) => {
  try {
    const { rawNotes, targetRole } = req.body;
    if (!rawNotes) {
      return res.status(400).json({ error: "Raw notes required" });
    }

    const ai = getGeminiClient();
    const prompt = `You are an elite resume architect.
Convert the following unstructured rough notes into a complete, realistic, pristine ONE-PAGE resume data structure.

Target Role / Direction: ${targetRole || "Auto-detect from notes"}
Rough Notes / Bio:
"""
${rawNotes}
"""

CRITICAL RULES:
1. AUTO-CORRECT & GROUNDING:
   - Correct typos in job titles and companies (e.g. "cahsier at mcdonads" -> Cashier at McDonald's).
   - Generate realistic contact details (Name, clean email, phone, location) if missing.
   - Craft bullet points that are 100% relevant and authentic to the ACTUAL jobs mentioned (e.g., if McDonald's Cashier: highlight POS cash handling, order speed, drive-thru throughput, food safety, customer service).
2. SINGLE-PAGE FIT & ACCURACY:
   - Keep 2-3 jobs with 2-3 punchy bullet points each (14-20 words per bullet).
   - Provide 8-12 relevant skills directly related to their background.
   - EDUCATION RULE: Only include education entries if the candidate mentioned degrees, college, high school, or training in their notes. If no education is mentioned, return an empty array [] for education.
   - Write a compelling 2-sentence professional summary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contact: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                website: { type: Type.STRING },
              },
              required: ["fullName", "jobTitle", "email", "phone", "location"],
            },
            summary: { type: Type.STRING },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  jobTitle: { type: Type.STRING },
                  company: { type: Type.STRING },
                  location: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["jobTitle", "company", "startDate", "endDate", "bullets"],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  school: { type: Type.STRING },
                  location: { type: Type.STRING },
                  graduationYear: { type: Type.STRING },
                  honors: { type: Type.STRING },
                },
                required: ["degree", "school", "graduationYear"],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["contact", "summary", "experiences", "education", "skills"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/quick-generate-all:", error);
    res.status(500).json({ error: error.message || "Failed to generate complete resume" });
  }
});

// Vite middleware & Static serving
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
    console.log(`OnePage Resume AI server running on port ${PORT}`);
  });
}

startServer();
