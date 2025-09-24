// netlify/functions/ai.js
// Node 18+ syntax supported by Netlify. This example uses Google Generative API style.
// If you're using the real Google SDK, adapt to the SDK shape you used previously.
// This example uses a simple fetch to the hypothetical endpoint for clarity.

const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in environment variables" }),
      };
    }

    // helper to call the generative API (adapt to your SDK)
    async function callGenerative(prompt) {
      // Example: If you have a wrapper library, use it. Here we use a generic fetch as placeholder.
      // You must adapt endpoint + headers to whatever you used successfully earlier.
      const res = await fetch("https://api.openai-compatible-or-google-gemini-endpoint.example/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt, max_tokens: 1200 }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI request failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      // adjust for your provider's shape
      return (data.result && (data.result.content || data.result.text)) || JSON.stringify(data);
    }

    let prompt = "";
    if (action === "find_jobs") {
      prompt = `You are an expert job-sourcing assistant. Given resume text and a query, return a JSON array of up to 10 entry-level job suggestions. 
Resume: ${payload.resume_text || ""} 
Query: ${payload.query || ""} 
Return JSON array like [{title, company, ats, stage, date}, ...].`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "optimize_resume") {
      prompt = `You are an ATS resume expert. Optimize the following resume text for entry-level job applications. Provide output as JSON: { "optimized": "...", "score": 0-100 }. Resume:\n${payload.resume_text || ""}`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "generate_cover_letter") {
      prompt = `Write a concise professional cover letter for this job and this resume. Job: ${JSON.stringify(payload.job || {})}\nResume: ${payload.resume_text || ""}\nReturn plain text.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "generate_lesson") {
      prompt = `Generate a 10-20 minute micro-lesson (outline + steps + short practice) to improve skill: ${payload.skill}`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "mock_interview") {
      prompt = `Act as an interviewer for the role: ${payload.role}. Generate 5 realistic interview questions in JSON: { "questions": [ ... ] }`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "interview_feedback") {
      prompt = `Question: ${payload.question}\nCandidate Answer: ${payload.answer}\nProvide constructive feedback and a 3-point improvement plan. Return plain text.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "side_hustles") {
      prompt = `Suggest 5 freelance side hustles for a person with profile: ${payload.profile}. Return JSON array of {title, desc, pay}.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    // NEW: create_resume from profile
    if (action === "create_resume") {
      // payload.profile = { name, title, summary, education, experience, skills }
      const p = payload.profile || {};
      prompt = `You are an expert resume writer. Create a professional, ATS-friendly resume (plain text) using this profile. Include: name, title, contact line (placeholder), summary/profile, skills (comma separated), education (formatted), experience (bullet points showing measurable impact). Output only the resume text. Use concise, achievement-focused language.\n\nProfile:\n${JSON.stringify(p, null, 2)}`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (err) {
    console.error("AI function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", details: err.message }) };
  }
};
