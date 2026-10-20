// Testes com o runner nativo do Node (node:test), sem dependências.
// Rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarIE, limparIE, UFS } from './index.ts';

// Vetores VÁLIDOS. "ofic." = exemplo publicado no roteiro da UF no portal do SINTEGRA;
// os demais são sintéticos, calculados pelo algoritmo (ver REGRAS.md).
const VALIDAS: Record<string, string[]> = {
  AC: ['0123456700124', '01.004.823/001-12' /* ofic. */],
  AL: ['240765435', '240000048' /* ofic. */, '240123450' /* resto 10 => 0 */],
  AP: ['031234569', '030123459' /* ofic., faixa p=5 */, '030180009' /* faixa p=9 */],
  AM: ['041234561'],
  BA: [
    '23456776', // 8 díg., módulo 10
    '123456-63', // ofic., 8 díg., módulo 10
    '612345-57', // ofic., 8 díg., módulo 11
    '1000003-06', // ofic., 9 díg., módulo 10
    '0612345-57', // 9 díg., 2º dígito 6 => módulo 11
    '234567823', // 9 díg., módulo 10
  ],
  CE: ['061234567', '06000001-5' /* ofic. */],
  DF: ['0731234500187', '07300001001-09' /* ofic. */, '0812345600171' /* prefixo 08 */],
  ES: ['081234562'],
  GO: [
    '101234562',
    '10.987.654-7', // ofic.
    '101031050', // resto 1 => 0 (regra atual)
    '101031051', // resto 1 => 1 (regra legada, faixa 10103105–10119997)
    '110944020', // exceção histórica: DV 0 ou 1
    '110944021',
  ],
  MA: ['121234568', '120000385' /* ofic. */],
  MT: ['00132345676', '0013000001-9' /* ofic. */, '132345676' /* sem zeros à esquerda */],
  MS: ['283456787', '501234560'],
  MG: ['3171234560046', '062.307.904/0081' /* ofic. */],
  PA: ['151234566', '15-999999-5' /* ofic. */, '750000023' /* ofic. */],
  PB: ['161234569'],
  PR: ['4123456730', '123.45678-50' /* ofic. */],
  PE: ['123456797', '0321418-40' /* ofic. e-Fisco */, '18.1.001.0000004-9' /* ofic. CACEPE */],
  PI: ['191234567', '012345679' /* ofic. */],
  RJ: ['81234566', '76543216'],
  RN: ['201234564', '20.040.040-1' /* ofic. */, '20.0.040.040-0' /* ofic. 10 díg. */, '2012345689'],
  RS: ['0961234563', '224/3658792' /* ofic. */],
  RO: ['00000002345676', '0000000062521-3' /* ofic. */, '101.62521-3' /* ofic. antigo */],
  RR: ['241234568', '24006153-6' /* ofic. */, '24006628-1' /* ofic. */],
  SC: ['251234568', '251.040.852' /* ofic. */],
  SP: ['123456785016', '110.042.490.114' /* ofic. */, 'P012345675001', 'P-01100424.3/002' /* ofic. */, 'p011004243002'],
  SE: ['276543211', '27123456-3' /* ofic. */],
  TO: ['291234569', '29011234569', '29010227836' /* ofic. */],
};

// Vetores INVÁLIDOS com o motivo esperado (prefixo do texto).
const INVALIDAS: Record<string, Array<[string, string]>> = {
  AC: [['0123456700125', 'dígito'], ['0123456700134', 'dígito'], ['0223456700124', 'prefixo'], ['012345670012', 'tamanho']],
  AL: [['240765436', 'dígito'], ['250765435', 'prefixo']],
  AP: [['031234568', 'dígito'], ['041234569', 'prefixo']],
  AM: [['041234562', 'dígito'], ['04123456', 'tamanho']],
  BA: [['23456777', 'dígito'], ['12345664', 'dígito'], ['100000307', 'dígito'], ['1234567', 'tamanho']],
  CE: [['061234568', 'dígito']],
  DF: [['0731234500188', 'dígito'], ['0931234500187', 'prefixo']],
  ES: [['081234563', 'dígito']],
  GO: [['101234563', 'dígito'], ['121234562', 'prefixo'], ['101234561', 'dígito']],
  MA: [['121234569', 'dígito'], ['131234568', 'prefixo']],
  MT: [['00132345677', 'dígito'], ['13234567', 'tamanho']],
  MS: [['283456788', 'dígito'], ['293456787', 'prefixo']],
  MG: [['3171234560047', 'dígito'], ['3171234560056', 'dígito'], ['317123456004', 'tamanho']],
  PA: [['151234567', 'dígito'], ['161234566', 'prefixo']],
  PB: [['161234560', 'dígito']],
  PR: [['4123456731', 'dígito'], ['4123456720', 'dígito']],
  PE: [['123456798', 'dígito'], ['18100100000048', 'dígito'], ['1234567970', 'tamanho']],
  PI: [['191234568', 'dígito']],
  RJ: [['81234567', 'dígito'], ['812345660', 'tamanho']],
  RN: [['201234565', 'dígito'], ['211234564', 'prefixo']],
  RS: [['0961234564', 'dígito']],
  RO: [['00000002345677', 'dígito'], ['101625214', 'dígito']],
  RR: [['241234569', 'dígito'], ['251234568', 'prefixo']],
  SC: [['251234569', 'dígito']],
  SP: [
    ['123456785017', 'dígito'],
    ['123456786016', 'dígito'],
    ['P012345676001', 'dígito'],
    ['P01234567500', 'tamanho'],
    ['1234567850160', 'tamanho'],
  ],
  SE: [['276543212', 'dígito']],
  TO: [['291234560', 'dígito'], ['29041234569', 'categoria'], ['2912345690', 'tamanho']],
};

