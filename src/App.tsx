import { Route, Switch, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VoiceAssistantPage from "@/pages/voice-assistant";
import MealPlanningPage from "@/pages/meal-planning";
import FamilyProfilesPage from "@/pages/family-profiles";
import PantryPage from "@/pages/pantry";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const [location] = useLocation();
  
  // Debug logging
  console.log('Current location:', location);
  console.log('Window location pathname:', window.location.pathname);
  
  return (
    <Switch>
      <Route path="/" component={VoiceAssistantPage} />
      <Route path="/meal-planning" component={MealPlanningPage} />
      <Route path="/family-profiles" component={FamilyProfilesPage} />
      <Route path="/pantry" component={PantryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Savviwell Platform</h1>
      <p>React app is working!</p>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router base="/savviwell-platform">
            <AppRouter />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
