import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Search, User, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  user_id: string;
  full_name: string;
  tokens: number;
  plan_type: string;
  subscription_status: string;
  is_active: boolean;
}

export default function TokenManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, tokens, plan_type, subscription_status, is_active')
        .or(`full_name.ilike.%${searchQuery}%,user_id.eq.${searchQuery}`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar usuários",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery(user.full_name || user.user_id);
  };

  const processTokens = async (operation: 'add' | 'remove') => {
    if (!selectedUser || !tokenAmount || !description.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const tokens = parseInt(tokenAmount);
    if (isNaN(tokens) || tokens <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade de tokens deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (operation === 'add') {
        const { error } = await supabase.rpc('add_tokens_to_user', {
          p_user_id: selectedUser.user_id,
          p_tokens: tokens,
          p_plan_type: selectedUser.plan_type,
          p_description: `Admin: ${description}`
        });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `${tokens} tokens adicionados ao usuário`,
        });
      } else {
        // Para remover tokens, usamos a função de reembolso
        const { error } = await supabase.rpc('process_refund', {
          p_user_id: selectedUser.user_id,
          p_refunded_credits: tokens,
          p_description: `Admin: ${description}`
        });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `${tokens} tokens removidos do usuário`,
        });
      }

      // Atualizar dados do usuário selecionado
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('user_id, full_name, tokens, plan_type, subscription_status, is_active')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (updatedUser) {
        setSelectedUser(updatedUser);
      }

      setTokenAmount("");
      setDescription("");
    } catch (error) {
      console.error('Erro ao processar tokens:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (block: boolean) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !block })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      // Atualizar dados do usuário selecionado
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('user_id, full_name, tokens, plan_type, subscription_status, is_active')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (updatedUser) {
        setSelectedUser(updatedUser);
      }

      toast({
        title: "Sucesso",
        description: block ? "Usuário bloqueado com sucesso" : "Usuário desbloqueado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">{/* Grid principal */}
      {/* Buscar Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Usuário
          </CardTitle>
          <CardDescription>
            Busque por nome ou ID do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome ou ID do usuário"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button 
              onClick={searchUsers} 
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Resultados:</Label>
              {searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="p-3 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.full_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{user.user_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{user.tokens} tokens</p>
                      <div className="flex gap-1">
                        <Badge variant="outline">{user.plan_type}</Badge>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Ativo" : "Bloqueado"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                <strong>Usuário selecionado:</strong><br />
                {selectedUser.full_name || "Sem nome"}<br />
                <strong>Tokens atuais:</strong> {selectedUser.tokens}<br />
                <strong>Plano:</strong> {selectedUser.plan_type}<br />
                <strong>Status:</strong> {selectedUser.is_active ? "Ativo" : "Bloqueado"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gerenciar Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Gerenciar Tokens
          </CardTitle>
          <CardDescription>
            Adicione ou remova tokens do usuário selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenAmount">Quantidade de Tokens *</Label>
            <Input
              id="tokenAmount"
              type="number"
              min="1"
              placeholder="Ex: 1000"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              disabled={!selectedUser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Motivo *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo da alteração..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!selectedUser}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => processTokens('add')}
              disabled={loading || !selectedUser || !tokenAmount || !description.trim()}
              className="flex items-center gap-2 flex-1"
            >
              <Plus className="h-4 w-4" />
              Adicionar Tokens
            </Button>
            <Button
              variant="destructive"
              onClick={() => processTokens('remove')}
              disabled={loading || !selectedUser || !tokenAmount || !description.trim()}
              className="flex items-center gap-2 flex-1"
            >
              <Minus className="h-4 w-4" />
              Remover Tokens
            </Button>
          </div>

          {!selectedUser && (
            <Alert>
              <AlertDescription>
                Selecione um usuário primeiro para gerenciar tokens.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Bloquear/Desbloquear Usuário */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedUser.is_active ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              Controle de Acesso
            </CardTitle>
            <CardDescription>
              Bloqueie ou desbloqueie o acesso do usuário às ferramentas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <p className="font-medium mb-1">Status atual: </p>
                <Badge variant={selectedUser.is_active ? "default" : "destructive"} className="text-sm">
                  {selectedUser.is_active ? "🟢 Ativo - Usuário pode usar as ferramentas" : "🔴 Bloqueado - Usuário não pode usar as ferramentas"}
                </Badge>
              </div>
              <div className="flex gap-2">
                {selectedUser.is_active ? (
                  <Button
                    variant="destructive"
                    onClick={() => toggleUserAccess(true)}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Bloquear Usuário
                  </Button>
                ) : (
                  <Button
                    onClick={() => toggleUserAccess(false)}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Unlock className="h-4 w-4" />
                    Desbloquear Usuário
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}