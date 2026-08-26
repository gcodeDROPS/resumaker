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

// 1. Generate Bullet Points from 1-2 sentences of job description
app.post("/api/generate-bullets", async (req, res) => {
  try {
    const { jobTitle, company, description, targetRole, count = 3 } = req.body;
    if (!description && !jobTitle && !company) {
      return res.status(400).json({ error: "Job title, company, or description is required" });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert, award-winning professional resume writer.
Task: Write exactly ${count} highly impactful, authentic, single-page resume bullet points for the following work experience entry.

Input Context:
- Raw Job Title: "${jobTitle || "Not specified"}"
- Raw Company / Organization: "${company || "Not specified"}"
- User's Raw Notes / Description: "${description || ""}"
${targetRole ? `- Long-Term Target Role: "${targetRole}"` : ""}

CRITICAL INSTRUCTIONS & ACCURACY RULES:
1. AUTO-CORRECT & NORMALIZE:
   - Autocorrect any typos in the job title or company (e.g., "cahsier" -> Cashier, "mcdonads" -> McDonald's, "starbuks" -> Starbucks, "barista" -> Barista, "warehosue" -> Warehouse, "receptionst" -> Receptionist).
   - If the user wrote "cashier at mcdonalds" in the title or notes, accurately identify the position as Cashier and company as McDonald's.

2. STRICT ROLE RELEVANCE & DOMAIN VOCABULARY:
   - The generated accomplishments MUST be 100% realistic, authentic, and directly relevant to the ACTUAL job title and company/industry provided.
   - For Food Service / Restaurant / Frontline / Retail roles (e.g., McDonald's Cashier, Crew Member, Barista, Server, Retail Associate):
     * Use authentic frontline achievements: POS cash register operations & end-of-day drawer balancing ($1,000+ daily with 99.9% accuracy), high-volume customer throughput (serving 100-150+ customers/hour during peak lunch/drive-thru rushes), speed of service (sub-90 second drive-thru turnaround), food safety & sanitation standards (HACCP/ServSafe compliance), upselling meal upgrades/promotions, conflict de-escalation, and training new crew members.
     * NEVER use absurd corporate or software engineering buzzwords (do NOT say "Engineered enterprise cloud architectures", "Spearheaded cross-functional OKRs", "Developed CI/CD pipelines", or "Managed multimillion dollar P&L") for entry-level or service-industry roles.
   - For Technical, Healthcare, Trades, Business, Logistics, or Creative roles:
     * Tailor metrics, methodologies, tools, and vocabulary strictly to that specific profession.

3. HIGH-IMPACT BULLET STRUCTURE:
   - Start each bullet with a strong, active verb appropriate to the role (e.g., for service: Processed, Reconciled, Expedited, Maintained, Delivered, Facilitated, Boosted, Resolved; for engineering: Developed, Architected, Automated; for management: Directed, Mentored, Scaled).
   - Integrate realistic, believable metrics (percentages, dollar amounts, transaction volumes, time saved, accuracy rates).
   - Length: 14 to 22 words per bullet so each fits cleanly on 1-2 printed lines on a standard single-page US Letter resume.
   - Do NOT include bullet symbols (•, -, *), asterisks, or markdown numbering. Just return the clean bullet strings.`;

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
        temperature: 0.6,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"bullets":[]}');
    res.json({ bullets: parsed.bullets || [] });
  } catch (error: any) {
    console.error("Error in /api/generate-bullets:", error);
    
    // Dynamic role-aware fallback generator
    const titleLower = `${req.body.jobTitle || ""} ${req.body.company || ""} ${req.body.description || ""}`.toLowerCase();
    let fallbackBullets = [
      `Delivered consistent, high-quality output for ${req.body.company || "the team"}, exceeding core performance benchmarks by 15%.`,
      `Streamlined daily workflows to improve operational efficiency and turnaround time.`,
      `Collaborated effectively across team members to maintain high standards and customer satisfaction.`,
    ];

    if (titleLower.includes("cashier") || titleLower.includes("cahsier") || titleLower.includes("mcdonad") || titleLower.includes("food") || titleLower.includes("retail") || titleLower.includes("crew") || titleLower.includes("barista") || titleLower.includes("server")) {
      fallbackBullets = [
        `Processed 120+ customer transactions per hour using POS register systems with a 99.9% cash-handling accuracy rate.`,
        `Maintained an average drive-thru and counter order turnaround under 90 seconds during high-volume peak rushes.`,
        `Ensured 100% compliance with food safety, sanitation, and hygiene standards while delivering exceptional customer service.`,
      ];
    } else if (titleLower.includes("software") || titleLower.includes("developer") || titleLower.includes("engineer")) {
      fallbackBullets = [
        `Architected and deployed scalable full-stack features, reducing API response times by 35%.`,
        `Collaborated with cross-functional engineering and design teams to deliver key sprint milestones ahead of schedule.`,
        `Implemented automated testing and CI/CD workflows, increasing test coverage and code reliability by 25%.`,
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
