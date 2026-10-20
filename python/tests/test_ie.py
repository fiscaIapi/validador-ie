# Testes (pytest). Rodar a partir da pasta python/: python -m pytest -q
import pytest

from validador_ie import UFS, ResultadoIE, limpar_ie, validar_ie

# Vetores VÁLIDOS. "ofic." = exemplo publicado no roteiro da UF no portal do SINTEGRA;
# os demais são sintéticos, calculados pelo algoritmo (ver regras-por-uf.md).
VALIDAS = {
    "AC": ["0123456700124", "01.004.823/001-12"],  # ofic.
    "AL": ["240765435", "240000048", "240123450"],  # ofic.; resto 10 => 0
    "AP": ["031234569", "030123459", "030180009"],  # p=0; ofic. p=5; p=9
    "AM": ["041234561"],
    "BA": ["23456776", "123456-63", "612345-57", "1000003-06", "0612345-57", "234567823"],
    "CE": ["061234567", "06000001-5"],
    "DF": ["0731234500187", "07300001001-09"],
    "ES": ["081234562"],
    "GO": ["101234562", "10.987.654-7", "101031050", "101031051", "110944020", "110944021"],
    "MA": ["121234568", "120000385"],
    "MT": ["00132345676", "0013000001-9", "132345676"],
    "MS": ["283456787", "501234560"],
    "MG": ["3171234560046", "062.307.904/0081"],
    "PA": ["151234566", "15-999999-5", "750000023"],
    "PB": ["161234569"],
    "PR": ["4123456730", "123.45678-50"],
    "PE": ["123456797", "0321418-40", "18.1.001.0000004-9"],
    "PI": ["191234567", "012345679"],
    "RJ": ["81234566", "76543216"],
    "RN": ["201234564", "20.040.040-1", "20.0.040.040-0", "2012345689"],
    "RS": ["0961234563", "224/3658792"],
    "RO": ["00000002345676", "0000000062521-3", "101.62521-3"],
    "RR": ["241234568", "24006153-6", "24006628-1"],
    "SC": ["251234568", "251.040.852"],
    "SP": ["123456785016", "110.042.490.114", "P012345675001", "P-01100424.3/002", "p011004243002"],
    "SE": ["276543211", "27123456-3"],
    "TO": ["291234569", "29011234569", "29010227836"],
}

# Vetores INVÁLIDOS: (ie, início esperado do motivo)
INVALIDAS = {
    "AC": [("0123456700125", "dígito"), ("0123456700134", "dígito"), ("0223456700124", "prefixo"),
           ("012345670012", "tamanho")],
    "AL": [("240765436", "dígito"), ("250765435", "prefixo")],
    "AP": [("031234568", "dígito"), ("041234569", "prefixo")],
    "AM": [("041234562", "dígito"), ("04123456", "tamanho")],
    "BA": [("23456777", "dígito"), ("12345664", "dígito"), ("100000307", "dígito"), ("1234567", "tamanho")],
    "CE": [("061234568", "dígito")],
    "DF": [("0731234500188", "dígito"), ("0831234500187", "prefixo")],
    "ES": [("081234563", "dígito")],
    "GO": [("101234563", "dígito"), ("121234562", "prefixo"), ("101234561", "dígito")],
    "MA": [("121234569", "dígito"), ("131234568", "prefixo")],
    "MT": [("00132345677", "dígito"), ("13234567", "tamanho")],
    "MS": [("283456788", "dígito"), ("293456787", "prefixo")],
    "MG": [("3171234560047", "dígito"), ("3171234560056", "dígito"), ("317123456004", "tamanho")],
    "PA": [("151234567", "dígito"), ("161234566", "prefixo")],
    "PB": [("161234560", "dígito")],
    "PR": [("4123456731", "dígito"), ("4123456720", "dígito")],
    "PE": [("123456798", "dígito"), ("18100100000048", "dígito"), ("1234567970", "tamanho")],
    "PI": [("191234568", "dígito")],
    "RJ": [("81234567", "dígito"), ("812345660", "tamanho")],
    "RN": [("201234565", "dígito"), ("211234564", "prefixo")],
    "RS": [("0961234564", "dígito")],
    "RO": [("00000002345677", "dígito"), ("101625214", "dígito")],
    "RR": [("241234569", "dígito"), ("251234568", "prefixo")],
    "SC": [("251234569", "dígito")],
    "SP": [("123456785017", "dígito"), ("123456786016", "dígito"), ("P012345676001", "dígito"),
           ("P01234567500", "tamanho"), ("1234567850160", "tamanho")],
    "SE": [("276543212", "dígito")],
    "TO": [("291234560", "dígito"), ("29041234569", "categoria"), ("2912345690", "tamanho")],
}


