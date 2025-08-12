import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserRow { id: string; email: string; name?: string; created_at?: string; role?: string; is_active?: boolean }

export default function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;
      // @ts-ignore
      setUsers((data?.users as any) || []);
    } catch (e) {
      toast.error("Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter(u =>
    (u.email || '').toLowerCase().includes(query.toLowerCase()) || (u.name || '').toLowerCase().includes(query.toLowerCase())
  ), [users, query]);

  const updateRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      if (role === 'admin') {
        const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' as any }, { onConflict: 'user_id,role' });
        if (error) throw error;
      } else {
        // remove role admin
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
        if (error) throw error;
      }
      toast.success('Permissão atualizada');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao atualizar permissão');
    }
  };

  const setActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('user_id', userId);
      if (error) throw error;
      toast.success('Status atualizado');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao atualizar status');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', { body: { email } });
      if (error) throw error;
      toast.success('E-mail de redefinição enviado');
    } catch (e: any) {
      toast.error('Erro ao enviar redefinição');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input placeholder="Buscar por nome ou e-mail" value={query} onChange={e => setQuery(e.target.value)} />
        <Button variant="secondary" onClick={load}>Atualizar</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={6}>Nenhum usuário</TableCell></TableRow>
          ) : (
            filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Select value={(u.role || 'user')} onValueChange={(v: any) => updateRole(u.id, v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário Padrão</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={u.is_active ? 'ativo' : 'inativo'} onValueChange={(v: any) => setActive(u.id, v === 'ativo')}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" onClick={() => resetPassword(u.email)}>Resetar senha</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
