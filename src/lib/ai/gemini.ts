import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '@/lib/env';
import { ClassificationResult, classifyWithRules } from '@/lib/domain/classifier-rules';
import { ComplaintCategory, Priority, DepartmentCode } from '@prisma/client';
import { getDepartmentForCategory } from '@/lib/domain/categories';

const classificationSchema = z.object({
  category: z.nativeEnum(ComplaintCategory),
  priority: z.nativeEnum(Priority),
  departmentCode: z.nativeEnum(DepartmentCode),
  explanation: z.string().min(5),
  signals: z.array(z.string()).default([]),
});

/**
 * Classifies a complaint using Gemini when GEMINI_API_KEY is available,
 * with an 8-second timeout budget and deterministic keyword rule fallback.
 */
export async function classifyComplaint(input: {
  title: string;
  description: string;
}): Promise<ClassificationResult> {
  const fallback = classifyWithRules(input);

  // If no Gemini API key configured, use deterministic rules immediately
  if (!env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';

    const prompt = `You are an expert municipal triage assistant for the city of Bengaluru, India.
Analyze this civic grievance and return a JSON classification with:
- category: one of [POTHOLES, ROAD_DAMAGE, TRAFFIC_INFRASTRUCTURE, WATER_LEAKAGE, GARBAGE_COLLECTION, PUBLIC_SANITATION, STREETLIGHT_FAILURE, DRAINAGE_PROBLEMS, PUBLIC_PROPERTY_DAMAGE, OTHER]
- priority: one of [LOW, MEDIUM, HIGH, CRITICAL]
- departmentCode: one of [ROADS, WATER, SANITATION, LIGHTING, DRAINAGE, GENERAL]
- explanation: concise 1-2 sentence rationale
- signals: array of key indicator phrases detected in the text

Complaint Title: ${input.title.slice(0, 120)}
Complaint Description: ${input.description.slice(0, 2000)}

Output must be raw JSON matching the schema without markdown tags.`;

    // 8-second time budget
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini classification timeout after 8000ms')), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = response.text?.trim() || '';

    // Validate structured response
    const parsed = JSON.parse(responseText);
    const validated = classificationSchema.parse(parsed);

    // Ensure department code matches category mapping
    const expectedDepartment = getDepartmentForCategory(validated.category);

    return {
      category: validated.category,
      priority: validated.priority,
      departmentCode: expectedDepartment,
      explanation: validated.explanation,
      source: 'GEMINI',
      signals: validated.signals,
    };
  } catch (error) {
    console.warn('Gemini classification failed or timed out, using rule-based fallback:', error);
    return fallback;
  }
}
