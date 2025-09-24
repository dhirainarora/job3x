// netlify/functions/ai.js
const axios = require("axios");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: JSON.stringify({ ok: true, message: "AI function alive" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { action, payload } = body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  async function geminiChat(prompt) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }
      );
      return res.data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(res.data);
    } catch (err) {
      console.error("Gemini API error", err.response?.data || err.message);
      throw err;
    }
  }

  try {
    let prompt = "";
    if (action === "optimize_resume") {
      prompt = `Optimize this resume for ATS. Return JSON: { "optimized": "...", "score": 0-100 }. Resume:\n${payload.resume_text || ""}`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    if (action === "generate_cover_letter") {
      prompt = `Write a cover letter for this job: ${JSON.stringify(payload.job)} using resume:\n${payload.resume_text || ""}`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    if (action === "generate_lesson") {
      prompt = `Make a micro-lesson for learning ${payload.skill}. Include steps and an exercise.`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    if (action === "mock_interview") {
      prompt = `Generate 8 interview questions for ${payload.role || "software engineer"}. Return JSON: { "questions": [ ... ] }`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    if (action === "interview_feedback") {
      prompt = `Give feedback on this answer. Q: ${payload.question} A: ${payload.answer}. Return 3 improvement tips.`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    if (action === "side_hustles") {
      prompt = `Suggest 6 online side hustles for ${payload.profile}. Return JSON: { "gigs": [ { "title": "...", "desc": "..." } ] }`;
      return { statusCode: 200, body: JSON.stringify({ result: await geminiChat(prompt) }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "AI call failed", detail: err.message || String(err) }) };
  }
};
