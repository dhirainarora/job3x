import { GoogleGenerativeAI } from "@google/generative-ai";

export async function handler(event) {
  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    // ✅ Read Gemini key from Netlify env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = "";

    if (action === "optimize_resume") {
      prompt = `You are an ATS resume expert. Optimize the following resume text for better job applications. Give ATS score (0-100) and optimized resume as JSON with keys "optimized" and "score". Resume:\n${payload.resume_text}`;
    } else if (action === "generate_cover_letter") {
      prompt = `Write a professional cover letter for this job:\n${JSON.stringify(payload.job)}\nResume:\n${payload.resume_text}`;
    } else if (action === "generate_lesson") {
      prompt = `Generate a 10–20 min micro-lesson to improve skill: ${payload.skill}`;
    } else if (action === "mock_interview") {
      prompt = `Act as an interviewer for the role: ${payload.role}. Generate 5 realistic interview questions in JSON array.`;
    } else if (action === "interview_feedback") {
      prompt = `Question: ${payload.question}\nCandidate Answer: ${payload.answer}\nGive constructive feedback.`;
    } else if (action === "side_hustles") {
      prompt = `Suggest 5 freelance side hustles for a person with profile: ${payload.profile}. Return JSON array of {title, pay, type}.`;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ result: text }),
    };

  } catch (err) {
    console.error("AI call failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI call failed", details: err.message }),
    };
  }
}
