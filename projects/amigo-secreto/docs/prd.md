# Product Requirements — Amigo Secreto

## Summary
Sistema para gerir e realizar o sorteio de amigo secreto de forma digital. O sistema permite cadastrar participantes, definir restrições (quem não pode tirar quem) e realizar o sorteio de forma aleatória e anónima, garantindo que ninguém se tire a si próprio.

## Goals
1. Permitir o cadastro simples de participantes (nome e email).
2. Configurar restrições entre participantes para evitar sorteios indesejados.
3. Executar o sorteio de forma automática e justa.
4. Notificar os participantes sobre o resultado do sorteio.

## Functional requirements
- **FR-001**: Cadastrar e listar participantes.
- **FR-002**: Adicionar restrições de exclusão (ex: Particpante A não pode tirar Participante B).
- **FR-003**: Executar algoritmo de sorteio aleatório, evitando auto-sorteio e respeitando restrições.
- **FR-004**: Garantir que cada participante tenha exatamente um par e seja escolhido exatamente por uma pessoa.

## Non-functional requirements
- **Security**: O resultado do sorteio não deve ser visível para outros participantes além do sorteado.
- **Reliability**: O algoritmo deve ser testado exaustivamente para evitar loops infinitos ou falhas nas restrições.
- **Performance**: Capaz de lidar com grupos de até 100 participantes sem atrasos significativos.

## Test Strategy
- **Unit Tests**: Testar exaustivamente o algoritmo de sorteio com diferentes configurações de restrições.
- **Integration Tests**: Validar o fluxo completo desde o cadastro até a geração de resultados.

_Last updated: 2026-04-03._
