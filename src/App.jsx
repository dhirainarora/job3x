import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Rocket,
  UserCheck,
  Zap,
  Database,
  Edit3,
  Clock,
  Award,
  Briefcase,
  LayoutGrid,
  FileText,
  MessageCircle,
  GitBranch,
} from "lucide-react";
import { auth, db, loginWithGoogle, logoutUser } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Full CareerAI App.jsx
 * - Keeps your exact preview UI (hero, features, pricing, footer, dashboard, etc.)
 * - Wires AI features via fetch('/.netlify/functions/ai') -> action + payload
 * - Uses Firebase auth (loginWithGoogle/logoutUser) and Firestore to save applications
 *
 * Notes:
 * - Ensure netlify/functions/ai.js exists and calls Gemini (GEMINI_API_KEY in Netlify).
 * - Ensure src/firebase.js uses import.meta.env.VITE_FIREBASE_* (I provided that file earlier).
 */

export default function CareerAIPreview() {
  // UI state
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Resume / AI states
  const [resumeText, setResumeText] = useState("");
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  // Skill / lesson states
  const [lesson, setLesson] = useState(null);

  // Interview states
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  // Side hustles
  const [gigs, setGigs] = useState([]);

  // Mock jobs (kept from your preview)
  const mockJobs = [
    {
      id: 1,
      title: "Junior Data Analyst",
      company: "Insight Labs",
      ats: 88,
      stage: "Applied",
      date: "Sep 16, 2025",
    },
    {
      id: 2,
      title: "Frontend Intern",
      company: "PixelWorks",
      ats: 72,
      stage: "Interview Scheduled",
      date: "Sep 25, 2025",
    },
    {
      id: 3,
      title: "Business Analyst Trainee",
      company: "MarketPulse",
      ats: 94,
      stage: "Offer",
      date: "Sep 10, 2025",
    },
  ];

  const features = [
    {
      title: "Career Path Navigator",
      desc: "Discover job paths from your degree + real market demand.",
      icon: Rocket,
    },
    {
      title: "AI Skill Fixer",
      desc: "Micro-lessons that fill your exact skill gaps — learn in 10–30 min blocks.",
      icon: Zap,
    },
    {
      title: "Resume + ATS Booster",
      desc: "Auto-tailor resumes for each job and hit 90+ ATS scores.",
      icon: FileText,
    },
    {
      title: "Job Apply Autopilot",
      desc: "Set preferences and let AI apply to hundreds of matching roles.",
      icon: GitBranch,
    },
    {
      title: "Interview Coach (Voice & Video)",
      desc: "Realistic mock interviews with instant feedback and improvement tips.",
      icon: UserCheck,
    },
    {
      title: "Side-Hustle Finder",
      desc: "Freelance gigs to start earning while you land your full-time role.",
      icon: Briefcase,
    },
  ];

  // Firebase auth observer
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // Central AI call to serverless function
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
    } catch (e) {
      setAiLoading(false);
      return { error: e.message || String(e) };
    }
  }

  // Resume & ATS handlers
  async function handleOptimizeResume() {
    if (!resumeText) return alert("Upload or paste your resume first");
    const ai = await callAI("optimize_resume", { resume_text: resumeText });
    if (ai?.result) {
      // AI may return JSON or raw text; try parse
      try {
        const parsed = JSON.parse(ai.result);
        setOptimizedResume(parsed.optimized || parsed.optimized_text || ai.result);
        setAtsScore(parsed.score || parsed.ats || null);
      } catch {
        setOptimizedResume(ai.result);
      }
    } else {
      alert("AI error: " + (ai.error || "unknown"));
    }
  }

  async function handleGenerateCoverLetter(job) {
    if (!resumeText) return alert("Add resume text first (upload/paste)");
    const ai = await callAI("generate_cover_letter", { job, resume_text: resumeText });
    if (ai?.result) setCoverLetter(ai.result);
    else alert("Error generating cover letter");
  }

  // Autopilot applies and saves to Firestore if user logged in
  async function handleApplyAutopilot() {
    if (!user) return alert("Please sign in to use Apply Autopilot (we save your applications)");
    for (const job of mockJobs) {
      const gen = await callAI("generate_cover_letter", { job, resume_text: resumeText });
      const letter = gen?.result || "Auto-generated cover letter";
      try {
        await addDoc(collection(db, "applications"), {
          userId: user.uid,
          job,
          coverLetter: letter,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Firestore save failed", e);
      }
    }
    alert("Autopilot finished — applications saved to your account (if signed in).");
  }

  // Skill lesson
  async function handleGenerateLesson(skill) {
    const ai = await callAI("generate_lesson", { skill });
    if (ai?.result) setLesson(ai.result);
    else alert("Lesson generation failed");
  }

  // Interview coach
  async function handleStartMockInterview(role = "Full-stack recruiter simulation") {
    const ai = await callAI("mock_interview", { role });
    if (ai?.result) {
      try {
        const parsed = JSON.parse(ai.result);
        setInterviewQuestions(parsed.questions || parsed || []);
      } catch {
        setInterviewQuestions(ai.result.split("\n").filter(Boolean));
      }
      setCurrentQuestionIdx(0);
    } else {
      alert("Failed to start mock interview");
    }
  }

  async function handleSubmitInterviewAnswer() {
    const question = interviewQuestions[currentQuestionIdx];
    const ai = await callAI("interview_feedback", { question, answer: userAnswer });
    if (ai?.result) setInterviewFeedback(ai.result);
    setUserAnswer("");
    setCurrentQuestionIdx((i) => Math.min(i + 1, interviewQuestions.length - 1));
  }

  // Side hustles
  async function handleFindSideHustles() {
    const ai = await callAI("side_hustles", { profile: user?.email || "student" });
    if (ai?.result) {
      try {
        const parsed = JSON.parse(ai.result);
        setGigs(parsed.gigs || parsed || []);
      } catch {
        setGigs(ai.result.split("\n").filter(Boolean));
      }
    } else {
      alert("Failed to find hustles");
    }
  }

  // File upload helper (reads text content)
  function handleResumeFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(String(ev.target.result || ""));
    // For PDFs, reading as text won't produce usable content; we still allow upload and fallback to user paste.
    reader.readAsText(file);
  }

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
          <button className="text-sm px-3 py-2 rounded-md hover:bg-slate-100">Features</button>
          <button className="text-sm px-3 py-2 rounded-md hover:bg-slate-100">Pricing</button>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">{user.displayName || user.email}</div>
              <button onClick={() => logoutUser()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95">
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => loginWithGoogle()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95">
              Sign in
            </button>
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
            <button onClick={() => setTab("overview")} className="px-6 py-3 rounded-md bg-indigo-600 text-white font-medium shadow hover:scale-[1.01]">
              Start Free
            </button>
            <button className="px-6 py-3 rounded-md border border-slate-200 text-slate-700">See Demo</button>
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

        {/* Hero Right: Quick Dashboard Mock */}
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">Active Applications</p>
              <h3 className="font-semibold">3 in progress</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Next Mock</p>
              <p className="font-semibold">Sep 25, 2025</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {mockJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-xs text-slate-400">{j.company} • {j.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">ATS</p>
                  <p className={`font-semibold ${j.ats > 85 ? 'text-emerald-600' : j.ats > 75 ? 'text-amber-600' : 'text-rose-600'}`}>{j.ats}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 py-2 rounded-md bg-indigo-600 text-white" onClick={() => setTab("resume")}>Open Dashboard</button>
            <button className="py-2 px-3 rounded-md border">Export</button>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <h3 className="text-2xl font-bold">What CareerAI does differently</h3>
        <p className="text-slate-500 mt-2 max-w-2xl">An end-to-end AI job accelerator built for college grads and anyone struggling to find a role.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div key={idx} whileHover={{ y: -6 }} className="bg-white border rounded-xl p-5 shadow-sm">
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
            <button className="bg-white text-indigo-700 px-5 py-3 rounded-md font-semibold">Start Free</button>
            <button className="border border-white px-5 py-3 rounded-md">Book Demo</button>
          </div>
        </div>
      </section>

      {/* DASHBOARD + TABS (Full preview preserved) */}
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
              <button onClick={() => setTab("overview")} className={`w-full text-left p-2 rounded-md ${tab === 'overview' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><LayoutGrid className="text-indigo-600"/><span>Overview</span></div>
              </button>
              <button onClick={() => setTab("resume")} className={`w-full text-left p-2 rounded-md ${tab === 'resume' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><FileText className="text-indigo-600"/><span>Resume</span></div>
              </button>
              <button onClick={() => setTab("skills")} className={`w-full text-left p-2 rounded-md ${tab === 'skills' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Database className="text-indigo-600"/><span>Skills</span></div>
              </button>
              <button onClick={() => setTab("interview")} className={`w-full text-left p-2 rounded-md ${tab === 'interview' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><UserCheck className="text-indigo-600"/><span>Interview</span></div>
              </button>
              <button onClick={() => setTab("hustles")} className={`w-full text-left p-2 rounded-md ${tab === 'hustles' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Briefcase className="text-indigo-600"/><span>Side Hustles</span></div>
              </button>
            </nav>

            <div className="mt-6 text-xs text-slate-400">
              <p>Account: Free</p>
              <p>Applications: 12 this month</p>
            </div>
          </aside>

          <main className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              {tab === 'overview' && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Overview</h4>
                    <div className="flex items-center gap-2">
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs, skills..." className="px-3 py-2 border rounded-md text-sm" />
                      <button className="px-3 py-2 rounded-md border">Filter</button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Active</p>
                      <p className="font-semibold text-lg">3</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Avg ATS Score</p>
                      <p className="font-semibold text-lg">84%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Skill Progress</p>
                      <p className="font-semibold text-lg">40%</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="font-semibold">Recent Applications</h5>
                    <div className="mt-3 space-y-3">
                      {mockJobs.map((j) => (
                        <div key={j.id} className="p-3 rounded-lg flex items-center justify-between bg-slate-50">
                          <div>
                            <p className="font-medium">{j.title}</p>
                            <p className="text-xs text-slate-400">{j.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{j.stage}</p>
                            <p className={`font-semibold ${j.ats > 85 ? 'text-emerald-600' : j.ats > 75 ? 'text-amber-600' : 'text-rose-600'}`}>{j.ats}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'resume' && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Resume + ATS Booster</h4>
                    <div className="text-sm text-slate-400">Upload → Optimize → Score</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Uploaded Resume</p>
                      <div className="mt-2 p-3 bg-white rounded-md border">
                        {resumeText ? (
                          <pre className="text-xs max-h-40 overflow-auto">{resumeText.slice(0, 400)}{resumeText.length > 400 ? '...' : ''}</pre>
                        ) : (
                          <div className="space-y-2">
                            <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleResumeFile} />
                            <p className="text-xs text-slate-400">Or paste resume text below</p>
                            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="w-full mt-2 p-2 border rounded-md h-28" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">Current ATS Score</p>
                      <p className="font-bold text-3xl mt-2">{atsScore || '—'}</p>
                      <p className="text-sm text-slate-500 mt-2">Suggested fixes: add keywords "SQL", "Data Analysis" • shorten experience lines</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={handleOptimizeResume} className="px-3 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? 'Working...' : 'Auto-Optimize'}</button>
                        <button onClick={() => alert('View suggestions — will open a detailed modal in future iterations')} className="px-3 py-2 border rounded-md">View Suggestions</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'skills' && (
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
                        <button onClick={() => handleGenerateLesson('SQL Fundamentals')} className="px-3 py-1 rounded-md border">Start Lesson</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Excel for Analysts</p>
                      <p className="text-xs text-slate-400">Progress: 10%</p>
                      <div className="mt-3">
                        <button onClick={() => handleGenerateLesson('Excel for Analysts')} className="px-3 py-1 rounded-md border">Start Lesson</button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium">Communication: Answers</p>
                      <p className="text-xs text-slate-400">Progress: 50%</p>
                      <div className="mt-3">
                        <button onClick={() => handleGenerateLesson('Communication for interviews')} className="px-3 py-1 rounded-md border">Start Lesson</button>
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

              {tab === 'interview' && (
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
                        <button onClick={() => handleStartMockInterview()} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? 'Starting...' : 'Start Mock'}</button>
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
                          <button onClick={() => setCurrentQuestionIdx(i => Math.min(i+1, interviewQuestions.length-1))} className="px-3 py-2 border rounded-md">Skip</button>
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

              {tab === 'hustles' && (
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
                    <button onClick={handleFindSideHustles} className="px-3 py-2 bg-indigo-600 text-white rounded-md">{aiLoading ? 'Finding...' : 'Find More Hustles'}</button>
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
