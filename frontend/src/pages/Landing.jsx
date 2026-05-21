import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiClock, 
  FiUsers, 
  FiActivity, 
  FiPlus, 
  FiPlay, 
  FiCheckSquare,
  FiCalendar
} from 'react-icons/fi';

export default function Landing() {
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Refactor user auth controller', status: 'in-progress', priority: 'high', project: 'Cobalt', category: 'Backend' },
    { id: 2, title: 'Design system typography specs', status: 'done', priority: 'medium', project: 'Leaf', category: 'Design' },
    { id: 3, title: 'Deploy staging build to Vercel', status: 'due-soon', priority: 'urgent', project: 'Ember', category: 'DevOps' },
  ]);

  const toggleTaskStatus = (id) => {
    setDemoTasks(prev => 
      prev.map(task => {
        if (task.id === id) {
          const nextStatus = task.status === 'done' ? 'in-progress' : 'done';
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'done': return 'badge-status-done';
      case 'in-progress': return 'badge-status-in-progress';
      case 'due-soon': return 'badge-status-due-soon';
      default: return 'badge-status-todo';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getProjectBg = (project) => {
    switch (project) {
      case 'Ember': return 'project-bg-ember';
      case 'Leaf': return 'project-bg-leaf';
      default: return 'project-bg-cobalt';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FA] to-white flex flex-col">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-[#C4E9ED]/40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] flex items-center justify-center shadow-md">
            <FiCheckSquare className="text-white text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#082F38] font-sans">
            Task<span className="text-[#F97316]">Flow</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#082F38]">
          <a href="#features" className="hover:text-[#0E7490] transition-colors">Features</a>
          <a href="#demo" className="hover:text-[#0E7490] transition-colors">Interactive Demo</a>
          <a href="#pricing" className="hover:text-[#0E7490] transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="btn btn-ghost hover:text-[#0E7490]">
            Log In
          </Link>
          <Link to="/register" className="btn btn-accent">
            Get Started <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2F4F6] text-[#0E7490] text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <FiActivity className="text-sm" /> Productive task management reimagined
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#082F38] max-w-4xl leading-tight font-sans"
          >
            Where clarity meets{' '}
            <span className="bg-gradient-to-r from-[#0E7490] to-[#F97316] bg-clip-text text-transparent">
              productivity.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-[#5B9EA8] max-w-2xl font-normal leading-relaxed"
          >
            Organize tasks, collaborate with your team, and track project status seamlessly in one clean workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
          >
            <Link to="/register" className="btn btn-accent px-8 py-3 text-base shadow-lg">
              Start for Free <FiArrowRight className="ml-2" />
            </Link>
            <a href="#demo" className="btn btn-secondary px-8 py-3 text-base">
              Try Interactive Demo <FiPlay className="ml-2 text-sm text-[#0E7490]" />
            </a>
          </motion.div>
        </section>

        {/* Interactive Demo Dashboard (Teaser) */}
        <section id="demo" className="w-full max-w-4xl px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="card relative border-[#C4E9ED]/60 bg-white p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E2F4F6] gap-4 mb-6">
              <div>
                <span className="section-label">Active Sprint</span>
                <h3 className="page-title mt-1">Product Roadmap v1.2</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[#5B9EA8]">Overall Progress</p>
                  <p className="text-sm font-semibold text-[#082F38]">66% Done</p>
                </div>
                <div className="w-24 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-[#16A34A]"></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {demoTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#C4E9ED]/40 transition-all hover:bg-[#F0F9FA]/40 ${
                    task.status === 'done' ? 'bg-[#DCFCE7]/10' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        task.status === 'done' 
                          ? 'bg-[#16A34A] border-[#16A34A] text-white' 
                          : 'border-[#80CDD6] hover:border-[#0E7490] bg-white'
                      }`}
                    >
                      {task.status === 'done' && <FiCheckCircle className="text-sm" />}
                    </button>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        task.status === 'done' ? 'line-through text-[#5B9EA8]' : 'text-[#082F38]'
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`w-2 h-2 rounded-full ${getProjectBg(task.project)}`}></span>
                        <span className="text-xs text-[#5B9EA8] font-medium">{task.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 sm:mt-0 pl-8 sm:pl-0">
                    <div className={`priority-indicator ${getPriorityClass(task.priority)}`}>
                      <span className="priority-dot"></span>
                      <span className="capitalize text-xs">{task.priority}</span>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center text-xs text-[#5B9EA8]">
              <span className="flex items-center gap-1">
                <FiCalendar /> Updated just now
              </span>
              <button 
                onClick={() => setDemoTasks(prev => [
                  ...prev, 
                  { id: Date.now(), title: 'Mock newly added task item', status: 'in-progress', priority: 'medium', project: 'Leaf', category: 'Idea' }
                ])}
                className="flex items-center gap-1 text-[#0E7490] hover:text-[#164E63] font-semibold transition-colors"
              >
                <FiPlus /> Add Mock Task
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full bg-[#E2F4F6]/30 py-20 border-y border-[#C4E9ED]/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="section-label">Features</span>
              <h2 className="text-3xl font-bold text-[#082F38] mt-2 font-sans">
                Everything you need to stay in sync
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-white p-6 border-[#C4E9ED]/50 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-[#FFF5F0] text-[#F97316] flex items-center justify-center mb-5 text-xl font-bold shadow-sm">
                  <FiClock />
                </div>
                <h3 className="section-heading text-[#082F38] mb-3">Due Date Tracking</h3>
                <p className="text-sm text-[#5B9EA8] leading-relaxed">
                  Never miss a deadline. TaskFlow visually flags items as due-soon or overdue using simple semantic layouts.
                </p>
              </div>

              <div className="card bg-white p-6 border-[#C4E9ED]/50 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-[#E2F4F6] text-[#0E7490] flex items-center justify-center mb-5 text-xl font-bold shadow-sm">
                  <FiUsers />
                </div>
                <h3 className="section-heading text-[#082F38] mb-3">Collaboration First</h3>
                <p className="text-sm text-[#5B9EA8] leading-relaxed">
                  Invite your team to collaborate, assign owners to tasks, and leave comments in an unified ecosystem.
                </p>
              </div>

              <div className="card bg-white p-6 border-[#C4E9ED]/50 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-[#16A34A] flex items-center justify-center mb-5 text-xl font-bold shadow-sm">
                  <FiActivity />
                </div>
                <h3 className="section-heading text-[#082F38] mb-3">Interactive Dashboards</h3>
                <p className="text-sm text-[#5B9EA8] leading-relaxed">
                  Gain visibility over active projects, sprint velocity, and bottlenecks using beautiful visual graphs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#C4E9ED]/40 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5B9EA8]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#082F38]">TaskFlow</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#0E7490]">Privacy Policy</a>
            <a href="#" className="hover:text-[#0E7490]">Terms of Service</a>
            <a href="#" className="hover:text-[#0E7490]">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
