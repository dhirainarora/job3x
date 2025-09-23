import React, { useState } from "react";
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

// CareerAI Full Frontend Preview Component
export default function CareerAIPreview() {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  const mockJobs = [
    { id: 1, title: "Junior Data Analyst", company: "Insight Labs", ats: 88, stage: "Applied", date: "Sep 16, 2025" },
    { id: 2, title: "Frontend Intern", company: "PixelWorks", ats: 72, stage: "Interview Scheduled", date: "Sep 25, 2025" },
    { id: 3, title: "Business Analyst Trainee", company: "MarketPulse", ats: 94, stage: "Offer", date: "Sep 10, 2025" },
  ];

  const features = [
    { title: "Career Path Navigator", desc: "Discover job paths from your degree + real market demand.", icon: Rocket },
    { title: "AI Skill Fixer", desc: "Micro-lessons that fill your exact skill gaps — learn in 10–30 min blocks.", icon: Zap },
    { title: "Resume + ATS Booster", desc: "Auto-tailor resumes for each job and hit 90+ ATS scores.", icon: FileText },
    { title: "Job Apply Autopilot", desc: "Set preferences and let AI apply to hundreds of matching roles.", icon: GitBranch },
    { title: "Interview Coach (Voice & Video)", desc: "Realistic mock interviews with instant feedback.", icon: UserCheck },
    { title: "Side-Hustle Finder", desc: "Freelance gigs to start earning while you land your full-time role.", icon: Briefcase },
  ];

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
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95">Sign in</button>
        </nav>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold leading-tight"
          >
            Stuck after college or can’t land a job? <span className="text-indigo-600">CareerAI</span> gets you hired — fast.
          </motion.h2>
          <motion.p
            className="mt-4 text-slate-600 max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            From discovering career paths, fixing skill gaps with micro-lessons, auto-optimizing resumes for ATS, to mock interviews — CareerAI automates the entire job hunt.
          </motion.p>

          <div className="mt-6 flex gap-3">
            <button className="px-6 py-3 rounded-md bg-indigo-600 text-white font-medium shadow hover:scale-[1.01]">Start Free</button>
            <button className="px-6 py-3 rounded-md border border-slate-200 text-slate-700">See Demo</button>
          </div>
        </div>

        {/* Hero Right: Dashboard Preview */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg"
        >
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

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500">
        <div className="flex items-center justify-between">
          <p>© {new Date().getFullYear()} CareerAI • Built for grads and job-seekers</p>
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
