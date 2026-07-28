import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APPLICANTS, EXPERIMENT_APPLICANTS, Applicant } from './data';
import { ShapPlot } from './components/ShapPlot';
import { ConditionBIntro } from './components/ConditionBIntro';
import { ConditionAIntro } from './components/ConditionAIntro';
import { ChatWindow } from './components/ChatWindow';
import { ApplicantOverview } from './components/ApplicantOverview';
import { GoogleGenAI } from "@google/genai";
import jsPDF from 'jspdf';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  RotateCcw,
  Info,
  AlertCircle
} from 'lucide-react';

type Condition = 'A' | 'B' | null;
type Screen = 'welcome' | 'intro-a' | 'intro-b' | 'experiment' | 'thanks' | 'explorer';

interface ChatHistory {
  [applicantId: number]: { role: 'user' | 'model'; text: string }[];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [condition, setCondition] = useState<Condition>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomizedApplicants, setRandomizedApplicants] = useState<Applicant[]>([]);
  const [explorerIndex, setExplorerIndex] = useState(0);
  const [jumpToId, setJumpToId] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize randomized order (use 3 borderline cases for experiment)
  const startExperiment = (cond: Condition) => {
    const shuffled = [...EXPERIMENT_APPLICANTS].sort(() => Math.random() - 0.5);
    setRandomizedApplicants(shuffled);
    setCondition(cond);
    setCurrentIndex(0);

    if (cond === 'B') {
      setScreen('intro-b');
    } else {
      setScreen('intro-a');
    }

    // Reset chat histories for new experiment
    setChatHistories({});
  };

  const currentApplicant = randomizedApplicants[currentIndex];

  const handleNext = () => {
    if (currentIndex < randomizedApplicants.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const generateChatPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Rejection Experiment: Chat History', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    randomizedApplicants.forEach((applicant, index) => {
      const history = chatHistories[applicant.id] || [];

      // Check for page overflow
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Applicant Header
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Applicant ${index + 1}: ${applicant.label}`, 20, yPos + 2);
      yPos += 15;

      if (history.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No chat history for this applicant.', 25, yPos);
        yPos += 15;
      } else {
        history.forEach((msg) => {
          const role = msg.role === 'user' ? 'User' : 'AI Assistant';
          const text = msg.text;

          // Check if we need a new page for the role label
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${role}:`, 20, yPos);
          yPos += 6;

          doc.setFont('helvetica', 'normal');
          const splitText = doc.splitTextToSize(text, pageWidth - 40);

          splitText.forEach((line: string) => {
            if (yPos > 285) {
              doc.addPage();
              yPos = 20;
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.text(`${role} (continued)...`, 20, yPos);
              yPos += 8;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
            }
            doc.text(line, 25, yPos);
            yPos += 5;
          });
          yPos += 5; // Space after message
        });
      }
      yPos += 10;
    });

    doc.save('loan-experiment-chat-history.pdf');
  };

  const handleFinish = () => {
    if (condition === 'B') {
      generateChatPdf();
    }
    setScreen('thanks');
  };

  const handleReset = () => {
    setScreen('welcome');
    setCondition(null);
    setCurrentIndex(0);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentApplicant) return;

    const applicantId = currentApplicant.id;
    const currentHistory = chatHistories[applicantId] || [];

    // Update local state immediately for user message
    const newHistory = [...currentHistory, { role: 'user' as const, text }];
    setChatHistories(prev => ({
      ...prev,
      [applicantId]: newHistory
    }));

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); // GEMINI_API_KEY is set in .env file

      // Construct system prompt with strict constraints and progressive disclosure
      const systemPrompt = `
You are an AI Credit Risk Assistant designed to help a user understand why an automated machine learning model rejected a specific applicant's loan application.

Your goal is to explain the decision in simple, conversational language, but you must act as a GUIDE. Your objective is to help the user better understand the loan application and invent solutions for how the applicant could get the loan approved in the future. You want to help the user figure out the solution themselves.

PRONOUN & PERSPECTIVE RULES:
- The user you are chatting with is reviewing the applicant's file; the user is NOT the applicant. 
- NEVER use "you", "your", or "yours" when referring to the loan, the data, or the risk factors (e.g., strictly avoid phrases like "your application" or "increased your risk").
- ALWAYS use the correct third-person pronouns (he/his, she/her) based on the applicant's details in the provided JSON data. If gender is unknown, use "the applicant".

DATA INTERPRETATION RULES:
1. You are looking at "Risk Impact Factors" (which are SHAP values). IMPORTANT: Multiply the raw SHAP values in the data by 100 to get the percentage point impact. For example, 0.081 means an 8.1% impact.
2. POSITIVE values INCREASED the risk score (Pushed toward REJECTION).
3. NEGATIVE values DECREASED the risk score (Pushed toward APPROVAL).
4. The total risk score is ${(currentApplicant.totalRisk * 100).toFixed(1)}%. Anything over 50.0% results in rejection.

CONVERSATIONAL BEHAVIOR & PROGRESSIVE DISCLOSURE:
- When first asked why the loan was rejected, ONLY reveal the top 1 or 2 features with the highest POSITIVE impact values. Only if asked again, list the next features, even all of them if asked specifically about it.
- If asked what factors HELPED the application, ONLY reveal the top 1 or 2 features with the highest NEGATIVE impact value. Only if asked again, list the next features, even all of them if asked specifically about it.
- Wait for the user to ask follow-up questions before revealing more details. Keep it conversational.

THE "NO SPOON-FEEDING" RULE (CRITICAL):
- If the user asks "How can this be fixed?" or "What should be done?", DO NOT just give them a bulleted list of answers.
- Instead, guide them. Point out which of the negative factors are "changeable" (like Loan Duration, Savings Account, or Loan Amount) versus "unchangeable" (like Age or Past Credit History).
- Ask them a guiding question to make them deduce the action (e.g., "I see that the length of the loan (48 months) heavily increased the applicant's risk. Since we can't change his/her age, what do you think could be changed about the loan request?"). Do not ask in every sentence, but every 2-3 answers.
- If the user suggests an impossible action (like "Change the applicant's age"), gently correct them and ask for a realistic financial step.
- Respond to users' answers, confirming or kindly correcting their observations.

STRICT HALLUCINATION CONSTRAINTS:
- ONLY use the factors present in the APPLICANT DATA below.
- Do NOT use nor reveal application IDs like GC-351 etc.
- Do NOT invent financial history, credit scores (like FICO), bank policies, or interest rates that are not in the JSON.
- If asked about a factor not in the data, reply: "I don't have access to that specific information in the applicant's file."
- Do not use the terms "SHAP", "Machine Learning", or "Algorithm" with the user; use "Risk Factors" or "Our System".
- When discussing the numeric impact of a risk factor, ALWAYS state it as a percentage (e.g., "increased the risk by 8.1%").
- MAXIMUM LENGTH: Keep every response under 100 words to ensure a back-and-forth chat.

APPLICANT DATA (JSON):
${JSON.stringify(currentApplicant, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          ...currentHistory.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const responseText = response.text;

      setChatHistories(prev => ({
        ...prev,
        [applicantId]: [...(prev[applicantId] || []), { role: 'model' as const, text: responseText }]
      }));
    } catch (error) {
      console.error("Gemini API Error:", error);
      setChatHistories(prev => ({
        ...prev,
        [applicantId]: [...(prev[applicantId] || []), { role: 'model' as const, text: "I'm sorry, I encountered an error while processing your request. Please try again." }]
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="max-w-3xl w-full">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">
                  Master Thesis Project
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.85]">
                  Loan <br />
                  <span className="text-indigo-600 italic font-serif">Rejection</span> <br />
                  Experiment
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                  Explore explainable AI through two distinct interfaces. <br />
                  Analyze why credit applications were rejected.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                  onClick={() => startExperiment('A')}
                  className="group relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Condition A</h2>
                  <p className="text-slate-500 text-sm">Static Condition: Analyze SHAP plots and feature explanations.</p>
                  <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm">
                    Start Static <ArrowRight size={16} className="ml-2" />
                  </div>
                </button>

                <button
                  onClick={() => startExperiment('B')}
                  className="group relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageSquare size={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Condition B</h2>
                  <p className="text-slate-500 text-sm">Conversational Condition: Chat with an AI to understand the decision.</p>
                  <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm">
                    Start Conversational <ArrowRight size={16} className="ml-2" />
                  </div>
                </button>
              </div>

              {/* Data Explorer Access (for Researcher) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 pt-12 border-t border-slate-200"
              >
                <button
                  onClick={() => setScreen('explorer')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  <BarChart3 size={18} />
                  Researcher Mode: Data Explorer
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Browse all {APPLICANTS.length} applicants and their SHAP plots to select cases for the experiment.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {screen === 'explorer' && (
          <motion.div
            key="explorer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-6 py-12 min-h-screen flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                    Researcher Mode
                  </span>
                  <h2 className="text-3xl font-black text-slate-900">
                    Data Explorer
                  </h2>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-sm font-bold text-slate-400">
                  Applicant {explorerIndex + 1} of {APPLICANTS.length}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Applicant ID"
                    value={jumpToId}
                    onChange={(e) => setJumpToId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && jumpToId.trim() !== '') {
                        const searchStr = jumpToId.trim().toUpperCase();
                        const searchId = parseInt(searchStr.replace('GC-', ''), 10);
                        const idx = APPLICANTS.findIndex(a => a.id === searchId);
                        if (idx !== -1) {
                          setExplorerIndex(idx);
                          setJumpToId('');
                        } else {
                          alert(`Applicant with ID ${searchStr} not found.`);
                        }
                      }
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => setExplorerIndex(prev => Math.max(0, prev - 1))}
                    disabled={explorerIndex === 0}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={() => setExplorerIndex(prev => Math.min(APPLICANTS.length - 1, prev + 1))}
                    disabled={explorerIndex === APPLICANTS.length - 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{APPLICANTS[explorerIndex].label} (ID: {APPLICANTS[explorerIndex].displayId})</h3>
                  <p className="text-slate-500">Risk Probability: {(APPLICANTS[explorerIndex].prob * 100).toFixed(1)}%</p>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${APPLICANTS[explorerIndex].prob > 0.5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {APPLICANTS[explorerIndex].prob > 0.5 ? 'Rejected' : 'Approved'}
                </div>
              </div>

              <ShapPlot applicant={APPLICANTS[explorerIndex]} />

              <div className="mt-12 pt-8 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4">Raw Data Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {APPLICANTS[explorerIndex].summary.map((s, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.k}</div>
                      <div className="text-sm font-medium text-slate-700">{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'intro-a' && (
          <ConditionAIntro onStart={() => setScreen('experiment')} />
        )}

        {screen === 'intro-b' && (
          <ConditionBIntro onStart={() => setScreen('experiment')} />
        )}

        {screen === 'experiment' && currentApplicant && (
          <motion.div
            key="experiment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-6 py-12 min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                  title="Return to Welcome Screen"
                >
                  <RotateCcw size={20} />
                </button>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                    Applicant {currentIndex + 1} of {randomizedApplicants.length}
                  </span>
                  <h2 className="text-3xl font-black text-slate-900">
                    {condition === 'A' ? 'Static Analysis' : 'Conversational Analysis'}
                  </h2>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / randomizedApplicants.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {condition === 'A' ? (
                <motion.div
                  key={`static-${currentApplicant.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
                >
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-slate-900">Why Your Loan Was Rejected</h3>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${currentApplicant.totalRisk > 0.5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {currentApplicant.totalRisk > 0.5 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        <div>
                          <div className="text-sm font-black uppercase tracking-tight leading-none mb-1">
                            {currentApplicant.totalRisk > 0.5 ? 'Loan Rejected' : 'Loan Approved'}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none">
                            Risk Score: {(currentApplicant.totalRisk * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        <span className="text-slate-600">RED: Increases Risk (Rejection)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                        <span className="text-slate-600">BLUE: Lowers Risk (Approval)</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-tighter">
                        <Info size={12} /> SHAP Value Visualization
                      </div>
                    </div>
                  </div>

                  <ShapPlot applicant={currentApplicant} />
                </motion.div>
              ) : (
                <ChatWindow
                  applicant={currentApplicant}
                  history={chatHistories[currentApplicant.id] || []}
                  onSendMessage={handleSendMessage}
                  isTyping={isGenerating}
                  onNext={handleNext}
                  onBack={handleBack}
                  onFinish={handleFinish}
                  isFirst={currentIndex === 0}
                  isLast={currentIndex === randomizedApplicants.length - 1}
                  currentIndex={currentIndex}
                  total={randomizedApplicants.length}
                />
              )}
            </div>

            {/* Footer Navigation (Only for Condition A) */}
            {condition === 'A' && (
              <div className="mt-12 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft size={20} /> Back
                </button>

                {currentIndex === randomizedApplicants.length - 1 ? (
                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                  >
                    Finish Experiment <CheckCircle2 size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 hover:shadow-xl transition-all"
                  >
                    Next Applicant <ArrowRight size={20} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {screen === 'thanks' && (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="max-w-xl w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">Thank You!</h2>
              <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                Your participation in this experiment is greatly appreciated. Your insights will contribute significantly to my master's thesis on Explainable AI.
              </p>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl transition-all mx-auto"
              >
                <RotateCcw size={20} /> Return to Start
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
