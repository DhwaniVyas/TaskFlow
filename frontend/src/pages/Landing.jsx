import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckSquare,
  FiArrowRight,
  FiMenu,
  FiX,
  FiCheck,
  FiBell,
  FiFolder,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiShield
} from "react-icons/fi";

const currentYear = new Date().getFullYear();

// Reusable FAQ Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left font-sans font-semibold text-sm sm:text-base text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/50 transition-colors"
      >
        <span>{question}</span>
        <span className="text-[var(--brand-primary)] shrink-0 ml-4">
          {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--line-soft)] pt-4 bg-[var(--surface-subtle)]/30">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 3D Tilt Card Effect Wrapper
function TiltCard({ children, className = "" }) {
  const cardRef = React.useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12; // tilt sensitivity
    const angleY = (x - xc) / 12;
    card.style.transform = `perspective(800px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.15s ease-out" }}
      className={`transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

// Animated Odometer Count Counter
function AnimatedCounter({ endValue, label, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const duration = 1200; // 1.2s total count duration
          const steps = 40;
          const stepTime = duration / steps;
          const increment = endValue / steps;

          const timer = setInterval(() => {
            start += increment;
            if (start >= endValue) {
              setCount(endValue);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, stepTime);

          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [endValue]);

  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-3xl sm:text-5xl font-extrabold text-[var(--brand-primary)] font-mono">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-[var(--text-muted)] mt-2">
        {label}
      </p>
    </div>
  );
}

// Animated Viewport Progress Bar
function ProgressBar({ label, percentage }) {
  const [width, setWidth] = useState(0);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setWidth(percentage), 100);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [percentage]);

  return (
    <div ref={ref} className="space-y-2 text-left">
      <div className="flex justify-between text-xs font-bold text-[var(--text-primary)]">
        <span>{label}</span>
        <span className="font-mono">{percentage}%</span>
      </div>
      <div className="h-3 w-full bg-[var(--line-soft)]/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        ></div>
      </div>
    </div>
  );
}

const scrollSections = [
  { id: "hero", label: "Home" },
  { id: "metrics", label: "Stats" },
  { id: "features-explorer", label: "Explorer" },
  { id: "performance", label: "Performance" },
  { id: "product-showcase", label: "Showcase" },
  { id: "faq", label: "FAQ" }
];

