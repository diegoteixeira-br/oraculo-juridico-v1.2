import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Undo2, AlertTriangle, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";

interface RefundForm {
  user_id: string;
  tokens_amount: string;
  reason: string;
  transaction_id: string;
}

export default function RefundManager() {
  const [refundForm, setRefundForm] = useState<RefundForm>({
    user_id: "",
    tokens_amount: "",
    reason: "",
    transaction_id: ""
  });
  const [processing, setProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Buscar usuários com tokens
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users-with-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, tokens, plan_tokens, subscription_status, plan_type")
        .gt("tokens", 0)
        .order("tokens", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar transações de estorno recentes
  const { data: recentRefunds } = useQuery({
    queryKey: ["recent-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select(`
          id,
          user_id,
          amount,
          description,
          created_at,
          stripe_session_id,
          profiles!inner(full_name)
        `)
        .eq("transaction_type", "refund")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const handleProcessRefund = async () => {
    if (!refundForm.user_id || !refundForm.tokens_amount) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const tokensAmount = parseInt(refundForm.tokens_amount);
    if (isNaN(tokensAmount) || tokensAmount <= 0) {
      toast.error("Quantidade de tokens deve ser um número positivo");
      return;
    }

    setProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-refund", {
        body: {
          user_id: refundForm.user_id,
          tokens_amount: tokensAmount,
          reason: refundForm.reason,
          transaction_id: refundForm.transaction_id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Estorno processado: ${tokensAmount} tokens removidos`);
        setRefundForm({
          user_id: "",
          tokens_amount: "",
          reason: "",
          transaction_id: ""
        });
        setSelectedUser(null);
        refetchUsers();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao processar estorno:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setRefundForm(prev => ({
      ...prev,
      user_id: user.user_id
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Gerenciar Estornos
          </CardTitle>
          <CardDescription>
            Processar estornos manuais e visualizar histórico de reembolsos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação removerá tokens da conta do usuário e não pode ser desfeita. 
              Use apenas para estornos legítimos.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Estorno */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Processar Estorno</h3>
              
              {selectedUser && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{selectedUser.full_name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">
                    Tokens: {selectedUser.tokens} | Plano: {selectedUser.plan_type} | Status: {selectedUser.subscription_status}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="user_id">ID do Usuário *</Label>
                <Input
                  id="user_id"
                  value={refundForm.user_id}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, user_id: e.target.value }))}
                  placeholder="UUID do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_amount">Quantidade de Tokens *</Label>
                <Input
                  id="tokens_amount"
                  type="number"
                  value={refundForm.tokens_amount}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, tokens_amount: e.target.value }))}
                  placeholder="Ex: 1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_id">ID da Transação (opcional)</Label>
                <Input
                  id="transaction_id"
                  value={refundForm.transaction_id}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                  placeholder="ID da transação Stripe/Cakto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo do Estorno *</Label>
                <Textarea
                  id="reason"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Descreva o motivo do estorno..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleProcessRefund} 
                disabled={processing}
                className="w-full"
              >
                {processing ? "Processando..." : "Processar Estorno"}
              </Button>
            </div>

            {/* Lista de Usuários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usuários com Tokens</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {users?.map((user) => (
                  <div
                    key={user.user_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.user_id === user.user_id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground/20"
                    }`}
                    onClick={() => selectUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {user.full_name || "Sem nome"}
                        </span>
                      </div>
                      <Badge variant="secondary">{user.tokens} tokens</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.plan_type} • {user.subscription_status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Estornos */}
      <Card>
        <CardHeader>
          <CardTitle>Estornos Recentes</CardTitle>
          <CardDescription>
            Últimos 10 estornos processados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRefunds?.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    {(refund.profiles as any)?.full_name || "Usuário não encontrado"}
                  </TableCell>
                  <TableCell className="font-medium text-red-600">
                    {Math.abs(refund.amount)} tokens
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={refund.description}>
                    {refund.description}
                  </TableCell>
                  <TableCell>
                    {new Date(refund.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Processado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}