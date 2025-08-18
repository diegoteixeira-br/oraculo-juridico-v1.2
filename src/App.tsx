import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePageTitle } from "./hooks/usePageTitle";
import { useSmoothScrollTop } from "./hooks/useSmoothScrollTop";

import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RedefinirSenha from "./pages/RedefinirSenha";
import FinalizarCadastro from "./pages/FinalizarCadastro";

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
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AgendaJuridica from "./pages/AgendaJuridica";
import SuportePage from "./pages/SuportePage";
import MeusDocumentos from "./pages/MeusDocumentos";
import AdminDashboard from "./pages/AdminDashboard";
import ArtigoBlog from "./pages/ArtigoBlog";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
      <Route path="/blog" element={<PageWrapper><Index /></PageWrapper>} />
      <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
      <Route path="/cadastro" element={<PageWrapper><Cadastro /></PageWrapper>} />
      <Route path="/finalizar-cadastro" element={<PageWrapper><FinalizarCadastro /></PageWrapper>} />
      <Route path="/confirmar-email" element={<PageWrapper><ConfirmarEmail /></PageWrapper>} />
          <Route path="/redefinir-senha" element={<PageWrapper><RedefinirSenha /></PageWrapper>} />
          
      <Route path="/pagamento" element={<PageWrapper><PagamentoPage /></PageWrapper>} />
      
      <Route path="/termos" element={<PageWrapper><Termos /></PageWrapper>} />
      <Route path="/privacidade" element={<PageWrapper><Privacidade /></PageWrapper>} />
      <Route path="/contato" element={<PageWrapper><ContatoPage /></PageWrapper>} />
      <Route path="/calculo-contrato-bancario" element={<PageWrapper><ProtectedRoute gate="premium"><CalculoContratoBancario /></ProtectedRoute></PageWrapper>} />
      <Route path="/calculo-pensao-alimenticia" element={<PageWrapper><ProtectedRoute gate="premium"><CalculoPensaoAlimenticia /></ProtectedRoute></PageWrapper>} />
      <Route path="/dashboard" element={<PageWrapper><ProtectedRoute gate="dashboard"><Dashboard /></ProtectedRoute></PageWrapper>} />
      <Route path="/chat" element={<PageWrapper><Chat /></PageWrapper>} />
      <Route path="/minha-conta" element={<PageWrapper><ProtectedRoute gate="dashboard"><MinhaContaPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/historico-transacoes" element={<PageWrapper><ProtectedRoute gate="dashboard"><HistoricoTransacoesPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/comprar-creditos" element={<PageWrapper><ComprarCreditosPage /></PageWrapper>} />
      <Route path="/payment-success" element={<PageWrapper><ProtectedRoute><PaymentSuccessPage /></ProtectedRoute></PageWrapper>} />
      <Route path="/agenda-juridica" element={<PageWrapper><ProtectedRoute gate="premium"><AgendaJuridica /></ProtectedRoute></PageWrapper>} />
      <Route path="/admin/login" element={<PageWrapper><Navigate to="/admin" replace /></PageWrapper>} />
      <Route path="/admin/documentos" element={<PageWrapper><Navigate to="/admin" replace /></PageWrapper>} />
      <Route path="/admin" element={<PageWrapper><AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute></PageWrapper>} />
      
      <Route path="/suporte" element={<PageWrapper><ProtectedRoute gate="dashboard"><SuportePage /></ProtectedRoute></PageWrapper>} />
      <Route path="/meus-documentos" element={<PageWrapper><ProtectedRoute gate="premium"><MeusDocumentos /></ProtectedRoute></PageWrapper>} />
      <Route path="/blog/:slug" element={<PageWrapper><ArtigoBlog /></PageWrapper>} />
      
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
