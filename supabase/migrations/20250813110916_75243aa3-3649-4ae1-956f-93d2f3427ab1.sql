-- Vamos primeiro corrigir as principais funções que ainda não têm search_path definido
-- e depois atualizar o perfil do usuário que já pagou

-- Função handle_new_user já tem search_path definido, vamos verificar outras
-- Agora vamos atualizar manualmente o perfil do usuário que já pagou
-- Baseado nos logs, o user_id é: 195b0286-2406-4bcb-a769-3b7432ce4864

UPDATE public.profiles 
SET 
  subscription_status = 'active',
  plan_type = 'essencial',
  updated_at = now()
WHERE user_id = '195b0286-2406-4bcb-a769-3b7432ce4864';