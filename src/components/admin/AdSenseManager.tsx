import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdSenseSite {
  id: string;
  url: string;
  approval_status: 'preparando' | 'pronto' | 'precisa_revisao' | 'requer_atencao';
  status_details: string;
  ads_txt_status: 'encontrado' | 'nao_encontrado' | 'verificando';
  last_updated: string;
  created_at: string;
}

export default function AdSenseManager() {
  const [sites, setSites] = useState<AdSenseSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    url: '',
    approval_status: 'preparando' as const,
    status_details: '',
    ads_txt_status: 'verificando' as const
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('adsense_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Erro ao buscar sites:', error);
      toast.error('Erro ao carregar sites do AdSense');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('adsense_sites')
        .insert({
          ...formData,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Site adicionado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchSites();
    } catch (error) {
      console.error('Erro ao adicionar site:', error);
      toast.error('Erro ao adicionar site');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este site?')) return;

    try {
      const { error } = await supabase
        .from('adsense_sites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Site removido com sucesso!');
      fetchSites();
    } catch (error) {
      console.error('Erro ao remover site:', error);
      toast.error('Erro ao remover site');
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      approval_status: 'preparando',
      status_details: '',
      ads_txt_status: 'verificando'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      preparando: { label: 'Preparando', variant: 'secondary' as const },
      pronto: { label: 'Pronto', variant: 'default' as const },
      precisa_revisao: { label: 'Precisa de revisão', variant: 'destructive' as const },
      requer_atencao: { label: 'Requer atenção', variant: 'destructive' as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAdsTxtBadge = (status: string) => {
    const statusMap = {
      encontrado: { label: 'Encontrado', variant: 'default' as const },
      nao_encontrado: { label: 'Não encontrado', variant: 'destructive' as const },
      verificando: { label: 'Verificando', variant: 'secondary' as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Gerenciar seus sites
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione sites com que você quer gerar receita no Google AdSense.{' '}
              <a href="#" className="text-primary underline">
                Saiba mais sobre como gerar receita com seu site
              </a>
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Site</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="url">URL do Site</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="exemplo.com.br"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status_details">Detalhes do Status</Label>
                  <Input
                    id="status_details"
                    value={formData.status_details}
                    onChange={(e) => setFormData({ ...formData, status_details: e.target.value })}
                    placeholder="—"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar Site</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtros:</span>
            {['all', 'pronto', 'preparando', 'precisa_revisao', 'requer_atencao'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'Todos' : 
                 status === 'pronto' ? 'Pronto' :
                 status === 'preparando' ? 'Preparando' :
                 status === 'precisa_revisao' ? 'Precisa de revisão' :
                 'Requer atenção'}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando sites...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL do site</TableHead>
                  <TableHead>Status de aprovação</TableHead>
                  <TableHead>Detalhes do status</TableHead>
                  <TableHead>Status do ads.txt</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum site encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <a href={`https://${site.url}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {site.url}
                        </a>
                      </TableCell>
                      <TableCell>{getStatusBadge(site.approval_status)}</TableCell>
                      <TableCell>{site.status_details || '—'}</TableCell>
                      <TableCell>{getAdsTxtBadge(site.ads_txt_status)}</TableCell>
                      <TableCell>{formatDate(site.last_updated)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(site.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Ir para a página:</span>
              <Input type="number" className="w-16 h-8" defaultValue="1" />
              <span>de 1</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrar linhas:</span>
              <select className="border rounded px-2 py-1">
                <option>50</option>
                <option>100</option>
              </select>
              <span>1 - 1 de 1</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}