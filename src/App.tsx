import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePageTitle } from "./hooks/usePageTitle";
import { useSmoothScrollTop } from "./hooks/useSmoothScrollTop";

import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RedefinirSenha from "./pages/RedefinirSenha";

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
import CalculoContratoBancario from "./pages/CalculoContratoBancario";
import CalculoPensaoAlimenticia from "./pages/CalculoPensaoAlimenticia";
import ComprarCreditosPage from "./pages/ComprarCreditosPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import AdminDocuments from "./pages/AdminDocuments";
import AdminLogin from "./pages/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AgendaJuridica from "./pages/AgendaJuridica";
import SuportePage from "./pages/SuportePage";


const queryClient = new QueryClient();

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
      <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
      <Route path="/cadastro" element={<PageWrapper><Cadastro /></PageWrapper>} />
      <Route path="/confirmar-email" element={<PageWrapper><ConfirmarEmail /></PageWrapper>} />
          <Route path="/redefinir-senha" element={<PageWrapper><RedefinirSenha /></PageWrapper>} />
          
      <Route path="/pagamento" element={<PageWrapper><PagamentoPage /></PageWrapper>} />
      
      <Route path="/termos" element={<PageWrapper><Termos /></PageWrapper>} />
      <Route path="/privacidade" element={<PageWrapper><Privacidade /></PageWrapper>} />
      <Route path="/contato" element={<PageWrapper><ContatoPage /></PageWrapper>} />
      <Route path="/calculo-contrato-bancario" element={<PageWrapper><ProtectedRoute><CalculoContratoBancario /></ProtectedRoute></PageWrapper>} />
      <Route path="/calculo-pensao-alimenticia" element={<PageWrapper><ProtectedRoute><CalculoPensaoAlimenticia /></ProtectedRoute></PageWrapper>} />
      <Route path="/dashboard" element={<PageWrapper><ProtectedRoute><Dashboard /></ProtectedRoute></PageWrapper>} />
      <Route path="/chat" element={<PageWrapper><ProtectedRoute><Chat /></ProtectedRoute></PageWrapper>} />
      <Route path="/minha-conta" element={<PageWrapper><ProtectedRoute><MinhaContaPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/historico-transacoes" element={<PageWrapper><ProtectedRoute><HistoricoTransacoesPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/comprar-creditos" element={<PageWrapper><ProtectedRoute><ComprarCreditosPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/payment-success" element={<PageWrapper><ProtectedRoute><PaymentSuccessPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/agenda-juridica" element={<PageWrapper><ProtectedRoute><AgendaJuridica /></ProtectedRoute></PageWrapper>} />
      <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
      <Route path="/admin/documentos" element={<PageWrapper><AdminProtectedRoute><AdminDocuments /></AdminProtectedRoute></PageWrapper>} />
      <Route path="/suporte" element={<PageWrapper><ProtectedRoute><SuportePage /></ProtectedRoute></PageWrapper>} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
    </Routes>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  usePageTitle();
  useSmoothScrollTop(); // Scroll suave para o topo em mudanças de página
  return <>{children}</>;
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
