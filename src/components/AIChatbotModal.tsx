import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  UserCircle2, 
  Bot, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';

interface AIChatbotModalProps {
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onAskAi: (query: string) => Promise<{ text: string; suggestions?: string[] }>;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({
  student,
  isOpen,
  onClose,
  onAskAi
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello ${student.fullName}! I am your CAMPUSLINK AI Career Advisor. I have analyzed your verified academic record (CGPA: ${student.cgpa.toFixed(2)}), your ${student.skills.length} technical skills, and active placement drives. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Am I eligible for TechNova?',
        'What skills should I improve?',
        'Which jobs match my profile best?',
        'Why was I not shortlisted for other roles?'
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await onAskAi(q);
      const botMsg: Message = {
        id: `msg_${Date.now()}_b`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: `msg_${Date.now()}_err`,
        sender: 'assistant',
        text: 'I encountered an issue processing your query. Please try again or inspect your profile dashboard.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E2522]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F7F3EC] rounded-3xl max-w-lg w-full h-[620px] shadow-2xl border border-[#ECE4D9] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-[#1C4631] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 text-emerald-300 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base text-white">Ask CampusLink</span>
                <span className="text-[9px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded-full font-sans font-medium">Online</span>
              </div>
              <p className="text-[11px] text-emerald-200/80">Placement insights for your profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#1C4631] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-1">
                    CL
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#1C4631] text-white rounded-br-xs'
                      : 'bg-white text-[#1E2522] rounded-bl-xs border border-[#ECE4D9] shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              <span className="text-[10px] text-[#7A7268] mt-1 px-1">
                {msg.timestamp}
              </span>

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F0EAE1] text-[#1C4631] font-medium rounded-full border border-[#ECE4D9] text-[11px] transition-colors cursor-pointer shadow-2xs"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#7A7268]">
              <div className="w-5 h-5 rounded-full bg-[#1C4631] text-white flex items-center justify-center text-[10px] animate-pulse">
                ✦
              </div>
              <span className="italic">Analyzing campus drives and requirements...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#ECE4D9]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about shortlisting, interview prep, skill gaps..."
              className="flex-1 px-4 py-2 bg-[#F7F3EC] text-xs text-[#1E2522] placeholder-[#8C8377] rounded-full border border-[#E3DCD1] focus:outline-none focus:border-[#1C4631]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2 bg-[#1C4631] text-white rounded-full hover:bg-[#153826] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

