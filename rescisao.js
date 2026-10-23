// Cálculo simplificado de rescisão CLT (valores brutos, sem INSS/IRRF).
(function (global) {
  const DIA = 24 * 60 * 60 * 1000;

  function parseData(str) {
    const [a, m, d] = str.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, d));
  }

  function addDias(data, dias) {
    return new Date(data.getTime() + dias * DIA);
  }

  function addMeses(data, meses) {
    const d = new Date(data.getTime());
    const dia = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + meses);
    const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(dia, ultimo));
    return d;
  }

  function diffDias(inicio, fim) {
    return Math.round((fim - inicio) / DIA);
  }

  function anosCompletos(inicio, fim) {
    let anos = 0;
    while (addMeses(inicio, 12 * (anos + 1)) <= fim) anos++;
    return anos;
  }

  // Meses (avos) entre inicio e fim; fração de 15+ dias conta como mês cheio.
  function avosPeriodo(inicio, fim) {
    const fimExcl = addDias(fim, 1);
    let meses = 0;
    while (addMeses(inicio, meses + 1) <= fimExcl) meses++;
    if (diffDias(addMeses(inicio, meses), fimExcl) >= 15) meses++;
    return Math.min(meses, 12);
  }

  // 13º: conta cada mês do calendário com 15+ dias trabalhados no ano da saída.
  function avos13(admissao, fim) {
    let avos = 0;
    const inicioAno = new Date(Date.UTC(fim.getUTCFullYear(), 0, 1));
    for (let m = 0; m <= fim.getUTCMonth(); m++) {
      const iniMes = new Date(Date.UTC(fim.getUTCFullYear(), m, 1));
      const fimMes = new Date(Date.UTC(fim.getUTCFullYear(), m + 1, 0));
      const ini = admissao > iniMes ? admissao : iniMes;
      const f = fim < fimMes ? fim : fimMes;
      if (ini <= f && ini >= inicioAno && diffDias(ini, f) + 1 >= 15) avos++;
    }
    return avos;
  }

  function calcular({ salario, admissao, saida, tipo, aviso, feriasVencidas = 0, saldoFgts = null }) {
    const adm = parseData(admissao);
    const sai = parseData(saida);
    if (sai < adm) throw new Error('A data de saída deve ser depois da admissão.');

    const diario = salario / 30;
    const anos = anosCompletos(adm, sai);
    const diasAviso = Math.min(30 + 3 * anos, 90);
    const linhas = [];

    // 1. Saldo de salário
    const diasMes = Math.min(sai.getUTCDate(), 30);
    linhas.push(['Saldo de salário (' + diasMes + ' dias)', diario * diasMes]);

    // 2. Aviso prévio
    let diasProjecao = 0;
    if (aviso === 'indenizado') {
      if (tipo === 'sem_justa_causa') {
        diasProjecao = diasAviso;
        linhas.push(['Aviso prévio indenizado (' + diasAviso + ' dias)', diario * diasAviso]);
      } else if (tipo === 'acordo') {
        diasProjecao = Math.floor(diasAviso / 2);
        linhas.push(['Aviso prévio indenizado 50% (' + diasProjecao + ' dias)', diario * diasProjecao]);
      } else if (tipo === 'pedido_demissao') {
        linhas.push(['Desconto aviso prévio não cumprido (30 dias)', -salario]);
      }
    }
    const fimProjetado = addDias(sai, diasProjecao);

    // 3. 13º e férias proporcionais (não há na justa causa)
    if (tipo !== 'justa_causa') {
      const a13 = avos13(adm, fimProjetado);
      linhas.push(['13º proporcional (' + a13 + '/12)', (salario / 12) * a13]);

      const inicioAquisitivo = addMeses(adm, 12 * anosCompletos(adm, fimProjetado));
      const aFerias = avosPeriodo(inicioAquisitivo, fimProjetado);
      const ferias = (salario / 12) * aFerias;
      linhas.push(['Férias proporcionais (' + aFerias + '/12)', ferias]);
      linhas.push(['1/3 sobre férias proporcionais', ferias / 3]);
    }

    // 4. Férias vencidas (sempre devidas)
    if (feriasVencidas > 0) {
      const v = salario * feriasVencidas;
      linhas.push(['Férias vencidas (' + feriasVencidas + ' período(s))', v]);
      linhas.push(['1/3 sobre férias vencidas', v / 3]);
    }

    // 5. Multa do FGTS
    const mesesTrabalhados = avosPeriodoTotal(adm, fimProjetado);
    const fgts = saldoFgts != null ? saldoFgts : salario * 0.08 * mesesTrabalhados;
    const multa = { sem_justa_causa: 0.4, acordo: 0.2 }[tipo] || 0;
    if (multa > 0) {
      linhas.push(['Multa FGTS ' + multa * 100 + '%' + (saldoFgts == null ? ' (saldo estimado)' : ''), fgts * multa]);
    }

    const total = linhas.reduce((s, [, v]) => s + v, 0);
    const saque = { sem_justa_causa: '100%', acordo: '80%' }[tipo] || 'não';
    return {
      linhas,
      total,
      info: {
        anosCompletos: anos,
        saldoFgts: fgts,
        saqueFgts: saque,
        seguroDesemprego: tipo === 'sem_justa_causa',
      },
    };
  }

  function avosPeriodoTotal(inicio, fim) {
    let meses = 0;
    while (addMeses(inicio, meses + 1) <= addDias(fim, 1)) meses++;
    return meses;
  }

  const api = { calcular };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Rescisao = api;
})(this);