// Scroll Indicator Sidebar component
function ScrollIndicator() {
  const [activeSection, setActiveSection] = useState("hero");

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      for (const section of scrollSections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 z-40">
      <div className="w-0.5 h-32 bg-[var(--line-soft)] relative flex items-center justify-center">
        <div
          className="absolute top-0 w-full bg-[var(--brand-primary)] transition-all duration-300"
          style={{
            height: `${(scrollSections.findIndex((s) => s.id === activeSection) / (scrollSections.length - 1)) * 100}%`
          }}
        />
      </div>

      {scrollSections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className="group relative flex items-center justify-center w-6 h-6 focus:outline-none"
          title={section.label}
        >
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? "bg-[var(--brand-primary)] scale-150 ring-4 ring-[var(--brand-primary)]/20"
                : "bg-[var(--text-muted)]/40 group-hover:bg-[var(--brand-secondary)] group-hover:scale-125"
            }`}
          />
          <span className="absolute left-8 px-2 py-1 bg-[var(--surface)] border border-[var(--line-soft)] text-[9px] font-bold uppercase tracking-wider text-[var(--text-primary)] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
            {section.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// Hero Animated Task Ticker Component
const tickerTasks = [
  "Finish sprint review",
  "Prepare project proposal",
  "Assign design revisions",
  "Schedule team meeting",
  "Analyze productivity report",
  "Update project dashboard"
];

function TaskTicker() {
  const [tasks, setTasks] = useState([
    { id: 0, text: tickerTasks[0], completed: false },
    { id: 1, text: tickerTasks[1], completed: false },
    { id: 2, text: tickerTasks[2], completed: false }
  ]);
  const [counter, setCounter] = useState(2);

  React.useEffect(() => {
    const timer = setInterval(() => {
      // Complete first incomplete item
      setTasks((prev) => {
        const next = [...prev];
        const incompleteIdx = next.findIndex((t) => !t.completed);
        if (incompleteIdx !== -1) {
          next[incompleteIdx] = { ...next[incompleteIdx], completed: true };
        }
        return next;
      });

      // Shift tasks out and insert new one
      setTimeout(() => {
        setTasks((prev) => {
          const next = prev.filter((_, idx) => idx !== 0);
          const nextCounter = (counter + 1) % tickerTasks.length;
          setCounter(nextCounter);
          return [
            ...next,
            { id: Date.now(), text: tickerTasks[nextCounter], completed: false }
          ];
        });
      }, 900);
    }, 2800);

    return () => clearInterval(timer);
  }, [counter]);

  return (
    <div className="w-full max-w-[380px] bg-white/70 dark:bg-[var(--surface)]/70 border border-[var(--line-soft)] rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden backdrop-blur-sm">
      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] border-b border-[var(--line-soft)] pb-2 flex justify-between items-center">
        <span>Workspace Flow Stream</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
      </div>

      <div className="h-[145px] flex flex-col justify-start gap-2.5 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-3 p-2.5 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)]/50 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  task.completed
                    ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white"
                    : "border-[var(--line-soft)] bg-white"
                }`}
              >
                {task.completed && <FiCheck className="text-[10px]" />}
              </div>
              <span
                className={`text-xs font-semibold transition-all duration-300 truncate ${
                  task.completed
                    ? "line-through text-[var(--text-muted)] opacity-60"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {task.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Features Explorer Component (Pill Switcher)
function FeatureExplorer() {
  const [activeTab, setActiveTab] = useState("Tasks");

  const featureData = {
    Tasks: {
      caption: "Track everything in one place with nested subtask progress.",
      mockup: (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line-soft)] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-wider">Subtask Breakdown</span>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Marketing Materials Checklist</h4>
            </div>
            <span className="text-[10px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2.5 py-0.5 rounded-full font-bold">80% Done</span>
          </div>
          <div className="space-y-2">
            {[
              { text: "Draft quarterly product strategy", completed: true },
              { text: "Configure Ocean Depth brand styles", completed: true },
              { text: "Verify production build compiler", completed: false }
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-xl">
                <div
                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    t.completed ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : "border-[var(--line-soft)] bg-white"
                  }`}
                >
                  {t.completed && <FiCheck className="text-xs" />}
                </div>
                <span className={`text-xs font-semibold ${t.completed ? "line-through text-[var(--text-muted)] opacity-65" : "text-[var(--text-primary)]"}`}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    Projects: {
      caption: "Coordinate work across teams with role-based access levels.",
      mockup: (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line-soft)] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-wider">Workspace Security</span>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Team Access Permissions</h4>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium font-sans">Active Locks</span>
          </div>
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)]/70 text-[10px] leading-relaxed">
              <p className="font-extrabold text-[var(--text-primary)]">Restricted Write Permissions</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1">Members can edit cards and check subtasks but cannot remove folders or delete projects.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white border border-white text-[9px] font-bold flex items-center justify-center">JD</div>
                <div className="w-7 h-7 rounded-full bg-[var(--brand-secondary)] border border-white text-[9px] font-bold flex items-center justify-center">AM</div>
                <div className="w-7 h-7 rounded-full bg-[var(--brand-accent)] text-white border border-white text-[9px] font-bold flex items-center justify-center">SK</div>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">3 Collaborators Active</span>
            </div>
          </div>
        </div>
      )
    },
    Calendar: {
      caption: "Organize task deadlines and event schedules visually.",
      mockup: (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line-soft)] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-wider">Deadlines Tracker</span>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">June 2026 Grid</h4>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Month View</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{d}</span>
            ))}
            {Array.from({ length: 14 }).map((_, i) => {
              const dayNum = i + 8;
              const hasEvent = dayNum === 9 || dayNum === 12;
              return (
                <div
                  key={i}
                  className={`p-1 border border-[var(--line-soft)]/50 rounded-lg min-h-[34px] flex flex-col justify-between ${
                    dayNum === 9 ? "bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/30" : "bg-white dark:bg-[var(--surface)]"
                  }`}
                >
                  <span className="text-[8px] font-mono text-[var(--text-muted)] text-left">{dayNum}</span>
                  {hasEvent && <span className="w-full h-1 bg-[var(--brand-primary)] rounded-full block"></span>}
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    Analytics: {
      caption: "Measure progress instantly with observation workload metrics.",
      mockup: (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line-soft)] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-wider">Productivity Metrics</span>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Workspace Activity Trend</h4>
            </div>
            <span className="text-[10px] text-[var(--color-success-primary)] font-bold bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">
              +18% Today
            </span>
          </div>
          <div className="flex items-end justify-between h-20 pt-4 px-2">
            {[40, 25, 75, 55, 90, 65, 80].map((h, i) => (
              <div key={i} className="w-8 flex flex-col items-center gap-1">
                <div className="w-3.5 bg-[var(--brand-primary)] rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-wider">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    Collaboration: {
      caption: "Connect and comment with teammates in real-time.",
      mockup: (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line-soft)] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-wider">Comments Log</span>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Twilio SMS notifications active</h4>
            </div>
            <span className="text-[10px] text-[var(--color-success-primary)] font-bold">Live Status</span>
          </div>
          <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
            {[
              { author: "JD", text: "Refactored UI colors to match Ocean theme!" },
              { author: "AM", text: "SMS notifications verified and online." }
            ].map((c, i) => (
              <div key={i} className="flex gap-2.5 p-2 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-lg text-[9px] text-left">
                <div className="w-6.5 h-6.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-bold shrink-0">
                  {c.author}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[var(--text-primary)]">{c.author}</p>
                  <p className="text-[8.5px] text-[var(--text-muted)] mt-0.5 truncate">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  const tabs = Object.keys(featureData);

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto w-full pt-6">
      {/* Left Menu Pills */}
      <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all duration-200 border shrink-0 min-w-[130px] lg:min-w-0 ${
              activeTab === tab
                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md shadow-[var(--brand-primary)]/15"
                : "bg-white dark:bg-[var(--surface)] border-[var(--line-soft)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right Showroom Card with 3D Tilt */}
      <div className="lg:col-span-8">
        <TiltCard className="w-full bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-3xl p-6 text-left shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="min-h-[200px] bg-[var(--surface-subtle)]/50 rounded-2xl border border-[var(--line-soft)] p-5 relative flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {featureData[activeTab].mockup}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 border-t border-[var(--line-soft)]/50 pt-3 flex items-center justify-between text-xs text-[var(--text-muted)] gap-4">
            <span className="font-semibold text-[var(--brand-primary)] text-[10px] sm:text-xs">
              {featureData[activeTab].caption}
            </span>
            <span className="text-[9px] uppercase tracking-wide bg-[var(--surface-subtle)] px-2 py-0.5 rounded font-mono shrink-0">
              Live Mockup
            </span>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState("Overview");

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] flex flex-col w-full font-sans select-none relative overflow-x-hidden">
      {/* Scroll indicator sidebar */}
      <ScrollIndicator />

      {/* Background Glows (Animate slowly for deep ocean motion) */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.05, 0.95, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--brand-secondary)]/10 blur-[140px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, -30, 30, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.95, 1.05, 1]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[35%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-[var(--brand-primary)]/5 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, 20, -30, 0],
          y: [0, 20, 20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-[var(--brand-accent)]/5 blur-[150px] pointer-events-none z-0"
      />

      {/* --- HEADER NAVBAR --- */}
      <header className="relative w-full border-b border-[var(--line-soft)] bg-[var(--surface)]/85 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/10 group-hover:scale-105 transition-transform duration-300">
              <FiCheckSquare className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Task<span className="text-[var(--brand-primary)] font-extrabold">Flow</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <a href="#features-explorer" className="hover:text-[var(--brand-primary)] transition-colors duration-200">Features</a>
            <a href="#performance" className="hover:text-[var(--brand-primary)] transition-colors duration-200">Why Us</a>
            <a href="#product-showcase" className="hover:text-[var(--brand-primary)] transition-colors duration-200">Showcase</a>
            <a href="#faq" className="hover:text-[var(--brand-primary)] transition-colors duration-200">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors px-4 py-2">
              Log In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
            >
              Get Started <FiArrowRight className="text-sm" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors"
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-[var(--surface)] border-b border-[var(--line-soft)] py-6 px-6 flex flex-col gap-4 md:hidden z-50 shadow-lg"
            >
              <a href="#features-explorer" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] py-2 border-b border-[var(--line-soft)]">Features</a>
              <a href="#performance" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] py-2 border-b border-[var(--line-soft)]">Why Us</a>
              <a href="#product-showcase" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] py-2 border-b border-[var(--line-soft)]">Showcase</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] py-2 border-b border-[var(--line-soft)]">FAQ</a>
              <div className="flex flex-col gap-3 pt-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-sm font-bold border border-[var(--line-soft)] rounded-xl hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]">
                  Log In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-sm font-bold text-white bg-[var(--brand-primary)] rounded-xl">
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1 w-full flex flex-col items-center relative z-10">
        {/* ==================================================
            HERO SECTION
            ================================================== */}
        <section id="hero" className="w-full max-w-7xl px-6 pt-12 md:pt-24 pb-20 grid lg:grid-cols-12 gap-12 items-center min-h-[80vh]">
          {/* Hero Left info */}
          <div className="lg:col-span-7 space-y-8 text-left relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--line-soft)] bg-white/60 dark:bg-[var(--surface)]/60 text-[var(--brand-accent)] text-[10px] uppercase font-bold tracking-widest shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              Coordinate. Plan. Deliver.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hero-headline"
            >
              Tasks, Projects, Teams.<br />
              <span className="text-[var(--brand-primary)]">Together.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/register"
                className="btn btn-primary px-8 py-4 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[var(--brand-primary)]/15 hover:shadow-[var(--brand-primary)]/25 transition-all"
              >
                Get Started <FiArrowRight className="ml-2 text-sm" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border border-[var(--line-soft)] bg-white/80 hover:bg-white dark:bg-[var(--surface)]/80 dark:hover:bg-[var(--surface)] rounded-xl transition-all duration-200 hover:border-[var(--brand-secondary)]"
              >
                View Demo
              </Link>
            </motion.div>

            {/* Google Authentication SSO & Security trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--line-soft)]/60 max-w-md"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google Single Sign-On</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiShield className="text-[var(--brand-primary)]" />
                <span>Role-based Security</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: Live Task Ticker Showcase */}
          <div className="lg:col-span-5 flex justify-center relative z-10">
            <div className="absolute w-[300px] h-[300px] bg-[var(--brand-primary)]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <TaskTicker />
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            SOCIAL PROOF METRICS STRIP
            ================================================== */}
        <div className="section-divider-gradient" />
        <section id="metrics" className="w-full py-12 px-6 bg-white/40 dark:bg-[var(--surface-subtle)]/20 flex flex-col items-center">
          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[var(--line-soft)] items-center">
            <AnimatedCounter endValue={25000} label="Tasks Managed" suffix="+" />
            <AnimatedCounter endValue={500} label="Projects Organized" suffix="+" />
            <AnimatedCounter endValue={98} label="Completion Rate" suffix="%" />
          </div>
        </section>
        <div className="section-divider-gradient" />

        {/* ==================================================
            INTERACTIVE FEATURES PILL EXPLORER
            ================================================== */}
        <section id="features-explorer" className="w-full py-20 px-6 flex flex-col items-center">
          <div className="max-w-7xl w-full space-y-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto space-y-3"
            >
              <span className="text-xs uppercase font-bold tracking-widest text-[var(--brand-primary)]">Feature Explorer</span>
              <h2 className="section-title">Visual Workspaces</h2>
              <p className="section-subtitle">Interact with pills below to see how TaskFlow organizes your tasks and projects visually.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7 }}
            >
              <FeatureExplorer />
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            TRUST & PERFORMANCE SECTION
            ================================================== */}
        <div className="section-divider-gradient" />
        <section id="performance" className="w-full py-20 px-6 bg-white/40 dark:bg-[var(--surface-subtle)]/20 flex flex-col items-center">
          <div className="max-w-4xl w-full text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto space-y-3"
            >
              <span className="text-xs uppercase font-bold tracking-widest text-[var(--brand-secondary)]">Metrics that Matter</span>
              <h2 className="section-title">Guaranteed Productivity</h2>
              <p className="section-subtitle">Real metrics reflecting visual, organized tracking performance inside modern teams.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-6 text-left"
            >
              <TiltCard className="p-6 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-3">
                    <FiCheckSquare className="text-lg" />
                  </div>
                  <ProgressBar label="Task Completion" percentage={92} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-2 pt-2 border-t border-[var(--line-soft)]/40">
                  92% of tasks tracked within nested checklists achieve successful delivery timelines.
                </p>
              </TiltCard>

              <TiltCard className="p-6 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)] flex items-center justify-center mb-3">
                    <FiFolder className="text-lg" />
                  </div>
                  <ProgressBar label="Projects Delivered" percentage={87} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-2 pt-2 border-t border-[var(--line-soft)]/40">
                  87% of project milestones complete without delay using custom role configurations.
                </p>
              </TiltCard>

              <TiltCard className="p-6 bg-white dark:bg-[var(--surface)] border border-[var(--line-soft)] rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] flex items-center justify-center mb-3">
                    <FiZap className="text-lg" />
                  </div>
                  <ProgressBar label="Team Productivity" percentage={95} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-2 pt-2 border-t border-[var(--line-soft)]/40">
                  95% of active head/member teams report enhanced coordination inside shared spaces.
                </p>
              </TiltCard>
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            PRODUCT SHOWCASE SECTION
            ================================================== */}
        <div className="section-divider-gradient" />
        <section id="product-showcase" className="w-full py-20 px-6 flex flex-col items-center">
          <div className="max-w-7xl w-full text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto space-y-3"
            >
              <span className="text-xs uppercase font-bold tracking-widest text-[var(--brand-primary)]">Interactive Showcase</span>
              <h2 className="section-title">A complete workspace preview</h2>
              <p className="section-subtitle">A high-fidelity layout representing how you manage folders, check subtasks, inspect project boards, and view schedules inside TaskFlow.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="border border-[var(--line-soft)] rounded-2xl bg-white dark:bg-[var(--surface)] shadow-lg overflow-hidden max-w-4xl mx-auto text-left"
            >
              {/* Fake Window Header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] bg-white dark:bg-[var(--surface)] px-4 py-0.5 border border-[var(--line-soft)] rounded-md">
                  taskflow.app/dashboard/{showcaseTab.toLowerCase()}
                </div>
                <div className="w-8"></div>
              </div>

              {/* Fake Window Body layout */}
              <div className="grid grid-cols-12 min-h-[340px]">
                {/* Fake Sidebar */}
                <div className="col-span-3 border-r border-[var(--line-soft)] bg-[var(--surface-subtle)]/30 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center">TF</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Workspace</span>
                  </div>
                  <div className="space-y-1">
                    {["Overview", "Tasks", "Projects", "Analytics", "Profile"].map((name) => (
                      <button
                        key={name}
                        onClick={() => setShowcaseTab(name)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all text-left ${
                          showcaseTab === name
                            ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-transform ${showcaseTab === name ? "bg-[var(--brand-primary)] scale-110" : "bg-[var(--text-muted)]/50"}`}></span>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fake Content area with AnimatePresence */}
                <div className="col-span-9 p-5 space-y-4 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {showcaseTab === "Overview" && (
                      <motion.div
                        key="Overview"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Productivity Hub</h3>
                          <span className="text-[9px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded font-bold">Jun 2026</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl text-center space-y-1">
                            <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Completed</span>
                            <p className="text-lg font-bold text-[var(--color-success-primary)]">14 Tasks</p>
                          </div>
                          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl text-center space-y-1">
                            <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">In Progress</span>
                            <p className="text-lg font-bold text-[var(--color-warning-primary)]">5 Tasks</p>
                          </div>
                          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl text-center space-y-1">
                            <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Pending</span>
                            <p className="text-lg font-bold text-[var(--color-pending-primary)]">2 Tasks</p>
                          </div>
                        </div>

                        <div className="p-3 border border-[var(--line-soft)] rounded-xl space-y-2">
                          <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wide">Ongoing Milestones</p>
                          <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)]">
                            <span>Brand Overhaul Pass</span>
                            <span className="font-bold text-[var(--brand-primary)]">80%</span>
                          </div>
                          <div className="h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--brand-primary)]" style={{ width: "80%" }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {showcaseTab === "Tasks" && (
                      <motion.div
                        key="Tasks"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Checklist Items</h3>
                          <span className="text-[9px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded font-bold">6 Active</span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { text: "Initialize production environment", checked: true },
                            { text: "Review role permissions layout", checked: true },
                            { text: "Verify compiler build compatibility", checked: false }
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 p-2 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-lg text-[10px]">
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                item.checked ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : "border-[var(--line-soft)] bg-white"
                              }`}>
                                {item.checked && <FiCheck size={10} />}
                              </div>
                              <span className={item.checked ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)] font-medium"}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {showcaseTab === "Projects" && (
                      <motion.div
                        key="Projects"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Active Projects</h3>
                          <span className="text-[9px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded font-bold">3 Workspaces</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            { title: "TaskFlow Engine", role: "Head", label: "Restricted" },
                            { title: "Marketing Page", role: "Member", label: "Collaborator" },
                            { title: "Client Deliverables", role: "Viewer", label: "Locked" }
                          ].map((p, idx) => (
                            <div key={idx} className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl space-y-1.5">
                              <p className="text-[10px] font-bold text-[var(--text-primary)] truncate">{p.title}</p>
                              <div className="flex items-center justify-between text-[8px] gap-2">
                                <span className="text-[var(--brand-secondary)] font-bold">{p.role} Mode</span>
                                <span className="text-[var(--text-muted)] truncate">{p.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {showcaseTab === "Analytics" && (
                      <motion.div
                        key="Analytics"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Workload Metrics</h3>
                          <span className="text-[9px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded font-bold">Active Statistics</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl">
                            <span className="text-[8px] text-[var(--text-muted)] uppercase">Completion Rate</span>
                            <p className="text-lg font-bold text-[var(--color-success-primary)] mt-0.5">91%</p>
                          </div>
                          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl">
                            <span className="text-[8px] text-[var(--text-muted)] uppercase">Total Workload</span>
                            <p className="text-lg font-bold text-[var(--brand-primary)] mt-0.5">48 Cards</p>
                          </div>
                        </div>

                        <div className="h-6 w-full flex items-center justify-between gap-1 px-1">
                          {[35, 45, 20, 80, 50, 95, 60].map((val, idx) => (
                            <div key={idx} className="flex-1 h-full bg-[var(--line-soft)] rounded-sm overflow-hidden flex items-end">
                              <div className="w-full bg-[var(--brand-primary)]" style={{ height: `${val}%` }}></div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {showcaseTab === "Profile" && (
                      <motion.div
                        key="Profile"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Profile Configuration</h3>
                          <span className="text-[9px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded font-bold">Twilio Integration</span>
                        </div>

                        <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-xl text-center space-y-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mx-auto text-xs">
                            <FiBell />
                          </div>
                          <p className="text-[9px] text-[var(--text-muted)] max-w-[200px] mx-auto leading-relaxed">
                            SMS reminders are fully configured. Alerts will dispatch 24 hours before deadlines.
                          </p>
                          <div className="py-1 px-2.5 bg-[var(--color-success-bg)] text-[var(--color-success-primary)] text-[8px] font-bold rounded inline-block">
                            +1 (555) 019-2834
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            FAQ SECTION
            ================================================== */}
        <div className="section-divider-gradient" />
        <section id="faq" className="w-full py-20 px-6 bg-white/40 dark:bg-[var(--surface-subtle)]/20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl w-full text-center space-y-12"
          >
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[var(--brand-primary)]">Support & Security</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">Everything you need to know about security, roles, and integrations.</p>
            </div>

            <div className="space-y-3 text-left">
              <FAQItem
                question="How secure are project workspace invitations?"
                answer="Every invitation generates a single-use tokenized email link. Only authenticated accounts clicking that unique verification link can gain project workspace entry, preventing public indexing and session leakage."
              />
              <FAQItem
                question="Can I customize roles for my collaborators?"
                answer="Yes. TaskFlow supports three distinct permissions: Head (project creator with read/write access), Member (assigned task access and checklist complete permissions), and Viewer (read-only context with locked buttons/forms)."
              />
              <FAQItem
                question="How do automated SMS notifications work?"
                answer="Once you edit your profile to add and verify a valid mobile number, TaskFlow schedules notifications via Twilio for critical checklists, teammate comments, and upcoming due date limits."
              />
              <FAQItem
                question="Does TaskFlow support Google SSO?"
                answer="Absolutely. You can log in or register instantly using your Google Account, securing your session credentials without managing separate passwords."
              />
            </div>
          </motion.div>
        </section>

        {/* ==================================================
            CALL TO ACTION (PRE-FOOTER)
            ================================================== */}
        <div className="section-divider-gradient" />
        <section className="w-full py-20 px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl w-full rounded-2xl bg-[var(--brand-accent)] text-white p-10 md:p-14 text-center shadow-xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-[-30%] right-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Start organizing your workflows today
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)] bg-[var(--app-bg)] hover:bg-white rounded-xl transition-all duration-200 shadow-md"
              >
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 hover:border-white/50 bg-white/5 rounded-xl transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* --- FOOTER (PREMIUM DARK FOOTER) --- */}
      <div className="section-divider-gradient" />
      <footer className="w-full bg-[#0A1F35] text-[#E8F3FC] py-16 px-6 flex flex-col items-center relative z-10 text-xs">
        <div className="max-w-7xl w-full grid grid-cols-2 md:grid-cols-5 gap-8 text-left mb-12">
          <div className="space-y-4 col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center shadow-md shadow-[var(--brand-primary)]/10">
                <FiCheckSquare className="text-white text-sm" />
              </div>
              <span className="font-bold text-base text-[#E8F3FC] tracking-tight">TaskFlow</span>
            </div>
            <p className="text-[11px] text-[#A5BDD3] leading-relaxed max-w-sm">
              An elegant, real-time productivity SaaS designed to centralize tasks, project boards, collaborator invite structures, and performance analytics.
            </p>
            {/* Newsletter input placeholder */}
            <div className="space-y-2 pt-2 max-w-xs">
              <p className="text-[10px] font-bold text-[#E8F3FC] uppercase tracking-wide">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-[#162F4A] border border-[#183350] rounded-lg px-3 py-2 text-xs text-[#E8F3FC] outline-none focus:border-[var(--brand-secondary)] flex-1 min-w-0"
                />
                <button className="bg-[var(--brand-primary)] text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--brand-primary)]/90 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <h4 className="font-bold text-[#E8F3FC] uppercase tracking-wider text-[10px]">Product</h4>
            <ul className="space-y-2 text-[#A5BDD3]">
              <li><a href="#features-explorer" className="hover:text-[var(--brand-primary)] transition-colors">Features</a></li>
              <li><a href="#performance" className="hover:text-[var(--brand-primary)] transition-colors">Why TaskFlow</a></li>
              <li><a href="#product-showcase" className="hover:text-[var(--brand-primary)] transition-colors">Showcase</a></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h4 className="font-bold text-[#E8F3FC] uppercase tracking-wider text-[10px]">Resources</h4>
            <ul className="space-y-2 text-[#A5BDD3]">
              <li><a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Security Rules</a></li>
              <li><a href="#" className="hover:text-[var(--brand-primary)] transition-colors">API Guide</a></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h4 className="font-bold text-[#E8F3FC] uppercase tracking-wider text-[10px]">Company</h4>
            <ul className="space-y-2 text-[#A5BDD3]">
              <li><a href="#" className="hover:text-[var(--brand-primary)] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Contact Support</a></li>
              <li><a href="#faq" className="hover:text-[var(--brand-primary)] transition-colors">FAQ Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl w-full border-t border-[#183350] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#A5BDD3]">
            &copy; {currentYear} TaskFlow Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-[#A5BDD3] text-[10px]">
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">Cookie Controls</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
