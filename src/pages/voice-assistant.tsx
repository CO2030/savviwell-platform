import { VoiceChat } from "@/components/voice-chat";

export default function VoiceAssistantPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-bold text-slate-900">Voice Assistant</h1>
        <p className="text-slate-600">AI-powered nutrition and meal planning assistant</p>
      </div>
      <div className="flex-1">
        <VoiceChat />
      </div>
    </div>
  );
}

