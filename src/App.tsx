import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePageTitle } from "./hooks/usePageTitle";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RedefinirSenha from "./pages/RedefinirSenha";
import TesteWebhookPage from "./pages/TesteWebhookPage";
import PagamentoPage from "./pages/PagamentoPage";
import ConfirmarEmail from "./pages/ConfirmarEmail";

import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import MinhaContaPage from "./pages/MinhaContaPage";
import HistoricoTransacoesPage from "./pages/HistoricoTransacoesPage";
import ContatoPage from "./pages/ContatoPage";
import ComprarCreditosPage from "./pages/ComprarCreditosPage";


const queryClient = new QueryClient();

function AppContent() {
  usePageTitle();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/teste-webhook" element={<TesteWebhookPage />} />
      <Route path="/pagamento" element={<PagamentoPage />} />
      
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/contato" element={<ContatoPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/minha-conta" element={<ProtectedRoute><MinhaContaPage /></ProtectedRoute>} />
      <Route path="/historico-transacoes" element={<ProtectedRoute><HistoricoTransacoesPage /></ProtectedRoute>} />
      <Route path="/comprar-creditos" element={<ProtectedRoute><ComprarCreditosPage /></ProtectedRoute>} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
