(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var helper = null;
  var governedProjection = null;
  var latestReport = null;
  var runtimeDiagnostics = {
    ruleSource: 'pending',
    staleState: 'UNKNOWN_VERSION',
    loadError: null,
    calculationError: null,
    legacyFallbackActive: false
  };
  var monthWindows = {
    Janeiro:{window:'janeiro, fevereiro e marco'},
    Fevereiro:{window:'fevereiro, marco e abril'},
    Marco:{window:'marco, abril e maio'},
    Abril:{window:'abril, maio e junho'},
    Maio:{window:'maio, junho e julho'},
    Junho:{window:'junho, julho e agosto'},
    Julho:{window:'julho, agosto e setembro'},
    Agosto:{window:'agosto, setembro e outubro'},
    Setembro:{window:'setembro, outubro e novembro'},
    Outubro:{window:'outubro, novembro e dezembro'},
    Novembro:{window:'novembro, dezembro e janeiro do ano seguinte'},
    Dezembro:{window:'dezembro, janeiro e fevereiro do ano seguinte'}
  };

  function money(value) {
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g,function (character) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
    });
  }

  function parseCurrencyInput(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return {status:'EMPTY',value:0};
    var digits = raw.replace(/\D/g,'');
    if (!digits) return {status:'INVALID',value:0};
    var parsed = Number(digits) / 100;
    return {status:parsed > 0 ? 'VALID' : 'ZERO',value:parsed};
  }

  function showError(message) {
    $('form-error').textContent = message;
    $('form-error').hidden = false;
    $('form-error').focus();
  }

  function hideError() {
    $('form-error').hidden = true;
    $('form-error').textContent = '';
  }

  function updateMonthHelp() {
    var month = $('birth-month').value;
    var data = monthWindows[month];
    $('month-help').textContent = data
      ? 'Para nascidos em ' + month + ', a janela estimada de saque e: ' + data.window + '.'
      : 'Selecione o mes de nascimento para ver a janela de saque.';
  }

  function renderRatesTable(projection) {
    helper.validarProjecaoSaqueAniversario(projection);
    $('fgts-rates-body').innerHTML = projection.faixas.map(function (band) {
      return '<tr><td class="px-4 py-3 font-bold text-slate-950">' + escapeHtml(band.rotulo) + '</td><td class="px-4 py-3 text-slate-700">' + escapeHtml(band.percentual) + '%</td><td class="px-4 py-3 text-slate-700">' + escapeHtml(money(band.parcelaAdicional)) + '</td></tr>';
    }).join('');
  }

  async function loadGovernedProjection() {
    helper = window.CalculeTrabalhadorTabelas;
    if (!helper) {
      runtimeDiagnostics.loadError = 'Shared calculator runtime unavailable.';
      throw new Error('RUNTIME_UNAVAILABLE');
    }

    var tables = null;
    if (window.location.protocol !== 'file:') {
      try {
        tables = await helper.carregarTabelasTrabalhistas();
      } catch (error) {
        runtimeDiagnostics.loadError = error.message;
      }
    }

    if (tables) {
      var candidate = helper.obterTabelaSaqueAniversario(tables);
      runtimeDiagnostics.staleState = helper.diagnosticarProjecaoSaqueAniversario(candidate);
      helper.validarProjecaoSaqueAniversario(candidate);
      governedProjection = candidate;
      runtimeDiagnostics.ruleSource = 'governed-aggregate-json';
    } else {
      governedProjection = helper.obterFallbackSaqueAniversario();
      runtimeDiagnostics.staleState = helper.diagnosticarProjecaoSaqueAniversario(governedProjection);
      helper.validarProjecaoSaqueAniversario(governedProjection);
      runtimeDiagnostics.ruleSource = 'governed-derived-fallback';
    }

    renderRatesTable(governedProjection);
    return governedProjection;
  }

  function buildMemory(result) {
    return [
      'Saldo total informado: ' + money(result.saldo) + '.',
      'Faixa selecionada: ' + result.faixa.rotulo + '.',
      'Aliquota da faixa: ' + result.percentual + '%.',
      'Parcela adicional da faixa: ' + money(result.parcelaAdicional) + '.',
      'Calculo: ' + money(result.saldo) + ' x ' + result.percentual + '% + ' + money(result.parcelaAdicional) + ' = ' + money(result.saquePermitido) + '.',
      'Saldo restante estimado: ' + money(result.saldo) + ' - ' + money(result.saquePermitido) + ' = ' + money(result.saldoRestante) + '.',
      'Os resultados monetarios finais sao arredondados para duas casas decimais.'
    ];
  }

  function interpretation(result) {
    return 'Com o saldo informado, sua conta se enquadra na faixa "' + result.faixa.rotulo + '". A estimativa aplica ' + result.percentual + '% ao saldo e soma a parcela adicional de ' + money(result.parcelaAdicional) + '.';
  }

  function scrollResultIntoView() {
    var top = $('result-content').getBoundingClientRect().top + window.scrollY - 160;
    window.scrollTo({top:Math.max(0,top),left:0,behavior:'smooth'});
  }

  function renderResult(result, month) {
    var memory = buildMemory(result);
    var note = interpretation(result);
    $('empty-state').hidden = true;
    $('result-content').hidden = false;
    $('withdrawal').textContent = money(result.saquePermitido);
    $('balance-result').textContent = money(result.saldo);
    $('percentage').textContent = result.percentual + '%';
    $('additional').textContent = money(result.parcelaAdicional);
    $('band-result').textContent = result.faixa.rotulo;
    $('remaining').textContent = money(result.saldoRestante);
    $('interpretation-text').textContent = note;
    $('memory-list').innerHTML = memory.map(function (item,index) { return '<li class="rounded-2xl bg-white p-4"><strong class="text-blue-700">' + (index + 1) + '.</strong> ' + escapeHtml(item) + '</li>'; }).join('');
    var rows = [
      ['Saldo','Valor informado',money(result.saldo)],
      ['Faixa','Enquadramento pelo saldo',result.faixa.rotulo],
      ['Aliquota','Percentual da faixa',result.percentual + '%'],
      ['Parcela adicional','Valor fixo da faixa',money(result.parcelaAdicional)],
      ['Saque estimado','Saldo x aliquota + adicional',money(result.saquePermitido)],
      ['Saldo restante','Saldo menos saque estimado',money(result.saldoRestante)]
    ];
    $('result-table').innerHTML = rows.map(function (row) {
      return '<tr><td class="px-4 py-3 font-bold text-slate-950">' + escapeHtml(row[0]) + '</td><td class="px-4 py-3 text-slate-700">' + escapeHtml(row[1]) + '</td><td class="px-4 py-3 text-slate-700">' + escapeHtml(row[2]) + '</td></tr>';
    }).join('');

    var monthData = monthWindows[month];
    $('month-info').textContent = monthData
      ? 'Janela estimada para nascidos em ' + month + ': ' + monthData.window + '.'
      : 'Estimativa calculada. Selecione o mes de nascimento para ver a janela de saque.';
    if (monthData) {
      $('availability-info').hidden = false;
      $('availability-info').innerHTML = '<strong class="mb-1 block">Disponibilidade para nascidos em ' + escapeHtml(month) + '</strong><span>O saque fica disponivel no mes do aniversario e nos dois meses seguintes, dentro da janela de ' + escapeHtml(monthData.window) + '.</span>';
    } else {
      $('availability-info').hidden = true;
      $('availability-info').innerHTML = '';
    }

    latestReport = {
      calculatedAt:new Date().toLocaleString('pt-BR'),
      month:month || 'Nao informado',
      result:result,
      interpretation:note,
      memory:memory
    };
  }

  function calculateBalance(balance) {
    if (!helper || !governedProjection) throw new Error('PROJECTION_NOT_READY');
    helper.validarProjecaoSaqueAniversario(governedProjection);
    return helper.calcularSaqueAniversarioFGTS(balance,{saqueAniversario:governedProjection});
  }

  function submit(event) {
    if (event) event.preventDefault();
    hideError();
    var parsed = parseCurrencyInput($('balance').value);
    if (parsed.status === 'EMPTY') { showError('Informe o saldo para fazer a simulacao.'); return {ok:false,state:'EMPTY'}; }
    if (parsed.status === 'INVALID') { showError('Digite um valor valido.'); return {ok:false,state:'INVALID'}; }
    if (parsed.status === 'ZERO') { showError('Informe um saldo maior que zero.'); return {ok:false,state:'ZERO'}; }
    try {
      var result = calculateBalance(parsed.value);
      if (!result.faixa) throw new Error('BAND_NOT_FOUND');
      renderResult(result,$('birth-month').value);
      scrollResultIntoView();
      return result;
    } catch (error) {
      runtimeDiagnostics.calculationError = error.message;
      showError('Nao foi possivel realizar o calculo agora. Tente novamente em alguns instantes.');
      return {ok:false,state:'RUNTIME_ERROR'};
    }
  }

  function clearCalculator() {
    $('calculator-form').reset();
    hideError();
    $('empty-state').hidden = false;
    $('result-content').hidden = true;
    $('availability-info').hidden = true;
    $('month-info').textContent = 'Informe o saldo para visualizar os resultados.';
    $('month-help').textContent = 'Selecione o mes de nascimento para ver a janela de saque.';
    latestReport = null;
  }

  function ensureReport() {
    if (latestReport) return true;
    showError('Faca a simulacao antes de usar esta acao.');
    return false;
  }

  function shortSummary(report) {
    return [
      'Saque Aniversario FGTS - Calcule Trabalhador',
      'Saldo informado: ' + money(report.result.saldo),
      'Saque estimado: ' + money(report.result.saquePermitido),
      'Faixa: ' + report.result.faixa.rotulo,
      'Aliquota: ' + report.result.percentual + '%',
      'Parcela adicional: ' + money(report.result.parcelaAdicional),
      'Saldo restante: ' + money(report.result.saldoRestante)
    ].join('\n');
  }

  function buildReportHtml(report, autoPrint) {
    var rows = [
      ['Calculado em',report.calculatedAt],['Saldo informado',money(report.result.saldo)],
      ['Saque estimado',money(report.result.saquePermitido)],['Faixa',report.result.faixa.rotulo],
      ['Aliquota',report.result.percentual + '%'],['Parcela adicional',money(report.result.parcelaAdicional)],
      ['Saldo restante',money(report.result.saldoRestante)],['Mes de nascimento',report.month]
    ];
    var table = rows.map(function (row) { return '<tr><th>' + escapeHtml(row[0]) + '</th><td>' + escapeHtml(row[1]) + '</td></tr>'; }).join('');
    var steps = report.memory.map(function (item,index) { return '<li><strong>' + (index + 1) + '.</strong> ' + escapeHtml(item) + '</li>'; }).join('');
    var printScript = autoPrint ? '<script>window.addEventListener("load",function(){window.focus();window.print();});<\/script>' : '';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatorio do Saque Aniversario FGTS</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#0f172a;font-family:Arial,sans-serif;line-height:1.5}main{width:100%;max-width:180mm;margin:auto;padding:10px}.brand{color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase}h1{font-size:26px}.primary{background:#1d4ed8;color:#fff;border-radius:12px;padding:16px}.primary strong{display:block;font-size:30px;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-top:1px solid #cbd5e1;padding:7px;text-align:left}th{width:43%;color:#475569}ol{font-size:11px}.note{background:#fef3c7;border-radius:10px;padding:10px;font-size:11px}@media(max-width:430px){h1{font-size:22px}.primary strong{font-size:25px}}</style></head><body><main><div class="brand">Calcule Trabalhador</div><h1>Relatorio do Saque Aniversario FGTS</h1><section class="primary"><span>Valor estimado do saque</span><strong>' + escapeHtml(money(report.result.saquePermitido)) + '</strong></section><table><tbody>' + table + '</tbody></table><h2>Interpretacao</h2><p>' + escapeHtml(report.interpretation) + '</p><h2>Memoria de calculo</h2><ol>' + steps + '</ol><p class="note">Simulacao educativa. Confira o saldo e as condicoes diretamente nos canais oficiais do FGTS.</p></main>' + printScript + '</body></html>';
  }

  function openPrint() {
    if (!ensureReport()) return;
    var reportWindow = window.open('','_blank');
    if (!reportWindow) { alert('Nao foi possivel abrir o relatorio.'); return; }
    reportWindow.document.open();
    reportWindow.document.write(buildReportHtml(latestReport,true));
    reportWindow.document.close();
  }

  function ascii(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'-'); }
  function pdfEscape(value) { return ascii(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  function wrap(value,limit) { var words=ascii(value).split(/\s+/),lines=[],line=''; words.forEach(function(word){var next=line?line+' '+word:word;if(next.length>limit&&line){lines.push(line);line=word;}else{line=next;}});if(line)lines.push(line);return lines; }

  function buildPdfBlob(report) {
    var lines=['CALCULE TRABALHADOR','Relatorio do Saque Aniversario FGTS','Calculado em: '+report.calculatedAt,'','Saldo informado: '+money(report.result.saldo),'Saque estimado: '+money(report.result.saquePermitido),'Faixa: '+report.result.faixa.rotulo,'Aliquota: '+report.result.percentual+'%','Parcela adicional: '+money(report.result.parcelaAdicional),'Saldo restante: '+money(report.result.saldoRestante),'','Interpretacao:'];
    wrap(report.interpretation,86).forEach(function(line){lines.push(line);});
    lines.push('','Memoria de calculo:');
    report.memory.forEach(function(item,index){wrap((index+1)+'. '+item,86).forEach(function(line){lines.push(line);});});
    var pages=[];while(lines.length)pages.push(lines.splice(0,46));
    var objects=[],add=function(body){objects.push(body);return objects.length;},catalog=add(''),pagesId=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),pageIds=[];
    pages.forEach(function(page){var body='BT\n/F1 10 Tf\n42 800 Td\n13 TL\n';page.forEach(function(line,index){if(index)body+='T*\n';body+='('+pdfEscape(line)+') Tj\n';});body+='ET';var contentId=add('<< /Length '+body.length+' >>\nstream\n'+body+'\nendstream');pageIds.push(add('<< /Type /Page /Parent '+pagesId+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+font+' 0 R >> >> /Contents '+contentId+' 0 R >>'));});
    objects[catalog-1]='<< /Type /Catalog /Pages '+pagesId+' 0 R >>';objects[pagesId-1]='<< /Type /Pages /Kids ['+pageIds.map(function(id){return id+' 0 R';}).join(' ')+'] /Count '+pageIds.length+' >>';
    var pdf='%PDF-1.4\n',offsets=[0];objects.forEach(function(body,index){offsets.push(pdf.length);pdf+=(index+1)+' 0 obj\n'+body+'\nendobj\n';});var xref=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';offsets.slice(1).forEach(function(offset){pdf+=String(offset).padStart(10,'0')+' 00000 n \n';});pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }

  async function copyResult() {
    if (!ensureReport()) return;
    var text = shortSummary(latestReport);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else { var area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove(); }
      $('btn-copy').textContent='Resumo copiado';
      setTimeout(function(){$('btn-copy').textContent='Copiar resumo';},1800);
    } catch (error) { alert('Nao foi possivel copiar o resultado.'); }
  }

  function downloadPdf() {
    if (!ensureReport()) return;
    var url=URL.createObjectURL(buildPdfBlob(latestReport));
    var link=document.createElement('a');link.href=url;link.download='relatorio-saque-aniversario-fgts.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }

  function testPage() {
    var cases=[500,500.01,1000,1000.01,5000,5000.01,10000,10000.01,15000,15000.01,20000,20000.01,123.45,100000];
    var results=cases.map(function(balance){var result=calculateBalance(balance);return{balance:balance,status:result.faixa&&result.saquePermitido>0?'PASS':'FAIL',result:result};});
    return {passed:results.filter(function(item){return item.status==='PASS';}).length,total:results.length,results:results,diagnostics:runtimeDiagnostics};
  }

  $('balance').addEventListener('input',function(event){var parsed=parseCurrencyInput(event.target.value);if(parsed.status==='VALID')event.target.value=money(parsed.value);});
  $('birth-month').addEventListener('change',updateMonthHelp);
  $('calculator-form').addEventListener('submit',submit);
  $('clear-button').addEventListener('click',clearCalculator);
  $('btn-copy').addEventListener('click',copyResult);
  $('btn-print').addEventListener('click',openPrint);
  $('btn-download').addEventListener('click',downloadPdf);

  window.calculateSaqueAniversarioPage=calculateBalance;
  window.testarCalculadoraSaqueAniversario=testPage;
  window.buildSaqueAniversarioReportHtml=buildReportHtml;
  window.buildSaqueAniversarioPdfBlob=buildPdfBlob;
  window.CalculeTrabalhadorSaqueAniversarioDiagnostics=runtimeDiagnostics;

  loadGovernedProjection().then(function(){
    var visual=['127.0.0.1','localhost'].includes(location.hostname)?new URLSearchParams(location.search).get('visual-test'):'';
    if(visual==='result'||visual==='report'){
      $('balance').value=money(20000.01);$('birth-month').value='Julho';submit();
      if(visual==='result')setTimeout(scrollResultIntoView,0);
      if(visual==='report')setTimeout(function(){document.open();document.write(buildReportHtml(latestReport,false));document.close();},0);
    }
  }).catch(function(error){
    runtimeDiagnostics.loadError=error.message;
    $('fgts-rates-body').innerHTML='<tr><td colspan="3">Nao foi possivel carregar as faixas agora.</td></tr>';
    showError('Nao foi possivel preparar a calculadora agora. Tente novamente em alguns instantes.');
  });
})();
