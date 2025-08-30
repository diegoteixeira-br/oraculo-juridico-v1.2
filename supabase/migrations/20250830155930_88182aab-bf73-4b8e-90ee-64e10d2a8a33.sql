-- Criar tabela para categorias do blog
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - admins podem gerenciar tudo
CREATE POLICY "Admins can manage blog categories" 
ON public.blog_categories 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Todos podem ver categorias ativas
CREATE POLICY "Everyone can read active categories" 
ON public.blog_categories 
FOR SELECT 
USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.blog_categories (name, slug, description, display_order) VALUES
('Geral', 'geral', 'Artigos gerais sobre direito', 1),
('Direito Digital', 'direito-digital', 'Tecnologia e direito digital', 2),
('LGPD', 'lgpd', 'Lei Geral de Proteção de Dados', 3),
('Tecnologia Jurídica', 'tecnologia', 'Inovação e tecnologia no direito', 4),
('Compliance', 'compliance', 'Conformidade e regulamentações', 5),
('Jurisprudência', 'jurisprudencia', 'Decisões e jurisprudência', 6),
('Direito Civil', 'direito-civil', 'Direito civil e obrigações', 7),
('Direito Penal', 'direito-penal', 'Direito penal e criminal', 8),
('Direito Trabalhista', 'direito-trabalhista', 'Relações de trabalho', 9),
('Direito Tributário', 'direito-tributario', 'Tributos e impostos', 10),
('Direito Empresarial', 'direito-empresarial', 'Direito societário e empresarial', 11),
('Direito Constitucional', 'direito-constitucional', 'Direito constitucional', 12),
('Direito Administrativo', 'direito-administrativo', 'Direito público administrativo', 13),
('Direito Previdenciário', 'direito-previdenciario', 'Previdência social', 14),
('Direito do Consumidor', 'direito-consumidor', 'Relações de consumo', 15),
('Direito de Família', 'direito-familia', 'Direito familiar', 16),
('Direito Imobiliário', 'direito-imobiliario', 'Negócios imobiliários', 17),
('Direito Processual', 'direito-processual', 'Processo civil e procedimentos', 18),
('Advocacia', 'advocacia', 'Prática advocatícia', 19),
('Legislação', 'legislacao', 'Leis e normativas', 20);