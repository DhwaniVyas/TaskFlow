import React from 'react';
import { FiLayout, FiUserPlus, FiTrendingUp } from 'react-icons/fi';
import Card from '../common/Card';

export default function Workflow() {
  const steps = [
    {
      num: '01',
      icon: <FiLayout />,
      title: 'Plan & Organize',
      description: 'Create customizable workspaces, outline sprints, and map out your project timelines with high fidelity.'
    },
    {
      num: '02',
      icon: <FiUserPlus />,
      title: 'Collaborate Seamlessly',
      description: 'Assign tasks to owners, exchange files, and stay updated with real-time activities across channels.'
    },
    {
      num: '03',
      icon: <FiTrendingUp />,
      title: 'Deliver on Time',
      description: 'Track velocity bottlenecks with interactive visual widgets, and finalize sprints on schedule.'
    }
  ];

  return (
    <section id="workflow" className="w-full bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="section-label">Workflow</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#082F38] mt-2 font-sans">
            How TaskFlow Works
          </h2>
          <p className="text-base text-[#5B9EA8] max-w-xl mx-auto mt-4 font-normal">
            A simple, repeatable process to take your projects from ideation to delivery.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-[#C4E9ED]/20 via-[#C4E9ED] to-[#C4E9ED]/20 -translate-y-12 z-0"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center relative z-10">
              <Card hoverable={true} className="w-full p-8 border-[#C4E9ED]/50 bg-[#F0F9FA]/40 hover:bg-white shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border border-[#C4E9ED] flex items-center justify-center text-2xl text-[#0E7490] shadow-md mb-6 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center shadow">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#082F38] mb-3 font-sans">
                  {step.title}
                </h3>
                <p className="text-sm text-[#5B9EA8] leading-relaxed">
                  {step.description}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
