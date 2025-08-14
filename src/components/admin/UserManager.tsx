import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

interface UserRow { id: string; email: string; name?: string; created_at?: string; role?: string; is_active?: boolean; tokens?: number; plan_type?: string; subscription_activated_at?: string }

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

  const updateCreatedAt = async (userId: string, newDate: string) => {
    try {
      // Converter a data local brasileira para UTC
      const localDate = new Date(newDate + 'T12:00:00');
      const utcDate = fromZonedTime(localDate, 'America/Sao_Paulo');
      
      const { error } = await supabase
        .from('profiles')
        .update({ created_at: utcDate.toISOString() })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('Data de cadastro atualizada');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao atualizar data de cadastro');
    }
  };

  const updateSubscriptionActivatedAt = async (userId: string, newDate: string) => {
    try {
      // Converter a data local brasileira para UTC
      const localDate = new Date(newDate + 'T12:00:00');
      const utcDate = fromZonedTime(localDate, 'America/Sao_Paulo');
      
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_activated_at: utcDate.toISOString() })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('Data de contratação atualizada');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao atualizar data de contratação');
    }
  };

  const updatePlanType = async (userId: string, planType: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: planType })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success('Plano atualizado');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao atualizar plano');
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
            <TableHead>Tokens</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Contratação</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9}>Carregando...</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={9}>Nenhum usuário</TableCell></TableRow>
          ) : (
            filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                 <TableCell>
                   <Input 
                     type="date" 
                     defaultValue={u.created_at ? toZonedTime(new Date(u.created_at), 'America/Sao_Paulo').toISOString().split('T')[0] : ''} 
                     onBlur={(e) => {
                       if (e.target.value && e.target.value !== (u.created_at ? toZonedTime(new Date(u.created_at), 'America/Sao_Paulo').toISOString().split('T')[0] : '')) {
                         updateCreatedAt(u.id, e.target.value);
                       }
                     }}
                     className="w-36 text-sm"
                   />
                 </TableCell>
                <TableCell className="font-medium">{u.tokens || 0}</TableCell>
                <TableCell>
                  <Select value={u.plan_type || 'gratuito'} onValueChange={(v: string) => updatePlanType(u.id, v)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gratuito">Gratuito</SelectItem>
                      <SelectItem value="Essencial">Essencial</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                 <TableCell>
                   {u.plan_type === 'Essencial' ? (
                     <Input 
                       type="date" 
                       defaultValue={u.subscription_activated_at ? toZonedTime(new Date(u.subscription_activated_at), 'America/Sao_Paulo').toISOString().split('T')[0] : ''} 
                       onBlur={(e) => {
                         if (e.target.value && e.target.value !== (u.subscription_activated_at ? toZonedTime(new Date(u.subscription_activated_at), 'America/Sao_Paulo').toISOString().split('T')[0] : '')) {
                           updateSubscriptionActivatedAt(u.id, e.target.value);
                         }
                       }}
                       className="w-36 text-sm"
                       placeholder="Selecionar data"
                     />
                   ) : (
                     <Input 
                       value="dd/mm/aaaa"
                       disabled
                       className="w-36 text-sm bg-slate-800 text-slate-500 cursor-not-allowed"
                     />
                   )}
                 </TableCell>
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
