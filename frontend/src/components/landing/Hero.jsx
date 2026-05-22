import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiArrowRight, 
  FiPlus, 
  FiCheckCircle,
  FiCalendar
} from 'react-icons/fi';
import Button from '../common/Button';
import Card from '../common/Card';

export default function Hero() {
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
    <section className="w-full max-w-7xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
      {/* Intro tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2F4F6] text-[#0E7490] text-xs font-semibold uppercase tracking-wider mb-6"
      >
        <FiActivity className="text-sm animate-pulse" /> Productive task management reimagined
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#082F38] max-w-4xl leading-tight font-sans"
      >
        Organize your work.<br />
        <span className="bg-gradient-to-r from-[#0E7490] to-[#F97316] bg-clip-text text-transparent">
          Simplify your life.
        </span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-lg md:text-xl text-[#5B9EA8] max-w-2xl font-normal leading-relaxed"
      >
        Manage tasks and projects from one beautiful workspace.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row gap-4 items-center mb-20"
      >
        <Link to="/register">
          <Button variant="accent" className="px-8 py-3 text-base shadow-lg hover:scale-102 transition-transform flex items-center gap-2">
            Get Started <FiArrowRight />
          </Button>
        </Link>
        <a href="#features">
          <Button variant="secondary" className="px-8 py-3 text-base">
            Learn More
          </Button>
        </a>
      </motion.div>

      {/* Interactive Demo Dashboard (Teaser) */}
      <motion.div
        id="demo"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="w-full max-w-4xl text-left"
      >
        <Card hoverable={false} className="border-[#C4E9ED]/60 bg-white p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2F4F6] gap-4 mb-6">
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
              className="flex items-center gap-1 text-[#0E7490] hover:text-[#164E63] font-semibold transition-colors focus:outline-none"
            >
              <FiPlus /> Add Mock Task
            </button>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
