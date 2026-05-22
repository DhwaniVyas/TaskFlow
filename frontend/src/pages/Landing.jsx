import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Workflow from '../components/landing/Workflow';
import CTA from '../components/landing/CTA';
import Footer from '../components/layout/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FA] to-white flex flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        <Hero />
        <Features />
        <Workflow />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
