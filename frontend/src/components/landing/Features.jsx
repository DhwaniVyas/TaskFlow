import React from 'react';
import { FiClock, FiUsers, FiActivity } from 'react-icons/fi';
import Card from '../common/Card';

export default function Features() {
  const featureList = [
    {
      icon: <FiClock />,
      title: 'Due Date Tracking',
      description: 'Never miss a deadline. TaskFlow visually flags items as due-soon or overdue using simple semantic layouts.',
      iconBg: 'bg-[#FFF5F0]',
      iconColor: 'text-[#F97316]'
    },
    {
      icon: <FiUsers />,
      title: 'Collaboration First',
      description: 'Invite your team to collaborate, assign owners to tasks, and leave comments in a unified ecosystem.',
      iconBg: 'bg-[#E2F4F6]',
      iconColor: 'text-[#0E7490]'
    },
    {
      icon: <FiActivity />,
      title: 'Interactive Dashboards',
      description: 'Gain visibility over active projects, sprint velocity, and bottlenecks using beautiful visual graphs.',
      iconBg: 'bg-green-50',
      iconColor: 'text-[#16A34A]'
    }
  ];

  return (
    <section id="features" className="w-full bg-[#E2F4F6]/30 py-24 border-y border-[#C4E9ED]/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="section-label">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#082F38] mt-2 font-sans">
            Everything you need to stay in sync
          </h2>
          <p className="text-base text-[#5B9EA8] max-w-xl mx-auto mt-4 font-normal">
            Streamlined features designed to eliminate friction and maximize output for modern teams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featureList.map((feature, idx) => (
            <Card key={idx} hoverable={true} className="bg-white p-8 border-[#C4E9ED]/50 flex flex-col items-start text-left">
              <div className={`w-12 h-12 rounded-xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-6 text-xl font-bold shadow-sm`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#082F38] mb-3 font-sans">
                {feature.title}
              </h3>
              <p className="text-sm text-[#5B9EA8] leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
