
# Módulo de Análises de Avarias da MC

Vou transformar o dashboard atual num módulo estruturado, preservando 100% do layout e funcionalidades já aprovadas. A entrega será **incremental em 7 etapas**, cada uma testável isoladamente.

## Pré-requisito: Lovable Cloud

O módulo exige backend (importação persistente, histórico de lotes, normalização server-side, controle de duplicidade). Vou ativar o **Lovable Cloud** (banco Postgres + Auth + Storage + Edge Functions, sem necessidade de conta externa) na Etapa 1.

---

## Arquitetura do módulo

```text
src/
├── pages/
│   ├── Index.tsx                      (mantido — dashboard atual continua funcionando)
│   └── avarias/
│       ├── AvariasModule.tsx          (shell do módulo, com abas)
│       ├── DashboardTab.tsx           (evolução do dashboard atual)
│       ├── ImportTab.tsx              (upload + preview + confirmação)
│       ├── HistoricoTab.tsx           (lotes de importação)
│       ├── ContratoDetalhe.tsx        (drilldown ao clicar num card)
│       └── RelatoriosTab.tsx          (export CSV/PDF)
├── modules/avarias/
│   ├── types.ts                       (Avaria, Importacao, Categoria, etc.)
│   ├── normalize.ts                   (status, parecer)
│   ├── classify.ts                    (categorização por palavra-chave)
│   ├── parseSpreadsheet.ts            (xlsx → linhas validadas, multi-aba)
│   ├── duplicateKey.ts                (chave de duplicidade)
│   ├── insights.ts                    (geração de insights automáticos)
│   └── hooks/
│       ├── useAvarias.ts              (query + filtros)
│       ├── useImportacoes.ts
│       └── useFilters.ts
└── components/avarias/                (KPICard, charts, tabela melhorada, etc.)
```

## Modelo de dados (Lovable Cloud / Postgres)

```text
avarias_importacoes
  id uuid pk
  nome_arquivo text
  usuario_id uuid (auth.users)
  data_importacao timestamptz default now()
  total_linhas_lidas int
  total_registros_validos int
  total_registros_ignorados int
  total_duplicados int
  valor_total_importado numeric(14,2)
  status_importacao text   -- 'pendente' | 'confirmada' | 'cancelada'
  observacoes text

avarias_registros
  id uuid pk
  importacao_id uuid fk
  data_envio date
  placa text
  contrato text
  status_original text
  status_normalizado text
  nf_mc text
  valor numeric(14,2)
  parecer_original text
  parecer_normalizado text
  observacoes text
  categoria text
  subcategoria text
  chave_duplicidade text  -- hash(data+placa+contrato+valor+nf+obs)
  created_at timestamptz default now()
  -- dias_atraso e criticidade são calculados em runtime (não persistir)

avarias_categorias_regras   (opcional, p/ futuro: regras editáveis)
  id, categoria, palavra_chave, prioridade
```

RLS: usuários autenticados podem ler/inserir; só o autor pode cancelar a própria importação. Tabela de roles `user_roles` para futuro perfil admin.

## Etapas de entrega

**Etapa 1 — Fundação (esta entrega)**
- Ativar Lovable Cloud.
- Criar tabelas + RLS + bucket de storage `avarias-uploads`.
- Criar shell do módulo `/avarias` com abas (Dashboard, Importar, Histórico, Relatórios).
- Manter `Index.tsx` atual intocado e adicionar link/rota para o novo módulo.

**Etapa 2 — Importação**
- Tela de upload (.xlsx/.xls/.csv) com `xlsx` (SheetJS).
- Multi-aba: lista abas, permite escolher quais importar e atribuir contrato quando ausente.
- Parser ignora linha totalizadora e linhas vazias.
- Preview com totais (linhas lidas, válidas, ignoradas, duplicadas, valor total, contratos, placas, sem NF, sem parecer).
- Detecção de duplicidade por `chave_duplicidade` contra base existente.
- Confirmação grava em `avarias_registros` + `avarias_importacoes`.

**Etapa 3 — Normalização & classificação**
- `normalize.ts`: regras de status e parecer conforme spec.
- `classify.ts`: 8 categorias por palavra-chave (com normalização de acentos).
- Aplicado durante importação; campos originais preservados.
- Dias de atraso e criticidade calculados sempre com `new Date()` (sem data fixa).

**Etapa 4 — Dashboard evoluído (preservando layout atual)**
- Substitui fonte estática `avariasData` por hook que lê do banco com filtros.
- Adiciona KPIs faltantes: Equipamentos/Placas, Avarias Críticas, Em Negociação, Sem Parecer, Sem NF.
- Header "Atualizado em" usa a mesma `Date.now()` do cálculo de atraso.

**Etapa 5 — Filtros completos + tabela melhorada**
- Filtros: período, contrato, placa, status, parecer, categoria, criticidade, NF preenchida/pendente, lote, valor min/max, busca em observações.
- Tabela: busca textual, modal de detalhe, observação completa em popover, exportação CSV do filtrado.

**Etapa 6 — Cards de contrato + drilldown + gráficos novos**
- Cards com: valor, qtd, atraso médio, críticas, sem parecer, sem NF, indicador visual, ordenação configurável.
- Drilldown `/avarias/contrato/:nome` com gráficos específicos.
- Novos gráficos: Custos por Categoria, Top Placas (valor e qtd), Evolução Mensal, Faixas de Atraso, Heatmap Contrato×Categoria.

**Etapa 7 — Histórico, insights e relatórios**
- Aba Histórico: lista lotes, permite cancelar/reprocessar.
- Seção "Insights da Base" com frases automáticas.
- Relatórios: export CSV imediato; PDF como passo seguinte se necessário.

## Detalhes técnicos relevantes

- **xlsx**: biblioteca `xlsx` (SheetJS) para leitura cliente-side; conversão de datas Excel via `XLSX.SSF`.
- **Validação**: zod nos schemas de linha; tipos compartilhados em `modules/avarias/types.ts`.
- **Performance**: paginação server-side na tabela quando >1k linhas; índices em `(contrato)`, `(placa)`, `(importacao_id)`, `(chave_duplicidade)`.
- **Compatibilidade**: rota `/` continua mostrando o dashboard atual até a Etapa 4 substituí-lo internamente sem mudar o visual.
- **Sem hardcode**: toda métrica vem do banco; data atual sempre dinâmica.

## O que NÃO será alterado
- Layout, cores, tipografia e componentes do dashboard atual.
- Arquivo `src/data/avarias.ts` (mantido como fallback até Etapa 4 estar validada).
- Qualquer rota/permissão fora do módulo de avarias.

---

Posso começar pela **Etapa 1** (ativar Cloud + criar tabelas + shell do módulo) assim que você aprovar?
