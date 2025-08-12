import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Save, User, Lock, Camera, ArrowLeft, Zap, Shield, Mail, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export default function MinhaContaPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile, updatePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { visible: menuVisible } = useScrollDirection();

  // Atualizar avatar quando profile mudar
  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile?.avatar_url]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Criar um nome único para o arquivo com estrutura de pasta
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      // Fazer upload do arquivo
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true  // Permite sobrescrever arquivos existentes
        });

      if (error) {
        console.error('Storage error:', error);
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      await refreshProfile();
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Usar a nova função updatePassword do AuthContext
      const result = await updatePassword(newPassword);

      if (result.error) {
        toast({
          title: "Erro ao alterar senha",
          description: result.error.message || "Não foi possível alterar a senha.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha alterada com sucesso!",
          description: "Sua senha foi atualizada.",
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'premium': return 'bg-purple-600 text-white';
      case 'basico': return 'bg-blue-600 text-white';
      default: return 'bg-slate-900 text-white border border-slate-700';
    }
  };

  const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);
  const isTrial = profile?.subscription_status === 'trial';
  const trialEndDate = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const daysRemaining = isTrial && trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Minha Conta
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Gerencie suas configurações e dados pessoais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de tokens */}
              <div className="hidden md:flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {Math.floor(totalTokens).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              
              <UserMenu hideOptions={["account"]} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações da conta */}
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar do usuário */}
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-primary/30">
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback className="text-lg bg-primary/20 text-primary">
                        {user?.email?.substring(0, 2).toUpperCase() || "DT"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary hover:bg-primary/90 border-primary p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3 text-white" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
                    </h3>
                    <p className="text-sm text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPlanBadgeColor(profile?.plan_type || 'gratuito')}>
                        {profile?.plan_type === 'premium' ? 'Premium' : 
                         profile?.plan_type === 'basico' ? 'Básico' : (isTrial ? `Gratuito • ${daysRemaining}d` : 'Gratuito')}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-300">
                        {Math.floor(totalTokens).toLocaleString()} tokens
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">{Math.floor(profile?.token_balance || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Tokens de Teste</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">{Math.floor(profile?.plan_tokens || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Tokens do Plano</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400">Membro desde</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Informações e Alteração de Senha */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Informações da Conta */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-primary" />
                  Informações da Conta
                </CardTitle>
                <CardDescription>
                  Dados básicos e configurações da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-slate-300">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profile?.full_name || ""}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-sm text-slate-300">Plano Atual</Label>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPlanBadgeColor(profile?.plan_type || 'gratuito')} px-3 py-1`}>
                        {profile?.plan_type === 'premium' ? 'Premium' : 
                         profile?.plan_type === 'basico' ? 'Básico' : 'Gratuito'}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        {profile?.plan_type === 'premium' ? '150.000 tokens' : 
                         profile?.plan_type === 'basico' ? '75.000 tokens' : '3.000 tokens diários'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm text-slate-300">Status da Conta</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        {profile?.subscription_status === 'active' ? 'Ativa' : 
                         profile?.subscription_status === 'trial' ? 'Período Gratuito' : 'Ativa'}
                      </Badge>
                      {profile?.trial_end_date && profile?.subscription_status === 'trial' && (
                        <span className="text-xs text-slate-400">
                          até {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <p className="text-sm text-slate-400 mb-3">
                    💡 Para alterar nome ou email, entre em contato com o suporte
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => navigate("/comprar-creditos")}
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Comprar Mais Tokens
                    </Button>
                    <Button 
                      onClick={() => navigate("/suporte")}
                      variant="outline"
                      className="w-full border-slate-600 hover:bg-slate-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Entrar em Contato
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5 text-primary" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura alterando sua senha regularmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm text-slate-300">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white pr-10"
                        placeholder="Digite sua senha atual"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm text-slate-300">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white pr-10"
                        placeholder="Digite sua nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm text-slate-300">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white pr-10"
                        placeholder="Confirme sua nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 py-3"
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Alterando senha...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Alterar Senha
                        </div>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-600">
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-200 mb-1">Dicas de Segurança</h4>
                        <div className="space-y-1 text-xs text-amber-300/80">
                          <p>• Use pelo menos 8 caracteres</p>
                          <p>• Combine letras, números e símbolos</p>
                          <p>• Não use informações pessoais</p>
                          <p>• Altere regularmente sua senha</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Privacidade */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2">Privacidade e Segurança</h4>
                  <div className="space-y-1 text-sm text-blue-300/80">
                    <p>• Seus dados são protegidos com criptografia SSL</p>
                    <p>• Não compartilhamos informações com terceiros</p>
                    <p>• Conformidade total com a LGPD</p>
                    <p>• Backup automático de todas as suas consultas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}