test('cobre as 27 UFs', () => {
  assert.equal(UFS.length, 27);
  for (const uf of UFS) {
    assert.ok(VALIDAS[uf]?.length, `sem vetor válido para ${uf}`);
    assert.ok(INVALIDAS[uf]?.length, `sem vetor inválido para ${uf}`);
  }
});

for (const [uf, lista] of Object.entries(VALIDAS)) {
  test(`${uf}: IEs válidas`, () => {
    for (const ie of lista) {
      const r = validarIE(ie, uf);
      assert.equal(r.valida, true, `${uf} ${ie} deveria ser válida (motivo: ${r.motivo})`);
      assert.equal(r.motivo, undefined);
      assert.ok(r.formatada);
      // a forma formatada também precisa validar
      assert.equal(validarIE(r.formatada!, uf).valida, true, `${uf} formatada ${r.formatada}`);
    }
  });
}

for (const [uf, lista] of Object.entries(INVALIDAS)) {
  test(`${uf}: IEs inválidas`, () => {
    for (const [ie, motivo] of lista) {
      const r = validarIE(ie, uf);
      assert.equal(r.valida, false, `${uf} ${ie} deveria ser inválida`);
      assert.ok(r.motivo?.startsWith(motivo), `${uf} ${ie}: motivo "${r.motivo}" não começa com "${motivo}"`);
      assert.equal(r.formatada, undefined);
    }
  });
}

test('máscaras', () => {
  assert.equal(validarIE('110042490114', 'SP').formatada, '110.042.490.114');
  assert.equal(validarIE('P011004243002', 'SP').formatada, 'P-01100424.3/002');
  assert.equal(validarIE('0100482300112', 'AC').formatada, '01.004.823/001-12');
  assert.equal(validarIE('0623079040081', 'MG').formatada, '062.307.904/0081');
  assert.equal(validarIE('1234567850', 'PR').formatada, '123.45678-50');
  assert.equal(validarIE('130000019', 'MT').formatada, '0013000001-9');
  assert.equal(validarIE('2243658792', 'RS').formatada, '224/3658792');
});

test('UF em minúsculas e com espaços é aceita', () => {
  assert.equal(validarIE('110042490114', ' sp ').valida, true);
});

test('IE de uma UF não vale para outra', () => {
  assert.equal(validarIE('110042490114', 'RJ').valida, false);
  assert.equal(validarIE('0100482300112', 'DF').valida, false); // prefixo 01 é do AC
});

test('entradas inválidas genéricas', () => {
  assert.deepEqual(validarIE('110042490114', 'XX'), { valida: false, motivo: 'UF inválida' });
  assert.deepEqual(validarIE('', 'SP'), { valida: false, motivo: 'IE vazia' });
  assert.equal(validarIE('ISENTO', 'SP').valida, false);
  assert.match(validarIE('ISENTO', 'SP').motivo!, /ISENTO/);
  assert.equal(validarIE('12A456785016', 'SP').motivo, 'caracteres inválidos');
  assert.equal(validarIE('P01234567500X', 'SP').motivo, 'caracteres inválidos');
  assert.equal(validarIE('P012345675001', 'MG').motivo, 'caracteres inválidos'); // "P" só em SP
  assert.equal(validarIE('000000000', 'SC').motivo, 'sequência de dígitos repetidos');
  assert.equal(validarIE('00000000000', 'MT').motivo, 'sequência de dígitos repetidos');
  // @ts-expect-error — entrada não-texto vinda de JS puro
  assert.equal(validarIE(110042490114, 'SP').valida, false);
});

test('limparIE', () => {
  assert.equal(limparIE(' 110.042.490-114 '), '110042490114');
  assert.equal(limparIE('p-01100424.3/002'), 'P011004243002');
});
