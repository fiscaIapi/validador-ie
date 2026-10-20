# validador-ie — Inscrição Estadual das 27 UFs

[![CI](https://github.com/fiscaIapi/validador-ie/actions/workflows/ci.yml/badge.svg)](https://github.com/fiscaIapi/validador-ie/actions/workflows/ci.yml)

Biblioteca gratuita e de código aberto (MIT) que confere se um número de **Inscrição Estadual (IE)**
está bem formado: quantidade de dígitos, prefixo da UF quando existe e **dígito(s) verificador(es)**,
seguindo os roteiros de cálculo publicados por cada Unidade da Federação.

- Todas as 27 UFs, incluindo os casos especiais: produtor rural de SP (`P…`), BA com 8 ou 9 dígitos
  (módulo 10 ou 11), PE e RO em formato antigo e atual, RN com 9 ou 10 dígitos, AP por faixa e RR em módulo 9.
- Sem dependências. Mesma regra e mesmos vetores de teste em **JavaScript/TypeScript** e **Python**.
- Devolve o motivo da recusa e a IE formatada com a máscara usual da UF.
- Aceita a IE sem os zeros à esquerda (como sai de planilhas): completa até o tamanho da UF e avisa.

| Linguagem | Pasta | Pacote |
|---|---|---|
| JavaScript / TypeScript (Node 18+, navegador) | [`js/`](js) | `validador-ie` (npm) |
| Python 3.9+ | [`python/`](python) | `validador-ie` (PyPI), import `validador_ie` |

## Instalação

```bash
npm install validador-ie
```

```bash
pip install validador-ie
```

## Uso

### JavaScript / TypeScript

```ts
import { validarIE } from 'validador-ie';

validarIE('110.042.490.114', 'SP');
// { valida: true, formatada: '110.042.490.114', zerosCompletados: 0 }

validarIE('P-01100424.3/002', 'SP'); // produtor rural
// { valida: true, formatada: 'P-01100424.3/002', zerosCompletados: 0 }

validarIE('623079040081', 'MG'); // sem os zeros à esquerda
// { valida: true, formatada: '062.307.904/0081', zerosCompletados: 1 }

validarIE('062307904008', 'MG');
// { valida: false, motivo: 'tamanho inválido (esperado 13 dígitos)' }

validarIE('0623079040082', 'MG');
// { valida: false, motivo: 'dígito verificador inválido' }
```

### Python

```python
from validador_ie import validar_ie

r = validar_ie("110.042.490.114", "SP")
r.valida      # True
r.formatada   # '110.042.490.114'

r = validar_ie("623079040081", "MG")   # sem os zeros à esquerda
r.formatada          # '062.307.904/0081'
r.zeros_completados  # 1

r = validar_ie("0623079040082", "MG")
r.valida      # False
r.motivo      # 'dígito verificador inválido'

if validar_ie("12345663", "BA"):   # o resultado também funciona como booleano
    ...
```

### Entrada aceita

- Com ou sem pontuação (`.`, `-`, `/`, espaços).
- UF em maiúsculas ou minúsculas.
- Sem os zeros à esquerda. A SEFAZ despreza zeros à esquerda antes de conferir a IE, e planilhas os
  apagam (`0623079040081` vira `623079040081`). Quando a IE tem menos dígitos que o tamanho da UF, a
  biblioteca completa com zeros à esquerda e confere de novo; se conferir, `formatada` já sai com os
  zeros e `zerosCompletados` (`zeros_completados` no Python) diz quantos foram completados — vale
  mostrar isso a quem digitou. Nunca completa além do tamanho da UF, não remove zeros a mais e não
  mexe em IE do tamanho certo. A IE de produtor rural de SP (`P…`) não é completada.
- `ISENTO` é recusado com motivo próprio (não há número a validar).

### Motivos de recusa

`UF inválida` · `IE vazia` · `caracteres inválidos` · `tamanho inválido (…)` · `prefixo inválido (…)` ·
`categoria inválida (…)` (TO, formato de 11 dígitos) · `sequência de dígitos repetidos` · `dígito verificador inválido`

## O que esta biblioteca NÃO faz

Ela verifica **apenas o formato** do número. Uma IE pode passar nesta validação e, ainda assim:

- não existir;
- estar suspensa, baixada, cancelada ou inapta;
- pertencer a outro contribuinte, outro estabelecimento ou outra UF diferente da esperada;
- não estar habilitada para a operação que você pretende fazer.

Saber a **situação cadastral real** exige uma consulta à base oficial. A validação de formato é útil
para barrar erros de digitação antes disso — em formulários, importações de planilhas e cadastros
de clientes e fornecedores.

## Consulte a situação real na FiscalAPI

Se você precisa saber se a IE está ativa e a quem pertence, a [FiscalAPI](https://fiscalapi.com.br)
oferece uma API REST de consulta cadastral. Exemplo:

```bash
curl -H "X-API-Key: SUA_CHAVE" \
  "https://api.fiscalapi.com.br/api/consultar?uf=SP&cnpj=00000000000000"
```

Também é possível consultar pela própria IE (`ie=`) ou por CPF (`cpf=`). Parâmetros, formato da
resposta e planos estão na documentação: https://docs.fiscalapi.com.br

Uma combinação comum: validar o formato localmente com esta biblioteca e só então consultar a API.

```ts
const r = validarIE(ie, uf);
if (!r.valida) throw new Error(`IE inválida: ${r.motivo}`);
// formato ok -> consultar a situação cadastral na API
```

## Regras implementadas

Cada UF segue o roteiro de cálculo do dígito verificador publicado no portal do SINTEGRA
(http://www.sintegra.gov.br/insc_est.html) e pelas Secretarias de Fazenda. Onde roteiros antigos e
atuais divergem (por exemplo, prefixos de GO, MS e PA), a biblioteca aceita as duas formas para não
recusar inscrições legítimas. O detalhamento por UF, com exemplos calculados passo a passo, está em
[`REGRAS.md`](REGRAS.md).

## Desenvolvimento

```bash
cd js && npm install && npm run build && npm test
cd python && pip install pytest && python -m pytest -q
```

As duas implementações compartilham os mesmos vetores de teste (válidos e inválidos para cada UF).
Uma mudança de regra precisa entrar nas duas, com teste.

Encontrou uma IE real que a biblioteca recusa (ou aceita indevidamente)? Abra uma *issue* com a UF
e o motivo retornado — sem expor dados de terceiros.

## Licença

MIT © FiscalAPI