def test_cobre_27_ufs():
    assert len(UFS) == 27
    assert set(VALIDAS) == set(UFS)
    assert set(INVALIDAS) == set(UFS)


@pytest.mark.parametrize("uf,ie", [(uf, ie) for uf, lista in VALIDAS.items() for ie in lista])
def test_validas(uf, ie):
    r = validar_ie(ie, uf)
    assert r.valida, f"{uf} {ie}: {r.motivo}"
    assert r.motivo is None
    assert r.formatada
    assert validar_ie(r.formatada, uf).valida  # a forma formatada também valida
    assert bool(r) is True


@pytest.mark.parametrize("uf,ie,motivo", [(uf, ie, m) for uf, lista in INVALIDAS.items() for ie, m in lista])
def test_invalidas(uf, ie, motivo):
    r = validar_ie(ie, uf)
    assert not r.valida
    assert r.motivo and r.motivo.startswith(motivo), r.motivo
    assert r.formatada is None
    assert bool(r) is False


@pytest.mark.parametrize("ie,uf,esperado", [
    ("110042490114", "SP", "110.042.490.114"),
    ("P011004243002", "SP", "P-01100424.3/002"),
    ("0100482300112", "AC", "01.004.823/001-12"),
    ("0623079040081", "MG", "062.307.904/0081"),
    ("1234567850", "PR", "123.45678-50"),
    ("130000019", "MT", "0013000001-9"),
    ("2243658792", "RS", "224/3658792"),
])
def test_mascaras(ie, uf, esperado):
    assert validar_ie(ie, uf).formatada == esperado


def test_uf_minuscula_com_espacos():
    assert validar_ie("110042490114", " sp ").valida


def test_ie_de_uma_uf_nao_vale_para_outra():
    assert not validar_ie("110042490114", "RJ").valida
    assert not validar_ie("0100482300112", "DF").valida  # prefixo 01 é do AC


def test_entradas_genericas():
    assert validar_ie("110042490114", "XX") == ResultadoIE(False, "UF inválida")
    assert validar_ie("", "SP") == ResultadoIE(False, "IE vazia")
    assert "ISENTO" in validar_ie("ISENTO", "SP").motivo
    assert validar_ie("12A456785016", "SP").motivo == "caracteres inválidos"
    assert validar_ie("P01234567500X", "SP").motivo == "caracteres inválidos"
    assert validar_ie("P012345675001", "MG").motivo == "caracteres inválidos"  # "P" só em SP
    assert validar_ie("１２３４５６７８５０１６", "SP").motivo == "caracteres inválidos"  # dígitos não-ASCII
    assert validar_ie("000000000", "SC").motivo == "sequência de dígitos repetidos"
    assert validar_ie("00000000000", "MT").motivo == "sequência de dígitos repetidos"
    assert not validar_ie(110042490114, "SP").valida  # type: ignore[arg-type]


def test_limpar_ie():
    assert limpar_ie(" 110.042.490-114 ") == "110042490114"
    assert limpar_ie("p-01100424.3/002") == "P011004243002"
