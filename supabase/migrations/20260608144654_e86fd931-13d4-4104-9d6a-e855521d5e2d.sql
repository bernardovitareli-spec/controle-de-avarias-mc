
-- 1) Drop open policies on avarias tables
DROP POLICY IF EXISTS open_all_imp ON public.avarias_importacoes;
DROP POLICY IF EXISTS open_all_reg ON public.avarias_registros;

-- 2) Require authenticated user for all access
CREATE POLICY "auth read imp"   ON public.avarias_importacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert imp" ON public.avarias_importacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update imp" ON public.avarias_importacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete imp" ON public.avarias_importacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth read reg"   ON public.avarias_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert reg" ON public.avarias_registros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update reg" ON public.avarias_registros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete reg" ON public.avarias_registros FOR DELETE TO authenticated USING (true);

-- 3) Default usuario_id = auth.uid()
ALTER TABLE public.avarias_importacoes ALTER COLUMN usuario_id SET DEFAULT auth.uid();

-- 4) Storage bucket policies for avarias-uploads (drop any open policies first)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%avarias-uploads%' OR with_check ILIKE '%avarias-uploads%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "avarias uploads read"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias uploads insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias uploads update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avarias-uploads') WITH CHECK (bucket_id = 'avarias-uploads');
CREATE POLICY "avarias uploads delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avarias-uploads');

-- 5) Remove duplicates and create unique index on chave_duplicidade (per import)
DELETE FROM public.avarias_registros a
USING public.avarias_registros b
WHERE a.ctid < b.ctid
  AND a.importacao_id = b.importacao_id
  AND a.chave_duplicidade IS NOT NULL
  AND a.chave_duplicidade = b.chave_duplicidade;

CREATE UNIQUE INDEX IF NOT EXISTS avarias_registros_chave_dup_uniq
  ON public.avarias_registros (importacao_id, chave_duplicidade)
  WHERE chave_duplicidade IS NOT NULL;

-- 6) Also disable public signups should be done in auth config; here we ensure no anon access
REVOKE ALL ON public.avarias_importacoes FROM anon;
REVOKE ALL ON public.avarias_registros FROM anon;
