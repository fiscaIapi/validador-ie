# validador-ie

Valida o formato e o(s) dígito(s) verificador(es) da **Inscrição Estadual (IE)** das 27 UFs.
Sem dependências. Python 3.9+.

```bash
pip install validador-ie
```

```python
from validador_ie import validar_ie, limpar_ie, UFS

r = validar_ie("110.042.490.114", "SP")
r.valida      # True
r.formatada   # '110.042.490.114'

r = validar_ie("0623079040082", "MG")
r.motivo      # 'dígito verificador inválido'

if validar_ie("12345663", "BA"):   # o resultado também funciona como booleano
    ...
```

A biblioteca confere **apenas o formato**: não diz se a IE existe, está ativa ou a quem pertence.
Para a situação cadastral real, veja a [FiscalAPI](https://fiscalapi.com.br).

Documentação completa, regras por UF e versão em JavaScript/TypeScript: https://github.com/fiscaIapi/validador-ie

Licença MIT © FiscalAPI
