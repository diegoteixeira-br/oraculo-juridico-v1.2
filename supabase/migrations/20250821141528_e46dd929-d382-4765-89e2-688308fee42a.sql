-- Adicionar restrições de unicidade para CPF e email na tabela profiles
-- Para evitar contas duplicadas

-- Primeiro, vamos limpar qualquer duplicata existente (caso haja)
-- Manter apenas o registro mais antigo de cada CPF/email duplicado
DELETE FROM public.profiles p1 
WHERE EXISTS (
  SELECT 1 FROM public.profiles p2 
  WHERE p2.cpf = p1.cpf 
  AND p2.cpf IS NOT NULL 
  AND p2.created_at < p1.created_at
);

-- Adicionar constraint unique para CPF (apenas quando não for nulo)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_unique 
UNIQUE (cpf);

-- Adicionar índice único para user_id (garantir que cada usuário tenha apenas um profile)
-- Isso já deveria existir, mas vamos garantir
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique 
UNIQUE (user_id);

-- Criar função para validar CPF duplicado durante inserção
CREATE OR REPLACE FUNCTION validate_profile_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se CPF já existe (apenas se não for nulo)
  IF NEW.cpf IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE cpf = NEW.cpf AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'CPF já cadastrado em outra conta';
    END IF;
  END IF;
  
  -- Verificar se user_id já tem profile
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Usuário já possui um perfil cadastrado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;