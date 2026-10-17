import React from 'react';
import { HeartPulse, ShieldCheck, Award, Lock, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-lg">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                MEDIVANTA <span className="text-xs text-brand-400 font-bold">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Pioneering the future of patient care with predictive clinical intelligence, zero-latency workflows, and luxury healthcare experiences.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>HIPAA & SOC-2 Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>JCI Accredited</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ecosystem</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/appointments" className="hover:text-white transition-colors">Book Consultations</Link></li>
              <li><Link to="/doctors" className="hover:text-white transition-colors">Specialist Directory</Link></li>
              <li><Link to="/laboratory" className="hover:text-white transition-colors">Diagnostic Labs</Link></li>
              <li><Link to="/pharmacy" className="hover:text-white transition-colors">Pharmacy Refills</Link></li>
              <li><Link to="/beds" className="hover:text-white transition-colors">Live Bed Tracking</Link></li>
            </ul>
          </div>

          {/* Clinical Centers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Institutes</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors">Cardiovascular Institute</span></li>
              <li><span className="hover:text-white transition-colors">Neurovascular Center</span></li>
              <li><span className="hover:text-white transition-colors">Robotic Orthopedics</span></li>
              <li><span className="hover:text-white transition-colors">Precision Oncology</span></li>
              <li><span className="hover:text-white transition-colors">Pediatric Pavilion</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact & Concierge</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>108 Healthway Blvd, Medical City, MC 94016</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+1 (800) 555-MEDI (6334)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>concierge@medivanta.health</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Medivanta AI Health Systems, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Clinical Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
