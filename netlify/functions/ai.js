// netlify/functions/ai.js
// Uses global fetch (Node 18+ / Netlify environment) — no node-fetch required.
// Adjust the generative API call to match your working provider's endpoint/shape.

exports.handler = async function (event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, payload } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    // helper using global fetch
    async function callGenerative(prompt, maxTokens = 1200) {
      // === IMPORTANT ===
      // Replace the URL + request shape below with the exact endpoint & body your provider expects.
      // Example below is a generic POST that sends { prompt } and expects JSON { text: "..." }.
      const endpoint = process.env.GENERATIVE_API_URL || "https://your-gemini-or-openai-endpoint.example/v1/generate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt, max_tokens: maxTokens }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI request failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Try to return common shapes; adapt to your provider if different
      if (data.result) return typeof data.result === "string" ? data.result : JSON.stringify(data.result);
      if (data.text) return data.text;
      if (data.output?.text) return data.output.text;
      return JSON.stringify(data);
    }

    let prompt = "";
    if (action === "find_jobs") {
      prompt = `You are a job-sourcing assistant. Resume: ${payload.resume_text || ""}\nQuery: ${payload.query || ""}\nReturn a JSON array of jobs with fields: title, company, ats (number), stage, date.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "optimize_resume") {
      prompt = `You are an ATS resume expert. Optimize the following resume text. Return JSON: { "optimized": "...", "score": 0-100 }.\n\nResume:\n${payload.resume_text || ""}`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "generate_cover_letter") {
      prompt = `Write a concise professional cover letter for this job:\n${JSON.stringify(payload.job || {})}\nResume:\n${payload.resume_text || ""}\nReturn plain text.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "generate_lesson") {
      prompt = `Generate a 10-20 minute micro-lesson for skill: ${payload.skill}`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "mock_interview") {
      prompt = `Act as an interviewer for role: ${payload.role}. Return JSON: { "questions": [ ... ] }`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "interview_feedback") {
      prompt = `Question: ${payload.question}\nCandidate Answer: ${payload.answer}\nGive feedback and 3 improvements.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "side_hustles") {
      prompt = `Suggest 5 side hustles for profile: ${payload.profile}. Return JSON array of { title, desc, pay }.`;
      const result = await callGenerative(prompt);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    if (action === "create_resume") {
      const p = payload.profile || {};
      prompt = `You are an expert resume writer. Create an ATS-friendly resume (plain text) using profile: ${JSON.stringify(p)}. Output only resume text.`;
      const result = await callGenerative(prompt, 1400);
      return { statusCode: 200, body: JSON.stringify({ result }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (err) {
    console.error("AI function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", details: err.message }) };
  }
};

