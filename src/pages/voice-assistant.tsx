import { VoiceChat } from "@/components/voice-chat";

export default function VoiceAssistantPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SavviWell Assistant</h1>
              <p className="text-slate-600">Your AI-powered nutrition and meal planning companion</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <VoiceChat />
      </div>
    </div>
  );
}

