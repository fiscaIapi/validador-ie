/**
 * Validação de FORMATO e DÍGITO VERIFICADOR da Inscrição Estadual (IE)
 * das 27 UFs brasileiras.
 *
 * Esta biblioteca NÃO consulta se a IE existe, está ativa ou pertence a
 * quem diz pertencer. Ela apenas confere se o número é bem formado segundo
 * as regras públicas de cada UF (roteiros de crítica publicados no portal
 * do SINTEGRA e pelas Secretarias de Fazenda).
 *
 * Licença: MIT. Sem dependências.
 */

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type UF = (typeof UFS)[number];

export interface ResultadoIE {
  /** true quando formato e dígito(s) verificador(es) conferem. */
  valida: boolean;
  /** Motivo da recusa (presente apenas quando `valida` é false). */
  motivo?: string;
  /** IE com a máscara usual da UF (presente apenas quando `valida` é true). */
  formatada?: string;
}

/** Retorna null quando a IE confere; caso contrário, o motivo da recusa. */
type Validador = (n: string) => string | null;

interface Regra {
  /** Quantidades de dígitos aceitas (sem pontuação; para SP-produtor, conta o "P"). */
  tamanhos: readonly number[];
  validar: Validador;
  mascara: (n: string) => string;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const MOTIVO_DV = 'dígito verificador inválido';

function d(n: string, i: number): number {
  return n.charCodeAt(i) - 48;
}

/** Soma ponderada dos primeiros `pesos.length` dígitos de `n` a partir de `inicio`. */
function somaPonderada(n: string, pesos: readonly number[], inicio = 0): number {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += d(n, inicio + i) * pesos[i];
  return soma;
}

/** Pesos decrescentes de (qtd + 1) até 2. Ex.: pesosDesc(8) = [9,8,7,6,5,4,3,2]. */
function pesosDesc(qtd: number): number[] {
  const p: number[] = [];
  for (let w = qtd + 1; w >= 2; w--) p.push(w);
  return p;
}

/**
 * Módulo 11 "padrão": resto 0 ou 1 => DV 0; senão DV = 11 - resto.
 * Equivale à forma "DV = 11 - resto; se 10 ou 11, DV = 0", usada por várias UFs.
 */
function dvMod11(soma: number): number {
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Variante RO/PE-antiga: DV = 11 - resto; se > 9, subtrai 10. */
function dvMod11Menos10(soma: number): number {
  const dv = 11 - (soma % 11);
  return dv > 9 ? dv - 10 : dv;
}

/** Variante AL/RN: DV = (soma × 10) mod 11; se 10, DV = 0. */
function dvMod11Vezes10(soma: number): number {
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function aplicarMascara(n: string, mascara: string): string {
  let out = '';
  let j = 0;
  for (const c of mascara) {
    if (c === '#') {
      if (j >= n.length) break;
      out += n[j++];
    } else {
      out += c;
    }
  }
  return out;
}

const m = (mascara: string) => (n: string) => aplicarMascara(n, mascara);

function prefixoEm(n: string, prefixos: readonly string[]): boolean {
  return prefixos.some((p) => n.startsWith(p));
}

/** Validador genérico de 9 dígitos: 8 de base com pesos 9..2 + 1 DV em módulo 11 padrão. */
function nove(prefixos?: readonly string[]): Validador {
  return (n) => {
    if (prefixos && !prefixoEm(n, prefixos)) return `prefixo inválido (esperado ${prefixos.join(', ')})`;
    return dvMod11(somaPonderada(n, pesosDesc(8))) === d(n, 8) ? null : MOTIVO_DV;
  };
}

const PESOS_AC_DF_1 = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const PESOS_AC_DF_2 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function dois13(n: string): boolean {
  const dv1 = dvMod11(somaPonderada(n, PESOS_AC_DF_1));
  if (dv1 !== d(n, 11)) return false;
  const dv2 = dvMod11(somaPonderada(n, PESOS_AC_DF_2));
  return dv2 === d(n, 12);
}

// ---------------------------------------------------------------------------
// Regras por UF
// ---------------------------------------------------------------------------

const REGRAS: Record<UF, Regra> = {
  // AC: 13 dígitos, começa com 01, 2 DVs (módulo 11).
  AC: {
    tamanhos: [13],
    validar: (n) => {
      if (!n.startsWith('01')) return 'prefixo inválido (esperado 01)';
      return dois13(n) ? null : MOTIVO_DV;
    },
    mascara: m('##.###.###/###-##'),
  },

  // AL: 9 dígitos, começa com 24; DV = (soma × 10) mod 11, 10 => 0.
  AL: {
    tamanhos: [9],
    validar: (n) => {
      if (!n.startsWith('24')) return 'prefixo inválido (esperado 24)';
      return dvMod11Vezes10(somaPonderada(n, pesosDesc(8))) === d(n, 8) ? null : MOTIVO_DV;
    },
    mascara: m('##.###.###-#'),
  },

  // AP: 9 dígitos, começa com 03; constantes p e d por faixa numérica.
  AP: {
    tamanhos: [9],
    validar: (n) => {
      if (!n.startsWith('03')) return 'prefixo inválido (esperado 03)';
      const base = Number(n.slice(0, 8));
      let p = 0;
      let dd = 0;
      if (base >= 3000001 && base <= 3017000) {
        p = 5;
        dd = 0;
      } else if (base >= 3017001 && base <= 3019022) {
        p = 9;
        dd = 1;
      }
      let dv = 11 - ((p + somaPonderada(n, pesosDesc(8))) % 11);
      if (dv === 10) dv = 0;
      else if (dv === 11) dv = dd;
      return dv === d(n, 8) ? null : MOTIVO_DV;
    },
    mascara: m('##.###.###-#'),
  },

  // AM: 9 dígitos; se soma < 11, DV = 11 - soma; senão módulo 11 padrão.
  AM: {
    tamanhos: [9],
    validar: (n) => {
      const soma = somaPonderada(n, pesosDesc(8));
      const dv = soma < 11 ? 11 - soma : dvMod11(soma);
      return dv === d(n, 8) ? null : MOTIVO_DV;
    },
    mascara: m('##.###.###-#'),
  },

  // BA: 8 ou 9 dígitos; módulo 10 ou 11 conforme o 1º (8 díg.) ou 2º (9 díg.) dígito.
  // O SEGUNDO DV é calculado primeiro e entra no cálculo do primeiro.
  BA: {
    tamanhos: [8, 9],
    validar: (n) => {
      const tam = n.length;
      const qtdBase = tam - 2; // 6 ou 7
      const chave = tam === 8 ? n[0] : n[1];
      const mod10 = '0123458'.includes(chave);
      const calc = (soma: number) => {
        if (mod10) {
          const r = soma % 10;
          return r === 0 ? 0 : 10 - r;
        }
        return dvMod11(soma);
      };
      const dv2 = calc(somaPonderada(n, pesosDesc(qtdBase)));
      if (dv2 !== d(n, tam - 1)) return MOTIVO_DV;
      // 1º DV: base + 2º DV, pesos (qtdBase + 2)..2
      const pesos1 = pesosDesc(qtdBase + 1);
      let soma1 = 0;
      for (let i = 0; i < qtdBase; i++) soma1 += d(n, i) * pesos1[i];
      soma1 += dv2 * 2;
      return calc(soma1) === d(n, tam - 2) ? null : MOTIVO_DV;
    },
    mascara: (n) => (n.length === 8 ? aplicarMascara(n, '######-##') : aplicarMascara(n, '#######-##')),
  },

  // CE: 9 dígitos, módulo 11 padrão.
  CE: { tamanhos: [9], validar: nove(), mascara: m('########-#') },

  // DF: 13 dígitos, começa com 07 ou 08 (as novas inscrições já saem com 08); mesmos pesos do AC.
  DF: {
    tamanhos: [13],
    validar: (n) => {
      if (!prefixoEm(n, ['07', '08'])) return 'prefixo inválido (esperado 07 ou 08)';
      return dois13(n) ? null : MOTIVO_DV;
    },
    mascara: m('###########-##'),
  },

  // ES: 9 dígitos, módulo 11 padrão.
  ES: { tamanhos: [9], validar: nove(), mascara: m('###.###.##-#') },

  // GO: 9 dígitos; prefixos 10, 11, 20–29 (SINTEGRA atual) e 15 (roteiro antigo).
  // Regra legada: resto 1 na faixa 10103105–10119997 => DV 1; e 11094402 aceita DV 0 ou 1.
  GO: {
    tamanhos: [9],
    validar: (n) => {
      const pref = Number(n.slice(0, 2));
      if (!(pref === 10 || pref === 11 || pref === 15 || (pref >= 20 && pref <= 29))) {
        return 'prefixo inválido (esperado 10, 11, 15 ou 20 a 29)';
      }
      const base = n.slice(0, 8);
      const informado = d(n, 8);
      const resto = somaPonderada(n, pesosDesc(8)) % 11;
      const dv = resto < 2 ? 0 : 11 - resto;
      if (dv === informado) return null;
      if (base === '11094402' && (informado === 0 || informado === 1)) return null;
      const num = Number(base);
      if (resto === 1 && informado === 1 && num >= 10103105 && num <= 10119997) return null;
      return MOTIVO_DV;
    },
    mascara: m('##.###.###-#'),
  },

  // MA: 9 dígitos, começa com 12, módulo 11 padrão.
  MA: { tamanhos: [9], validar: nove(['12']), mascara: m('##.###.###-#') },

  // MT: 11 dígitos (aceita 9 ou 10 e completa com zeros à esquerda); pesos 3,2,9..2.
  MT: {
    tamanhos: [9, 10, 11],
    validar: (n) => {
      const x = n.padStart(11, '0');
      return dvMod11(somaPonderada(x, [3, 2, 9, 8, 7, 6, 5, 4, 3, 2])) === d(x, 10) ? null : MOTIVO_DV;
    },
    mascara: (n) => aplicarMascara(n.padStart(11, '0'), '##########-#'),
  },

  // MS: 9 dígitos, começa com 28 ou 50; módulo 11 (T > 9 => 0, equivale ao padrão).
  MS: { tamanhos: [9], validar: nove(['28', '50']), mascara: m('##.###.###-#') },

  // MG: 13 dígitos. DV1: insere "0" após o município, pesos 1-2 alternados,
  // soma dos ALGARISMOS dos produtos, complemento para a dezena superior.
  // DV2: pesos 3,2,11..2 sobre 12 dígitos, módulo 11 padrão.
  MG: {
    tamanhos: [13],
    validar: (n) => {
      const trabalho = n.slice(0, 3) + '0' + n.slice(3, 11);
      let soma = 0;
      for (let i = 0; i < trabalho.length; i++) {
        const prod = d(trabalho, i) * (i % 2 === 0 ? 1 : 2);
        soma += prod >= 10 ? Math.floor(prod / 10) + (prod % 10) : prod;
      }
      const dv1 = (10 - (soma % 10)) % 10;
      if (dv1 !== d(n, 11)) return MOTIVO_DV;
      const dv2 = dvMod11(somaPonderada(n, [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]));
      return dv2 === d(n, 12) ? null : MOTIVO_DV;
    },
    mascara: m('###.###.###/####'),
  },

  // PA: 9 dígitos, começa com 15 ou 75–79; módulo 11 padrão.
  PA: { tamanhos: [9], validar: nove(['15', '75', '76', '77', '78', '79']), mascara: m('##-######-#') },

  // PB: 9 dígitos, módulo 11 padrão.
  PB: { tamanhos: [9], validar: nove(), mascara: m('########-#') },

  // PR: 10 dígitos, 2 DVs (pesos 3,2,7..2 e 4,3,2,7..2).
  PR: {
    tamanhos: [10],
    validar: (n) => {
      if (dvMod11(somaPonderada(n, [3, 2, 7, 6, 5, 4, 3, 2])) !== d(n, 8)) return MOTIVO_DV;
      return dvMod11(somaPonderada(n, [4, 3, 2, 7, 6, 5, 4, 3, 2])) === d(n, 9) ? null : MOTIVO_DV;
    },
    mascara: m('###.#####-##'),
  },

  // PE: 9 dígitos (e-Fisco, 2 DVs) ou 14 dígitos (CACEPE antigo, 1 DV).
  PE: {
    tamanhos: [9, 14],
    validar: (n) => {
      if (n.length === 9) {
        if (dvMod11(somaPonderada(n, pesosDesc(7))) !== d(n, 7)) return MOTIVO_DV;
        return dvMod11(somaPonderada(n, pesosDesc(8))) === d(n, 8) ? null : MOTIVO_DV;
      }
      const dv = dvMod11Menos10(somaPonderada(n, [5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2]));
      return dv === d(n, 13) ? null : MOTIVO_DV;
    },
    mascara: (n) =>
      n.length === 9 ? aplicarMascara(n, '#######-##') : aplicarMascara(n, '##.#.###.#######-#'),
  },

  // PI: 9 dígitos, módulo 11 padrão.
  PI: { tamanhos: [9], validar: nove(), mascara: m('#########') },

  // RJ: 8 dígitos, pesos 2,7,6,5,4,3,2.
  RJ: {
    tamanhos: [8],
    validar: (n) =>
      dvMod11(somaPonderada(n, [2, 7, 6, 5, 4, 3, 2])) === d(n, 7) ? null : MOTIVO_DV,
    mascara: m('##.###.##-#'),
  },

  // RN: 9 ou 10 dígitos, começa com 20; DV = (soma × 10) mod 11, 10 => 0.
  RN: {
    tamanhos: [9, 10],
    validar: (n) => {
      if (!n.startsWith('20')) return 'prefixo inválido (esperado 20)';
      const qtd = n.length - 1;
      return dvMod11Vezes10(somaPonderada(n, pesosDesc(qtd))) === d(n, qtd) ? null : MOTIVO_DV;
    },
    mascara: (n) =>
      n.length === 9 ? aplicarMascara(n, '##.###.###-#') : aplicarMascara(n, '##.#.###.###-#'),
  },

  // RS: 10 dígitos, pesos 2,9..2.
  RS: {
    tamanhos: [10],
    validar: (n) =>
      dvMod11(somaPonderada(n, [2, 9, 8, 7, 6, 5, 4, 3, 2])) === d(n, 9) ? null : MOTIVO_DV,
    mascara: m('###/#######'),
  },

  // RO: 14 dígitos (desde 08/2000) ou 9 dígitos (formato antigo, município + empresa).
  RO: {
    tamanhos: [9, 14],
    validar: (n) => {
      if (n.length === 14) {
        const dv = dvMod11Menos10(somaPonderada(n, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
        return dv === d(n, 13) ? null : MOTIVO_DV;
      }
      // antigo: ignora os 3 dígitos do município, pesos 6..2 sobre os 5 da empresa
      const dv = dvMod11Menos10(somaPonderada(n, [6, 5, 4, 3, 2], 3));
      return dv === d(n, 8) ? null : MOTIVO_DV;
    },
    mascara: (n) =>
      n.length === 14 ? aplicarMascara(n, '#############-#') : aplicarMascara(n, '###.#####-#'),
  },

  // RR: 9 dígitos, começa com 24; pesos 1..8, módulo 9.
  RR: {
    tamanhos: [9],
    validar: (n) => {
      if (!n.startsWith('24')) return 'prefixo inválido (esperado 24)';
      return somaPonderada(n, [1, 2, 3, 4, 5, 6, 7, 8]) % 9 === d(n, 8) ? null : MOTIVO_DV;
    },
    mascara: m('########-#'),
  },

  // SC: 9 dígitos, módulo 11 padrão.
  SC: { tamanhos: [9], validar: nove(), mascara: m('###.###.###') },

  // SP: 12 dígitos (2 DVs na 9ª e 12ª posições) ou produtor rural "P" + 12 dígitos.
  SP: {
    tamanhos: [12, 13],
    validar: (n) => {
      const pesos1 = [1, 3, 4, 5, 6, 7, 8, 10];
      if (n[0] === 'P') {
        // P0MMMSSSSD000: DV sobre os 8 dígitos após o "P"
        const dv = (somaPonderada(n, pesos1, 1) % 11) % 10;
        return dv === d(n, 9) ? null : MOTIVO_DV;
      }
      if ((somaPonderada(n, pesos1) % 11) % 10 !== d(n, 8)) return MOTIVO_DV;
      const dv2 = (somaPonderada(n, [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11) % 10;
      return dv2 === d(n, 11) ? null : MOTIVO_DV;
    },
    mascara: (n) =>
      n[0] === 'P' ? aplicarMascara(n, '#-########.#/###') : aplicarMascara(n, '###.###.###.###'),
  },

  // SE: 9 dígitos, módulo 11 padrão.
  SE: { tamanhos: [9], validar: nove(), mascara: m('########-#') },

  // TO: 9 dígitos (atual) ou 11 dígitos (antigo, 3º e 4º = categoria 01/02/03/99,
  // que não entram no cálculo).
  TO: {
    tamanhos: [9, 11],
    validar: (n) => {
      let base = n;
      if (n.length === 11) {
        const cat = n.slice(2, 4);
        if (!['01', '02', '03', '99'].includes(cat)) {
          return 'categoria inválida (3º e 4º dígitos devem ser 01, 02, 03 ou 99)';
        }
        base = n.slice(0, 2) + n.slice(4);
      }
      return dvMod11(somaPonderada(base, pesosDesc(8))) === d(base, 8) ? null : MOTIVO_DV;
    },
    mascara: (n) =>
      n.length === 11 ? aplicarMascara(n, '##.##.######-#') : aplicarMascara(n, '##.###.###-#'),
  },
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Remove pontuação e espaços; mantém dígitos e a letra P (maiúscula). */
export function limparIE(ie: string): string {
  return ie.toUpperCase().replace(/[\s./\\-]/g, '');
}

function isUF(uf: string): uf is UF {
  return (UFS as readonly string[]).includes(uf);
}

/**
 * Valida o formato e o(s) dígito(s) verificador(es) de uma Inscrição Estadual.
 *
 * Não diz se a IE está ativa ou cadastrada — isso só uma consulta real responde.
 *
 * @param ie  Número da IE, com ou sem pontuação (ex.: "110.042.490.114").
 * @param uf  Sigla da UF (ex.: "SP"). Maiúsculas ou minúsculas.
 */
export function validarIE(ie: string, uf: string): ResultadoIE {
  if (typeof ie !== 'string' || typeof uf !== 'string') {
    return { valida: false, motivo: 'parâmetros devem ser texto' };
  }
  const sigla = uf.trim().toUpperCase();
  if (!isUF(sigla)) return { valida: false, motivo: 'UF inválida' };

  const n = limparIE(ie);
  if (n.length === 0) return { valida: false, motivo: 'IE vazia' };
  if (n === 'ISENTO' || n === 'ISENTA') {
    return { valida: false, motivo: 'IE informada como ISENTO (não há número a validar)' };
  }

  const regra = REGRAS[sigla];
  const produtorSP = sigla === 'SP' && n[0] === 'P';
  const digitos = produtorSP ? n.slice(1) : n;
  if (!/^\d+$/.test(digitos)) return { valida: false, motivo: 'caracteres inválidos' };

  const tamanhoOk =
    sigla === 'SP' ? n.length === (produtorSP ? 13 : 12) : regra.tamanhos.includes(n.length);
  if (!tamanhoOk) {
    const esperado =
      sigla === 'SP' ? '12 dígitos ou P + 12 dígitos' : `${regra.tamanhos.join(' ou ')} dígitos`;
    return { valida: false, motivo: `tamanho inválido (esperado ${esperado})` };
  }
  if (/^(\d)\1*$/.test(digitos)) return { valida: false, motivo: 'sequência de dígitos repetidos' };

  const falha = regra.validar(n);
  if (falha) return { valida: false, motivo: falha };
  return { valida: true, formatada: regra.mascara(n) };
}

export default validarIE;
