# Regras de validação da Inscrição Estadual — 27 UFs

> **Fonte primária:** roteiros de crítica do dígito verificador publicados por cada UF no portal do
> SINTEGRA, `http://www.sintegra.gov.br/Cad_Estados/cad_<UF>.html` (índice:
> `http://www.sintegra.gov.br/insc_est.html`). O próprio SINTEGRA avisa que a DLL antiga dele está
> desatualizada e recomenda implementar a partir desses roteiros — foi o que fizemos.
>
> **Como ler os exemplos:** o "exemplo sintético" foi gerado aplicando o algoritmo (é só um número
> bem formado; não sabemos nem afirmamos que exista ou pertença a alguém). O "exemplo oficial" é o
> publicado no roteiro da UF e serve de prova cruzada: as duas implementações (JS/TS e Python) têm
> que aceitar os dois.

## Convenções usadas abaixo

- **Pesos 9..2** = multiplicar o 1º dígito por 9, o 2º por 8, … o 8º por 2.
- **Módulo 11 padrão** = `resto = soma mod 11`; se `resto` for 0 ou 1 → DV = 0; senão DV = 11 − resto.
  É exatamente a mesma coisa que "DV = 11 − resto; se der 10 ou 11, DV = 0", forma usada por
  CE, PB, PI, SE, RS, AC, DF. MS também cai nisso ("se R = 0 → 0; T = 11 − R; T > 9 → 0").
- Máscaras são convenção de exibição; a lib ignora pontuação na entrada.

## Zeros à esquerda

O leiaute da NF-e manda a SEFAZ desprezar os zeros não significativos à esquerda da IE antes de
conferi-la, e planilhas apagam esses zeros de células numéricas. Por isso é comum a IE chegar curta:
`0623079040081` (MG, 13 dígitos) vira `623079040081`. A lib faz o seguinte:

- IE com **tamanho aceito pela UF**: confere como está. Nada é completado, mesmo que outro tamanho da
  UF também conferisse com zeros (ex.: BA de 8 dígitos não vira 9; RO de 9 dígitos não vira 14).
- IE **mais curta** que um tamanho da UF: completa com zeros à esquerda até esse tamanho e confere de
  novo. Com mais de um tamanho possível, tenta primeiro o de menos zeros (PE: 9, depois 14), exceto em
  RO, que tenta o formato atual (14) antes do antigo (9). O resultado traz `zerosCompletados` e a
  `formatada` já completa. Se nenhum tamanho conferir, o motivo é `tamanho inválido`.
- IE **mais longa** que a UF aceita: inválida (zeros a mais não são removidos).
- Só zeros (ou um dígito repetido, depois de completar) não é IE.
- **SP, produtor rural (`P…`):** não é completada. O `P` faz da IE um texto (planilha não come zero
  de texto) e o `0` logo depois do `P` é parte fixa do formato `P0MMMSSSSD000`; completar ali só
  esconderia erro de digitação. A IE comum de SP (12 dígitos) é completada normalmente.
- **MT:** 9 e 10 dígitos já eram aceitos e completados (é como a IE circula); agora o resultado
  também informa esses zeros (`zerosCompletados` 2 ou 1).

## Resumo

