import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#C4E9ED]/40 py-10 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5B9EA8]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#082F38]">TaskFlow</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#0E7490] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#0E7490] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#0E7490] transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
