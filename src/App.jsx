import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Rocket,
  UserCheck,
  Zap,
  Database,
  Briefcase,
  LayoutGrid,
  FileText,
  GitBranch,
} from "lucide-react";
import { auth, db, loginWithGoogle, logoutUser } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * src/App.jsx — CareerAI main app (full). 
 * Added feature: Create Resume (generate from profile form).
 * - Uses '/.netlify/functions/ai' for AI features (including create_resume).
 * - After generating, user can Download (.txt) or Open Printable (then print->Save PDF).
 */

export default function CareerAIPreview() {
  // UI state
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Jobs (dynamic: AI -> jobs)
  const [jobs, setJobs] = useState([]);

  // Resume & ATS
  const [resumeText, setResumeText] = useState("");
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  // Create Resume (form) state
  const [crName, setCrName] = useState("");
  const [crTitle, setCrTitle] = useState("");
  const [crSummary, setCrSummary] = useState("");
  const [crEducation, setCrEducation] = useState("");
  const [crExperience, setCrExperience] = useState("");
  const [crSkills, setCrSkills] = useState("");

  // Lessons & Interview
  const [lesson, setLesson] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  // Feature list for UI (kept visually same)
  const features = [
    {
      key: "navigator",
      title: "Career Path Navigator",
      desc: "Discover job paths from your degree + real market demand.",
      icon: Rocket,
      tab: "overview",
    },
    {
      key: "skillfix",
      title: "AI Skill Fixer",
      desc: "Micro-lessons that fill your exact skill gaps — learn in 10–30 min blocks.",
      icon: Zap,
      tab: "skills",
    },
    {
      key: "resume",
      title: "Resume + ATS Booster",
      desc: "Auto-tailor resumes for each job and hit 90+ ATS scores.",
      icon: FileText,
      tab: "resume",
    },
    {
      key: "autopilot",
      title: "Job Apply Autopilot",
      desc: "Set preferences and let AI apply to hundreds of matching roles.",
      icon: GitBranch,
      tab: "overview",
    },
    {
      key: "interview",
      title: "Interview Coach (Voice & Video)",
      desc: "Realistic mock interviews with instant feedback and improvement tips.",
      icon: UserCheck,
      tab: "interview",
    },
    {
      key: "hustles",
      title: "Side-Hustle Finder",
      desc: "Freelance gigs to start earning while you land your full-time role.",
      icon: Briefcase,
      tab: "hustles",
    },
  ];

  // Monitor Firebase auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // Fetch starter jobs on mount
  useEffect(() => {
    fetchJobs(); // initial load (AI or fallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user switches to overview, refresh jobs
  useEffect(() => {
    if (tab === "overview") {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Centralized AI call to serverless endpoint
  async function callAI(action, payload = {}) {
    setAiLoading(true);
    try {
      const res = await fetch("/.netlify/functions/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const json = await res.json();
      setAiLoading(false);
      return json;
    } catch (err) {
      setAiLoading(false);
      console.error("callAI error", err);
      return { error: err.message || String(err) };
    }
  }

  // ---------- JOBS ----------
  async function fetchJobs() {
    const payload = { resume_text: resumeText || "", query: search || "entry-level roles" };
    const ai = await callAI("find_jobs", payload);
    if (!ai) {
      showAlert("AI returned no response while fetching jobs.");
      setJobs(getFallbackJobs());
      return;
    }
    if (ai.error) {
      console.warn("AI error fetching jobs:", ai.error);
      setJobs(getFallbackJobs());
      return;
    }
    if (ai.result) {
      try {
        const parsed = JSON.parse(ai.result);
        if (Array.isArray(parsed)) {
          setJobs(parsed.map(normalizeJob));
          return;
        }
        if (parsed.jobs && Array.isArray(parsed.jobs)) {
          setJobs(parsed.jobs.map(normalizeJob));
          return;
        }
        if (parsed.title) {
          setJobs([normalizeJob(parsed)]);
          return;
        }
        const lines = String(ai.result).split("\n").filter(Boolean).slice(0, 10);
        setJobs(lines.map((l, i) => ({ id: i + 1, title: l, company: "", ats: randomAts(), stage: "Sourced", date: "" })));
        return;
      } catch {
        const lines = String(ai.result).split("\n").filter(Boolean).slice(0, 10);
        setJobs(lines.map((l, i) => ({ id: i + 1, title: l, company: "", ats: randomAts(), stage: "Sourced", date: "" })));
        return;
      }
    } else {
      setJobs(getFallbackJobs());
    }
  }

  function normalizeJob(j) {
    return {
      id: j.id || j.jobId || Math.random().toString(36).slice(2, 9),
      title: j.title || j.jobTitle || j.position || "Role",
      company: j.company || j.employer || j.organization || "",
      ats: j.ats !== undefined ? j.ats : j.score !== undefined ? j.score : randomAts(),
      stage: j.stage || j.status || "Sourced",
      date: j.date || j.posted || "",
    };
  }

  function getFallbackJobs() {
    return [
      { id: "f1", title: "Data-entry • Remote", company: "Remote Gigs", ats: 75, stage: "Sourced", date: "" },
      { id: "f2", title: "Website QA • Remote", company: "QA Hub", ats: 78, stage: "Sourced", date: "" },
      { id: "f3", title: "Junior Data Analyst", company: "Insight Labs", ats: 80, stage: "Sourced", date: "" },
    ];
  }

  function randomAts() {
    return Math.floor(Math.random() * 25) + 70;
  }

  // ---------- RESUME (optimize) ----------
  async function handleOptimizeResume() {
    if (!resumeText) {
      showAlert("Please upload or paste your resume text first.");
      return;
    }
    const ai = await callAI("optimize_resume", { resume_text: resumeText });
    if (!ai) {
      showAlert("AI returned no response for resume optimization.");
      return;
    }
    if (ai.error) {
      showAlert("AI error: " + ai.error);
      return;
    }
    if (ai.result) {
      try {
        const parsed = JSON.parse(ai.result);
        setOptimizedResume(parsed.optimized || parsed.optimized_text || ai.result);
        setAtsScore(parsed.score || parsed.ats || null);
      } catch {
        setOptimizedResume(ai.result);
        setAtsScore(null);
      }
      fetchJobs();
    } else {
      showAlert("AI did not return optimized resume.");
    }
  }

  async function handleGenerateCoverLetter(job) {
    if (!resumeText) {
      showAlert("Please add your resume text first so we can tailor the cover letter.");
      return;
    }
    const ai = await callAI("generate_cover_letter", { job, resume_text: resumeText });
    if (ai?.error) {
      showAlert("Error generating cover letter: " + ai.error);
      return;
    }
    if (ai?.result) {
      setCoverLetter(ai.result);
      setTab("resume");
    } else {
      showAlert("Cover letter generation failed.");
    }
  }

  // ---------- CREATE RESUME (new) ----------
  async function handleCreateResume() {
    // Build profile object
    const profile = {
      name: crName,
      title: crTitle,
      summary: crSummary,
      education: crEducation,
      experience: crExperience,
      skills: crSkills,
    };

    // validation
    if (!crName || !crSkills) {
      showAlert("Please provide at least your name and skills (skills help AI generate a relevant resume).");
      return;
    }

    const ai = await callAI("create_resume", { profile });
    if (ai?.error) {
      showAlert("Resume generation failed: " + ai.error);
      return;
    }
    if (ai?.result) {
      // AI should return a plaintext resume. We'll set optimizedResume to that
      setOptimizedResume(ai.result);
      setAtsScore(null);
      // switch to resume view so user can see/download
      setTab("resume");
    } else {
      showAlert("No resume returned from AI.");
    }
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openPrintableResume(content) {
    const html = `
      <html>
        <head>
          <title>Resume</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color:#111; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; }
          </style>
        </head>
        <body>
          <pre>${escapeHtml(content)}</pre>
          <script>setTimeout(()=>window.print(), 300);</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) {
      showAlert("Popup blocked. Allow popups to print/save as PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  // ---------- AUTOPILOT ----------
  async function handleApplyAutopilot() {
    if (!user) {
      const ok = confirm("You need to sign in to save applications. Sign in now?");
      if (ok) loginWithGoogle();
      return;
    }

    if (!jobs || jobs.length === 0) {
      await fetchJobs();
    }
    if (!jobs || jobs.length === 0) {
      showAlert("No jobs to apply to yet — try 'Find Hustles' or open Overview");
      return;
    }

    const toApply = jobs.slice(0, 10);
    for (const job of toApply) {
      const gen = await callAI("generate_cover_letter", { job, resume_text: resumeText });
      const letter = gen?.result || "Auto-generated cover letter";
      try {
        await addDoc(collection(db, "applications"), {
          userId: user.uid,
          job,
          coverLetter: letter,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Firestore save failed", err);
      }
    }
    alert("Autopilot finished — applications saved to your account.");
    fetchJobs();
  }

  // ---------- LESSON ----------
  async function handleGenerateLesson(skill) {
    const ai = await callAI("generate_lesson", { skill });
    if (ai?.error) {
      showAlert("Failed to generate lesson: " + ai.error);
      return;
    }
    if (ai?.result) {
      setLesson(ai.result);
      setTab("skills");
    } else {
      showAlert("Lesson generation returned nothing.");
    }
  }

  // ---------- INTERVIEW ----------
  async function handleStartMockInterview(role = "Full-stack recruiter simulation") {
    const ai = await callAI("mock_interview", { role });
    if (ai?.error) {
      showAlert("Failed to start mock interview: " + ai.error);
      return;
    }
    if (ai?.result) {
      try {
        const parsed = JSON.parse(ai.result);
        setInterviewQuestions(parsed.questions || parsed || []);
      } catch {
        setInterviewQuestions(String(ai.result).split("\n").filter(Boolean));
      }
      setCurrentQuestionIdx(0);
      setTab("interview");
    } else {
      showAlert("Mock interview returned no questions.");
    }
  }

  async function handleSubmitInterviewAnswer() {
    const question = interviewQuestions[currentQuestionIdx];
    if (!question) {
      showAlert("No question available.");
      return;
    }
    const ai = await callAI("interview_feedback", { question, answer: userAnswer });
    if (ai?.error) {
      showAlert("Feedback error: " + ai.error);
      return;
    }
    if (ai?.result) {
      setInterviewFeedback(ai.result);
      setUserAnswer("");
      setCurrentQuestionIdx((i) => Math.min(i + 1, interviewQuestions.length - 1));
    } else {
      showAlert("Feedback generation failed.");
    }
  }

  // ---------- SIDE HUSTLES ----------
  async function handleFindSideHustles() {
    const ai = await callAI("side_hustles", { profile: user?.email || "student" });
    if (ai?.error) {
      showAlert("Failed to find hustles: " + ai.error);
      setGigs([]);
      return;
    }
    if (ai?.result) {
      try {
        const parsed = JSON.parse(ai.result);
        setGigs(parsed.gigs || parsed || []);
      } catch {
        setGigs(String(ai.result).split("\n").filter(Boolean));
      }
      setTab("hustles");
    } else {
      setGigs([]);
      showAlert("No hustles returned.");
    }
  }

  // ---------- HELPERS ----------
  function handleResumeFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(String(ev.target.result || ""));
    reader.onerror = () => showAlert("Failed to read file. Try pasting text instead.");
    reader.readAsText(file);
  }

  function showAlert(msg) {
    try {
      alert(msg);
    } catch (e) {
      console.error("Alert failed:", e);
    }
  }

  function renderJobCard(j, idx) {
    const title = j.title || `Role ${idx + 1}`;
    const company = j.company || "";
    const date = j.date || "";
    const ats = j.ats !== undefined ? j.ats : j.score !== undefined ? j.score : randomAts();
    return (
      <div key={j.id ?? idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-slate-400">{company} {date ? `• ${date}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">ATS</p>
          <p className={`font-semibold ${ats > 85 ? "text-emerald-600" : ats > 75 ? "text-amber-600" : "text-rose-600"}`}>{ats}%</p>
        </div>
      </div>
    );
  }

  async function onFeatureClick(feature) {
    if (!feature) return;
    setTab(feature.tab || "overview");
    if (feature.key === "navigator") {
      await fetchJobs();
    } else if (feature.key === "skillfix") {
      await handleGenerateLesson("Communication for interviews");
    } else if (feature.key === "resume") {
      // open resume tab; no extra
    } else if (feature.key === "autopilot") {
      if (!user) {
        if (confirm("Sign in to use Apply Autopilot?")) loginWithGoogle();
      } else {
        handleApplyAutopilot();
      }
    } else if (feature.key === "interview") {
      handleStartMockInterview();
    } else if (feature.key === "hustles") {
      handleFindSideHustles();
    }
  }

  function onStartFree() {
    setTab("overview");
    fetchJobs();
    window.scrollTo({ top: 300, behavior: "smooth" });
  }
  function onSeeDemo() {
    setTab("skills");
    handleGenerateLesson("SQL Fundamentals");
  }

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* NAV */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <Rocket className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl">CareerAI</h1>
            <p className="text-xs text-slate-400">AI Job Accelerator — land jobs faster</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <button onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })} className="text-sm px-3 py-2 rounded-md hover:bg-slate-100">Features</button>
          <button onClick={() => window.scrollTo({ top: 1400, behavior: "smooth" })} className="text-sm px-3 py-2 rounded-md hover:bg-slate-100">Pricing</button>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
              <div className="text-sm">{user.displayName || user.email}</div>
              <button onClick={() => logoutUser()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95">Sign out</button>
            </div>
          ) : (
            <button onClick={() => loginWithGoogle()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95">Sign in</button>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="text-4xl md:text-5xl font-bold leading-tight">
            Stuck after college or can’t land a job? <span className="text-indigo-600">CareerAI</span> gets you hired — fast.
          </motion.h2>
          <motion.p className="mt-4 text-slate-600 max-w-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            From discovering career paths, fixing skill gaps with micro-lessons, auto-optimizing resumes for ATS, to mock interviews — CareerAI automates the entire job hunt.
          </motion.p>

          <div className="mt-6 flex gap-3">
            <button onClick={onStartFree} className="px-6 py-3 rounded-md bg-indigo-600 text-white font-medium shadow hover:scale-[1.01]">Start Free</button>
            <button onClick={onSeeDemo} className="px-6 py-3 rounded-md border border-slate-200 text-slate-700">See Demo</button>
          </div>

          <div className="mt-8 bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-md bg-white shadow-sm">
                <CheckCircle className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Success story</p>
                <p className="text-sm font-semibold">"Landed a job in 3 weeks with CareerAI" — Ayesha, 2025 grad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Right: Quick Dashboard Mock (dynamic) */}
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">Active Applications</p>
              <h3 className="font-semibold">{jobs.length ? jobs.length : "—"} in progress</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Next Mock</p>
              <p className="font-semibold">Sep 25, 2025</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {jobs && jobs.length > 0 ? (
              jobs.slice(0, 3).map((j, idx) => renderJobCard(j, idx))
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium">Discovering roles…</p>
                  <p className="text-xs text-slate-400">Matching to your profile</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">ATS</p>
                  <p className="font-semibold text-amber-600">—</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => setTab("overview")} className="flex-1 py-2 rounded-md bg-indigo-600 text-white">Open Dashboard</button>
            <button onClick={() => { if (!user) return alert("Sign in to export"); alert("Export is not implemented yet"); }} className="py-2 px-3 rounded-md border">Export</button>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-8">
        <h3 className="text-2xl font-bold">What CareerAI does differently</h3>
        <p className="text-slate-500 mt-2 max-w-2xl">An end-to-end AI job accelerator built for college grads and anyone struggling to find a role.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.key} whileHover={{ y: -6 }} onClick={() => onFeatureClick(f)} className="cursor-pointer select-none bg-white border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-50">
                    <Icon className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{f.title}</h4>
                    <p className="text-sm text-slate-500">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PROMINENT CTA */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-indigo-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Ready to stop applying aimlessly?</h3>
            <p className="text-slate-100 mt-2">Let AI apply, train and coach you — so you only interview where you’ll win.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onStartFree} className="bg-white text-indigo-700 px-5 py-3 rounded-md font-semibold">Start Free</button>
            <button onClick={() => alert("Book demo coming soon")} className="border border-white px-5 py-3 rounded-md">Book Demo</button>
          </div>
        </div>
      </section>

      {/* DASHBOARD + TABS */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="col-span-1 bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Welcome</p>
                <p className="font-semibold">{user?.displayName || "Dhirain"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Streak</p>
                <p className="font-semibold">7 🔥</p>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              <button onClick={() => setTab("overview")} className={`w-full text-left p-2 rounded-md ${tab === "overview" ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><LayoutGrid className="text-indigo-600"/><span>Overview</span></div>
              </button>
              <button onClick={() => setTab("resume")} className={`w-full text-left p-2 rounded-md ${tab === "resume" ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><FileText className="text-indigo-600"/><span>Resume</span></div>
              </button>
              <button onClick={() => setTab("skills")} className={`w-full text-left p-2 rounded-md ${tab === "skills" ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Database className="text-indigo-600"/><span>Skills</span></div>
              </button>
              <button onClick={() => setTab("interview")} className={`w-full text-left p-2 rounded-md ${tab === "interview" ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><UserCheck className="text-indigo-600"/><span>Interview</span></div>
              </button>
              <button onClick={() => setTab("hustles")} className={`w-full text-left p-2 rounded-md ${tab === "hustles" ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Briefcase className="text-indigo-600"/><span>Side Hustles</span></div>
              </button>
            </nav>

            <div className="mt-6 text-xs text-slate-400">
              <p>Account: Free</p>
              <p>Applications: 12 this month</p>
            </div>

            <div className="mt-4">
              <button onClick={handleApplyAutopilot} className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? "Applying..." : "Apply Autopilot"}</button>
            </div>
          </aside>

          <main className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              {tab === "overview" && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Overview</h4>
                    <div className="flex items-center gap-2">
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs, skills..." className="px-3 py-2 border rounded-md text-sm" />
                      <button onClick={fetchJobs} className="px-3 py-2 rounded-md border">{aiLoading ? "Searching..." : "Filter"}</button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Active</p>
                      <p className="font-semibold text-lg">{jobs.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Avg ATS Score</p>
                      <p className="font-semibold text-lg">{jobs.length ? `${Math.round(jobs.reduce((a, b) => a + (b.ats || b.score || 80), 0) / jobs.length)}%` : "—"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Skill Progress</p>
                      <p className="font-semibold text-lg">40%</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="font-semibold">Recent Applications</h5>
                    <div className="mt-3 space-y-3">
                      {jobs.length > 0 ? jobs.slice(0, 6).map((j, i) => (
                        <div key={j.id ?? i} className="p-3 rounded-lg flex items-center justify-between bg-slate-50">
                          <div>
                            <p className="font-medium">{j.title}</p>
                            <p className="text-xs text-slate-400">{j.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{j.stage || "Sourced"}</p>
                            <p className={`font-semibold ${((j.ats || j.score || 0) > 85) ? "text-emerald-600" : ((j.ats || j.score || 0) > 75) ? "text-amber-600" : "text-rose-600"}`}>{j.ats || j.score || "—"}%</p>
                          </div>
                        </div>
                      )) : <p className="text-slate-400">No recent applications yet — try Optimize Resume or Find Hustles.</p>}
                    </div>
                  </div>
                </div>
              )}

              {tab === "resume" && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Resume + ATS Booster</h4>
                    <div className="text-sm text-slate-400">Upload → Optimize → Score • Or create a resume from profile</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload / Paste */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Uploaded Resume</p>
                      <div className="mt-2 p-3 bg-white rounded-md border">
                        {resumeText ? (
                          <pre className="text-xs max-h-40 overflow-auto">{resumeText.slice(0, 400)}{resumeText.length > 400 ? "..." : ""}</pre>
                        ) : (
                          <div className="space-y-2">
                            <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleResumeFile} />
                            <p className="text-xs text-slate-400">Or paste resume text below</p>
                            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="w-full mt-2 p-2 border rounded-md h-28" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ATS score + Optimize + Create Resume Form */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Current ATS Score</p>
                      <p className="font-bold text-3xl mt-2">{atsScore || "—"}</p>
                      <p className="text-sm text-slate-500 mt-2">Suggested fixes: add keywords "SQL", "Data Analysis" • shorten experience lines</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={handleOptimizeResume} className="px-3 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? "Working..." : "Auto-Optimize"}</button>
                        <button onClick={() => alert("View suggestions — will open a detailed modal in future iterations")} className="px-3 py-2 border rounded-md">View Suggestions</button>
                        <button onClick={() => { if (!jobs.length) fetchJobs(); else setTab("overview"); }} className="px-3 py-2 border rounded-md">Refresh Jobs</button>
                      </div>
                    </div>
                  </div>

                  {/* Create Resume from Profile */}
                  <div className="mt-6 bg-white border rounded-md p-4">
                    <h5 className="font-semibold">Create Resume from Profile</h5>
                    <p className="text-sm text-slate-500">If you don't have a resume, fill this quick form and let AI generate a professional resume for you.</p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={crName} onChange={(e) => setCrName(e.target.value)} placeholder="Full name" className="p-2 border rounded-md" />
                      <input value={crTitle} onChange={(e) => setCrTitle(e.target.value)} placeholder="Desired title (e.g., Junior Data Analyst)" className="p-2 border rounded-md" />
                      <textarea value={crSummary} onChange={(e) => setCrSummary(e.target.value)} placeholder="Short summary (optional)" className="p-2 border rounded-md md:col-span-2" />
                      <textarea value={crEducation} onChange={(e) => setCrEducation(e.target.value)} placeholder="Education (degree, college, year)" className="p-2 border rounded-md" />
                      <textarea value={crExperience} onChange={(e) => setCrExperience(e.target.value)} placeholder="Experience / projects (comma or newline separated)" className="p-2 border rounded-md" />
                      <input value={crSkills} onChange={(e) => setCrSkills(e.target.value)} placeholder="Skills (comma separated: SQL, Python, Excel)" className="p-2 border rounded-md" />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={handleCreateResume} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? "Generating..." : "Generate Resume"}</button>
                      <button onClick={() => { setCrName(""); setCrTitle(""); setCrSummary(""); setCrEducation(""); setCrExperience(""); setCrSkills(""); }} className="px-4 py-2 border rounded-md">Reset</button>
                    </div>

                    {optimizedResume && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <h6 className="font-semibold">Generated Resume</h6>
                          <div className="flex gap-2">
                            <button onClick={() => downloadTextFile("resume.txt", optimizedResume)} className="px-3 py-1 border rounded-md">Download (.txt)</button>
                            <button onClick={() => openPrintableResume(optimizedResume)} className="px-3 py-1 bg-indigo-600 text-white rounded-md">Open Printable</button>
                          </div>
                        </div>
                        <pre className="text-xs mt-2 max-h-56 overflow-auto">{optimizedResume}</pre>
                      </div>
                    )}
                  </div>

                  {coverLetter && (
                    <div className="mt-4 p-4 bg-white border rounded-md">
                      <h5 className="font-semibold">Generated Cover Letter</h5>
                      <pre className="text-xs mt-2 max-h-56 overflow-auto">{coverLetter}</pre>
                    </div>
                  )}
                </div>
              )}

              {tab === "skills" && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Skill Fixer</h4>
                    <div className="text-sm text-slate-400">Micro-lessons • 10–30 min</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">SQL Fundamentals</p>
                      <p className="text-xs text-slate-400">Progress: 20%</p>
                      <div className="mt-3">
                        <button onClick={() => handleGenerateLesson("SQL Fundamentals")} className="px-3 py-1 rounded-md border">Start Lesson</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Excel for Analysts</p>
                      <p className="text-xs text-slate-400">Progress: 10%</p>
                      <div className="mt-3">
                        <button onClick={() => handleGenerateLesson("Excel for Analysts")} className="px-3 py-1 rounded-md border">Start Lesson</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Communication: Answers</p>
                      <p className="text-xs text-slate-400">Progress: 50%</p>
                      <div className="mt-3">
                        <button onClick={() => handleGenerateLesson("Communication for interviews")} className="px-3 py-1 rounded-md border">Start Lesson</button>
                      </div>
                    </div>
                  </div>

                  {lesson && (
                    <div className="mt-4 p-4 bg-white border rounded-md">
                      <h5 className="font-semibold">Lesson</h5>
                      <div className="text-sm mt-2 max-h-48 overflow-auto">{lesson}</div>
                    </div>
                  )}
                </div>
              )}

              {tab === "interview" && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Interview Coach</h4>
                    <div className="text-sm text-slate-400">Mock interviews • Voice & Video</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Next Mock</p>
                      <p className="text-xs text-slate-400">Full-stack recruiter simulation • Sep 25, 2025</p>
                      <div className="mt-3">
                        <button onClick={() => handleStartMockInterview()} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? "Starting..." : "Start Mock"}</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Feedback Snapshot</p>
                      <p className="text-xs text-slate-400 mt-2">Tone: Improve • Keywords: missing</p>
                      <div className="mt-2 text-sm text-slate-500">Suggested: add examples, highlight results.</div>
                    </div>
                  </div>

                  {interviewQuestions.length > 0 && (
                    <div className="mt-4 p-4 bg-white border rounded-md">
                      <h5 className="font-semibold">Mock Interview</h5>
                      <div className="mt-2">
                        <p className="font-medium">Q: {interviewQuestions[currentQuestionIdx]}</p>
                        <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full mt-2 p-2 border rounded-md h-28" />
                        <div className="mt-2 flex gap-2">
                          <button onClick={handleSubmitInterviewAnswer} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Submit Answer</button>
                          <button onClick={() => setCurrentQuestionIdx(i => Math.min(i + 1, interviewQuestions.length - 1))} className="px-3 py-2 border rounded-md">Skip</button>
                        </div>
                        {interviewFeedback && (
                          <div className="mt-3 bg-slate-50 p-3 rounded-md">
                            <p className="font-semibold">Feedback</p>
                            <div className="text-sm mt-2">{interviewFeedback}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "hustles" && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Side-Hustle Finder</h4>
                    <div className="text-sm text-slate-400">Freelance gigs matched to your profile</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Data-entry • Remote</p>
                          <p className="text-xs text-slate-400">Est. pay: $120/week</p>
                        </div>
                        <div>
                          <button className="px-3 py-1 rounded-md border">Apply</button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Website QA • Remote</p>
                          <p className="text-xs text-slate-400">Est. pay: $160/week</p>
                        </div>
                        <div>
                          <button className="px-3 py-1 rounded-md border">Apply</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button onClick={handleFindSideHustles} className="px-3 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? "Finding..." : "Find More Hustles"}</button>
                  </div>

                  {gigs.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-semibold">Recommended</h5>
                      <ul className="mt-2 space-y-2">
                        {gigs.map((g, idx) => (
                          <li key={idx} className="p-2 bg-white border rounded-md flex items-center justify-between">
                            <div>
                              <p className="font-medium">{g.title || g}</p>
                              <p className="text-xs text-slate-400">{g.desc || ""}</p>
                            </div>
                            <div>
                              <button className="px-3 py-1 rounded-md border">Apply</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary panels */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border rounded-lg shadow-sm">
                <p className="text-xs text-slate-400">Community Challenge</p>
                <p className="font-semibold mt-2">Interview Sprint — 48h</p>
                <p className="text-xs text-slate-400 mt-2">Leaderboard: you - #12</p>
              </div>
              <div className="p-4 bg-white border rounded-lg shadow-sm">
                <p className="text-xs text-slate-400">Recommended Learning</p>
                <p className="font-semibold mt-2">SQL for Beginners — 12 lessons</p>
              </div>
              <div className="p-4 bg-white border rounded-lg shadow-sm">
                <p className="text-xs text-slate-400">Quick Tip</p>
                <p className="font-semibold mt-2">Add numbers to your resume — hiring managers love metrics.</p>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold">Pricing</h3>
        <p className="text-slate-500 mt-2">Free, Pro and Premium plans designed for students and job-seekers.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-xl bg-white text-center">
            <p className="text-sm text-slate-400">Free</p>
            <p className="text-2xl font-bold mt-2">$0</p>
            <ul className="mt-4 text-sm space-y-2 text-slate-600">
              <li>Basic resume tools</li>
              <li>5 job applies/week</li>
              <li>Limited mock interviews</li>
            </ul>
            <div className="mt-4">
              <button className="px-4 py-2 border rounded-md">Get Started</button>
            </div>
          </div>

          <div className="p-6 border rounded-xl bg-white text-center shadow-md">
            <p className="text-sm text-slate-400">Pro</p>
            <p className="text-2xl font-bold mt-2">$29 / mo</p>
            <ul className="mt-4 text-sm space-y-2 text-slate-600">
              <li>Unlimited tailored resumes</li>
              <li>100 job applies/week (autopilot)</li>
              <li>Full interview coach</li>
            </ul>
            <div className="mt-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">Choose Pro</button>
            </div>
          </div>

          <div className="p-6 border rounded-xl bg-white text-center">
            <p className="text-sm text-slate-400">Premium</p>
            <p className="text-2xl font-bold mt-2">$59 / mo</p>
            <ul className="mt-4 text-sm space-y-2 text-slate-600">
              <li>Everything in Pro</li>
              <li>Side-hustle finder</li>
              <li>Priority support + community boosts</li>
            </ul>
            <div className="mt-4">
              <button className="px-4 py-2 border rounded-md">Choose Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500">
        <div className="flex items-center justify-between">
          <div>
            <p>© {new Date().getFullYear()} CareerAI • Built for grads and job-seekers</p>
          </div>
          <div className="flex gap-4">
            <p>Privacy</p>
            <p>Terms</p>
            <p>Contact</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

