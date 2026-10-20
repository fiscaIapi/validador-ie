"""Validação de FORMATO e DÍGITO VERIFICADOR da Inscrição Estadual (IE) das 27 UFs.

Esta biblioteca NÃO consulta se a IE existe, está ativa ou pertence a quem diz
pertencer. Ela apenas confere se o número é bem formado segundo as regras
públicas de cada UF (roteiros de crítica publicados no portal do SINTEGRA e
pelas Secretarias de Fazenda).

Licença: MIT. Sem dependências.

Uso::

    >>> from validador_ie import validar_ie
    >>> validar_ie("110.042.490.114", "SP")
    ResultadoIE(valida=True, motivo=None, formatada='110.042.490.114', zeros_completados=0)
    >>> validar_ie("623079040081", "MG")  # sem os zeros à esquerda
    ResultadoIE(valida=True, motivo=None, formatada='062.307.904/0081', zeros_completados=1)
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, Optional, Sequence

__all__ = ["UFS", "ResultadoIE", "validar_ie", "limpar_ie"]
__version__ = "0.2.1"

UFS: tuple[str, ...] = (
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
)

MOTIVO_DV = "dígito verificador inválido"


@dataclass(frozen=True)
class ResultadoIE:
    """Resultado da validação.

    - ``valida``: True quando formato e dígito(s) verificador(es) conferem.
    - ``motivo``: motivo da recusa (apenas quando ``valida`` é False).
    - ``formatada``: IE com a máscara usual da UF (apenas quando ``valida`` é True).
    - ``zeros_completados``: quantos zeros à esquerda a biblioteca completou para a
      IE chegar ao tamanho da UF (0 quando a IE já veio completa ou é inválida).
      Ex.: ``"623079040081"`` em MG → 1 (a IE é 0623079040081).
    """

    valida: bool
    motivo: Optional[str] = None
    formatada: Optional[str] = None
    zeros_completados: int = 0

    def __bool__(self) -> bool:  # permite `if validar_ie(...):`
        return self.valida


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------


def _soma(n: str, pesos: Sequence[int], inicio: int = 0) -> int:
    return sum(int(n[inicio + i]) * p for i, p in enumerate(pesos))


def _pesos_desc(qtd: int) -> list[int]:
    """Pesos decrescentes de (qtd + 1) até 2. Ex.: _pesos_desc(8) = [9, ..., 2]."""
    return list(range(qtd + 1, 1, -1))


def _dv_mod11(soma: int) -> int:
    """Módulo 11 padrão: resto 0 ou 1 => 0; senão 11 - resto."""
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def _dv_mod11_menos10(soma: int) -> int:
    """RO e PE (antigo): DV = 11 - resto; se > 9, subtrai 10."""
    dv = 11 - soma % 11
    return dv - 10 if dv > 9 else dv


def _dv_mod11_vezes10(soma: int) -> int:
    """AL e RN: DV = (soma × 10) mod 11; se 10, DV = 0."""
    resto = (soma * 10) % 11
    return 0 if resto == 10 else resto


def _mascara(n: str, mascara: str) -> str:
    out = []
    j = 0
    for c in mascara:
        if c == "#":
            if j >= len(n):
                break
            out.append(n[j])
            j += 1
        else:
            out.append(c)
    return "".join(out)


def _m(mascara: str) -> Callable[[str], str]:
    return lambda n: _mascara(n, mascara)


def _ok(cond: bool) -> Optional[str]:
    return None if cond else MOTIVO_DV


def _nove(prefixos: Optional[Sequence[str]] = None) -> Callable[[str], Optional[str]]:
    """9 dígitos: 8 de base com pesos 9..2 + 1 DV em módulo 11 padrão."""

    def validar(n: str) -> Optional[str]:
        if prefixos and not n.startswith(tuple(prefixos)):
            return f"prefixo inválido (esperado {', '.join(prefixos)})"
        return _ok(_dv_mod11(_soma(n, _pesos_desc(8))) == int(n[8]))

    return validar


_PESOS_AC_DF_1 = (4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
_PESOS_AC_DF_2 = (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)


def _dois13(n: str) -> bool:
    if _dv_mod11(_soma(n, _PESOS_AC_DF_1)) != int(n[11]):
        return False
    return _dv_mod11(_soma(n, _PESOS_AC_DF_2)) == int(n[12])


# ---------------------------------------------------------------------------
# Regras por UF
# ---------------------------------------------------------------------------


def _ac(n: str) -> Optional[str]:
    if not n.startswith("01"):
        return "prefixo inválido (esperado 01)"
    return _ok(_dois13(n))


def _al(n: str) -> Optional[str]:
    if not n.startswith("24"):
        return "prefixo inválido (esperado 24)"
    return _ok(_dv_mod11_vezes10(_soma(n, _pesos_desc(8))) == int(n[8]))


def _ap(n: str) -> Optional[str]:
    if not n.startswith("03"):
        return "prefixo inválido (esperado 03)"
    base = int(n[:8])
    if 3000001 <= base <= 3017000:
        p, dd = 5, 0
    elif 3017001 <= base <= 3019022:
        p, dd = 9, 1
    else:
        p, dd = 0, 0
    dv = 11 - (p + _soma(n, _pesos_desc(8))) % 11
    if dv == 10:
        dv = 0
    elif dv == 11:
        dv = dd
    return _ok(dv == int(n[8]))


def _am(n: str) -> Optional[str]:
    soma = _soma(n, _pesos_desc(8))
    dv = 11 - soma if soma < 11 else _dv_mod11(soma)
    return _ok(dv == int(n[8]))


def _ba(n: str) -> Optional[str]:
    tam = len(n)
    qtd_base = tam - 2  # 6 ou 7
    chave = n[0] if tam == 8 else n[1]
    mod10 = chave in "0123458"

    def calc(soma: int) -> int:
        if mod10:
            r = soma % 10
            return 0 if r == 0 else 10 - r
        return _dv_mod11(soma)

    # o SEGUNDO DV é calculado primeiro e entra no cálculo do primeiro
    dv2 = calc(_soma(n, _pesos_desc(qtd_base)))
    if dv2 != int(n[tam - 1]):
        return MOTIVO_DV
    pesos1 = _pesos_desc(qtd_base + 1)
    soma1 = sum(int(n[i]) * pesos1[i] for i in range(qtd_base)) + dv2 * 2
    return _ok(calc(soma1) == int(n[tam - 2]))


def _df(n: str) -> Optional[str]:
    if not n.startswith(("07", "08")):
        return "prefixo inválido (esperado 07 ou 08)"
    return _ok(_dois13(n))


def _go(n: str) -> Optional[str]:
    pref = int(n[:2])
    if not (pref in (10, 11, 15) or 20 <= pref <= 29):
        return "prefixo inválido (esperado 10, 11, 15 ou 20 a 29)"
    base = n[:8]
    informado = int(n[8])
    resto = _soma(n, _pesos_desc(8)) % 11
    dv = 0 if resto < 2 else 11 - resto
    if dv == informado:
        return None
    # exceção histórica publicada no roteiro antigo de GO
    if base == "11094402" and informado in (0, 1):
        return None
    # regra legada: resto 1 na faixa 10103105–10119997 => DV 1
    if resto == 1 and informado == 1 and 10103105 <= int(base) <= 10119997:
        return None
    return MOTIVO_DV


def _mt(n: str) -> Optional[str]:
    x = n.zfill(11)
    return _ok(_dv_mod11(_soma(x, (3, 2, 9, 8, 7, 6, 5, 4, 3, 2))) == int(x[10]))


def _mg(n: str) -> Optional[str]:
    trabalho = n[:3] + "0" + n[3:11]
    soma = 0
    for i, c in enumerate(trabalho):
        prod = int(c) * (1 if i % 2 == 0 else 2)
        soma += prod // 10 + prod % 10  # soma dos ALGARISMOS do produto
    dv1 = (10 - soma % 10) % 10
    if dv1 != int(n[11]):
        return MOTIVO_DV
    return _ok(_dv_mod11(_soma(n, (3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2))) == int(n[12]))


def _pr(n: str) -> Optional[str]:
    if _dv_mod11(_soma(n, (3, 2, 7, 6, 5, 4, 3, 2))) != int(n[8]):
        return MOTIVO_DV
    return _ok(_dv_mod11(_soma(n, (4, 3, 2, 7, 6, 5, 4, 3, 2))) == int(n[9]))


def _pe(n: str) -> Optional[str]:
    if len(n) == 9:  # e-Fisco
        if _dv_mod11(_soma(n, _pesos_desc(7))) != int(n[7]):
            return MOTIVO_DV
        return _ok(_dv_mod11(_soma(n, _pesos_desc(8))) == int(n[8]))
    # CACEPE (antigo, 14 dígitos)
    return _ok(_dv_mod11_menos10(_soma(n, (5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2))) == int(n[13]))


def _rj(n: str) -> Optional[str]:
    return _ok(_dv_mod11(_soma(n, (2, 7, 6, 5, 4, 3, 2))) == int(n[7]))


def _rn(n: str) -> Optional[str]:
    if not n.startswith("20"):
        return "prefixo inválido (esperado 20)"
    qtd = len(n) - 1
    return _ok(_dv_mod11_vezes10(_soma(n, _pesos_desc(qtd))) == int(n[qtd]))


def _rs(n: str) -> Optional[str]:
    return _ok(_dv_mod11(_soma(n, (2, 9, 8, 7, 6, 5, 4, 3, 2))) == int(n[9]))


def _ro(n: str) -> Optional[str]:
    if len(n) == 14:
        return _ok(_dv_mod11_menos10(_soma(n, (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2))) == int(n[13]))
    # antigo (9 dígitos): ignora os 3 do município; pesos 6..2 sobre os 5 da empresa
    return _ok(_dv_mod11_menos10(_soma(n, (6, 5, 4, 3, 2), 3)) == int(n[8]))


def _rr(n: str) -> Optional[str]:
    if not n.startswith("24"):
        return "prefixo inválido (esperado 24)"
    return _ok(_soma(n, (1, 2, 3, 4, 5, 6, 7, 8)) % 9 == int(n[8]))


_PESOS_SP_1 = (1, 3, 4, 5, 6, 7, 8, 10)


def _sp(n: str) -> Optional[str]:
    if n[0] == "P":  # produtor rural: P0MMMSSSSD000
        return _ok((_soma(n, _PESOS_SP_1, 1) % 11) % 10 == int(n[9]))
    if (_soma(n, _PESOS_SP_1) % 11) % 10 != int(n[8]):
        return MOTIVO_DV
    return _ok((_soma(n, (3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2)) % 11) % 10 == int(n[11]))


def _to(n: str) -> Optional[str]:
    base = n
    if len(n) == 11:
        if n[2:4] not in ("01", "02", "03", "99"):
            return "categoria inválida (3º e 4º dígitos devem ser 01, 02, 03 ou 99)"
        base = n[:2] + n[4:]
    return _ok(_dv_mod11(_soma(base, _pesos_desc(8))) == int(base[8]))


@dataclass(frozen=True)
class _Regra:
    tamanhos: tuple[int, ...]
    validar: Callable[[str], Optional[str]]
    mascara: Callable[[str], str]
    # Ordem dos tamanhos tentados ao completar zeros à esquerda de uma IE curta
    # (vazio: ``tamanhos``, do menor ao maior — o formato com menos zeros).
    completar: tuple[int, ...] = ()


_REGRAS: dict[str, _Regra] = {
    "AC": _Regra((13,), _ac, _m("##.###.###/###-##")),
    "AL": _Regra((9,), _al, _m("##.###.###-#")),
    "AP": _Regra((9,), _ap, _m("##.###.###-#")),
    "AM": _Regra((9,), _am, _m("##.###.###-#")),
    "BA": _Regra((8, 9), _ba, lambda n: _mascara(n, "######-##" if len(n) == 8 else "#######-##")),
    "CE": _Regra((9,), _nove(), _m("########-#")),
    "DF": _Regra((13,), _df, _m("###########-##")),
    "ES": _Regra((9,), _nove(), _m("###.###.##-#")),
    "GO": _Regra((9,), _go, _m("##.###.###-#")),
    "MA": _Regra((9,), _nove(("12",)), _m("##.###.###-#")),
    "MT": _Regra((9, 10, 11), _mt, lambda n: _mascara(n.zfill(11), "##########-#")),
    "MS": _Regra((9,), _nove(("28", "50")), _m("##.###.###-#")),
    "MG": _Regra((13,), _mg, _m("###.###.###/####")),
    "PA": _Regra((9,), _nove(("15", "75", "76", "77", "78", "79")), _m("##-######-#")),
    "PB": _Regra((9,), _nove(), _m("########-#")),
    "PR": _Regra((10,), _pr, _m("###.#####-##")),
    "PE": _Regra((9, 14), _pe, lambda n: _mascara(n, "#######-##" if len(n) == 9 else "##.#.###.#######-#")),
    "PI": _Regra((9,), _nove(), _m("#########")),
    "RJ": _Regra((8,), _rj, _m("##.###.##-#")),
    "RN": _Regra((9, 10), _rn, lambda n: _mascara(n, "##.###.###-#" if len(n) == 9 else "##.#.###.###-#")),
    "RS": _Regra((10,), _rs, _m("###/#######")),
    # Completando zeros, o formato atual (14) vem antes do antigo (9, fora de uso
    # desde 2000): a mesma IE curta costuma conferir nos dois.
    "RO": _Regra(
        (9, 14), _ro, lambda n: _mascara(n, "#############-#" if len(n) == 14 else "###.#####-#"), completar=(14, 9)
    ),
    "RR": _Regra((9,), _rr, _m("########-#")),
    "SC": _Regra((9,), _nove(), _m("###.###.###")),
    "SP": _Regra((12, 13), _sp, lambda n: _mascara(n, "#-########.#/###" if n[0] == "P" else "###.###.###.###")),
    "SE": _Regra((9,), _nove(), _m("########-#")),
    "TO": _Regra((9, 11), _to, lambda n: _mascara(n, "##.##.######-#" if len(n) == 11 else "##.###.###-#")),
}

# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

_LIMPAR = re.compile(r"[\s./\\-]")
_REPETIDO = re.compile(r"^(\d)\1*$")


def limpar_ie(ie: str) -> str:
    """Remove pontuação e espaços; mantém dígitos e a letra P (maiúscula)."""
    return _LIMPAR.sub("", ie.upper())


def validar_ie(ie: str, uf: str) -> ResultadoIE:
    """Valida o formato e o(s) dígito(s) verificador(es) de uma Inscrição Estadual.

    Não diz se a IE está ativa ou cadastrada — isso só uma consulta real responde.

    :param ie: número da IE, com ou sem pontuação (ex.: ``"110.042.490.114"``).
    :param uf: sigla da UF (ex.: ``"SP"``), maiúsculas ou minúsculas.
    """
    if not isinstance(ie, str) or not isinstance(uf, str):
        return ResultadoIE(False, "parâmetros devem ser texto")
    sigla = uf.strip().upper()
    regra = _REGRAS.get(sigla)
    if regra is None:
        return ResultadoIE(False, "UF inválida")

    n = limpar_ie(ie)
    if not n:
        return ResultadoIE(False, "IE vazia")
    if n in ("ISENTO", "ISENTA"):
        return ResultadoIE(False, "IE informada como ISENTO (não há número a validar)")

    produtor_sp = sigla == "SP" and n[0] == "P"
    digitos = n[1:] if produtor_sp else n
    if not (digitos.isascii() and digitos.isdigit()):
        return ResultadoIE(False, "caracteres inválidos")

    tamanhos = ((13 if produtor_sp else 12),) if sigla == "SP" else regra.tamanhos
    if len(n) not in tamanhos:
        esperado = (
            "12 dígitos ou P + 12 dígitos"
            if sigla == "SP"
            else " ou ".join(str(t) for t in regra.tamanhos) + " dígitos"
        )
        recusa = ResultadoIE(False, f"tamanho inválido (esperado {esperado})")
        # IE curta: a SEFAZ despreza os zeros à esquerda (e planilhas os comem).
        # Completa com zeros até um tamanho da UF e confere de novo. Não vale para
        # o produtor rural de SP: o "P" faz da IE um texto, que não perde zeros, e
        # o 0 depois do "P" é parte fixa do formato.
        if produtor_sp:
            return recusa
        for tam in regra.completar or tamanhos:
            if tam <= len(n):
                continue
            completa = n.zfill(tam)
            if _REPETIDO.match(completa):
                continue
            if regra.validar(completa) is None:
                return _aceita(regra, completa, len(n))
        return recusa
    if _REPETIDO.match(digitos):
        return ResultadoIE(False, "sequência de dígitos repetidos")

    falha = regra.validar(n)
    if falha:
        return ResultadoIE(False, falha)
    return _aceita(regra, n, len(n))


def _aceita(regra: _Regra, n: str, tamanho_entrada: int) -> ResultadoIE:
    """Resultado válido. Os zeros completados contam também os que a máscara põe (MT de 9 ou 10 dígitos)."""
    formatada = regra.mascara(n)
    return ResultadoIE(True, None, formatada, sum(c.isdigit() or c == "P" for c in formatada) - tamanho_entrada)
