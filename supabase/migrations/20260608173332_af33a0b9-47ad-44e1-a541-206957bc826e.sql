CREATE OR REPLACE FUNCTION public.create_avarias_import(
  p_nome_arquivo text,
  p_total_linhas_lidas int,
  p_total_registros_ignorados int,
  p_valor_total_importado numeric,
  p_registros jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_importacao_id uuid;
  v_total_lote int := 0;
  v_unicos_lote int := 0;
  v_inseridos int := 0;
  v_duplicados int := 0;
  v_valor_inserido numeric := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.avarias_importacoes (
    nome_arquivo, usuario_id, total_linhas_lidas,
    total_registros_ignorados, valor_total_importado, status_importacao
  )
  VALUES (
    p_nome_arquivo, v_user, COALESCE(p_total_linhas_lidas, 0),
    COALESCE(p_total_registros_ignorados, 0),
    COALESCE(p_valor_total_importado, 0), 'confirmada'
  )
  RETURNING id INTO v_importacao_id;

  -- Dedup dentro do lote por chave_duplicidade
  WITH lote AS (
    SELECT
      (r->>'data_envio')::date            AS data_envio,
      r->>'placa'                          AS placa,
      r->>'contrato'                       AS contrato,
      r->>'status_original'                AS status_original,
      r->>'status_normalizado'             AS status_normalizado,
      r->>'nf_mc'                          AS nf_mc,
      COALESCE((r->>'valor')::numeric, 0)  AS valor,
      r->>'parecer_original'               AS parecer_original,
      r->>'parecer_normalizado'            AS parecer_normalizado,
      r->>'observacoes'                    AS observacoes,
      r->>'categoria'                      AS categoria,
      r->>'subcategoria'                   AS subcategoria,
      r->>'chave_duplicidade'              AS chave_duplicidade
    FROM jsonb_array_elements(COALESCE(p_registros, '[]'::jsonb)) AS r
  ),
  total_lote AS (SELECT COUNT(*)::int AS c FROM lote),
  unicos AS (
    SELECT DISTINCT ON (chave_duplicidade) *
    FROM lote
    WHERE chave_duplicidade IS NOT NULL AND chave_duplicidade <> ''
    ORDER BY chave_duplicidade
  ),
  unicos_count AS (SELECT COUNT(*)::int AS c FROM unicos),
  inseridos AS (
    INSERT INTO public.avarias_registros (
      importacao_id, data_envio, placa, contrato,
      status_original, status_normalizado, nf_mc, valor,
      parecer_original, parecer_normalizado, observacoes,
      categoria, subcategoria, chave_duplicidade
    )
    SELECT
      v_importacao_id, u.data_envio, u.placa, u.contrato,
      u.status_original, u.status_normalizado, u.nf_mc, u.valor,
      u.parecer_original, u.parecer_normalizado, u.observacoes,
      u.categoria, u.subcategoria, u.chave_duplicidade
    FROM unicos u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.avarias_registros ar
      WHERE ar.chave_duplicidade = u.chave_duplicidade
    )
    RETURNING valor
  ),
  agg AS (
    SELECT COUNT(*)::int AS c, COALESCE(SUM(valor), 0)::numeric AS v
    FROM inseridos
  )
  SELECT
    (SELECT c FROM total_lote),
    (SELECT c FROM unicos_count),
    agg.c,
    agg.v
  INTO v_total_lote, v_unicos_lote, v_inseridos, v_valor_inserido
  FROM agg;

  v_duplicados := v_total_lote - v_inseridos;

  UPDATE public.avarias_importacoes
  SET total_registros_validos   = v_inseridos,
      total_duplicados          = v_duplicados,
      valor_total_importado     = v_valor_inserido,
      status_importacao         = 'confirmada',
      updated_at                = now()
  WHERE id = v_importacao_id;

  RETURN jsonb_build_object(
    'importacao_id', v_importacao_id,
    'inseridos', v_inseridos,
    'duplicados', v_duplicados
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_avarias_import(text, int, int, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_avarias_import(text, int, int, numeric, jsonb) TO authenticated;