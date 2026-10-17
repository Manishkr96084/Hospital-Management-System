import React, { useState, useRef, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { AIChatMessage } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bot, Sparkles, Send, Volume2, VolumeX, ShieldAlert, 
  ArrowRight, HeartPulse, Stethoscope, Pill, Calendar 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      sender: 'ai',
      text: `Welcome to **Medivanta AI Clinical Concierge**. I am your automated healthcare triage assistant.\n\nI can assist you with:\n• **Symptom guidance & appropriate specialty matching**\n• **Finding doctors & booking consultation slots**\n• **Understanding laboratory test results and normal reference ranges**\n• **Medication precautions and hospital navigation**\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_actions: ['Chest Pain Guidance', 'Persistent Migraine', 'Book Cardiology Consultation', 'Check Lab Tests'],
      disclaimer: 'Medivanta AI provides educational and triage assistance only. In an acute emergency, please contact 1-800-555-MEDI or visit Level 1 Emergency.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await hospitalService.chatWithAI(textToSend, historyPayload);
      const aiMsg: AIChatMessage = {
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_actions: res.suggested_actions,
        disclaimer: res.disclaimer
      };
      setMessages(prev => [...prev, aiMsg]);
      speakText(res.reply);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'The AI engine is temporarily experiencing high load. Please feel free to retry your query or reach the central care helpline at +1 (800) 555-MEDI.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.toLowerCase().includes('book') || action.toLowerCase().includes('appointment')) {
      navigate('/appointments');
    } else if (action.toLowerCase().includes('lab')) {
      navigate('/laboratory');
    } else if (action.toLowerCase().includes('doctor')) {
      navigate('/doctors');
    } else {
      handleSend(action);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-brand-500" />
            <span>Medivanta AI Clinical Assistant</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Intelligent symptom triage, department guidance, and medical terminology translator
          </p>
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
            voiceEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-500'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{voiceEnabled ? 'Voice Active' : 'Voice Muted'}</span>
        </button>
      </div>

      {/* Main Chat Container Card */}
      <Card className="p-0 overflow-hidden flex flex-col h-[680px] shadow-xl border-slate-200 dark:border-slate-800">
        {/* Safety Disclaimer Banner */}
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span><b>Clinical Safety Notice:</b> Medivanta AI Assistant provides educational and triage assistance only. It is not an alternative to professional clinical examination.</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[85%]">
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                    {msg.text}
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-11">
                {msg.timestamp}
              </span>

              {/* Action Pills */}
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
                  {msg.suggested_actions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={() => handleActionClick(act)}
                      className="text-xs px-3 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-full font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <span>{act}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 ml-11">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Medivanta AI is formulating clinical guidance...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your medical symptoms, medication question, or hospital navigation inquiry..."
            className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || loading}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};
