import { Participant } from '../src/models/participant';
import { DrawShuffler } from '../src/services/draw-shuffler';

const participants: Participant[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com' },
  { id: '4', name: 'Diana', email: 'diana@example.com' }
];

const restrictions = new Map<string, string[]>();
restrictions.set('1', ['2']); // Alice cannot draw Bob

try {
  const results = DrawShuffler.performDraw(participants, restrictions);
  console.log("Sorteio realizado com sucesso:");
  results.forEach(r => {
    const p = participants.find(p => p.id === r.participantId)?.name;
    const f = participants.find(p => p.id === r.drawnFriendId)?.name;
    console.log(`${p} -> ${f}`);
  });
} catch (error) {
  console.error("Erro no sorteio:", error.message);
}
