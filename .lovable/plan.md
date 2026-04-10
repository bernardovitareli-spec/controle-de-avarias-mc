

## Análise dos Dados

A planilha contém avarias da empresa Ápia, separadas por contrato (abas):

| Aba/Contrato | Registros | Total (R$) |
|---|---|---|
| ÁPIA SALOBO | ~40 itens | R$ 71.613,17 |
| APIA SLB | ~18 itens | R$ 31.014,61 |
| Possíveis abas adicionais | A verificar | - |

**Colunas**: Data Envio, Placa, Contrato, Status, NF MC, Valor, Parecer Cliente, Observações

**Pareceres identificados**: LIBERADO DE ACORDO, ACORDADO MATEUS, DIEGO, REPOSIÇÃO, À NEGOCIAR

**Todas em status NEGOCIAÇÃO** -- o atraso será calculado como dias desde a Data Envio até hoje (10/04/2026).

---

## Plano de Implementação

### 1. Extrair e estruturar os dados da planilha
- Script Python com pandas para ler todas as abas do Excel
- Gerar um JSON estruturado com todos os registros, classificados por contrato e parecer
- Calcular dias de atraso para cada avaria

### 2. Criar página de Dashboard Executivo
- **Painel de resumo (KPIs)**: Total geral, total por contrato, quantidade de avarias, atraso médio
- **Cards por contrato/aba**: Cada contrato com seu subtotal, quantidade e indicador de criticidade
- **Classificação por Parecer Cliente**: Agrupar avarias em categorias (Liberado, Acordado, Reposição, À Negociar) com cores diferenciadas
- **Tabela detalhada**: Com todas as avarias, ordenável, com coluna de "Dias de Atraso" destacada em vermelho/amarelo conforme gravidade
- **Gráficos**: Distribuição de custos por contrato e por tipo de parecer

### 3. Visual e UX
- Cores de alerta para atrasos (verde <30d, amarelo 30-90d, vermelho >90d)
- Filtros por contrato e por parecer
- Layout responsivo com cards e tabelas

### Arquivos a criar/modificar
- `src/data/avarias.ts` -- dados estruturados extraídos da planilha
- `src/pages/Index.tsx` -- dashboard principal com KPIs, cards e tabela
- `src/components/AvariasTable.tsx` -- tabela detalhada com indicadores de atraso
- `src/components/KPICard.tsx` -- cards de resumo executivo
- Instalar `recharts` para gráficos

