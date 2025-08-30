import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Send, User, Bot, Volume2, VolumeX, Loader2 } from "lucide-react";

export function VoiceChat() {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello Sarah Johnson! I\'m your AI health assistant. I can help you plan meals, track nutrition, book restaurants, and provide personalized health recommendations. You can type your questions or use voice - I respond to both! How can I assist you today?'
    }
  ]);
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <Avatar className={`w-10 h-10 ${message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'}`}>
                <AvatarFallback className="text-white text-sm">
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className={`rounded-2xl px-6 py-4 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-800 shadow-md'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                {index === 0 && (
                  <p className="text-xs text-slate-500 mt-2">Just now</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-6">
        <div className="flex items-end space-x-4">
          {/* Voice Button */}
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className={`rounded-full w-12 h-12 transition-all ${
              isListening ? 'animate-pulse-ring bg-red-500 text-white' : 'hover:scale-105'
            }`}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          {/* Speaker Button */}
          <Button
            size="icon"
            variant="outline"
            className="rounded-full w-12 h-12 hover:scale-105"
            onClick={() => console.log('Speaker')}
          >
            <span className="text-green-600 text-lg">🔊</span>
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here... or"
              className="resize-none rounded-2xl border-slate-200 focus:border-purple-300 pr-12 shadow-sm"
              rows={1}
            />
            <div className="absolute bottom-2 left-4 text-slate-400 text-xs">
              Type your message or press the mic button • Press Enter to send.
            </div>
          </div>
          
          {/* Send Button */}
          <Button
            size="icon"
            className="rounded-full w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all hover:scale-105 shadow-lg"
            onClick={() => {
              if (input.trim()) {
                setMessages([...messages, { role: 'user', content: input }]);
                setInput('');
              }
            }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
