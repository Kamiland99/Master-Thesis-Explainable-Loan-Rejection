import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Applicant } from '../data';
import { ApplicantOverview } from './ApplicantOverview';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWindowProps {
  applicant: Applicant;
  history: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentIndex: number;
  total: number;
}

const SUGGESTIONS = [
  "Tell me about this loan application",
  "What are the relevant factors in this loan application?",
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  applicant,
  history,
  onSendMessage,
  isTyping,
  onNext,
  onBack,
  onFinish,
  isFirst,
  isLast,
  currentIndex,
  total,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const genderRaw = applicant.rawFeatures['personal_status'] || '';
  const gender = genderRaw.toLowerCase().includes('female') ? 'female' : 'male';
  const duration = applicant.rawFeatures['duration'] || 'unknown';
  const purpose = applicant.rawFeatures['purpose'] || 'unknown';
  const amount = applicant.rawFeatures['credit_amount'] || 'unknown';
  const age = applicant.rawFeatures['age'] || 'unknown';
  const welcomeText = `Hello! I am the AI Assistant. I see this ${age}-year-old ${gender} applicant wanted to get a loan of ${amount}€ for ${duration} months for the purpose of ${purpose}, but was rejected by our automated system. I cannot give you a simple checklist to fix it, but I am here to help you discover the case, investigate the data, and understand the risk factors behind this decision. What would you like to know first?`;

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-slate-50/50 p-6 overflow-y-auto hidden lg:flex flex-col">
        <ApplicantOverview applicant={applicant} />

        <div className="mt-auto pt-8 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              disabled={isFirst}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={onNext}
              disabled={isLast}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {isLast && (
            <button
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finish Experiment</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-100">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800 leading-tight">AI Assistant</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Analyzing Applicant {currentIndex + 1} of {total}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
        >
          <AnimatePresence initial={false}>
            {[
              {
                role: 'model' as const,
                text: welcomeText
              },
              ...history
            ].map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
                  }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j} className="font-bold text-blue-900">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 rounded-tl-none">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <footer className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask about this loan application..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[48px] max-h-32"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
};
