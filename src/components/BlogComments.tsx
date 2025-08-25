import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Reply, Trash2, Edit3, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_comment_id: string | null;
  user_email?: string;
  user_name?: string;
  replies?: Comment[];
}

interface BlogCommentsProps {
  postId: string;
  postTitle: string;
}

export const BlogComments = ({ postId, postTitle }: BlogCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar informações dos usuários
      const userIds = commentsData?.map(c => c.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', uniqueUserIds);

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Organizar comentários em hierarquia
      const commentsMap = new Map();
      const rootComments: Comment[] = [];

      commentsData?.forEach(comment => {
        const profile = profilesMap.get(comment.user_id);
        const commentWithUser = {
          ...comment,
          user_name: profile?.full_name || 'Usuário',
          replies: []
        };
        commentsMap.set(comment.id, commentWithUser);
      });

      commentsData?.forEach(comment => {
        const commentData = commentsMap.get(comment.id);
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(commentData);
          }
        } else {
          rootComments.push(commentData);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comentários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, escreva um comentário.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comentário.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!user) return;

    if (!replyContent.trim()) {
      toast({
        title: "Resposta vazia",
        description: "Por favor, escreva uma resposta.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_comment_id: parentId,
        });

      if (error) throw error;

      setReplyContent('');
      setReplyTo(null);
      await fetchComments();
      toast({
        title: "Resposta enviada!",
        description: "Sua resposta foi publicada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a resposta.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchComments();
      toast({
        title: "Comentário removido",
        description: "Seu comentário foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o comentário.",
        variant: "destructive",
      });
    }
  };

  const updateComment = async (commentId: string) => {
    if (!user || !editContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      await fetchComments();
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o comentário.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-slate-700 pl-4' : ''}`}>
      <Card className="bg-slate-800/30 border-slate-700 mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {getUserInitials(comment.user_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-200 text-sm">
                  {comment.user_name || 'Usuário'}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(comment.created_at)}
                  {comment.updated_at !== comment.created_at && ' (editado)'}
                </p>
              </div>
            </div>
            
            {user && user.id === comment.user_id && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="text-slate-400 hover:text-blue-400"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment(comment.id)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {editingComment === comment.id ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edite seu comentário..."
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => updateComment(comment.id)}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  className="border-slate-600 text-slate-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-300 mb-3 whitespace-pre-wrap">{comment.content}</p>
              
              {user && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-slate-400 hover:text-blue-400"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Responder
                </Button>
              )}
              
              {replyTo === comment.id && (
                <div className="mt-3 space-y-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="bg-slate-700/50 border-slate-600 text-slate-200"
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => submitReply(comment.id)}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Renderizar respostas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Carregando comentários...</p>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-slate-200">
          Comentários ({comments.length})
        </h2>
      </div>

      {/* Formulário para novo comentário */}
      <Card className="bg-slate-800/30 border-slate-700 mb-8">
        <CardHeader>
          <h3 className="font-semibold text-slate-200">
            {user ? 'Deixe seu comentário' : 'Faça login para comentar'}
          </h3>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Compartilhe suas ideias sobre este artigo..."
                className="bg-slate-700/50 border-slate-600 text-slate-200 min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">
                  Comentando como <strong>{user.email}</strong>
                </p>
                <Button
                  onClick={submitComment}
                  disabled={submitting || !newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 mb-4">
                Você precisa estar logado para participar da discussão sobre este artigo.
              </p>
              <Link to="/login" state={{ from: 'blog' }}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Fazer Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de comentários */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">
            Seja o primeiro a comentar sobre este artigo!
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Compartilhe suas ideias e inicie a discussão.
          </p>
        </div>
      )}
    </section>
  );
};