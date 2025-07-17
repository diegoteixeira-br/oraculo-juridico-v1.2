import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, UserPlus, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!authLoading && user && !isAdmin()) {
      toast({
        title: "Acesso negado",
        description: "Esta página é restrita para administradores.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (isAdmin()) {
      fetchAdmins();
    }
  }, [user, authLoading, isAdmin, navigate, toast]);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      // Buscar admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('*');

      if (adminsError) throw adminsError;

      // Buscar profiles para cada admin
      const adminsWithProfiles = [];
      for (const admin of adminsData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', admin.user_id)
          .single();

        adminsWithProfiles.push({
          ...admin,
          profiles: profileData
        });
      }

      setAdmins(adminsWithProfiles);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de administradores.",
        variant: "destructive",
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar o usuário pelo email (usando full_name que pode conter email)
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${newAdminEmail}%`)
        .single();

      if (userError || !userData) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Certifique-se de que o usuário já possui uma conta.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar o usuário como admin
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: userData.user_id
        });

      if (adminError) {
        if (adminError.code === '23505') { // Unique constraint violation
          toast({
            title: "Erro",
            description: "Este usuário já é um administrador.",
            variant: "destructive",
          });
        } else {
          throw adminError;
        }
        return;
      }

      toast({
        title: "Sucesso",
        description: "Administrador adicionado com sucesso!",
      });

      setNewAdminEmail('');
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (adminId: string) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Administrador removido com sucesso!",
      });

      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o administrador.",
        variant: "destructive",
      });
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não mostrar conteúdo se não for admin
  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Administração
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os administradores do sistema
          </p>
        </div>

        {/* Adicionar novo admin */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Adicionar Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="admin-email">Email do usuário</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addAdmin} disabled={loading}>
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de admins */}
        <Card>
          <CardHeader>
            <CardTitle>Administradores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdmins ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregando administradores...</p>
              </div>
            ) : admins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum administrador encontrado.
              </p>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">
                        {admin.profiles?.full_name || 'Nome não disponível'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Admin desde: {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdmin(admin.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}