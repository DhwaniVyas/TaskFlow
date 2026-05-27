import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckSquare, FiArrowRight, FiMenu, FiX } from 'react-icons/fi';
import Button from '../common/Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative w-full border-b border-[#C4E9ED]/40 bg-white/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] flex items-center justify-center shadow-md">
            <FiCheckSquare className="text-white text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#082F38] font-sans">
            Task<span className="text-[#F97316]">Flow</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#082F38]">
          <a href="#features" className="hover:text-[#0E7490] transition-colors">Features</a>
          <a href="#workflow" className="hover:text-[#0E7490] transition-colors">Workflow</a>
          <a href="#cta" className="hover:text-[#0E7490] transition-colors">Pricing</a>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="hover:text-[#0E7490]">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="accent" className="flex items-center gap-2">
              Get Started <FiArrowRight />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-[#082F38] hover:text-[#0E7490] transition-colors focus:outline-none"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-[#C4E9ED]/40 py-6 px-6 flex flex-col gap-4 shadow-lg md:hidden animate-fade-in">
          <a
            href="#features"
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-[#082F38] hover:text-[#0E7490] py-2 border-b border-gray-50"
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-[#082F38] hover:text-[#0E7490] py-2 border-b border-gray-50"
          >
            Workflow
          </a>
          <a
            href="#cta"
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-[#082F38] hover:text-[#0E7490] py-2 border-b border-gray-50"
          >
            Get a start
          </a>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="ghost" className="w-full text-center py-2.5">
                Log In
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="accent" className="w-full text-center py-2.5 flex items-center justify-center gap-2">
                Get Started <FiArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
