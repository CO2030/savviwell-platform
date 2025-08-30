import { VoiceChat } from "@/components/voice-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Bell, TrendingUp, Calendar, Users, Package, Utensils } from "lucide-react";

export default function VoiceAssistantPage() {
  return (
    <div className="h-screen flex bg-white">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* App Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-semibold">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">VoiceAI</h1>
                <p className="text-sm text-slate-500">Assistant</p>
              </div>
            </div>
            <Settings className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600">
                <AvatarFallback className="text-white font-semibold">S</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Sarah Johnson</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Premium Member</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="p-6 space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Calories Today</p>
                  <p className="text-2xl font-bold text-green-800">1,247</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Day Streak</p>
                  <p className="text-2xl font-bold text-blue-800">3</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Navigation</h3>
          <nav className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">🤖</span>
              </div>
              <span className="font-medium text-purple-700">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
              <Utensils className="w-5 h-5" />
              <span>Meal Planning</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
              <Users className="w-5 h-5" />
              <span>Family Profiles</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
              <Package className="w-5 h-5" />
              <span>Smart Pantry</span>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">AI Assistant</h2>
              <p className="text-slate-600">Ask me anything about your health and nutrition</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">AI Online</span>
              </div>
              <Bell className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            </div>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1">
          <VoiceChat />
        </div>
      </div>

      {/* Right Panel - Nutrition & Recommendations */}
      <div className="w-80 bg-white border-l border-slate-200 p-6">
        <div className="space-y-6">
          {/* Today's Nutrition */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Nutrition</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Calories</span>
                  <span className="font-medium">1,247 / 2,000</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Carbs</span>
                  <span className="font-medium">45g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Protein</span>
                  <span className="font-medium">98g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Fat</span>
                  <span className="font-medium">52g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Health Score</h3>
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold text-green-600">8.5</div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className={`w-5 h-5 ${star <= 4 ? 'text-green-500' : 'text-slate-300'}`}>
                    ★
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🍃</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Add more fiber</h4>
                      <p className="text-sm text-green-700">Try adding berries to your breakfast</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">💧</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Stay hydrated</h4>
                      <p className="text-sm text-blue-700">You're 2 glasses behind today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

