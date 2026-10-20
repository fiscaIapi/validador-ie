# validador-ie

Valida o formato e o(s) dígito(s) verificador(es) da **Inscrição Estadual (IE)** das 27 UFs.
Sem dependências. Node 18+ e navegadores modernos.

```bash
npm install validador-ie
```

```ts
import { validarIE, limparIE, UFS } from 'validador-ie';

validarIE('110.042.490.114', 'SP');
// { valida: true, formatada: '110.042.490.114', zerosCompletados: 0 }

validarIE('623079040081', 'MG'); // sem os zeros à esquerda: completa e avisa
// { valida: true, formatada: '062.307.904/0081', zerosCompletados: 1 }

validarIE('0623079040082', 'MG');
// { valida: false, motivo: 'dígito verificador inválido' }
```

A biblioteca confere **apenas o formato**: não diz se a IE existe, está ativa ou a quem pertence.
Para a situação cadastral real, veja a [FiscalAPI](https://fiscalapi.com.br).

Documentação completa, regras por UF e versão em Python: https://github.com/fiscaIapi/validador-ie

Licença MIT © FiscalAPI
