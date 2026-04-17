import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Code, Mic, Wrench, HeartHandshake } from 'lucide-react';

const TEAM_MEMBERS = [
  { name: "Prakhar Agnihotri", role: "Team Leader & Core Innovator", desc: "Full-stack architect & algorithm designer.", icon: Code },
  { name: "Lakshita Chawla", role: "Support & Operations", desc: "Ensures seamless team coordination and documentation.", icon: HeartHandshake },
  { name: "Parineeta Jain", role: "Hardware Expert", desc: "Specialist in physical infrastructure and optimization.", icon: Cpu },
  { name: "Shreeyanshu Vats", role: "Lead Presenter", desc: "The voice of VectorHire, turning code into stories.", icon: Mic },
  { name: "Aditya Sengar", role: "Technical Strategist", desc: "Versatile engineer focused on implementation.", icon: Wrench },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Link to="/" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Team VectorHire
            </h1>
            <p className="text-slate-400 mt-1">The minds behind the machine.</p>
          </div>
        </div>

        {/* Team Grid */}
        <div className="space-y-6">
          {TEAM_MEMBERS.map((member, idx) => (
            <div key={idx} className="flex items-center gap-6 p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all group">
              
              {/* Photo Box Placeholder */}
              <div className="w-24 h-24 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border-2 border-dashed border-slate-700 group-hover:border-blue-500/50">
                <span className="text-xs text-slate-600 text-center px-2">Photo Pending</span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <member.icon size={18} className="text-blue-400" />
                  <h3 className="text-xl font-bold text-slate-100">{member.name}</h3>
                </div>
                <p className="text-sm font-semibold text-blue-400 mb-2">{member.role}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{member.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AboutUs;