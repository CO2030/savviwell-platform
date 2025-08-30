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
      content: 'Hello! I\'m your SavviWell nutrition assistant. I can help you with meal planning, nutrition advice, and healthy eating tips. What would you like to know today?'
    },
    {
      role: 'user',
      content: 'I need help planning meals for my family this week'
    },
    {
      role: 'assistant',
      content: 'Great! I\'d love to help you plan meals for your family. To give you the best recommendations, could you tell me:\n\n• How many people in your family?\n• Any dietary restrictions or allergies?\n• What\'s your budget range?\n• Any favorite cuisines or ingredients?'
    }
  ]);
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <Avatar className={`w-10 h-10 ${message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
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
              </div>
            </div>
          </div>
        ))}
        
        {/* Quick Actions */}
        {messages.length > 0 && (
          <div className="flex justify-center pt-4">
            <div className="bg-white rounded-full shadow-lg border border-slate-200 p-2">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="rounded-full text-xs">
                  🍽️ Meal Planning
                </Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs">
                  🥗 Nutrition Tips
                </Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs">
                  📊 Health Goals
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about nutrition, meal planning, or health tips..."
              className="resize-none rounded-2xl border-slate-200 focus:border-blue-300 pr-12 shadow-sm"
              rows={1}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs">
              Press Enter to send
            </div>
          </div>
          
          {/* Voice Button */}
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className={`rounded-full w-14 h-14 transition-all shadow-lg ${
              isListening ? 'animate-pulse-ring bg-red-500 text-white' : 'hover:scale-105 hover:shadow-xl'
            }`}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          {/* Send Button */}
          <Button
            size="icon"
            className="rounded-full w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={() => {
              if (input.trim()) {
                setMessages([...messages, { role: 'user', content: input }]);
                setInput('');
              }
            }}
          >
            <Send className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
