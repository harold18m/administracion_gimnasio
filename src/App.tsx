
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymLayout } from "./components/GymLayout";
import Dashboard from "./pages/Dashboard";
import Ejercicios from "./pages/Ejercicios";
import WhatsApp from "./pages/WhatsApp";
import ChatBot from "./pages/ChatBot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<GymLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ejercicios" element={<Ejercicios />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/chatbot" element={<ChatBot />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