| UF | Dígitos | Máscara usual | DVs | Algoritmo | Prefixo exigido |
|----|---------|---------------|-----|-----------|-----------------|
| AC | 13 | 01.234.567/001-24 | 2 | mod 11, pesos 4,3,2,9..2 / 5,4,3,2,9..2 | 01 |
| AL | 9 | 24.076.543-5 | 1 | (soma × 10) mod 11 | 24 |
| AP | 9 | 03.123.456-9 | 1 | mod 11 + constantes p/d por faixa | 03 |
| AM | 9 | 04.123.456-1 | 1 | mod 11 (caso especial soma < 11) | — |
| BA | 8 ou 9 | 234567-76 / 0612345-57 | 2 | mod 10 **ou** 11 conforme 1º/2º dígito; 2º DV calculado primeiro | — |
| CE | 9 | 06123456-7 | 1 | mod 11 padrão | — |
| DF | 13 | 07312345001-87 | 2 | igual ao AC | 07 ou 08 |
| ES | 9 | 081.234.56-2 | 1 | mod 11 padrão | — |
| GO | 9 | 10.123.456-2 | 1 | mod 11 padrão (+ regra legada) | 10, 11, 20–29 (e 15, legado) |
| MA | 9 | 12.123.456-8 | 1 | mod 11 padrão | 12 |
| MT | 11 (aceita 9–10 com zeros à esquerda) | 0013234567-6 | 1 | mod 11, pesos 3,2,9..2 | — |
| MS | 9 | 28.345.678-7 | 1 | mod 11 padrão | 28 ou 50 |
| MG | 13 | 317.123.456/0046 | 2 | DV1 "soma de algarismos" (Luhn-like); DV2 mod 11 | — |
| PA | 9 | 15-123456-6 | 1 | mod 11 padrão | 15, 75–79 |
| PB | 9 | 16123456-9 | 1 | mod 11 padrão | — |
| PR | 10 | 412.34567-30 | 2 | mod 11, pesos 3,2,7..2 / 4,3,2,7..2 | — |
| PE | 9 (e-Fisco) ou 14 (CACEPE antigo) | 1234567-97 / 18.1.001.0000004-9 | 2 / 1 | mod 11 padrão / 11 − resto, >9 → −10 | — |
| PI | 9 | 191234567 | 1 | mod 11 padrão | — |
| RJ | 8 | 81.234.56-6 | 1 | mod 11, pesos 2,7..2 | — |
| RN | 9 ou 10 | 20.123.456-4 / 20.1.234.568-9 | 1 | (soma × 10) mod 11 | 20 |
| RS | 10 | 096/1234563 | 1 | mod 11, pesos 2,9..2 | — |
| RO | 14 (atual) ou 9 (antigo) | 0000000234567-6 | 1 | 11 − resto, >9 → −10 | — |
| RR | 9 | 24123456-8 | 1 | pesos 1..8, **mod 9** | 24 |
| SC | 9 | 251.234.568 | 1 | mod 11 padrão | — |
| SP | 12, ou "P" + 12 (produtor rural) | 123.456.785.016 / P-01234567.5/001 | 2 / 1 | (soma mod 11), algarismo da direita | — |
| SE | 9 | 27654321-1 | 1 | mod 11 padrão | — |
| TO | 9 (atual) ou 11 (antigo) | 29.123.456-9 / 29.01.123456-9 | 1 | mod 11 padrão, 3º e 4º dígitos fora do cálculo no formato de 11 | categoria 01/02/03/99 (formato 11) |

