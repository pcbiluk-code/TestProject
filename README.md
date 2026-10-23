# Calculadora de Rescisão CLT

Formulário simples (HTML + JavaScript puro) que estima as verbas rescisórias de um contrato CLT.

## Como usar

Abra o arquivo `index.html` no navegador, preencha os campos e clique em **Calcular**.

## O que é calculado

| Verba | Sem justa causa | Pedido de demissão | Acordo (484-A) | Justa causa |
|---|---|---|---|---|
| Saldo de salário | ✅ | ✅ | ✅ | ✅ |
| Aviso prévio indenizado (30 + 3 dias/ano, máx. 90) | ✅ | ➖ desconto se não cumprido | ✅ 50% | ❌ |
| 13º proporcional | ✅ | ✅ | ✅ | ❌ |
| Férias proporcionais + 1/3 | ✅ | ✅ | ✅ | ❌ |
| Férias vencidas + 1/3 | ✅ | ✅ | ✅ | ✅ |
| Multa do FGTS | 40% | ❌ | 20% | ❌ |

Regras adotadas:
- Fração de 15 dias ou mais conta como 1 mês (1/12) para 13º e férias.
- O aviso prévio indenizado projeta o fim do contrato (conta para 13º e férias).
- Se o saldo do FGTS não for informado, é estimado em 8% do salário × meses trabalhados.

> Valores **brutos e estimados**, sem descontos de INSS/IRRF. Não substitui o cálculo oficial.

## Arquivos

- `index.html` — formulário e exibição do resultado
- `rescisao.js` — lógica do cálculo (funciona no navegador e no Node.js)
