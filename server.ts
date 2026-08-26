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
    const { jobTitle, company, description, summary, targetRole, existingBullets = [], otherJobTitles = [], count = 3 } = req.body;
    if (!description && !jobTitle && !company) {
      return res.status(400).json({ error: "Job title, company, or description is required" });
    }

    const ai = getGeminiClient();
    const existingBulletList = Array.isArray(existingBullets) && existingBullets.length > 0
      ? `\n\nCRITICAL ANTI-DUPLICATION RULE:\nThe candidate already has these bullets for other jobs on their resume:\n${existingBullets.map((b: string) => `- "${b}"`).join("\n")}\nYou MUST NOT repeat, paraphrase, or reuse any of the above bullet points, metrics, or phrases. This job entry must have 100% DISTINCT, UNIQUE accomplishments.`
      : "";

    const prompt = `You are a premier executive resume writer specializing in ATS-optimized, high-impact single-page resumes.
Task: Write exactly ${count} distinctive, highly relevant, metric-driven resume bullet points tailored SPECIFICALLY to this job title and experience summary.

Context:
- Current Target Role to Write: "${jobTitle || "Professional"}"
- Company / Organization: "${company || "Company"}"
- Specific Experience Notes / Duties: "${description || ""}"
${summary ? `- Candidate Background / Summary: "${summary}"` : ""}
${targetRole ? `- Target Career Role: "${targetRole}"` : ""}
${otherJobTitles.length > 0 ? `- Other Jobs on Resume: ${otherJobTitles.join(", ")}` : ""}${existingBulletList}

CRITICAL RELEVANCE & ACCURACY GUIDELINES:
1. STRICT ROLE DIFFERENTIATION (DO NOT CONFUSE JOBS):
   - Cook / Line Cook / Grill / Prep / Kitchen / Chef:
     * Focus on: Meals prepped (150+ per shift), ticket fulfillment times (<4 minutes), grill/fryer/assembly stations, recipe adherence, food safe temperature logs, kitchen sanitation, and HACCP/ServSafe standards.
     * NEVER write cashier, POS cash register, or customer transaction bullets for a cook!
   - Cashier / Front Counter / Drive-Thru:
     * Focus on: POS register transactions (120+/hour), 99.9% cash-handling accuracy, drawer balancing, order speed (<75s), customer greeting, and promo upselling.
   - Barista / Coffee Specialist:
     * Focus on: Espresso beverage crafting, latte art, grinder calibration, milk steaming, and speed during morning peak rush.
   - Server / Waitstaff / Host:
     * Focus on: Table section management (6-8 tables), menu knowledge, upselling specials, table turns, and guest satisfaction.
   - Dishwasher / Kitchen Utility:
     * Focus on: Dish machine operations (500+ items/hr), station sanitization, chemical safety, and kitchen cookware turnaround.
   - Delivery Driver / Courier:
     * Focus on: Route navigation, on-time delivery rates (99%+), vehicle safety, and order accuracy checks.
   - Customer Service / Support:
     * Focus on: Ticket resolution (65+/day), CSAT scores (95%+), Zendesk/Salesforce CRM, and empathy-driven de-escalation.
   - Retail Sales Associate:
     * Focus on: Sales floor customer assistance, inventory replenishment, visual merchandising, and quota attainment.
   - Software / Tech:
     * Focus on: Stack technologies, microservices, latency reductions, test coverage, and sprint execution.
   - Warehouse / Logistics:
     * Focus on: RF barcode scanning, order picking accuracy (99.8%+), pallet staging, and forklift safety.
   - Healthcare / Nursing:
     * Focus on: Patient vital monitoring, triage, EHR charting compliance, and interdisciplinary coordination.
   - Management / Supervisory:
     * Focus on: Team leadership, shift scheduling, labor cost reduction, and employee coaching.

2. SPECIFICITY FROM NOTES:
   - If notes are provided ("${description || ""}"), extract and elevate the exact accomplishments, tools, and duties mentioned.

3. STRUCTURE & METRICS:
   - Begin each bullet with a strong, distinctive active verb.
   - Integrate realistic quantitative metrics (%, $, volume, time saved).
   - Word count: 14 to 22 words per bullet so each statement fits on 1-2 printed lines.
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
    
    // Dynamic role-aware fallback generator for specific professions
    const title = `${req.body.jobTitle || ""} ${req.body.description || ""}`.toLowerCase();
    const company = `${req.body.company || ""}`.toLowerCase();
    const existing = Array.isArray(req.body.existingBullets) ? req.body.existingBullets : [];
    let fallbackBullets: string[] = [];

    // Cook / Kitchen / Chef / Grill / Prep
    if (title.includes("cook") || title.includes("chef") || title.includes("grill") || title.includes("prep") || title.includes("kitchen") || title.includes("baker") || title.includes("culinary")) {
      fallbackBullets = [
        `Prepared 150+ high-quality meals per shift adhering to strict recipe specifications, portion controls, and cooking temperatures.`,
        `Managed grill, fryer, and assembly stations during peak rush periods, sustaining average ticket execution times under 4 minutes.`,
        `Enforced rigorous food safety, sanitation, and ServSafe temperature compliance while maintaining a spotless station.`,
      ];
    // Cashier / Front Counter / Drive-thru
    } else if (title.includes("cashier") || title.includes("cahsier") || title.includes("register") || title.includes("counter") || title.includes("drive-thru") || title.includes("drive thru")) {
      fallbackBullets = [
        `Processed 120+ customer transactions per hour via POS register systems with a 99.9% cash-handling accuracy rate.`,
        `Maintained an average drive-thru and counter order turnaround under 75 seconds during high-volume peak rushes.`,
        `Upsold promotional menu combos and loyalty rewards programs, contributing to an 8% increase in average ticket size.`,
      ];
    // Barista
    } else if (title.includes("barista") || title.includes("coffee") || title.includes("espresso") || company.includes("starbucks") || company.includes("dunkin")) {
      fallbackBullets = [
        `Handcrafted 100+ specialty espresso beverages and custom drink orders per shift maintaining consistent quality and presentation.`,
        `Maintained espresso machine calibration, grinder dosing, and dairy temperature logs to ensure optimal taste and safety.`,
        `Delivered friendly, fast customer service during peak morning rushes with an average drink turnaround under 60 seconds.`,
      ];
    // Server / Waiter
    } else if (title.includes("server") || title.includes("waiter") || title.includes("waitress") || title.includes("host") || title.includes("dining")) {
      fallbackBullets = [
        `Managed a 6-to-8 table dining section in a fast-paced environment, providing attentive service and upselling daily specials.`,
        `Coordinated seamlessly with kitchen and expo staff to ensure prompt, accurate order delivery and temperature integrity.`,
        `Processed payments and resolved guest inquiries professionally, sustaining high customer satisfaction and repeat visits.`,
      ];
    // Dishwasher / Utility
    } else if (title.includes("dish") || title.includes("utility") || title.includes("busser") || title.includes("cleaner")) {
      fallbackBullets = [
        `Operated commercial dishwashing machinery and sanitation stations, processing 500+ dishware and cookware items per hour.`,
        `Maintained continuous supply of clean equipment for kitchen and front-of-house staff, preventing service bottlenecks.`,
        `Ensured strict adherence to chemical handling, kitchen sanitation, and waste disposal safety standards.`,
      ];
    // Retail
    } else if (title.includes("retail") || title.includes("store") || title.includes("sales associate") || title.includes("merchandis")) {
      fallbackBullets = [
        `Assisted 80+ customers daily on the sales floor, providing knowledgeable product recommendations and driving repeat business.`,
        `Maintained visual merchandising standards and managed accurate stock replenishment and inventory audits.`,
        `Operated POS checkout stations with 100% accuracy and resolved customer return requests with exceptional service.`,
      ];
    // Fast food general crew (if not specifically cook or cashier)
    } else if (title.includes("crew") || title.includes("team member") || company.includes("mcdonad") || company.includes("wendy") || company.includes("burger king") || company.includes("taco bell") || company.includes("chick-fil-a")) {
      fallbackBullets = [
        `Cross-trained across front counter, drive-thru, and food prep stations to flexibly support high-volume meal shifts.`,
        `Assembled customer orders rapidly and accurately, maintaining a team turnaround benchmark under 85 seconds.`,
        `Upheld strict corporate hygiene, food temperature safety, and dining room cleanliness standards throughout each shift.`,
      ];
    // Customer Support
    } else if (title.includes("support") || title.includes("customer service") || title.includes("help desk") || title.includes("call center")) {
      fallbackBullets = [
        `Resolved 65+ customer inquiries daily across phone, chat, and email channels while maintaining a 98% CSAT satisfaction score.`,
        `Documented troubleshooting workflows and created internal knowledge base guides, reducing first-contact resolution time by 22%.`,
        `De-escalated high-priority customer concerns calmly and collaborated with product teams to resolve recurring issues.`,
      ];
    // Sales
    } else if (title.includes("sales") || title.includes("account exec") || title.includes("bdr") || title.includes("sdr")) {
      fallbackBullets = [
        `Generated $450K+ in new pipeline revenue by qualifying outbound leads and closing key enterprise prospect contracts.`,
        `Consistently exceeded quarterly quota benchmarks by 120% through structured client discovery and tailored presentations.`,
        `Built and nurtured long-term client relationships, achieving an annual account renewal rate of 94%.`,
      ];
    // Marketing
    } else if (title.includes("marketing") || title.includes("social media") || title.includes("content") || title.includes("growth")) {
      fallbackBullets = [
        `Spearheaded multi-channel digital marketing campaigns that increased organic traffic by 45% and qualified leads by 30%.`,
        `Produced engaging visual and written content across platforms, growing active social followers by 12,000+ in 6 months.`,
        `Analyzed CAC, CTR, and conversion metrics in Google Analytics to optimize ad spend ROI by 28%.`,
      ];
    // Software
    } else if (title.includes("software") || title.includes("developer") || title.includes("engineer") || title.includes("programmer") || title.includes("frontend") || title.includes("backend") || title.includes("full stack")) {
      fallbackBullets = [
        `Architected and deployed responsive full-stack features, reducing API response times by 38% and supporting 50K+ active users.`,
        `Refactored mission-critical backend microservices, eliminating technical debt and increasing system reliability to 99.95%.`,
        `Collaborated in agile sprint cycles with cross-functional teams, shipping key product milestones 2 weeks ahead of schedule.`,
      ];
    // Healthcare
    } else if (title.includes("nurse") || title.includes("medical") || title.includes("healthcare") || title.includes("clinic") || title.includes("patient")) {
      fallbackBullets = [
        `Administered compassionate, high-quality patient care and monitored vital signs for 15+ acute care patients per shift.`,
        `Maintained meticulous electronic health records (EHR) in strict compliance with HIPAA and clinical quality standards.`,
        `Collaborated with interdisciplinary healthcare teams to develop and execute personalized patient recovery plans.`,
      ];
    // Warehouse
    } else if (title.includes("warehouse") || title.includes("logistics") || title.includes("forklift") || title.includes("shipping") || title.includes("inventory")) {
      fallbackBullets = [
        `Processed and staged 350+ shipments daily with a 99.8% order accuracy rate using handheld RF barcode scanners.`,
        `Operated forklift and pallet machinery safely, completing 500+ consecutive days with zero safety infractions.`,
        `Streamlined inbound inventory receiving workflows, reducing average dock-to-stock turnaround time by 25%.`,
      ];
    // Manager
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

    // Filter out any fallback that is identical to an existing bullet
    const filteredFallback = fallbackBullets.filter((b) => !existing.includes(b));
    const finalFallback = filteredFallback.length >= 2 ? filteredFallback : fallbackBullets;

    res.status(500).json({
      error: error.message || "Failed to generate bullet points with AI",
      fallbackBullets: finalFallback,
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

// 4. Suggest skills strictly aligned with summary and job history
app.post("/api/suggest-skills", async (req, res) => {
  try {
    const { targetRole, summary, experiences, currentSkills } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are a premier career architect and ATS resume skills optimizer.
Analyze this candidate's target role, professional summary, and full work experience history.
Task: Extract, generate, and recommend 10-14 relevant, highly accurate skills (technical/hard skills, tools/equipment/platforms, and core domain competencies) that STRICTLY ALIGN with their actual job background, summary, and industry.

Candidate Target Role / Title: "${targetRole || "Professional"}"
Candidate Summary: "${summary || "None provided"}"
Candidate Work Experience Entries:
${JSON.stringify(experiences || [], null, 2)}
${currentSkills && currentSkills.length > 0 ? `Current Skill List (for reference): ${JSON.stringify(currentSkills)}` : ""}

CRITICAL ALIGNMENT & EXTRACTION RULES:
1. STRICT ALIGNMENT WITH SUMMARY & WORK EXPERIENCE:
   - Carefully analyze the candidate's summary and every job role, company, duty description, and bullet point.
   - The generated skills MUST directly reflect and align with the specific tasks, tools, procedures, methodologies, and responsibilities mentioned in their summary and experience.
   - For Food Service / Restaurant / Kitchen (e.g. Cook, Line Cook, Prep, Chef, Grill):
     * Skills MUST focus on: Food Safety (ServSafe/HACCP), Culinary Prep & Knife Skills, Station Management (Grill/Fryer/Assembly), Recipe Adherence & Portion Control, Kitchen Sanitation, Ticket Execution Speed, Inventory & Restocking.
   - For Cashier / Retail / Fast Food Counter:
     * Skills MUST focus on: POS Systems (NCR, Aloha, Square), Cash Handling & Drawer Balancing, Customer Service Excellence, Order Accuracy & Speed, Upselling & Promotions, Stock Replenishment.
   - For Barista / Coffee:
     * Skills MUST focus on: Espresso Beverage Preparation, Latte Art & Steaming, Grinder Calibration, Order Expediting, Dairy & Food Temperature Standards.
   - For Customer Service / Support:
     * Skills MUST focus on: CRM Software (Zendesk, Salesforce), Omnichannel Support (Phone/Email/Chat), Ticket Resolution & SLAs, De-escalation & Conflict Resolution, Customer Empathy.
   - For Healthcare / Nursing / Medical:
     * Skills MUST focus on: Electronic Health Records (EHR/Epic/Cerner), Patient Vital Monitoring, Medication Administration, HIPAA Compliance, Triage & Assessment, Patient Care.
   - For Warehouse / Logistics / Driver:
     * Skills MUST focus on: Forklift Operation (OSHA), RF Barcode Scanning, Order Picking & Packing, Inventory Management (WMS), Route Navigation, Shipping & Receiving.
   - For Tech / Software / IT:
     * Skills MUST reflect the actual languages, frameworks, cloud tools, databases, and CI/CD tools mentioned in their experience (e.g. React, Node.js, Go, Python, AWS, Docker, REST/GraphQL, Agile/Scrum).
   - For Management / Leadership:
     * Skills MUST focus on: Team Leadership & Coaching, Shift Scheduling, KPI & Performance Tracking, Labor Cost Optimization, Workflow Improvement.

2. ACCURACY CONSTRAINT:
   - NEVER suggest unrelated skills (e.g., do NOT give software programming skills to a restaurant cook or cashier, and do NOT give kitchen culinary skills to a software developer).
   - Prioritize high-value ATS industry keywords.
   - Return concise 1-4 word skill phrases.`;

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
    const combinedContext = `${req.body.targetRole || ""} ${req.body.summary || ""} ${JSON.stringify(req.body.experiences || "")}`.toLowerCase();
    
    // Domain-aware fallback matching
    if (combinedContext.includes("cook") || combinedContext.includes("chef") || combinedContext.includes("grill") || combinedContext.includes("prep") || combinedContext.includes("kitchen") || combinedContext.includes("culinary")) {
      res.status(500).json({
        technicalSkills: ["Food Safety (ServSafe/HACCP)", "Grill & Fry Station Operations", "Recipe Adherence & Portioning"],
        toolsAndPlatforms: ["Commercial Kitchen Equipment", "Temperature Logging Systems", "Order Ticket POS"],
        coreCompetencies: ["Ticket Execution Speed", "Kitchen Sanitation", "Inventory Restocking", "Teamwork Under Pressure"],
      });
    } else if (combinedContext.includes("cashier") || combinedContext.includes("cahsier") || combinedContext.includes("mcdonad") || combinedContext.includes("counter") || combinedContext.includes("drive-thru")) {
      res.status(500).json({
        technicalSkills: ["POS Systems (NCR/Aloha)", "Cash Handling & Drawer Balancing", "Food Safety Standards"],
        toolsAndPlatforms: ["Drive-Thru Communication Headsets", "Debit/Credit Payment Terminals", "Inventory Checkers"],
        coreCompetencies: ["Customer Service Excellence", "Speed of Service", "Order Accuracy", "Upselling Promotions", "Conflict Resolution"],
      });
    } else if (combinedContext.includes("retail") || combinedContext.includes("store") || combinedContext.includes("merchandis")) {
      res.status(500).json({
        technicalSkills: ["POS Checkout Systems", "Visual Merchandising", "Inventory Audits & Restocking"],
        toolsAndPlatforms: ["Barcode Scanners", "Stockroom Management Tools", "Card Readers"],
        coreCompetencies: ["Customer Engagement", "Product Knowledge", "Sales Floor Organization", "Loss Prevention"],
      });
    } else if (combinedContext.includes("support") || combinedContext.includes("customer service") || combinedContext.includes("call center")) {
      res.status(500).json({
        technicalSkills: ["Ticket Resolution & SLAs", "Omnichannel Customer Support", "Issue Troubleshooting"],
        toolsAndPlatforms: ["Zendesk / Salesforce CRM", "Intercom", "VoIP Phone Systems"],
        coreCompetencies: ["Customer Empathy", "De-escalation Techniques", "Written Communication", "Process Documentation"],
      });
    } else if (combinedContext.includes("software") || combinedContext.includes("developer") || combinedContext.includes("engineer")) {
      res.status(500).json({
        technicalSkills: ["Full-Stack Web Development", "REST & GraphQL APIs", "Microservices Architecture"],
        toolsAndPlatforms: ["TypeScript / React / Node.js", "Docker & Kubernetes", "Git & CI/CD Pipelines"],
        coreCompetencies: ["System Design", "Code Review & Quality", "Agile/Scrum Methodologies", "Performance Optimization"],
      });
    } else if (combinedContext.includes("nurse") || combinedContext.includes("medical") || combinedContext.includes("patient")) {
      res.status(500).json({
        technicalSkills: ["Patient Vital Monitoring", "Medication Administration", "HIPAA & Clinical Compliance"],
        toolsAndPlatforms: ["Electronic Health Records (Epic/Cerner)", "Medical Diagnostic Equipment"],
        coreCompetencies: ["Patient Care & Advocacy", "Triage & Emergency Response", "Interdisciplinary Communication"],
      });
    } else {
      res.status(500).json({
        technicalSkills: ["Operational Workflow Management", "Process Optimization", "Performance Analytics"],
        toolsAndPlatforms: ["MS Office Suite", "Google Workspace", "Slack / Project Management Tools"],
        coreCompetencies: ["Cross-Functional Collaboration", "Problem Solving", "Quality Assurance", "Time Management"],
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
