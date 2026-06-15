import { db } from "@/lib/db";
import { cvData } from "@/lib/schema";
import { getGroqClient } from "@/lib/ai";
import { normalizeParsedCV } from "@/lib/cv-types";

export async function parseCVWithAI(text: string, userId: string) {
  const prompt = `
    Analyze the following CV text and extract information in JSON format.
    The output must strictly follow this structure:
    {
      "skills": ["skill1", "skill2"],
      "experience": [{"role": "...", "company": "...", "duration": "..."}],
      "education": [{"degree": "...", "school": "..."}],
      "certifications": ["cert1"],
      "keywords": ["keyword1", "keyword2"]
    }

    CV TEXT:
    ${text}
  `;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const parsedData = normalizeParsedCV(JSON.parse(chatCompletion.choices[0].message.content || "{}"));
    const now = new Date();

    await db.insert(cvData).values({
      userId,
      fullText: text,
      skills: parsedData.skills,
      experience: parsedData.experience,
      education: parsedData.education,
      certifications: parsedData.certifications,
      keywords: parsedData.keywords,
      parsedAt: now,
    }).onConflictDoUpdate({
      target: cvData.userId,
      set: {
        fullText: text,
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education,
        certifications: parsedData.certifications,
        keywords: parsedData.keywords,
        parsedAt: now,
        updatedAt: now,
      }
    });

    return parsedData;
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
}
