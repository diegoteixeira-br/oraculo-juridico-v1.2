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
      console.log('Buscando por:', searchQuery);
      
      // Usar a mesma abordagem da função admin-list-users
      // Buscar todos os usuários e filtrar localmente
      const { data: userData } = await supabase.functions.invoke('admin-list-users');
      
      if (userData?.users) {
        console.log('Dados retornados:', userData.users);
        
        // Filtrar usuários por nome
        const normalizedQuery = searchQuery
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        const filtered = userData.users.filter((user: any) => {
          // Normalizar nome se existir
          const normalizedName = user.name ? user.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") : "";
          
          // Normalizar email se existir
          const normalizedEmail = user.email ? user.email
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") : "";
          
          const queryParts = normalizedQuery.split(' ').filter(part => part.length > 0);
          
          // Buscar tanto no nome quanto no email
          return queryParts.every(part => 
            normalizedName.includes(part) || normalizedEmail.includes(part)
          );
        });
        
        // Converter para o formato esperado pelo componente
        const searchResults = filtered.map((user: any) => ({
          user_id: user.id,
          full_name: user.name,
          tokens: user.tokens || 0,
          plan_type: user.plan_type || 'gratuito',
          subscription_status: 'active', // Assumir ativo se não especificado
          is_active: user.is_active ?? true
        }));
        
        console.log('Resultados filtrados:', searchResults);
        setSearchResults(searchResults.slice(0, 10));
        
        if (searchResults.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Nenhum usuário encontrado com esse nome",
            variant: "default",
          });
        }
      } else {
        console.error('Erro na resposta:', userData);
        throw new Error('Falha ao buscar usuários');
      }
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

  const updateSelectedUserData = async () => {
    if (!selectedUser) return;
    
    try {
      const { data: userData } = await supabase.functions.invoke('admin-list-users');
      if (userData?.users) {
        const updatedUser = userData.users.find((user: any) => user.id === selectedUser.user_id);
        if (updatedUser) {
          const formattedUser = {
            user_id: updatedUser.id,
            full_name: updatedUser.name,
            tokens: updatedUser.tokens || 0,
            plan_type: updatedUser.plan_type || 'gratuito',
            subscription_status: 'active',
            is_active: updatedUser.is_active ?? true
          };
          setSelectedUser(formattedUser);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery(user.full_name || user.user_id);
    console.log('Usuário selecionado:', user);
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
        // Usar função administrativa específica para adicionar
        const { data, error } = await supabase.rpc('admin_add_tokens_to_user', {
          p_user_id: selectedUser.user_id,
          p_tokens: tokens,
          p_description: `Admin: ${description}`
        });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `${tokens} tokens adicionados ao usuário`,
        });
      } else {
        // Usar função administrativa específica para remover
        const { data, error } = await supabase.rpc('admin_remove_tokens_from_user', {
          p_user_id: selectedUser.user_id,
          p_tokens: tokens,
          p_description: `Admin: ${description}`
        });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `${tokens} tokens removidos do usuário`,
        });
      }

      // Atualizar dados do usuário selecionado buscando novamente na função admin-list-users
      await updateSelectedUserData();

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

      // Atualizar dados do usuário selecionado usando a mesma fonte de dados
      await updateSelectedUserData();

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
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 w-full">{/* Grid principal */}
      {/* Buscar Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Usuário
          </CardTitle>
          <CardDescription>
            Busque pelo nome do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nome do usuário"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setSearchResults([]);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              className="flex-1"
            />
            <Button 
              onClick={searchUsers} 
              disabled={searching || !searchQuery.trim()}
              className="w-full sm:w-auto shrink-0"
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
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedUser?.user_id === user.user_id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted'
                  }`}
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

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => processTokens('add')}
              disabled={loading || !selectedUser || !tokenAmount || !description.trim()}
              className="flex items-center justify-center gap-2 flex-1"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">Adicionar Tokens</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => processTokens('remove')}
              disabled={loading || !selectedUser || !tokenAmount || !description.trim()}
              className="flex items-center justify-center gap-2 flex-1"
            >
              <Minus className="h-4 w-4" />
              <span className="whitespace-nowrap">Remover Tokens</span>
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