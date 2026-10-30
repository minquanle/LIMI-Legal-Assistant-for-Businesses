'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { CopilotLLMService } from '../../../../backend/src/services/copilot-llm-service';

export function VoiceAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');

  const handleStartListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setTranscript('Trình duyệt không hỗ trợ Web Speech Recognition. Dùng mẫu câu bên dưới:');
      handleSimulateVoiceQuestion('Thời hiệu xử lý kỷ luật lao động tối đa bao nhiêu tháng?');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Đang lắng nghe giọng nói của bạn...');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      handleAskAI(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      handleSimulateVoiceQuestion('Quy định phạt hợp đồng thương mại tối đa là bao nhiêu?');
    };

    recognition.start();
  };

  const handleSimulateVoiceQuestion = (text: string) => {
    setTranscript(text);
    handleAskAI(text);
  };

  const handleAskAI = (question: string) => {
    const demoResponse = `Theo Điều 301 Luật Thương mại 2005, mức phạt vi phạm nghĩa vụ hợp đồng do các bên thỏa thuận nhưng không vượt quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.`;
    setAiAnswer(demoResponse);
    handleSpeakText(demoResponse);
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <>
      {/* Floating Action Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        title="Hỏi đáp Pháp lý bằng Giọng nói AI"
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all duration-300 z-40 flex items-center justify-center group"
      >
        <Mic className="w-6 h-6 group-hover:animate-bounce" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          Hỏi bằng Giọng nói AI
        </span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl relative text-slate-900 dark:text-slate-100">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">Trợ lý Giọng nói AI Pháp lý</h2>
                  <p className="text-[11px] text-slate-400">Voice Input & Audio Summary</p>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); handleStopSpeech(); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pulsing Mic Circle */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <button
                onClick={handleStartListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                  isListening
                    ? 'bg-red-600 text-white ring-8 ring-red-300 dark:ring-red-900/50 animate-pulse scale-110'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:scale-105'
                }`}
              >
                <Mic className="w-10 h-10" />
              </button>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isListening ? 'Đang lắng nghe... Hãy nói câu hỏi pháp lý' : 'Nhấn vào Micro để đọc câu hỏi pháp lý'}
              </p>
            </div>

            {/* Transcribed Text & Sample Questions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Câu hỏi nhận diện:</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 min-h-[44px]">
                {transcript || 'Chưa nhận diện câu hỏi...'}
              </div>

              {/* Sample Voice Prompts */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleSimulateVoiceQuestion('Mức phạt vi phạm hợp đồng thương mại tối đa là bao nhiêu?')}
                  className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                >
                  <MessageSquare className="w-3 h-3 inline" aria-hidden="true" /> Mức phạt thương mại tối đa?
                </button>
                <button
                  onClick={() => handleSimulateVoiceQuestion('Thời hiệu xử lý kỷ luật lao động 2026?')}
                  className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                >
                  <MessageSquare className="w-3 h-3 inline" aria-hidden="true" /> Thời hiệu kỷ luật lao động?
                </button>
              </div>
            </div>

            {/* AI Response & Audio Player */}
            {aiAnswer && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Kết quả Tư vấn AI
                  </span>
                  {isSpeaking ? (
                    <button onClick={handleStopSpeech} className="flex items-center gap-1 text-[11px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">
                      <VolumeX className="w-3.5 h-3.5" /> Tắt âm thanh
                    </button>
                  ) : (
                    <button onClick={() => handleSpeakText(aiAnswer)} className="flex items-center gap-1 text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                      <Volume2 className="w-3.5 h-3.5" /> Đọc lại kết quả
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{aiAnswer}</p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
