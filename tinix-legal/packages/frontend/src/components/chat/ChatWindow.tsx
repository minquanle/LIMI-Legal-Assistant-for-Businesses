'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatWindow() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

  const loadSessions = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/chatbot/sessions?userId=demo-user`);
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (sid: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/chatbot/sessions/${sid}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewSession = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/chatbot/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user', title: 'Cuộc hội thoại mới' })
      });
      if (res.ok) {
        const newSess = await res.json();
        setSessionId(newSess.id);
        setMessages([{ role: 'assistant', content: 'Xin chào! Tôi là trợ lý AI Pháp lý. Bạn có thắc mắc gì về quy định, thủ tục hay văn bản pháp luật không?' }]);
        loadSessions();
      }
    } catch (e) {
      console.error(e);
    }
    setShowSidebar(false);
  };

  useEffect(() => {
    loadSessions();
    if (!sessionId) {
      startNewSession();
    }
  }, []);

  const selectSession = (sid: string) => {
    setSessionId(sid);
    loadMessages(sid);
    setShowSidebar(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/chatbot/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg, userId: 'demo-user' })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        loadSessions();
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Có lỗi xảy ra khi gọi AI.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-gray-50 relative overflow-hidden">
      {/* Top bar internal to chat window */}
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center z-10">
        <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 hover:bg-gray-200 rounded transition-colors">
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
          {sessionId ? 'Đang trực tuyến' : 'Kết nối...'}
        </span>
        <div className="w-7"></div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="absolute top-[41px] left-0 bottom-0 w-64 bg-white shadow-lg border-r z-20 flex flex-col animate-in slide-in-from-left duration-200">
          <div className="p-3 border-b">
            <button onClick={startNewSession} className="w-full bg-blue-600 text-white rounded-lg p-2 text-sm hover:bg-blue-700 font-medium transition-colors">
              + Cuộc trò chuyện mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map(s => (
              <button 
                key={s.id} 
                onClick={() => selectSession(s.id)}
                className={`w-full text-left p-3 text-sm border-b hover:bg-gray-50 truncate transition-colors ${s.id === sessionId ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600' : 'text-gray-700'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
              <div className={`prose prose-sm max-w-none text-sm ${msg.role === 'user' ? 'text-white' : ''}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-1 text-xs text-gray-500 bg-white shadow-sm p-2 rounded-lg max-w-[85%] border border-gray-200 animate-in fade-in duration-300">
                <p className="font-semibold mb-1 text-blue-800">Căn cứ pháp lý:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {msg.citations.map((cit: any, j: number) => (
                    <li key={j} className="text-gray-600">{cit.documentNumber}: {cit.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200 z-0 relative">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <label htmlFor="chat-window-input" className="sr-only">Nhập câu hỏi pháp lý</label>
          <input
            id="chat-window-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi pháp lý..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            aria-label="Gửi câu hỏi"
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
