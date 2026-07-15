(function () {
  'use strict';

  const DATA_URL = '/data/tabelas-trabalhistas.json';
  let cacheTabelas = null;
  const AVISO_PREVIO_GOVERNED_FALLBACK = Object.freeze({
    ruleId: 'aviso-previo',
    ruleVersion: '1.0.0-rc.2',
    sourceProjectionFingerprint: 'd64857fa9777f45246637a88e0894ba658b0440e3edcc4708780832ac55eeb2a',
    updatedAt: '2026-07-14',
    reviewStatus: 'LEGAL_REVIEW_RESOLVED',
    legalCorrectionPolicy: 'LEGAL_CORRECTNESS_OVERRIDES_LEGACY_EQUIVALENCE',
    baseDays: 30,
    additionalDaysPerFullYear: 3,
    maximumAdditionalDays: 60,
    maximumTotalDays: 90,
    maximumWorkedDays: 30,
    salaryDivisorDays: 30,
    employeeResignationNoticeDays: 30,
    employeeDiscountLimitDays: 30,
    employerTerminationProportionality: true,
    employeeResignationProportionality: false,
    proportionalExcessIsIndemnified: true,
    presentation: {
      validResultStatus: 'Cálculo realizado',
      invalidResultStatus: 'Dados incompletos',
      invalidBadge: 'simulação',
      invalidMessage: 'Informe um salário válido e datas coerentes para calcular o aviso prévio.',
      types: {
        indenizado: { badge: 'verba estimada', estimatedLabel: 'Verba estimada', messageTemplate: 'Aviso prévio indenizado: o valor estimado de {estimatedValue} pode aparecer como verba a receber na rescisão, conforme a modalidade de desligamento e as regras aplicáveis.' },
        trabalhadoWithoutExcess: { badge: 'dias a cumprir', estimatedLabel: 'Referência salarial', messageTemplate: 'Aviso prévio trabalhado: a estimativa indica {totalDays} dias a cumprir. O valor exibido serve apenas como referência salarial do período, não como verba indenizada adicional.' },
        trabalhadoWithExcess: { badge: 'aviso misto', estimatedLabel: 'Referência total do aviso', messageTemplate: 'Aviso prévio misto: {workedDays} dias correspondem ao período trabalhado e {indemnifiedDays} dias à parcela proporcional indenizada.' },
        desconto: { badge: 'possível desconto', estimatedLabel: 'Possível desconto', messageTemplate: 'Pedido de demissão com desconto: o valor estimado de {estimatedValue} deve ser lido como possível desconto, caso o aviso não seja cumprido e a empresa não dispense o cumprimento.' }
      }
    }
  });
  const FGTS_SAQUE_ANIVERSARIO_RULE_ID = 'fgts.saque-aniversario';
  const FGTS_SAQUE_ANIVERSARIO_RULE_VERSION = '1.0.0-rc.1';
  const FGTS_SAQUE_ANIVERSARIO_FINGERPRINT = '966ea90005f500f2d462844680860fc548755271e26f51f8688e5889efd620bd';
  const FGTS_SAQUE_ANIVERSARIO_GOVERNED_FALLBACK = Object.freeze({
    ruleId: FGTS_SAQUE_ANIVERSARIO_RULE_ID,
    ruleVersion: FGTS_SAQUE_ANIVERSARIO_RULE_VERSION,
    sourceProjectionFingerprint: FGTS_SAQUE_ANIVERSARIO_FINGERPRINT,
    updatedAt: '2026-07-15',
    reviewStatus: 'LEGAL_REVIEW_RESOLVED',
    formula: Object.freeze({
      withdrawal: 'balance * rate + additionalAmount',
      remainingBalance: 'max(balance - withdrawal, 0)'
    }),
    rounding: Object.freeze({
      method: 'Math.round((value + Number.EPSILON) * 100) / 100',
      stage: 'final outputs',
      moneyScale: 2
    }),
    invalidBehavior: 'EMPTY_ZERO_OUTPUT',
    faixas: Object.freeze([
      Object.freeze({de:0,ate:500,aliquota:0.5,percentual:50,parcelaAdicional:0,rotulo:'At\u00e9 R$ 500,00'}),
      Object.freeze({de:500.01,ate:1000,aliquota:0.4,percentual:40,parcelaAdicional:50,rotulo:'R$ 500,01 a R$ 1.000,00'}),
      Object.freeze({de:1000.01,ate:5000,aliquota:0.3,percentual:30,parcelaAdicional:150,rotulo:'R$ 1.000,01 a R$ 5.000,00'}),
      Object.freeze({de:5000.01,ate:10000,aliquota:0.2,percentual:20,parcelaAdicional:650,rotulo:'R$ 5.000,01 a R$ 10.000,00'}),
      Object.freeze({de:10000.01,ate:15000,aliquota:0.15,percentual:15,parcelaAdicional:1150,rotulo:'R$ 10.000,01 a R$ 15.000,00'}),
      Object.freeze({de:15000.01,ate:20000,aliquota:0.1,percentual:10,parcelaAdicional:1900,rotulo:'R$ 15.000,01 a R$ 20.000,00'}),
      Object.freeze({de:20000.01,ate:null,aliquota:0.05,percentual:5,parcelaAdicional:2900,rotulo:'Acima de R$ 20.000,00'})
    ])
  });

  function arredondarCentavos(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number.isFinite(Number(valor)) ? Number(valor) : 0);
  }

  async function carregarTabelasTrabalhistas() {
    if (cacheTabelas) return cacheTabelas;

    const response = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${DATA_URL}`);
    }

    cacheTabelas = await response.json();
    return cacheTabelas;
  }

  function calcularINSS(salarioBruto, tabelas) {
    const salario = Number(salarioBruto) || 0;
    if (salario <= 0 || !tabelas || !tabelas.inss) return 0;

    const teto = Number(tabelas.inss.teto) || salario;
    const base = Math.min(salario, teto);
    let anterior = 0;
    let desconto = 0;

    tabelas.inss.faixas.forEach((faixa) => {
      const limite = Number(faixa.ate) || teto;
      const baseFaixa = Math.max(0, Math.min(base, limite) - anterior);
      desconto += baseFaixa * Number(faixa.aliquota || 0);
      anterior = limite;
    });

    return arredondarCentavos(desconto);
  }

  function calcularBaseIRRF(salarioBruto, inss, dependentes, outrosDescontos, tabelas) {
    const bruto = Number(salarioBruto) || 0;
    const descontoInss = Number(inss) || 0;
    const deps = Math.max(0, Number(dependentes) || 0);
    const outros = Math.max(0, Number(outrosDescontos) || 0);
    const deducaoDependentes = deps * Number(tabelas.irrf.descontoPorDependente || 0);
    const descontoSimplificado = Number(tabelas.irrf.descontoSimplificado || 0);
    const deducaoEscolhida = Math.max(deducaoDependentes, descontoSimplificado);
    const baseCalculo = Math.max(0, bruto - descontoInss - outros - deducaoEscolhida);

    return {
      baseCalculo: arredondarCentavos(baseCalculo),
      deducaoDependentes: arredondarCentavos(deducaoDependentes),
      deducaoEscolhida: arredondarCentavos(deducaoEscolhida)
    };
  }

  function calcularIRRF(baseIRRF, tabelas) {
    const base = Number(baseIRRF) || 0;
    if (base <= 0 || !tabelas || !tabelas.irrf) {
      return { impostoBruto: 0, redutor2026: 0, impostoFinal: 0 };
    }

    const faixa = tabelas.irrf.faixas.find((item) => item.ate === null || base <= Number(item.ate));
    const impostoBruto = Math.max(0, base * Number(faixa.aliquota || 0) - Number(faixa.deducao || 0));

    let redutor = 0;
    const redutorConfig = tabelas.irrf.redutorIsencao || {};
    if (redutorConfig.ativo) {
      if (base <= Number(redutorConfig.limiteIsencao || 0)) {
        redutor = impostoBruto;
      } else if (base <= Number(redutorConfig.limiteReducao || 0)) {
        redutor = Math.max(0, Number(redutorConfig.parcelaBase || 0) - Number(redutorConfig.coeficiente || 0) * base);
      }
    }

    const redutorAplicado = Math.min(impostoBruto, redutor);
    const impostoFinal = Math.max(0, impostoBruto - redutorAplicado);

    return {
      impostoBruto: arredondarCentavos(impostoBruto),
      redutor2026: arredondarCentavos(redutorAplicado),
      impostoFinal: arredondarCentavos(impostoFinal)
    };
  }

  function obterSalarioMinimo(tabelas) {
    return Number(tabelas?.salarioMinimo?.valor) || 0;
  }

  function obterTabelaSeguroDesemprego(tabelas) {
    return tabelas?.seguroDesemprego || null;
  }


  function calcularSeguroDesemprego(mediaSalarial, tabelas) {
    const media = Number(mediaSalarial) || 0;
    const tabela = obterTabelaSeguroDesemprego(tabelas);
    const piso = Number(tabela?.piso) || 0;
    const teto = Number(tabela?.teto) || Infinity;
    const faixas = Array.isArray(tabela?.faixas) ? tabela.faixas : [];

    if (!tabela || media <= 0 || !faixas.length) {
      return {
        media,
        valor: 0,
        faixa: '',
        faixaDados: null,
        piso,
        teto: Number.isFinite(teto) ? teto : 0
      };
    }

    const faixa = faixas.find((item) => item.ate === null || media <= Number(item.ate));
    let valor = 0;

    if (!faixa) {
      valor = teto;
    } else if (faixa.tipo === 'multiplicador') {
      valor = media * Number(faixa.multiplicador || 0);
    } else if (faixa.tipo === 'baseMaisExcedente') {
      valor = Number(faixa.valorBase || 0) + ((media - Number(faixa.limiteBase || 0)) * Number(faixa.multiplicadorExcedente || 0));
    } else if (faixa.tipo === 'teto') {
      valor = teto;
    }

    valor = Math.max(piso, Math.min(valor, teto));

    return {
      media: arredondarCentavos(media),
      valor: arredondarCentavos(valor),
      faixa: faixa?.rotulo || '',
      faixaDados: faixa || null,
      piso,
      teto: Number.isFinite(teto) ? teto : 0
    };
  }

  function calcularParcelasSeguroDesemprego(tempoOuParcelas, tabelas) {
    const valor = Number(tempoOuParcelas) || 0;
    const tabela = obterTabelaSeguroDesemprego(tabelas);
    const regras = Array.isArray(tabela?.parcelas?.faixas) ? tabela.parcelas.faixas : [];

    if ([3, 4, 5].includes(valor)) {
      return { parcelas: valor, regra: null };
    }

    const regra = regras.find((item) => {
      const de = Number(item.deMeses) || 0;
      const ate = item.ateMeses === null ? Infinity : Number(item.ateMeses);
      return valor >= de && valor <= ate;
    });

    return {
      parcelas: Number(regra?.parcelas) || 0,
      regra: regra || null
    };
  }

  function obterTabelaFGTS(tabelas) {
    return tabelas?.fgts || null;
  }


  function obterTabelaSaqueAniversario(tabelas) {
    return tabelas?.saqueAniversario || null;
  }

  function diagnosticarProjecaoSaqueAniversario(tabela) {
    if (!tabela || tabela.ruleId !== FGTS_SAQUE_ANIVERSARIO_RULE_ID || tabela.ruleVersion !== FGTS_SAQUE_ANIVERSARIO_RULE_VERSION) {
      return 'UNKNOWN_VERSION';
    }
    if (tabela.sourceProjectionFingerprint !== FGTS_SAQUE_ANIVERSARIO_FINGERPRINT) return 'STALE_DERIVED_OUTPUT';
    const faixas = Array.isArray(tabela.faixas) ? tabela.faixas : [];
    if (faixas.length !== 7 || !faixas[6] || faixas[6].rotulo !== 'Acima de R$ 20.000,00') return 'STALE_VISIBLE_TABLE';
    const expected = FGTS_SAQUE_ANIVERSARIO_GOVERNED_FALLBACK.faixas;
    const synchronized = expected.every((band, index) => {
      const current = faixas[index] || {};
      return ['de','ate','aliquota','percentual','parcelaAdicional','rotulo'].every((field) => current[field] === band[field]);
    });
    return synchronized ? 'SYNCED' : 'STALE_DERIVED_OUTPUT';
  }

  function validarProjecaoSaqueAniversario(tabela) {
    const state = diagnosticarProjecaoSaqueAniversario(tabela);
    if (state !== 'SYNCED') throw new Error(`FGTS_SAQUE_ANIVERSARIO_${state}`);
    return tabela;
  }

  function obterFallbackSaqueAniversario() {
    return FGTS_SAQUE_ANIVERSARIO_GOVERNED_FALLBACK;
  }

  function calcularSaqueAniversarioFGTS(saldoFGTS, tabelas) {
    const saldo = Number(saldoFGTS) || 0;
    const tabela = obterTabelaSaqueAniversario(tabelas);
    const faixas = Array.isArray(tabela?.faixas) ? tabela.faixas : [];
    const faixa = faixas.find((item) => item.ate === null || saldo <= Number(item.ate));

    if (!faixa || saldo <= 0) {
      return {
        saldo,
        faixa: null,
        percentual: 0,
        aliquota: 0,
        parcelaAdicional: 0,
        saquePermitido: 0,
        saldoRestante: Math.max(saldo, 0)
      };
    }

    const aliquota = Number(faixa.aliquota) || (Number(faixa.percentual) || 0) / 100;
    const percentual = Number(faixa.percentual) || aliquota * 100;
    const parcelaAdicional = Number(faixa.parcelaAdicional) || 0;
    const saquePermitido = arredondarCentavos(saldo * aliquota + parcelaAdicional);
    const saldoRestante = arredondarCentavos(Math.max(saldo - saquePermitido, 0));

    return {
      saldo,
      faixa,
      percentual,
      aliquota,
      parcelaAdicional,
      saquePermitido,
      saldoRestante
    };
  }

  function obterPercentualInsalubridade(grau, tabelas) {
    return Number(tabelas?.insalubridade?.percentuais?.[grau]) || 0;
  }

  function obterPercentualAdicionalNoturno(tabelas) {
    return Number(tabelas?.adicionalNoturno?.percentualPadrao) || 0;
  }


  function validarRegraAvisoPrevio(regra) {
    const requiredNumbers = ['baseDays', 'additionalDaysPerFullYear', 'maximumTotalDays', 'maximumWorkedDays', 'salaryDivisorDays', 'employeeResignationNoticeDays', 'employeeDiscountLimitDays'];
    const valid = regra
      && regra.ruleId === AVISO_PREVIO_GOVERNED_FALLBACK.ruleId
      && regra.ruleVersion === AVISO_PREVIO_GOVERNED_FALLBACK.ruleVersion
      && regra.sourceProjectionFingerprint === AVISO_PREVIO_GOVERNED_FALLBACK.sourceProjectionFingerprint
      && regra.reviewStatus === 'LEGAL_REVIEW_RESOLVED'
      && regra.employeeResignationProportionality === false
      && regra.proportionalExcessIsIndemnified === true
      && regra.presentation && regra.presentation.types
      && requiredNumbers.every((field) => Number.isFinite(Number(regra[field])));
    if (!valid) throw new Error('Regra governada de aviso previo ausente, invalida ou stale.');
    return regra;
  }

  function obterFallbackAvisoPrevio() {
    return { ...AVISO_PREVIO_GOVERNED_FALLBACK };
  }

  function obterRegraAvisoPrevio(tabelas) {
    return validarRegraAvisoPrevio(tabelas?.avisoPrevio || obterFallbackAvisoPrevio());
  }

  function calcularAvisoPrevio(inputOrYears, salarioOrTabelas, tabelasMaybe) {
    const objectInput = inputOrYears && typeof inputOrYears === 'object';
    const input = objectInput
      ? inputOrYears
      : { fullYears: inputOrYears, salary: salarioOrTabelas, noticeType: 'indenizado' };
    const tabelas = objectInput ? salarioOrTabelas : tabelasMaybe;
    const regra = obterRegraAvisoPrevio(tabelas);
    const anos = Math.max(0, Number(input.fullYears) || 0);
    const salario = Number(input.salary) || 0;
    const noticeType = input.noticeType || 'indenizado';
    const baseDays = Number(regra.baseDays);
    const rawAdditionalDays = anos * Number(regra.additionalDaysPerFullYear);
    const employerTotalDays = Math.min(Number(regra.maximumTotalDays), baseDays + rawAdditionalDays);
    const dailyValue = salario / Number(regra.salaryDivisorDays);
    let totalDays = employerTotalDays;
    let proportionalEntitlementDays = employerTotalDays - baseDays;
    let workedDays = 0;
    let indemnifiedDays = employerTotalDays;
    let discountDays = 0;

    if (noticeType === 'trabalhado') {
      workedDays = Math.min(Number(regra.maximumWorkedDays), employerTotalDays);
      indemnifiedDays = employerTotalDays - workedDays;
    } else if (noticeType === 'desconto') {
      totalDays = Number(regra.employeeResignationNoticeDays);
      proportionalEntitlementDays = 0;
      indemnifiedDays = 0;
      discountDays = Math.min(Number(regra.employeeDiscountLimitDays), totalDays);
    } else if (noticeType !== 'indenizado') {
      throw new Error(`Tipo de aviso previo desconhecido: ${noticeType}`);
    }

    const monetaryDays = noticeType === 'desconto' ? discountDays : totalDays;
    const estimatedValue = monetaryDays * dailyValue;

    return {
      ruleId: regra.ruleId,
      ruleVersion: regra.ruleVersion,
      sourceProjectionFingerprint: regra.sourceProjectionFingerprint,
      baseDays,
      rawAdditionalDays,
      additionalDays: proportionalEntitlementDays,
      proportionalEntitlementDays,
      totalDays,
      workedDays,
      indemnifiedDays,
      discountDays,
      monetaryDays,
      dailyValue,
      estimatedValue
    };
  }

  function projetarApresentacaoAvisoPrevio(result, tabelas) {
    const regra = obterRegraAvisoPrevio(tabelas);
    let typeKey = 'indenizado';
    if (result.discountDays > 0) typeKey = 'desconto';
    else if (result.workedDays > 0) typeKey = result.indemnifiedDays > 0 ? 'trabalhadoWithExcess' : 'trabalhadoWithoutExcess';
    const projection = regra.presentation.types[typeKey];
    const replacements = {
      estimatedValue: formatarMoeda(result.estimatedValue),
      totalDays: result.totalDays,
      workedDays: result.workedDays,
      indemnifiedDays: result.indemnifiedDays
    };
    const message = Object.entries(replacements).reduce(
      (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
      projection.messageTemplate
    );
    return { ...projection, message, typeKey, resultStatus: regra.presentation.validResultStatus };
  }

  function calcularAdicionalNoturno({ salary, monthlyHours, nightHours, percent }, tabelas) {
    const percentualCentral = Number(percent) || (obterPercentualAdicionalNoturno(tabelas) * 100);
    const normalHourValue = (Number(salary) || 0) / (Number(monthlyHours) || 1);
    const additionalPerHour = normalHourValue * (percentualCentral / 100);
    const totalValue = additionalPerHour * (Number(nightHours) || 0);

    return {
      normalHourValue,
      percent: percentualCentral,
      additionalPerHour,
      nightHours: Number(nightHours) || 0,
      totalValue
    };
  }

  function obterPercentuaisInsalubridade(tabelas) {
    return tabelas?.insalubridade?.percentuais || {};
  }

  function calcularInsalubridade({ minimumWage, degree }, tabelas) {
    const percentuais = obterPercentuaisInsalubridade(tabelas);
    const rotulos = tabelas?.insalubridade?.rotulos || {};
    const percentDecimal = Number(percentuais?.[degree]) || 0;
    const percent = percentDecimal * 100;
    const monthlyValue = (Number(minimumWage) || 0) * percentDecimal;
    const annualValue = monthlyValue * 12;

    return {
      minimumWage: Number(minimumWage) || 0,
      degreeLabel: rotulos?.[degree] || degree,
      percent,
      monthlyValue,
      annualValue
    };
  }

  function obterRegrasHorasExtras(tabelas) {
    return tabelas?.horasExtras || null;
  }

  function obterDivisorHorasCentral(jornadaTipo, jornadaCustom, tabelas) {
    const regras = obterRegrasHorasExtras(tabelas) || {};
    const divisores = regras.divisoresMensais || {};
    if (jornadaTipo === '44') return Number(divisores['44']) || 220;
    if (jornadaTipo === '40') return Number(divisores['40']) || 200;

    const personalizada = regras.personalizada || {};
    const semanasPorMes = Number(personalizada.semanasPorMes) || 4.33;
    const fatorAjuste = Number(personalizada.fatorAjuste) || 1.2;
    return (Number(jornadaCustom) || 0) * semanasPorMes * fatorAjuste;
  }

  function calcularHoraExtra({ salarioBruto, jornadaTipo, jornadaCustom, horas50, horas100 }, tabelas) {
    const regras = obterRegrasHorasExtras(tabelas) || {};
    const divisor = obterDivisorHorasCentral(jornadaTipo, jornadaCustom, tabelas);
    const salario = Number(salarioBruto) || 0;
    const qtd50 = Number(horas50) || 0;
    const qtd100 = Number(horas100) || 0;
    const adicional50 = Number(regras.percentualDiaUtil) || 0.50;
    const adicional100 = Number(regras.percentualDomingoFeriado) || 1.00;
    const valorHoraNormal = salario / divisor;
    const valorHoraExtra50 = valorHoraNormal * (1 + adicional50);
    const valorHoraExtra100 = valorHoraNormal * (1 + adicional100);
    const subtotal50 = qtd50 * valorHoraExtra50;
    const subtotal100 = qtd100 * valorHoraExtra100;
    const totalHoras = qtd50 + qtd100;
    const totalReceber = subtotal50 + subtotal100;

    return {
      divisor,
      valorHoraNormal,
      valorHoraExtra50,
      valorHoraExtra100,
      subtotal50,
      subtotal100,
      totalHoras,
      totalReceber
    };
  }

  function resultadosNumericosIguais(a, b, tolerancia = 0.01) {
    return Math.abs((Number(a) || 0) - (Number(b) || 0)) <= tolerancia;
  }


  function calcularFGTSMensal(salarioBruto, tabelas) {
    const salario = Number(salarioBruto) || 0;
    const percentual = Number(tabelas?.fgts?.depositoMensal) || 0.08;
    return arredondarCentavos(salario * percentual);
  }

  function calcularMultaFGTS(fgtsAcumulado, tabelas) {
    const saldo = Number(fgtsAcumulado) || 0;
    const percentual = Number(tabelas?.fgts?.multaRescisoria) || 0.4;
    return arredondarCentavos(saldo * percentual);
  }

  function calcularSaldoSalario(salarioBruto, diasTrabalhados, diasNoMes) {
    const salario = Number(salarioBruto) || 0;
    const dias = Number(diasTrabalhados) || 0;
    const totalDias = Number(diasNoMes) || 30;
    return arredondarCentavos((salario / totalDias) * dias);
  }

  function calcularFeriasProporcionais(salarioBruto, mesesProporcionais, tabelas) {
    const salario = Number(salarioBruto) || 0;
    const meses = Math.max(0, Number(mesesProporcionais) || 0);
    const mesesAno = Number(tabelas?.ferias?.mesesAno) || 12;
    const terco = Number(tabelas?.ferias?.tercoConstitucional) || (1 / 3);
    const base = salario * (meses / mesesAno);
    const tercoValor = base * terco;
    return {
      base: arredondarCentavos(base),
      terco: arredondarCentavos(tercoValor),
      total: arredondarCentavos(base + tercoValor)
    };
  }

  function calcularFeriasVencidas(salarioBruto, periodosVencidos, tabelas) {
    const salario = Number(salarioBruto) || 0;
    const periodos = Math.max(0, Number(periodosVencidos) || 0);
    const terco = Number(tabelas?.ferias?.tercoConstitucional) || (1 / 3);
    const base = salario * periodos;
    const tercoValor = base * terco;
    return {
      base: arredondarCentavos(base),
      terco: arredondarCentavos(tercoValor),
      total: arredondarCentavos(base + tercoValor)
    };
  }

  function calcularDecimoTerceiroProporcional(salarioBruto, mesesProporcionais, tabelas) {
    const salario = Number(salarioBruto) || 0;
    const meses = Math.max(0, Number(mesesProporcionais) || 0);
    const mesesAno = Number(tabelas?.decimoTerceiro?.mesesAno) || 12;
    return arredondarCentavos(salario * (meses / mesesAno));
  }

  function calcularRescisao(dados, tabelas) {
    const salario = Number(dados?.salario) || 0;
    const mesesServico = Math.max(0, Number(dados?.mesesServico) || 0);
    const diasServico = Math.max(0, Number(dados?.diasServico) || 0);
    const diasTrabalhadosMes = Math.max(0, Number(dados?.diasTrabalhadosMes) || 0);
    const diasNoMes = Math.max(1, Number(dados?.diasNoMes) || 30);
    const tipo = dados?.tipo || '';
    const aviso = dados?.aviso || '';
    const meses13 = Math.max(0, Number(dados?.meses13) || 0);
    const regraAviso = obterRegraAvisoPrevio(tabelas) || {};
    const anos = Math.floor(diasServico / 365);
    const diasAviso = calcularAvisoPrevio(anos, salario, tabelas).totalDays || Number(regraAviso.diasBase) || 30;

    const saldoSalario = calcularSaldoSalario(salario, diasTrabalhadosMes, diasNoMes);
    const qtdFeriasVencidas = Math.floor(mesesServico / 12);
    const feriasVencidas = calcularFeriasVencidas(salario, qtdFeriasVencidas, tabelas).total;
    const mesesFeriasProp = mesesServico % 12;
    const feriasProporcionais = calcularFeriasProporcionais(salario, mesesFeriasProp, tabelas).total;
    const decimoTerceiroProp = calcularDecimoTerceiroProporcional(salario, meses13, tabelas);
    const fgtsAcumulado = arredondarCentavos(calcularFGTSMensal(salario, tabelas) * mesesServico);
    const multa40 = (tabelas?.rescisao?.tiposComMultaFGTS || ['sem_justa_causa']).includes(tipo) ? calcularMultaFGTS(fgtsAcumulado, tabelas) : 0;

    let avisoPrevioValor = 0;
    if (aviso === 'indenizado') {
      const tiposPositivos = tabelas?.rescisao?.tiposComAvisoIndenizadoPositivo || ['sem_justa_causa', 'termino_contrato'];
      if (tiposPositivos.includes(tipo)) {
        avisoPrevioValor = arredondarCentavos((salario / 30) * diasAviso);
      }
    } else if (aviso === 'sem_aviso') {
      const tiposDesconto = tabelas?.rescisao?.tiposComDescontoAviso || ['pedido_demissao'];
      if (tiposDesconto.includes(tipo)) {
        const diasDesconto = Number(regraAviso.diasDescontoPedidoDemissao) || 30;
        avisoPrevioValor = -arredondarCentavos((salario / 30) * Math.min(diasAviso, diasDesconto));
      }
    }

    let totalVerbas = saldoSalario + feriasVencidas + feriasProporcionais + decimoTerceiroProp + avisoPrevioValor;
    if ((tabelas?.rescisao?.tiposComMultaFGTS || ['sem_justa_causa']).includes(tipo)) {
      totalVerbas += multa40;
    }

    return {
      saldoSalario: arredondarCentavos(saldoSalario),
      feriasVencidas: arredondarCentavos(feriasVencidas),
      feriasProporcionais: arredondarCentavos(feriasProporcionais),
      decimoTerceiroProp: arredondarCentavos(decimoTerceiroProp),
      fgtsAcumulado: arredondarCentavos(fgtsAcumulado),
      multa40: arredondarCentavos(multa40),
      avisoPrevioValor: arredondarCentavos(avisoPrevioValor),
      diasAviso,
      totalVerbas: arredondarCentavos(totalVerbas)
    };
  }

  function calcularBeneficios(valores) {
    return arredondarCentavos((Number(valores?.beneficios) || 0) + (Number(valores?.vaVr) || 0) + (Number(valores?.vt) || 0) + (Number(valores?.saude) || 0));
  }

  function calcularCustoCLT(dados, tabelas) {
    const salario = Number(dados?.salario) || 0;
    const dependentes = Number(dados?.dependentes) || 0;
    const descontos = Number(dados?.descontos) || 0;
    const beneficios = Number(dados?.beneficios) || 0;

    const teto = Number(tabelas?.inss?.teto) || salario;
    const baseInss = Math.min(salario, teto);
    let anterior = 0;
    let inss = 0;
    (tabelas?.inss?.faixas || []).forEach((faixa) => {
      const limite = faixa.ate === null ? teto : Number(faixa.ate);
      const baseFaixa = Math.max(0, Math.min(baseInss, limite) - anterior);
      inss += baseFaixa * Number(faixa.aliquota || 0);
      anterior = limite;
    });

    const deducaoDependentes = Math.max(0, dependentes) * Number(tabelas?.irrf?.descontoPorDependente || 0);
    const deducaoEscolhida = Math.max(deducaoDependentes, Number(tabelas?.irrf?.descontoSimplificado || 0));
    const baseIRRF = Math.max(0, salario - inss - deducaoEscolhida);
    const faixaIRRF = (tabelas?.irrf?.faixas || []).find((faixa) => faixa.ate === null || baseIRRF <= Number(faixa.ate)) || (tabelas?.irrf?.faixas || []).slice(-1)[0] || {};
    const impostoBruto = Math.max(0, baseIRRF * Number(faixaIRRF.aliquota || 0) - Number(faixaIRRF.deducucao || faixaIRRF.deducao || 0));
    let redutor = 0;
    const redutorConfig = tabelas?.irrf?.redutorIsencao || {};
    if (redutorConfig.ativo) {
      if (baseIRRF <= Number(redutorConfig.limiteIsencao || 0)) {
        redutor = impostoBruto;
      } else if (baseIRRF <= Number(redutorConfig.limiteReducao || 0)) {
        redutor = Math.max(0, Number(redutorConfig.parcelaBase || 0) - Number(redutorConfig.coeficiente || 0) * baseIRRF);
      }
    }
    const irrf = Math.max(0, impostoBruto - Math.min(impostoBruto, redutor));

    const liquido = Math.max(0, salario - inss - irrf - descontos);
    const decimoTerceiro = salario / (Number(tabelas?.decimoTerceiro?.mesesAno) || 12);
    const ferias = (salario + salario * (Number(tabelas?.ferias?.tercoConstitucional) || (1 / 3))) / 12;
    const fgts = salario * (Number(tabelas?.fgts?.depositoMensal) || 0.08);
    const total = liquido + decimoTerceiro + ferias + fgts + beneficios;

    return {
      inss,
      irrf,
      liquido,
      decimoTerceiro,
      ferias,
      fgts,
      beneficios,
      total
    };
  }

  function calcularReservaPJ(valores) {
    return arredondarCentavos((Number(valores?.reservaFerias) || 0) + (Number(valores?.reserva13) || 0));
  }

  function calcularComparativoCltPj(dados, tabelas) {
    const cltBeneficios = calcularBeneficios({
      beneficios: dados?.cltBeneficios,
      vaVr: dados?.cltVaVr,
      vt: dados?.cltVt,
      saude: dados?.cltSaude
    });
    const clt = calcularCustoCLT({
      salario: dados?.cltSalario,
      dependentes: dados?.cltDependentes,
      descontos: dados?.cltDescontos,
      beneficios: cltBeneficios
    }, tabelas);
    const pjValor = Number(dados?.pjValor) || 0;
    const impostoPercentual = Math.min(100, Number(dados?.pjImposto) || 0);
    const pjImposto = pjValor * (impostoPercentual / 100);
    const pjCustosSemImposto = (Number(dados?.pjContabilidade) || 0) + (Number(dados?.pjBeneficios) || 0) + (Number(dados?.pjInss) || 0) + (Number(dados?.pjOutros) || 0);
    const pjCustos = pjImposto + pjCustosSemImposto;
    const pjReservas = calcularReservaPJ({ reservaFerias: dados?.pjReservaFerias, reserva13: dados?.pjReserva13 });
    const pjLiquido = Math.max(0, pjValor - pjCustos);
    const pjRealDisponivel = Math.max(0, pjValor - pjCustos - pjReservas);
    const diferencaMensal = pjRealDisponivel - clt.total;
    const diferencaAnual = diferencaMensal * 12;
    const pjNecessario = clt.total + pjCustos + pjReservas;

    return {
      clt,
      pj: {
        bruto: arredondarCentavos(pjValor),
        imposto: arredondarCentavos(pjImposto),
        custos: arredondarCentavos(pjCustos),
        reservas: arredondarCentavos(pjReservas),
        liquido: arredondarCentavos(pjLiquido),
        realDisponivel: arredondarCentavos(pjRealDisponivel)
      },
      diferencaMensal: arredondarCentavos(diferencaMensal),
      diferencaAnual: arredondarCentavos(diferencaAnual),
      pjNecessario: arredondarCentavos(pjNecessario)
    };
  }

  window.CalculeTrabalhadorTabelas = {
    carregarTabelasTrabalhistas,
    calcularINSS,
    calcularBaseIRRF,
    calcularIRRF,
    obterSalarioMinimo,
    obterTabelaSeguroDesemprego,
    calcularSeguroDesemprego,
    calcularParcelasSeguroDesemprego,
    obterTabelaFGTS,
    obterTabelaSaqueAniversario,
    obterFallbackSaqueAniversario,
    diagnosticarProjecaoSaqueAniversario,
    validarProjecaoSaqueAniversario,
    calcularSaqueAniversarioFGTS,
    obterPercentualInsalubridade,
    obterPercentualAdicionalNoturno,
    obterRegraAvisoPrevio,
    obterFallbackAvisoPrevio,
    validarRegraAvisoPrevio,
    calcularAvisoPrevio,
    projetarApresentacaoAvisoPrevio,
    calcularAdicionalNoturno,
    obterPercentuaisInsalubridade,
    calcularInsalubridade,
    obterRegrasHorasExtras,
    calcularHoraExtra,
    resultadosNumericosIguais,
    calcularFGTSMensal,
    calcularMultaFGTS,
    calcularSaldoSalario,
    calcularFeriasProporcionais,
    calcularDecimoTerceiroProporcional,
    calcularRescisao,
    calcularBeneficios,
    calcularCustoCLT,
    calcularReservaPJ,
    calcularComparativoCltPj,
    formatarMoeda,
    arredondarCentavos
  };
})();
