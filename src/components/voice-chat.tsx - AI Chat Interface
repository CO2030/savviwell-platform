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
  const [messages, setMessages] = useState([]);
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                <AvatarFallback className="text-white text-sm">
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about nutrition, meal planning, or health tips..."
              className="resize-none rounded-2xl border-slate-200 focus:border-blue-300 pr-12"
              rows={1}
            />
          </div>
          
          {/* Voice Button */}
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className={`rounded-full w-12 h-12 transition-all ${
              isListening ? 'animate-pulse-ring' : 'hover:scale-105'
            }`}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          {/* Send Button */}
          <Button
            size="icon"
            className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 transition-all hover:scale-105"
            onClick={() => console.log('Send message')}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
