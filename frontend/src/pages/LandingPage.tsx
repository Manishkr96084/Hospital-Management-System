import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { AIChatFloating } from '../components/common/AIChatFloating';
import { 
  HeartPulse, Sparkles, Activity, Shield, Users, 
  Calendar, Stethoscope, Clock, CheckCircle2, 
  ArrowRight, Award, Lock, Zap, FileText, 
  TrendingUp, Pill, Brain, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { Doctor, AnalyticsOverview } from '../types';

export const LandingPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docs, st] = await Promise.all([
          hospitalService.getDoctors(),
          hospitalService.getAnalyticsOverview().catch(() => null),
        ]);
        setDoctors(docs.slice(0, 4));
        setStats(st);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const patientJourneySteps = [
    {
      num: '01',
      title: 'Digital Patient Dossier',
      desc: 'Instant self-registration or concierge intake with insurance verification and automated Medical Record Number (MRN).',
      icon: <Users className="w-6 h-6 text-brand-500" />
    },
    {
      num: '02',
      title: 'Intelligent Scheduling',
      desc: 'Real-time doctor calendar sync with zero double-booking and automated SMS/email reminders.',
      icon: <Calendar className="w-6 h-6 text-emerald-500" />
    },
    {
      num: '03',
      title: 'AI Clinical Consultation',
      desc: 'Structured EHR SOAP notes, AI-assisted history summarization, and verified digital prescription generation.',
      icon: <Stethoscope className="w-6 h-6 text-purple-500" />
    },
    {
      num: '04',
      title: 'Diagnostic Lab & Imaging',
      desc: 'Barcoded sample collection, automated bio-analyzer integration, and instant PDF laboratory reports.',
      icon: <Activity className="w-6 h-6 text-amber-500" />
    },
    {
      num: '05',
      title: 'Smart Pharmacy & Dispensing',
      desc: 'Live inventory stock decrementing, batch expiry alerts, and cashless prescription dispensing.',
      icon: <Pill className="w-6 h-6 text-cyan-500" />
    },
    {
      num: '06',
      title: 'Transparent Billing & Discharge',
      desc: 'Itemized invoice generation, multiple payment channels, and physician-authorized discharge summaries.',
      icon: <FileText className="w-6 h-6 text-teal-500" />
    }
  ];

  const faqs = [
    {
      q: 'How does Medivanta AI protect patient health data and privacy?',
      a: 'Medivanta AI is architected in accordance with HIPAA and SOC-2 Type II standards. All sensitive patient records, EHR notes, and lab data are encrypted in transit (TLS 1.3) and at rest (AES-256) with strict role-based access control and immutable audit trails.'
    },
    {
      q: 'How does the Clinical AI Assistant support physicians?',
      a: 'The Doctor AI Assistant helps authorized clinicians summarize longitudinal medical histories, structure raw dictation into standardized SOAP notes, and draft discharge summaries. Every AI-assisted document requires MD review and authorization before formal commit.'
    },
    {
      q: 'Can patients download digital PDF prescriptions and diagnostic lab reports?',
      a: 'Yes. Patients can access authenticated, digitally stamped PDF prescriptions, laboratory test reports, and itemized billing statements directly from their patient portal anytime.'
    },
    {
      q: 'How does the live bed and floor management system operate?',
      a: 'The floor management system maintains a real-time interactive matrix across ICU, Emergency, General Wards, and Private Suites, indicating availability, patient admissions, and maintenance statuses.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-mesh-light dark:bg-mesh-dark">
        {/* Glowing Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Pill */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-brand-500/30 text-xs font-bold text-brand-600 dark:text-brand-400 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin [animation-duration:8s]" />
              <span>Next-Gen AI Clinical Intelligence & Hospital Operating System</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]"
            >
              Healthcare, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400">
                Reimagined with AI.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Intelligent hospital management designed around patients, doctors, and modern healthcare teams. From automated triage to bed management and instant discharge billing.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/appointments')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto shadow-xl shadow-brand-500/30"
              >
                Book Specialist Consultation
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto"
              >
                Explore Command Platform
              </Button>
            </motion.div>

            {/* Accreditation trust chips */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> HIPAA Compliant</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-brand-500" /> JCI Gold Standard</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-indigo-500" /> 256-Bit Encrypted EMR</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> 99.99% Hospital Uptime</span>
            </div>
          </div>

          {/* Interactive Floating Dashboard Preview Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 relative max-w-5xl mx-auto"
          >
            <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-white/40 dark:border-slate-800 shadow-2xl bg-gradient-to-b from-white/80 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-950/80">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-6 relative">
                {/* Visual Dashboard Mock Topbar */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-400 ml-2">medivanta.health/command-center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live ICU Telemetry
                    </span>
                  </div>
                </div>

                {/* Dashboard grid preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400">Today's Appointments</span>
                    <h3 className="text-2xl font-bold mt-1 text-white">{stats?.today_appointments || 28} Confirmed</h3>
                    <p className="text-[11px] text-emerald-400 mt-2 font-medium">96% On-Time Consultations</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400">Bed Occupancy Index</span>
                    <h3 className="text-2xl font-bold mt-1 text-white">{stats?.occupied_beds || 4} / {stats?.total_beds || 64} Beds</h3>
                    <p className="text-[11px] text-brand-400 mt-2 font-medium">Live Ward Grid Synchronized</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400">AI Diagnostic Confidence</span>
                    <h3 className="text-2xl font-bold mt-1 text-white">99.4% Accuracy</h3>
                    <p className="text-[11px] text-indigo-400 mt-2 font-medium">Clinical Triage & SOPs Active</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Hospital Metrics */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400">
                {stats?.total_patients ? `${stats.total_patients}+` : '50+'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Active Patients</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {stats?.total_doctors ? `${stats.total_doctors}` : '15+'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Board Specialists</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">
                {stats?.total_beds ? `${stats.total_beds}` : '64'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Monitored Beds</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                99.8%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Patient Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Journey Flow */}
      <section id="patient-journey" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">
              End-to-End Care Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              The Seamless Digital Patient Journey
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Experience frictionless healthcare connectivity from registration to digital discharge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientJourneySteps.map((step, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-700 font-mono">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialist Doctors Showcase */}
      <section id="doctors" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">
                World-Class Clinical Faculty
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                Leading Medical Specialists
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/doctors')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Doctors
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center group hover:shadow-lg transition-all"
              >
                <img
                  src={doc.user?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces'}
                  alt={doc.user?.full_name}
                  className="w-24 h-24 rounded-2xl object-cover mb-4 border-2 border-brand-500/20 shadow-md group-hover:scale-105 transition-transform"
                />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {doc.user?.full_name}
                </h4>
                <p className="text-xs font-semibold text-brand-500 mt-0.5">
                  {doc.specialization}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {doc.qualification} • {doc.experience_years} yrs exp
                </span>

                <div className="flex items-center gap-1 mt-3 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{doc.rating} / 5.0</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/appointments?doctor_id=${doc.id}`)}
                  className="w-full mt-4"
                >
                  Book (${doc.consultation_fee})
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Healthcare Innovation Feature */}
      <section id="ai-intelligence" className="py-20 lg:py-28 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-xs font-bold text-brand-300">
                <Brain className="w-4 h-4 text-brand-400" />
                <span>Medivanta Clinical Intelligence Engine</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                AI Assistant built for Patient Safety and Physician Efficacy.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Empower your care team with predictive analytics, real-time triage guidance, medication risk screening, and automatic SOAP documentation — completely sandboxed with zero data leaks.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Intelligent Department & Specialist matching based on symptoms',
                  'Doctor SOAP note synthesis & longitudinal dossier summary',
                  'Predictive 7-day patient load and hospital bed occupancy forecasting',
                  'Integrated allergy and contraindication safety alerts'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button
                  variant="emerald"
                  size="lg"
                  onClick={() => navigate('/ai-assistant')}
                  leftIcon={<Sparkles className="w-5 h-5" />}
                >
                  Launch AI Clinical Assistant
                </Button>
              </div>
            </div>

            {/* Visual Chat Preview */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white">Live Clinical Triage Simulation</span>
                </div>
                <span className="text-[10px] text-slate-400">Response time: ~120ms</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-200 max-w-[80%]">
                  "I've been feeling persistent heaviness in my chest after walking upstairs."
                </div>
                <div className="p-3.5 rounded-xl bg-brand-950 border border-brand-800 text-brand-100 max-w-[90%] space-y-2">
                  <p className="font-semibold text-brand-300">⚠️ Clinical Recommendation:</p>
                  <p>
                    Symptoms matching exertional chest pressure warrant immediate evaluation by our <b>Department of Cardiology</b>.
                  </p>
                  <div className="pt-1 flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-[10px] font-bold text-brand-200">
                      Cardiology Suite 401
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-[10px] font-bold text-rose-300">
                      ECG Indicated
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Got Questions?</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-brand-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Experience Medivanta AI Clinical Platform Today</h2>
          <p className="text-sm sm:text-base text-brand-100 max-w-xl mx-auto font-medium">
            Explore with instant 1-click role logins for Doctors, Administrators, Nurses, Lab techs, Pharmacists, and Patients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-slate-950 hover:bg-slate-900 text-white border-0 shadow-2xl"
            >
              Sign In to Demo
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => navigate('/appointments')}
            >
              Book an Appointment
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatFloating />
    </div>
  );
};
