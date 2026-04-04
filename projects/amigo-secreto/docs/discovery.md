# Discovery — Amigo Secreto

## Problem
Sorteio de amigo secreto que respeite restrições arbitrárias de forma justa e anónima.

## Hypotheses
- O algoritmo Fisher-Yates com backtracking será suficiente para resolver grafos de restrições comuns.
- Uma base de dados em memória ou arquivo é suficiente para o MVP.

## Constraints
- Pelo menos 3 participantes.
- Participantes não podem tirar-se a si mesmos.
- Restrições específicas de "não pode tirar X" devem ser respeitadas.

## Tech Stack
- CLI ou Web App (Vite/React).
- Persistência simples (file-based ou memory para MVP).

## Benchmarking
Exemplos de algoritmos de sorteio de amigo secreto que evitam deadlocks em grafos cíclicos de restrições.

## Riscos
- Grupos pequenos com muitas restrições podem ser impossíveis de sortear.
- Falta de validação de emails.

