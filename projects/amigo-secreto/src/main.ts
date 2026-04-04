import { ParticipantRepository } from './repositories/participant';
import { DrawShuffler } from './services/draw-shuffler';
import { NotificationService } from './services/notification';

async function main() {
  const repo = new ParticipantRepository();

  // 1. Cadastrar Participantes
  const participants = [
    { id: '1', name: 'Carlos', email: 'carlos@aios.dev' },
    { id: '2', name: 'Ana', email: 'ana@aios.dev' },
    { id: '3', name: 'Beto', email: 'beto@aios.dev' }
  ];
  participants.forEach(p => repo.add(p));

  // 2. Definir Restrições (Ex: Carlos não pode tirar Ana)
  const restrictions = new Map<string, string[]>();
  restrictions.set('1', ['2']); 

  try {
    console.log("Iniciando sorteio...");
    const results = DrawShuffler.performDraw(repo.getAll(), restrictions);
    
    // 3. Notificar
    NotificationService.notify(results, repo.getAll());
    console.log("Processo concluído com sucesso!");
  } catch (err) {
    console.error("Falha no processo:", err.message);
  }
}

main();