Regras gerais da lib (todas as UFs): remove `. - / \` e espaços; recusa letras (exceto o `P`
inicial em SP); recusa "ISENTO"; recusa sequência de um dígito só repetido (`000000000`).

---

## AC — Acre

- **Dígitos:** 13 (11 + 2 DVs). **Máscara:** `01.004.823/001-12`. **Prefixo:** sempre `01`.
- **Algoritmo:**
  1. DV1: pesos `4,3,2,9,8,7,6,5,4,3,2` sobre os 11 primeiros; módulo 11 padrão.
  2. DV2: pesos `5,4,3,2,9,8,7,6,5,4,3,2` sobre os 11 primeiros + DV1; módulo 11 padrão.
- **Exemplo sintético — 01.234.567/001-24:**
  - DV1: 0×4 + 1×3 + 2×2 + 3×9 + 4×8 + 5×7 + 6×6 + 7×5 + 0×4 + 0×3 + 1×2 = 174; 174 mod 11 = 9; 11 − 9 = **2**
  - DV2: 0×5 + 1×4 + 2×3 + 3×2 + 4×9 + 5×8 + 6×7 + 7×6 + 0×5 + 0×4 + 1×3 + 2×2 = 183; 183 mod 11 = 7; 11 − 7 = **4**
- **Exemplo oficial:** 01.004.823/001-12.
- **Erros comuns:** esquecer o `0` inicial (o número tem 13 dígitos e começa com `01`).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_AC.html

## AL — Alagoas

- **Dígitos:** 9. **Formação:** `24XNNNNND` — `24` (UF), `X` tipo de empresa (roteiro cita 0 normal,
  3 produtor rural, 5 substituta, 7 microempresa ambulante, 8 microempresa), `NNNNN` número, `D` DV.
- **Algoritmo:** pesos 9..2 sobre os 8 primeiros → soma; produto = soma × 10; DV = produto mod 11; se 10 → 0.
- **Exemplo sintético — 24.076.543-5:** 2×9 + 4×8 + 0×7 + 7×6 + 6×5 + 5×4 + 4×3 + 3×2 = 160; 160 × 10 = 1600;
  1600 mod 11 = **5**.
- **Exemplo oficial:** 24000004-8 (soma 58 → 580 mod 11 = 8).
- **Decisão:** a lib **não** valida o 3º dígito (tipo de empresa). A lista do roteiro é antiga e há IEs
  reais com tipo fora dela (ex.: `2422…`); recusar seria falso negativo.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_AL.html

## AP — Amapá

- **Dígitos:** 9. **Prefixo:** `03`.
- **Algoritmo:** sobre os 8 primeiros (como número):
  - 03000001 a 03017000 → p = 5, d = 0
  - 03017001 a 03019022 → p = 9, d = 1
  - 03019023 em diante → p = 0, d = 0
  - soma = p + Σ(pesos 9..2); DV = 11 − (soma mod 11); se 10 → 0; se 11 → d.
- **Exemplo sintético — 03.123.456-9 (faixa p = 0):** 0 + 0×9 + 3×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 101;
  101 mod 11 = 2; 11 − 2 = **9**.
- **Exemplo oficial:** 030123459 (faixa p = 5: 5 + 74 = 79; 79 mod 11 = 2 → 9).
- **Erros comuns:** aplicar o módulo 11 "puro" sem o `p` — dá DV errado em inscrições antigas.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_AP.html

## AM — Amazonas

- **Dígitos:** 9. **Máscara:** `99.999.999-9`. Sem prefixo no roteiro (na prática começam com 04/05/06/07; não exigimos).
- **Algoritmo:** soma com pesos 9..2. Se soma < 11 → DV = 11 − soma. Senão, resto = soma mod 11;
  resto ≤ 1 → 0; senão 11 − resto.
- **Exemplo sintético — 04.123.456-1:** 0×9 + 4×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 109; 109 mod 11 = 10;
  11 − 10 = **1**.
- **Divergência:** algumas libs ignoram o ramo "soma < 11" (só afeta números quase todos zero; sem impacto real).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_AM.html

## BA — Bahia

- **Dígitos:** 8 (antigo) ou 9 (atual). **Máscara:** `123456-63` / `1000003-06`.
- **Qual módulo:** olha o **1º dígito** (IE de 8) ou o **2º dígito** (IE de 9):
  0, 1, 2, 3, 4, 5, 8 → **módulo 10**; 6, 7, 9 → **módulo 11**.
- **Ordem invertida:** calcula-se primeiro o **2º DV** (último dígito), depois o 1º DV usando o 2º.
  - 8 dígitos: 2º DV = pesos 7..2 sobre os 6 primeiros; 1º DV = pesos 8..2 sobre os 6 primeiros + 2º DV.
  - 9 dígitos: 2º DV = pesos 8..2 sobre os 7 primeiros; 1º DV = pesos 9..2 sobre os 7 primeiros + 2º DV.
  - Módulo 10: resto = soma mod 10; DV = 0 se resto 0, senão 10 − resto.
  - Módulo 11: padrão (resto 0 ou 1 → 0).
- **Exemplo sintético (9 dígitos, módulo 11) — 0612345-57:** 2º dígito = 6 → módulo 11.
  - 2º DV: 0×8 + 6×7 + 1×6 + 2×5 + 3×4 + 4×3 + 5×2 = 92; 92 mod 11 = 4; 11 − 4 = **7**
  - 1º DV: 0×9 + 6×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 7×2 = 127; 127 mod 11 = 6; 11 − 6 = **5**
- **Exemplo sintético (8 dígitos, módulo 10) — 234567-76:**
  - 2º DV: 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 = 104; 104 mod 10 = 4; 10 − 4 = **6**
  - 1º DV: 2×8 + 3×7 + 4×6 + 5×5 + 6×4 + 7×3 + 6×2 = 143; 143 mod 10 = 3; 10 − 3 = **7**
- **Exemplos oficiais:** 123456-63 (mod 10), 612345-57 (mod 11), 1000003-06 (9 díg., mod 10).
- **Erros comuns:** (1) usar o 1º dígito para decidir o módulo numa IE de 9 dígitos (é o 2º);
  (2) calcular os DVs na ordem natural; (3) completar IE de 8 dígitos com zero à esquerda — muda a regra.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_BA.html

## CE — Ceará

- **Dígitos:** 9. **Máscara:** `06000001-5`.
- **Algoritmo:** pesos 9..2; módulo 11 padrão.
- **Exemplo sintético — 06123456-7:** 0×9 + 6×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 125; 125 mod 11 = 4; 11 − 4 = **7**.
- **Exemplo oficial:** 06000001-5.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_CE.html

## DF — Distrito Federal

- **Dígitos:** 13. **Composição:** `07` ou `08` + número sequencial (6) + `001` matriz / `002…` filiais + 2 DVs.
- **Algoritmo:** idêntico ao AC (pesos 4,3,2,9..2 e 5,4,3,2,9..2; módulo 11 padrão).
- **Exemplo sintético — 07312345001-87:**
  - DV1: 0×4 + 7×3 + 3×2 + 1×9 + 2×8 + 3×7 + 4×6 + 5×5 + 0×4 + 0×3 + 1×2 = 124; 124 mod 11 = 3; 11 − 3 = **8**
  - DV2: 0×5 + 7×4 + 3×3 + 1×2 + 2×9 + 3×8 + 4×7 + 5×6 + 0×5 + 0×4 + 1×3 + 8×2 = 158; 158 mod 11 = 4; 11 − 4 = **7**
- **Exemplo oficial:** 07300001001-09 (o roteiro do DF é uma imagem: `df1t.gif`, `df2t.gif`).
- **Prefixo `08`:** o roteiro mostra só `07`, mas o DF já emite inscrições começando com `08` (há dezenas delas
  em editais publicados no DODF em 2025, todas com DV correto pelo mesmo cálculo). A biblioteca aceita `07` e `08`,
  como ACBr e `js-brasil`.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_DF.html

## ES — Espírito Santo

- **Dígitos:** 9. **Algoritmo:** pesos 9..2; resto < 2 → 0; senão 11 − resto.
- **Exemplo sintético — 081.234.56-2:** 0×9 + 8×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 141; 141 mod 11 = 9; 11 − 9 = **2**.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_ES.html

## GO — Goiás

- **Dígitos:** 9. **Máscara:** `AB.CDE.FGH-I`.
- **Prefixo:** roteiro **atual** do SINTEGRA: `10`, `11` ou `20` a `29`. Roteiros antigos e várias libs
  citam `10`, `11`, `15`. A lib aceita os quatro grupos (evita falso negativo).
- **Algoritmo (atual):** pesos 9..2; resto 0 ou 1 → 0; senão 11 − resto.
- **Regra legada (roteiro antigo, ainda replicada em libs):** se resto = 1 e a base estiver entre
  10103105 e 10119997, DV = 1; e a IE 11094402 aceita DV 0 ou 1. O roteiro atual não traz mais isso.
  A lib aceita **as duas** formas nesses casos.
- **Exemplo sintético — 10.123.456-2:** 1×9 + 0×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 86; 86 mod 11 = 9; 11 − 9 = **2**.
- **Exemplo oficial:** 10.987.654-7 (soma 202, resto 4 → 7).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_GO.html

## MA — Maranhão

- **Dígitos:** 9. **Prefixo:** `12`. **Algoritmo:** pesos 9..2; módulo 11 padrão.
- **Exemplo sintético — 12.123.456-8:** 1×9 + 2×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 102; 102 mod 11 = 3; 11 − 3 = **8**.
- **Exemplo oficial:** 12000038-5.
- **Nota:** a SEFAZ-MA anunciou em 07/2026 nova lógica de *geração* (reuso de lacunas), sem mudar
  estrutura (9 dígitos, prefixo 12) nem o cálculo do DV — fonte: notícia COAD de 24/07/2026.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_MA.html

## MT — Mato Grosso

- **Dígitos:** 11 (`NNNNNNNNNN-D`). Na prática a IE circula muitas vezes sem os zeros à esquerda
  (9 dígitos); a lib aceita 9, 10 ou 11 e completa com zeros.
- **Algoritmo:** pesos `3,2,9,8,7,6,5,4,3,2` sobre os 10 primeiros; módulo 11 padrão.
  (Com zeros à esquerda, isso é idêntico a "pesos 9..2 sobre 8 dígitos".)
- **Exemplo sintético — 0013234567-6:** 0×3 + 0×2 + 1×9 + 3×8 + 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 = 137;
  137 mod 11 = 5; 11 − 5 = **6**.
- **Exemplo oficial:** 0013000001-9.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_MT.html

## MS — Mato Grosso do Sul

- **Dígitos:** 9. **Prefixo:** `28` **ou `50`** (o `50` foi incluído no roteiro; libs antigas só aceitam 28).
- **Algoritmo:** pesos 9..2; R = soma mod 11; R = 0 → 0; T = 11 − R; T > 9 → 0; senão T.
- **Exemplo sintético — 28.345.678-7:** 2×9 + 8×8 + 3×7 + 4×6 + 5×5 + 6×4 + 7×3 + 8×2 = 213; 213 mod 11 = 4; 11 − 4 = **7**.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_MS.html

## MG — Minas Gerais

- **Dígitos:** 13 = município (3) + inscrição (6) + estabelecimento (2) + 2 DVs. **Máscara:** `062.307.904/0081`.
- **DV1:**
  1. Insere um `0` logo após os 3 dígitos do município (11 → 12 dígitos).
  2. Multiplica, da esquerda para a direita, alternadamente por 1, 2, 1, 2…
  3. Soma os **algarismos** dos produtos (12 → 1 + 2).
  4. DV1 = dezena exata imediatamente superior − soma (se a soma já for múltiplo de 10, DV1 = 0).
- **DV2:** sobre os 11 dígitos originais + DV1 (sem o `0` inserido), pesos `3,2,11,10,9,8,7,6,5,4,3,2`; módulo 11 padrão.
- **Exemplo sintético — 317.123.456/0046:**
  - Trabalho: 317 **0** 12345600 → produtos 3,2,7,0,1,4,3,8,5,12,0,0 → algarismos 3+2+7+0+1+4+3+8+5+1+2+0+0 = 36; 40 − 36 = **4**
  - DV2: 3×3 + 1×2 + 7×11 + 1×10 + 2×9 + 3×8 + 4×7 + 5×6 + 6×5 + 0×4 + 0×3 + 4×2 = 236; 236 mod 11 = 5; 11 − 5 = **6**
- **Exemplo oficial:** 062.307.904/0081.
- **Erros comuns:** somar os produtos em vez dos algarismos; esquecer o `0` inserido; manter o `0` no DV2.
  Formato antigo de produtor rural "PR…" não é suportado (hoje produtor usa a IE comum de 13 dígitos).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_MG.html

## PA — Pará

- **Dígitos:** 9. **Prefixo:** `15`, `75`, `76`, `77`, `78`, `79` (roteiro atual; libs antigas só `15`).
- **Algoritmo:** pesos 9..2; módulo 11 padrão.
- **Exemplo sintético — 15-123456-6:** 1×9 + 5×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 126; 126 mod 11 = 5; 11 − 5 = **6**.
- **Exemplos oficiais:** 15999999-5 e 75000002-3.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_PA.html

## PB — Paraíba

- **Dígitos:** 9. **Algoritmo:** pesos 9..2; 11 − resto; 10 ou 11 → 0. (Na prática começam com 16; não exigimos.)
- **Exemplo sintético — 16123456-9:** 1×9 + 6×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 134; 134 mod 11 = 2; 11 − 2 = **9**.
- **Nota:** o roteiro da PB reaproveita o exemplo do CE (06000001-5).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_PB.html

## PR — Paraná

- **Dígitos:** 10 (`NNNNNNNN-DD`). **Máscara:** `123.45678-50`.
- **Algoritmo:** DV1 = pesos `3,2,7,6,5,4,3,2` sobre 8 dígitos; DV2 = pesos `4,3,2,7,6,5,4,3,2` sobre 8 + DV1; módulo 11 padrão.
- **Exemplo sintético — 412.34567-30:**
  - DV1: 4×3 + 1×2 + 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 = 118; 118 mod 11 = 8; 11 − 8 = **3**
  - DV2: 4×4 + 1×3 + 2×2 + 3×7 + 4×6 + 5×5 + 6×4 + 7×3 + 3×2 = 144; 144 mod 11 = 1 → **0**
- **Exemplo oficial:** 123.45678-50.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_PR.html

## PE — Pernambuco

- **Formatos:** 9 dígitos (e-Fisco, atual: 7 + 2 DVs) ou 14 dígitos (CACEPE, antigo: 13 + 1 DV).
- **e-Fisco:** DV1 = pesos 8..2 sobre 7 dígitos; DV2 = pesos 9..2 sobre 7 + DV1; módulo 11 padrão.
- **CACEPE:** pesos `5,4,3,2,1,9,8,7,6,5,4,3,2` sobre 13 dígitos; DV = 11 − resto; se > 9, DV − 10.
- **Exemplo sintético (e-Fisco) — 1234567-97:**
  - DV1: 1×8 + 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 = 112; 112 mod 11 = 2; 11 − 2 = **9**
  - DV2: 1×9 + 2×8 + 3×7 + 4×6 + 5×5 + 6×4 + 7×3 + 9×2 = 158; 158 mod 11 = 4; 11 − 4 = **7**
- **Exemplos oficiais:** 0321418-40 (e-Fisco) e 18.1.001.0000004-9 (CACEPE).
- **Divergência:** várias libs não implementam o formato de 14 dígitos; nós aceitamos os dois.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_PE.html

## PI — Piauí

- **Dígitos:** 9. **Algoritmo:** pesos 9..2; 11 − resto; 10 ou 11 → 0. (Na prática começam com 19; não exigimos.)
- **Exemplo sintético — 191234567:** 1×9 + 9×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 158; 158 mod 11 = 4; 11 − 4 = **7**.
- **Exemplo oficial:** 012345679.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_PI.html

## RJ — Rio de Janeiro

- **Dígitos:** 8. **Máscara:** `99.999.99-9`.
- **Algoritmo:** pesos `2,7,6,5,4,3,2` sobre 7 dígitos; resto ≤ 1 → 0; senão 11 − resto.
- **Exemplo sintético — 81.234.56-6:** 8×2 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 93; 93 mod 11 = 5; 11 − 5 = **6**.
- **Nota:** o roteiro do RJ é uma imagem (`rj.gif`) sem exemplo numérico.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_RJ.html

## RN — Rio Grande do Norte

- **Dígitos:** 9 ou 10 ("ampliação do número de dígitos"; as duas valem). **Prefixo:** `20`.
- **Algoritmo:** pesos 9..2 (IE de 9) ou 10..2 (IE de 10) sobre todos menos o último; soma × 10; DV = mod 11; 10 → 0.
- **Exemplo sintético — 20.123.456-4:** 2×9 + 0×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 95; 95 × 10 = 950; 950 mod 11 = **4**.
- **Exemplos oficiais:** 20.040.040-1 e 20.0.040.040-0.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_RN.html

## RS — Rio Grande do Sul

- **Dígitos:** 10 = município (3) + empresa (6) + DV. **Máscara:** `224/3658792`.
- **Algoritmo:** pesos `2,9,8,7,6,5,4,3,2` sobre 9 dígitos; 11 − resto; 10 ou 11 → 0.
- **Exemplo sintético — 096/1234563:** 0×2 + 9×9 + 6×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 206; 206 mod 11 = 8; 11 − 8 = **3**.
- **Exemplo oficial:** 224/3658792.
- **Decisão:** não validamos a tabela de códigos de município (muda com emancipações).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_RS.html

## RO — Rondônia

- **Formato atual (desde 01/08/2000):** 14 dígitos = 13 + DV. Pesos `6,5,4,3,2,9,8,7,6,5,4,3,2`;
  DV = 11 − resto; se der 10 ou 11, subtrai 10 (ou seja: resto 0 → 1, resto 1 → 0).
- **Formato antigo:** 9 dígitos = município (3) + empresa (5) + DV; município fora do cálculo; pesos 6..2 sobre os 5
  da empresa; mesma regra do DV. Na conversão, retira-se o município, completa-se com zeros e o DV se mantém.
- **Exemplo sintético — 0000000234567-6:** 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 = 104 (zeros omitidos); 104 mod 11 = 5;
  11 − 5 = **6**.
- **Exemplos oficiais:** 101.62521-3 (antigo) = 0000000062521-3 (atual).
- **Erros comuns:** tratar resto 0 como DV 0 (em RO, resto 0 dá DV **1**).
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_RO.html

## RR — Roraima

- **Dígitos:** 9. **Prefixo:** `24` (mesmo prefixo de AL — a UF informada desambigua).
- **Algoritmo:** pesos **crescentes** 1..8; DV = soma **mod 9**.
- **Exemplo sintético — 24123456-8:** 2×1 + 4×2 + 1×3 + 2×4 + 3×5 + 4×6 + 5×7 + 6×8 = 143; 143 mod 9 = **8**.
- **Exemplos oficiais:** 24006153-6, 24006628-1 (e outros 8 listados no roteiro).
- **Erros comuns:** usar módulo 11 como as demais UFs.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_RR.html

## SC — Santa Catarina

- **Dígitos:** 9. **Máscara:** `251.040.852`. **Algoritmo:** pesos 9..2; módulo 11 padrão.
- **Exemplo sintético — 251.234.568:** 2×9 + 5×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 135; 135 mod 11 = 3; 11 − 3 = **8**.
- **Exemplo oficial:** 251.040.852.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_SC.html

## SP — São Paulo

- **Comércio/indústria:** 12 dígitos; DVs na 9ª e na 12ª posição.
  - DV1: pesos `1,3,4,5,6,7,8,10` sobre os 8 primeiros; DV1 = algarismo mais à direita de (soma mod 11) — resto 10 → 0.
  - DV2: pesos `3,2,10,9,8,7,6,5,4,3,2` sobre os 11 primeiros (inclui DV1); idem.
- **Produtor rural:** `P0MMMSSSSD000` (13 caracteres). DV `D` (10º caractere contando o P) = pesos `1,3,4,5,6,7,8,10`
  sobre os 8 dígitos após o `P`; os 3 últimos não entram no cálculo.
- **Exemplo sintético — 123.456.785.016:**
  - DV1: 1×1 + 2×3 + 3×4 + 4×5 + 5×6 + 6×7 + 7×8 + 8×10 = 247; 247 mod 11 = **5**
  - DV2: 1×3 + 2×2 + 3×10 + 4×9 + 5×8 + 6×7 + 7×6 + 8×5 + 5×4 + 0×3 + 1×2 = 259; 259 mod 11 = **6**
- **Exemplo sintético produtor — P-01234567.5/001:** 0×1 + 1×3 + 2×4 + 3×5 + 4×6 + 5×7 + 6×8 + 7×10 = 203; 203 mod 11 = **5**.
- **Exemplos oficiais:** 110.042.490.114 e P-01100424.3/002.
- **Erros comuns:** descartar o `P` (vira 12 dígitos e falha); usar "11 − resto" (em SP o DV é o próprio resto).
  Obs.: o roteiro oficial tem um erro de digitação no fim do exemplo do produtor ("P-011000424.3/002").
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_SP.html

## SE — Sergipe

- **Dígitos:** 9. **Algoritmo:** pesos 9..2; 11 − resto; 10 ou 11 → 0.
- **Exemplo sintético — 27654321-1:** 2×9 + 7×8 + 6×7 + 5×6 + 4×5 + 3×4 + 2×3 + 1×2 = 186; 186 mod 11 = 10; 11 − 10 = **1**.
- **Exemplo oficial:** 27123456-3.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_SE.html

## TO — Tocantins

- **Formatos:** 11 dígitos (roteiro SINTEGRA: `29` + categoria `01`/`02`/`03`/`99` + 6 + DV; a categoria não entra no
  cálculo) e 9 dígitos (formato sem a categoria, tabelado como "8 + 1 DV" em fontes secundárias e aceito por libs
  como `js-brasil`).
- **Algoritmo:** 8 dígitos de cálculo (no de 11, os dígitos 1, 2, 5–10) com pesos 9..2; resto < 2 → 0; senão 11 − resto.
- **Exemplo sintético — 29.123.456-9:** 2×9 + 9×8 + 1×7 + 2×6 + 3×5 + 4×4 + 5×3 + 6×2 = 167; 167 mod 11 = 2; 11 − 2 = **9**.
  (O mesmo número no formato antigo seria 29.01.123456-9 — o DV não muda.)
- **Exemplo oficial:** 29 01 022783 6.
- **Formato de 9 dígitos:** não há roteiro oficial publicado para ele, mas é o formato das IEs atuais publicadas
  no Diário Oficial do TO, e todas conferem com o mesmo cálculo. O prefixo `29` não é exigido.
- **Fonte:** http://www.sintegra.gov.br/Cad_Estados/cad_TO.html

---

## Divergências entre fontes (resumo)

| UF | SINTEGRA atual | Outras fontes / libs | O que a lib faz |
|----|----------------|----------------------|-----------------|
| GO | prefixo 10, 11, 20–29; sem regra de faixa | roteiro antigo/libs: 10, 11, 15; resto 1 na faixa 10103105–10119997 → DV 1; 11094402 → 0 ou 1 | aceita a união (10, 11, 15, 20–29) e as duas regras de DV nesses casos |
| MS | 28 ou 50 | `js-brasil`: só 28 | 28 ou 50 |
| PA | 15, 75–79 | `js-brasil`: 15 ou 75 | 15, 75–79 |
| DF | composição começa com 07 | IEs reais publicadas no DODF começam com 08; ACBr e `js-brasil`: 07 ou 08 | 07 ou 08 |
| AL | lista de "tipo de empresa" no 3º dígito | libs não validam | não valida o 3º dígito |
| TO | só 11 dígitos | CIGAM/libs: 9 dígitos | aceita 9 e 11 |
| PE | 9 e 14 dígitos | libs costumam ter só 9 | aceita 9 e 14 |
| MT | 11 dígitos | `js-brasil`: 9 ou 11 sem completar | aceita 9–11 completando com zeros (equivalente) |
| Todas | MOC NF-e: SEFAZ despreza zeros à esquerda | libs costumam recusar a IE curta | completa zeros até o tamanho da UF e informa quantos |
| AM | ramo "soma < 11" | `js-brasil` ignora | segue o roteiro |

## Conferência com inscrições reais (outubro de 2026)

Além dos exemplos dos roteiros, as regras de DF, TO, GO, AL, MS, PA, RJ e AM foram conferidas contra
inscrições reais publicadas em diários oficiais e editais das próprias UFs. Os números não são
reproduzidos aqui; só o resultado:

| UF | Resultado |
|----|-----------|
| DF | IEs reais com prefixo `07` e `08` conferem; a regra passou a aceitar `08` |
| TO | IEs reais de 9 dígitos (formato atual) conferem com o mesmo cálculo do formato de 11 |
| GO | IEs reais com prefixos `10` e `20` conferem; sem caso real encontrado para `15` nem para a faixa legada |
| AL | IEs reais conferem, inclusive com 3º dígito fora da lista antiga do roteiro |
| MS | IEs reais com prefixos `28` e `50` conferem |
| PA | IEs reais com prefixo `15` conferem; `75`–`79` seguem o roteiro (sem caso real encontrado ainda) |
| RJ | IEs reais conferem |
| AM | Conferido com o roteiro; o ramo "soma < 11" só afeta números quase todos zero |

## Código de terceiros consultado (só regras; nenhum código copiado)

| Fonte | Licença | Uso |
|-------|---------|-----|
| Roteiros SINTEGRA (inclui trechos VB/Java/Pascal de exemplo) | documento público oficial | fonte primária das regras |
| `js-brasil` (`src/inscricaoestadual.ts`, github.com/mariohmol/js-brasil) | MIT | só comparação de regras (divergências acima) |
| `Thiagocfn/InscricaoEstadual` (PHP) | MIT | só o README (observações por UF) |
| ACBr (`ACBrValidador.pas`) | LGPL | só comparação de regras (prefixos de DF e PA) |
| CIGAM wiki — formato da IE por estado | página pública | confirmação de tamanhos (TO 9 dígitos) |
| Notícia COAD 24/07/2026 (Maranhão) | página pública | confirmação de que MA não mudou estrutura |

Nenhum código de terceiros foi copiado. Nossa implementação é própria, sob MIT.

## Fontes

- Índice SINTEGRA: http://www.sintegra.gov.br/insc_est.html
- Roteiros por UF: `http://www.sintegra.gov.br/Cad_Estados/cad_{AC,AL,AP,AM,BA,CE,DF,ES,GO,MA,MT,MS,MG,PA,PB,PR,PE,PI,RJ,RN,RS,RO,RR,SC,SP,SE,TO}.html`
  (DF: imagens `df1t.gif`/`df2t.gif`; RJ: `rj.gif`)
- https://github.com/mariohmol/js-brasil (MIT)
- https://github.com/Thiagocfn/InscricaoEstadual (MIT)
- https://www.cigam.com.br/wiki/index.php/Qual_o_formato_da_Inscri%C3%A7%C3%A3o_Estadual_por_Estado%3F
- https://www.coad.com.br/home/noticias-detalhe/138837/maranhao-implementa-nova-logica-de-inscricao-estadual-garantindo-seguranca-cadastral-ate-2032
