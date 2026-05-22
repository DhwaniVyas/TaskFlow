import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../common/Button';

export default function CTA() {
  return (
    <section id="cta" className="w-full bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] py-20 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 font-sans leading-tight">
          Ready to streamline your workflow?
        </h2>
        <p className="text-lg text-white/80 max-w-xl mb-10 font-normal leading-relaxed">
          Join thousands of creators, builders, and developers who manage tasks beautifully every single day.
        </p>
        <Link to="/register">
          <Button 
            variant="accent" 
            className="px-8 py-4 text-base font-semibold shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 bg-[#F97316] border-[#F97316] text-white hover:bg-[#C2410C]"
          >
            Get Started for Free <FiArrowRight />
          </Button>
        </Link>
      </div>
    </section>
  );
}
