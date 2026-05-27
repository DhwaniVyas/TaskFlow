import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckSquare,
  FiArrowRight,
  FiMenu,
  FiX,
  FiClock,
  FiUsers,
  FiMessageSquare,
  FiCheck,
  FiBell,
  FiZap,
} from "react-icons/fi";

const currentYear = new Date().getFullYear();

// Simple animated counter for Productivity Metrics
function Counter({ target, duration = 1.0, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(target.toString().replace(/[^0-9.]/g, ""));
    if (isNaN(end)) return;

    const totalFrames = 60;
    const frameDuration = (duration * 1000) / totalFrames;
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentValue = Math.round(end * (1 - Math.pow(1 - progress, 2)));

      if (frame >= totalFrames) {
        clearInterval(counter);
        setCount(end);
      } else {
        setCount(currentValue);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [target, duration]);

  const displayVal = target.toString().includes(".") ? count.toFixed(1) : count;
  return <span>{displayVal}{suffix}</span>;
}

// Glassmorphic stat card with viewport-triggered counters
function StatCard({ label, target, suffix, desc, delay }) {
  const [isInView, setIsInView] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      onViewportEnter={() => setIsInView(true)}
      className="bg-white/80 border border-[#C4E9ED]/40 p-6 rounded-2xl shadow-md text-left space-y-3 hover:border-cyan-500/30 hover:bg-white transition-all duration-500 backdrop-blur-md"
    >
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="text-3xl font-extrabold text-[#082F38] flex items-baseline gap-1">
        {isInView ? (
          <Counter target={target} suffix={suffix} />
        ) : (
          <span>0{suffix}</span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectedTab, setConnectedTab] = useState("tasks");
  const [collabStep, setCollabStep] = useState(0);

  // Auto cycle Collaboration Showcase steps
  useEffect(() => {
    const timer = setInterval(() => {
      setCollabStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const tabContent = {
    tasks: {
      title: "Task Orchestration",
      badge: "Subtasks",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      desc: "Deconstruct tasks into actionable subtasks. Mark items complete inline to automatically recalculate and save the parent task progress.",
      node: (
        <div className="space-y-2 max-w-xl">
          {[
            { text: "Establish MongoDB schemas & validation queries", done: true, tag: "Backend" },
            { text: "Integrate Twilio SMS alerts for upcoming deadlines", done: false, tag: "Services" }
          ].map((item, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-[#F8FAFC]/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-md border ${item.done ? "border-[#0E7490] bg-cyan-50 flex items-center justify-center" : "border-slate-300"}`}>
                  {item.done && <FiCheck className="text-[#0E7490] text-xs" />}
                </div>
                <span className={`text-xs font-semibold ${item.done ? "text-slate-400 line-through" : "text-[#082F38]"}`}>{item.text}</span>
              </div>
              <span className="text-[8px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{item.tag}</span>
            </div>
          ))}
        </div>
      )
    },
    projects: {
      title: "Workspace Aggregation",
      badge: "Context",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
      desc: "Group checklist cards under distinct projects. Stay on top of overall project progress metrics and precise datetime limits.",
      node: (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: "Database Migration", progress: 80, gradient: "from-cyan-500 to-indigo-500" },
            { name: "API Gateway Integration", progress: 40, gradient: "from-indigo-500 to-purple-500" }
          ].map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC]/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-bold text-[#082F38]">{p.name}</h4>
                <span className="text-[#0E7490] font-bold">{p.progress}% Progress</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${p.gradient} rounded-full`} style={{ width: `${p.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    team: {
      title: "Role-Based Collaborator Permissions",
      badge: "Roles",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
      desc: "Protect project integrity. Assign Head role for complete write privileges, Member for editing tasks, and Viewer to lock out modifications.",
      node: (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { role: "Owner / Head", badge: "Write Access", desc: "Can create project tasks, configure datetime deadlines, invite emails, and delete items.", color: "text-emerald-600" },
            { role: "Viewer Role", badge: "Read Only", desc: "Filtered out from task assignees. Locked out from creating, editing, or completing items.", color: "text-amber-600" }
          ].map((r, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#082F38]">{r.role}</span>
                <span className={`text-[8px] font-bold ${r.color} uppercase`}>{r.badge}</span>
              </div>
              <p className="text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    analytics: {
      title: "Output Analytics Dashboard",
      badge: "Metrics",
      badgeColor: "bg-cyan-100 text-[#0E7490] border-cyan-200",
      desc: "Monitor completion speeds, status densities, and upcoming deadlines in real time to forecast product milestones.",
      node: (
        <div className="h-28 flex items-end gap-3 pt-4 border-b border-slate-100">
          {[
            { pct: "40%", bg: "bg-cyan-500/20 hover:bg-[#0E7490]" },
            { pct: "65%", bg: "bg-indigo-500/20 hover:bg-indigo-600" },
            { pct: "85%", bg: "bg-purple-500/20 hover:bg-purple-600" },
            { pct: "95%", bg: "bg-emerald-500/20 hover:bg-emerald-600" }
          ].map((bar, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: bar.pct }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
              className={`flex-1 ${bar.bg} rounded-t-lg transition-colors relative group`}
            >
              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{bar.pct}</span>
            </motion.div>
          ))}
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF7F9] via-[#F8FAFC] to-white text-[var(--text-primary)] flex flex-col w-full font-sans select-none relative overflow-hidden">
      
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Background Pastel Flowy Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#E2F4F6]/50 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#EEF2FF]/60 blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#FAE8FF]/40 blur-[120px] pointer-events-none z-0"></div>

      {/* --- HEADER NAVBAR --- */}
      <header className="relative w-full border-b border-[#C4E9ED]/40 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <FiCheckSquare className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#082F38]">
              Task<span className="text-[#F97316]">Flow</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <a href="#workflow" className="hover:text-[#0E7490] transition-colors">Flow</a>
            <a href="#collab" className="hover:text-[#0E7490] transition-colors">Collaboration</a>
            <a href="#metrics" className="hover:text-[#0E7490] transition-colors">Metrics</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-[#0E7490] transition-colors px-4 py-2">
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#0E7490] hover:bg-[#0c647c] rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
            >
              Get Started <FiArrowRight className="text-sm" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#082F38] hover:text-[#0E7490] transition-colors"
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-[#C4E9ED]/40 py-6 px-6 flex flex-col gap-4 md:hidden z-50 shadow-lg"
            >
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-slate-600 py-2 border-b border-gray-100">Flow</a>
              <a href="#collab" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-slate-600 py-2 border-b border-gray-100">Collaboration</a>
              <a href="#metrics" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-slate-600 py-2 border-b border-gray-100">Metrics</a>
              <div className="flex flex-col gap-3 pt-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-sm font-semibold border border-gray-200 rounded-full hover:bg-slate-50">
                  Log In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-sm font-semibold text-white bg-[#0E7490] rounded-full">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 w-full flex flex-col items-center relative z-10">
        
        <section className="w-full max-w-7xl px-6 pt-20 md:pt-32 pb-32 grid lg:grid-cols-12 gap-12 items-center min-h-[80vh]">
          {/* Hero Left Column */}
          <div className="lg:col-span-6 space-y-8 text-left relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-100 bg-[#EEF2FF] text-[#4F46E5] text-[10px] uppercase font-bold tracking-widest shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
              Real-Time Task Management
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-[#082F38] font-sans"
            >
              Workflows that <br />
              <span className="bg-gradient-to-r from-[#0E7490] via-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">Feel Under Control.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-lg"
            >
              Coordinate projects, track subtask checklists inline, and update teams with automated notifications. No feature dump. Just pure organization.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-wider text-white bg-[#0E7490] hover:bg-[#0c647c] rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(14,116,144,0.2)] transform hover:-translate-y-0.5"
              >
                Get Started Free <FiArrowRight className="text-sm" />
              </Link>
              
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#082F38] border border-slate-200 hover:border-slate-300 bg-white/50 hover:bg-white rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Login
              </Link>

              {/* Continue with Google button to guide users naturally */}
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 border border-slate-200 hover:border-[#4F46E5]/40 bg-white/70 hover:bg-white rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google Auth
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Column: Abstract workflow node visual instead of dashboard screen replication */}
          <div className="lg:col-span-6 flex justify-center relative py-6 min-h-[400px]">
            <div className="absolute w-[350px] h-[350px] bg-[#E2F4F6] rounded-full blur-[90px] pointer-events-none"></div>

            <div className="relative w-full max-w-[460px] h-[400px] flex items-center justify-center">
              
              {/* Central Node */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] p-0.5 shadow-xl flex items-center justify-center z-20"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
                  <FiCheckSquare className="text-3xl text-[#0E7490] animate-pulse" />
                </div>
              </motion.div>

              {/* Glowing link rings */}
              <div className="absolute w-52 h-52 rounded-full border border-dashed border-[#C4E9ED]/50 animate-[spin_50s_linear_infinite] pointer-events-none z-0" />
              <div className="absolute w-80 h-80 rounded-full border border-dashed border-indigo-100/60 animate-[spin_80s_linear_infinite_reverse] pointer-events-none z-0" />

              {/* Node 1: Task Checklist Card (top-left) */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute left-[-20px] top-[15%] bg-white/95 backdrop-blur-md border border-[#C4E9ED]/60 p-3 rounded-2xl shadow-lg flex items-center gap-3 z-10"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FiCheck className="text-xs" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#082F38]">Deploy Webhook</p>
                  <p className="text-[8px] text-slate-400 uppercase font-semibold">Status: Done</p>
                </div>
              </motion.div>

              {/* Node 2: Team Collaborator Stack (top-right) */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.5 }}
                className="absolute right-[-10px] top-[18%] bg-white/95 backdrop-blur-md border border-indigo-100/60 p-3 rounded-2xl shadow-lg flex items-center gap-3.5 z-10"
              >
                <div className="flex -space-x-1.5">
                  <span className="w-5.5 h-5.5 rounded-full bg-cyan-600 border border-white flex items-center justify-center text-[7px] font-bold text-white uppercase">AM</span>
                  <span className="w-5.5 h-5.5 rounded-full bg-indigo-600 border border-white flex items-center justify-center text-[7px] font-bold text-white uppercase">SK</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#082F38]">Sarah K.</p>
                  <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-wider">Joined Project</span>
                </div>
              </motion.div>

              {/* Node 3: SMS Dispatch Confirmation (bottom-left) */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="absolute left-[-5px] bottom-[15%] bg-white/95 backdrop-blur-md border border-orange-100/80 p-3 rounded-2xl shadow-lg flex items-center gap-3 z-10"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316]">
                  <FiBell className="text-xs" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#082F38]">SMS Dispatched</p>
                  <p className="text-[8px] text-slate-400 uppercase font-semibold">verified phone</p>
                </div>
              </motion.div>

              {/* Node 4: Quick-Sync Badge (bottom-right) */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 1.5 }}
                className="absolute right-[-15px] bottom-[16%] bg-white/95 backdrop-blur-md border border-purple-100 p-3 rounded-2xl shadow-lg flex items-center gap-3 z-10"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <FiZap className="text-xs" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#082F38]">Auto-Sync</p>
                  <p className="text-[8px] text-purple-500 uppercase font-semibold">no reload</p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- SECTION 2: EVERYTHING CONNECTED --- */}
        <section id="workflow" className="w-full py-32 px-6 flex flex-col items-center relative border-t border-[#C4E9ED]/40 bg-[#F8FAFC]/40">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl w-full text-center space-y-12"
          >
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#0E7490]">Everything Connected</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F38]">
                One Unified Project Flow.
              </h2>
              <p className="text-sm text-slate-500">
                Track how updates to subtasks instantly coordinate projects, team assignees, and workspace analytics.
              </p>
            </div>

            {/* Horizontal flow track layout */}
            <div className="grid grid-cols-4 max-w-3xl mx-auto bg-slate-100 border border-slate-200/60 rounded-2xl p-1.5 shadow-inner">
              {[
                { id: "tasks", label: "1. Checklists", desc: "Build Subtasks" },
                { id: "projects", label: "2. Projects", desc: "Track Progress" },
                { id: "team", label: "3. Team Access", desc: "Define Roles" },
                { id: "analytics", label: "4. Analytics", desc: "Monitor Output" },
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setConnectedTab(step.id)}
                  className={`flex flex-col items-center py-3.5 px-2 rounded-xl transition-all duration-300 ${
                    connectedTab === step.id
                      ? "bg-white border border-[#C4E9ED]/50 shadow-sm scale-102 text-[#0E7490]"
                      : "opacity-60 hover:opacity-100 text-slate-500"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${connectedTab === step.id ? "text-[#0E7490]" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium mt-0.5 hidden sm:inline">{step.desc}</span>
                </button>
              ))}
            </div>

            {/* Interactive Stage Panel */}
            <div className="max-w-3xl mx-auto w-full min-h-[300px] rounded-2xl bg-white border border-[#C4E9ED]/50 p-6 text-left shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#E2F4F6]/30 rounded-full blur-[50px] pointer-events-none"></div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={connectedTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-bold text-[#0E7490] uppercase tracking-widest">{tabContent[connectedTab].title}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${tabContent[connectedTab].badgeColor}`}>{tabContent[connectedTab].badge}</span>
                  </div>
                  <p className="text-xs text-slate-500">{tabContent[connectedTab].desc}</p>
                  {tabContent[connectedTab].node}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* --- SECTION 3: COLLABORATION SHOWCASE --- */}
        <section id="collab" className="w-full py-32 px-6 flex flex-col items-center relative bg-gradient-to-b from-[#F8FAFC]/40 to-white border-t border-[#C4E9ED]/30">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl w-full text-center space-y-12"
          >
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#4F46E5]">Secure Invites & Verification</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F38]">
                Real-Time Collaboration Showcase
              </h2>
              <p className="text-sm text-slate-500">
                Observe the chronological sync loop when members interact inside a shared space.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto w-full bg-white border border-[#C4E9ED]/60 rounded-2xl p-6 shadow-xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#082F38]">Live Collaboration Stream</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0E7490] border-2 border-white flex items-center justify-center text-[7px] font-bold text-white uppercase">SK</span>
                  <span className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[7px] font-bold text-white uppercase">AM</span>
                  <span className="text-[9px] font-bold text-slate-400 ml-1">+2 active</span>
                </div>
              </div>

              <div className="space-y-3 text-left">
                {[
                  {
                    step: 0,
                    title: "invitations@taskflow.io sent tokenized invite",
                    desc: "To: backend-lead@example.com (Verification Enabled)",
                    badge: "Pending",
                    badgeColor: "text-cyan-600",
                    indicatorColor: "bg-cyan-500",
                    activeStyle: "border-cyan-500/30 bg-cyan-50/[0.3]"
                  },
                  {
                    step: 1,
                    title: "backend-lead@example.com logged in & accepted",
                    desc: "Session validated and permanently added to members",
                    badge: "Joined",
                    badgeColor: "text-slate-400",
                    indicatorColor: "bg-indigo-500",
                    activeStyle: "border-indigo-500/30 bg-indigo-50/[0.2]"
                  },
                  {
                    step: 2,
                    title: "Task 'Database Migration' assigned to backend-lead",
                    desc: "Twilio dispatch: SMS alert sent to verified phone number",
                    badge: "SMS Sent",
                    badgeColor: "text-purple-600",
                    indicatorColor: "bg-purple-500",
                    activeStyle: "border-purple-500/30 bg-purple-50/[0.2]"
                  },
                  {
                    step: 3,
                    title: "backend-lead commented on 'Database Migration'",
                    desc: "\"Migration script executed successfully. No index locks found. 🚀\"",
                    badge: "Just Now",
                    badgeColor: "text-slate-400",
                    indicatorColor: "bg-emerald-500",
                    activeStyle: "border-emerald-500/30 bg-emerald-50/[0.2]",
                    isComment: true
                  }
                ].map((event, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: collabStep >= event.step ? 1 : 0.25, x: collabStep >= event.step ? 0 : -8 }}
                    transition={{ duration: 0.4 }}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex ${
                      event.isComment ? "flex-col gap-1.5" : "items-center justify-between"
                    } ${
                      collabStep === event.step ? event.activeStyle : "border-slate-100 bg-[#F8FAFC]/60"
                    }`}
                  >
                    {event.isComment ? (
                      <>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${event.indicatorColor}`} />
                            <h5 className="text-xs font-semibold text-[#082F38]">{event.title}</h5>
                          </div>
                          <span className="text-[8px] text-slate-400">{event.badge}</span>
                        </div>
                        <p className="text-[10px] text-[#0E7490] italic pl-4">{event.desc}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${event.indicatorColor}`} />
                          <div>
                            <h5 className="text-xs font-semibold text-[#082F38]">{event.title}</h5>
                            <p className="text-[10px] text-slate-400">{event.desc}</p>
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold ${event.badgeColor} uppercase`}>{event.badge}</span>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* --- SECTION 4: PRODUCTIVITY METRICS --- */}
        <section id="metrics" className="w-full py-32 px-6 flex flex-col items-center relative border-t border-[#C4E9ED]/30 bg-[#F8FAFC]/50">
          <div className="max-w-7xl w-full text-center space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto space-y-3"
            >
              <span className="text-xs uppercase font-bold tracking-widest text-[#0E7490]">Performance Analytics</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F38]">
                Productivity Metrics
              </h2>
              <p className="text-sm text-slate-500">
                Measure team operational speeds and task completion rates backed by actual dashboard logs.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { label: "Subtasks Finished", target: 94.2, suffix: "%", desc: "Items checked off within deadlines" },
                { label: "Total Tasks Closed", target: 1420, suffix: "+", desc: "Managed on TaskFlow workspaces" },
                { label: "Comment Loop Speed", target: 15.4, suffix: "%", desc: "Faster resolutions with nested replies" },
                { label: "On-Time Delivery", target: 98.7, suffix: "%", desc: "Tasks completed before date-time limit" },
              ].map((stat, idx) => (
                <StatCard
                  key={idx}
                  label={stat.label}
                  target={stat.target}
                  suffix={stat.suffix}
                  desc={stat.desc}
                  delay={idx * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 5: FINAL CTA --- */}
        <section className="w-full py-32 px-6 flex flex-col items-center relative bg-white border-t border-slate-100">
          <div className="absolute w-[400px] h-[400px] bg-[#E2F4F6]/50 rounded-full blur-[110px] pointer-events-none"></div>

          {/* Deep Teal Gradient Card matching TaskFlow branding */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full rounded-3xl bg-gradient-to-tr from-[#082F38] via-[#0E7490] to-[#164E63] p-12 md:p-16 text-center shadow-2xl space-y-8 relative z-10 border border-[#C4E9ED]/20 text-white"
          >
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to Streamline Your Workspace?
              </h2>
              <p className="text-sm sm:text-base text-cyan-100 max-w-lg mx-auto leading-relaxed">
                Join developers and managers who coordinate projects, verify collaborators, and hit deadlines on schedule.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 text-xs font-bold uppercase tracking-wider text-[#082F38] bg-white hover:bg-slate-100 rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.15)] transform hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 hover:border-white/50 bg-white/5 rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Login to Account
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-slate-100 bg-[#F8FAFC] py-12 px-6 flex flex-col items-center relative z-10">
        <div className="max-w-7xl w-full flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] flex items-center justify-center shadow-md">
              <FiCheckSquare className="text-white text-base" />
            </div>
            <span className="text-base font-bold text-[#082F38]">
              Task<span className="text-[#F97316]">Flow</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            &copy; {currentYear} TaskFlow Inc. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
