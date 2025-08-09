-- Add folder and tags to user_documents
ALTER TABLE public.user_documents
ADD COLUMN IF NOT EXISTS folder TEXT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] NULL DEFAULT '{}'::text[];

-- Optional index for tags search
CREATE INDEX IF NOT EXISTS idx_user_documents_tags ON public.user_documents USING GIN (tags);

-- Ensure updated_at is refreshed on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_documents_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;