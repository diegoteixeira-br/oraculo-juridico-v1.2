import { useState } from "react";
import { Eye, EyeOff, Lock, Shield, ArrowLeft, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import caktoLogo from "../assets/cakto-logo.png";

const Cadastro = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    email: "",
    whatsapp: "",
    senha: "",
    confirmarSenha: "",
    aceitarTermos: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp é obrigatório";
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "WhatsApp deve estar no formato (11) 99999-9999";
    }

    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória";
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    if (!formData.aceitarTermos) {
      newErrors.aceitarTermos = "Você deve aceitar os termos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simular envio para banco de dados
      console.log("Dados do usuário:", formData);
      
      // Aguardar um pouco para simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para a página de pagamento da Cakto
      window.location.href = "https://pay.cakto.com.br/76f5dfq_469425";
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/">
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
              <span>Voltar para Home</span>
            </button>
          </Link>
          <img 
            src="/lovable-uploads/c69e5a84-404e-4cbe-9d84-d19d95158721.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Formulário Card */}
          <div className="card-signup p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Crie sua conta no Oráculo Jurídico
              </h2>
              <p className="text-muted-foreground">
                Preencha seus dados abaixo para iniciar seus 7 dias de teste gratuito.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome Completo */}
              <div>
                <label htmlFor="nomeCompleto" className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                  className={`w-full input-field ${errors.nomeCompleto ? "border-red-500" : ""}`}
                  placeholder="Digite seu nome completo"
                />
                {errors.nomeCompleto && (
                  <p className="text-red-500 text-sm mt-1">{errors.nomeCompleto}</p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Seu melhor e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full input-field ${errors.email ? "border-red-500" : ""}`}
                  placeholder="Digite seu e-mail"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-foreground mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  WhatsApp
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  className={`w-full input-field ${errors.whatsapp ? "border-red-500" : ""}`}
                  placeholder="(11) 99999-9999"
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-foreground mb-2">
                  Crie uma senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="senha"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className={`w-full input-field pr-10 ${errors.senha ? "border-red-500" : ""}`}
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-foreground mb-2">
                  Confirme sua senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                    className={`w-full input-field pr-10 ${errors.confirmarSenha ? "border-red-500" : ""}`}
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmarSenha && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmarSenha}</p>
                )}
              </div>

              {/* Checkbox Termos */}
              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.aceitarTermos}
                    onChange={(e) => handleInputChange("aceitarTermos", e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Eu li e concordo com os{" "}
                    <a href="/termos" className="link-accent">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="/privacidade" className="link-accent">
                      Política de Privacidade
                    </a>
                    .
                  </span>
                </label>
                {errors.aceitarTermos && (
                  <p className="text-red-500 text-sm mt-1">{errors.aceitarTermos}</p>
                )}
              </div>

              {/* Botão de Submissão */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processando..." : "Criar Conta e Iniciar Teste"}
              </button>
            </form>

            {/* Social Login Buttons */}
            <div className="mt-6 space-y-4">
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground text-center">Ou crie sua conta com:</p>
              
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Implementar autenticação com Gmail
                    toast({
                      title: "Em breve!",
                      description: "Cadastro com Gmail será implementado em breve.",
                    });
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continuar com Gmail
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full bg-blue-600 border-blue-500 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Implementar autenticação com Facebook
                    toast({
                      title: "Em breve!",
                      description: "Cadastro com Facebook será implementado em breve.",
                    });
                  }}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuar com Facebook
                </Button>
              </div>
            </div>

            {/* Sinais de Confiança */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
                <Shield size={16} className="text-secondary" />
                <span>Você será redirecionado para um ambiente 100% seguro para adicionar suas informações de pagamento.</span>
              </div>
              
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Lock size={16} className="text-secondary" />
                  <span className="text-sm text-muted-foreground">SSL Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Powered by</span>
                  <img 
                    src={caktoLogo} 
                    alt="Cakto"
                    className="h-6 w-auto opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Oráculo Jurídico. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Cadastro;