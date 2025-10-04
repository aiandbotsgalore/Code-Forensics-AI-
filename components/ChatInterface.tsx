
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { UserIcon } from './icons/UserIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

interface ChatInterfaceProps {
    history: ChatMessage[];
    onSendMessage: (message: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, onSendMessage, isLoading, error }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700 mt-8 animate-fade-in">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Follow-up Conversation</h3>
            <div className="h-96 overflow-y-auto pr-2 sm:pr-4 space-y-4 bg-gray-900/40 p-4 rounded-md">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-cyan-900 flex-shrink-0 flex items-center justify-center">
                                <BrainCircuitIcon className="w-5 h-5 text-cyan-400" />
                            </div>
                        )}
                        <div className={`max-w-md md:max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                         {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-200" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && history.length > 0 && history[history.length - 1].role === 'user' && (
                     <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-cyan-900 flex-shrink-0 flex items-center justify-center">
                            <BrainCircuitIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="max-w-md md:max-w-lg p-3 rounded-lg bg-gray-700 flex items-center">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2 delay-75"></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2 delay-150"></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {error && <p className="text-red-400 text-sm mt-2 px-1">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50"
                    aria-label="Chat input"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="w-6 h-6"/>
                </button>
            </form>
        </div>
    );
};
