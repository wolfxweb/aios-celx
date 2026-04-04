import { Participant, DrawResult } from '../models/participant';

export class DrawShuffler {
  static performDraw(participants: Participant[], restrictions: Map<string, string[]>): DrawResult[] {
    if (participants.length < 3) {
      throw new Error("Pelo menos 3 participantes são necessários para o sorteio.");
    }

    const shuffled = [...participants];
    let attempts = 0;
    while (attempts < 1000) {
      this.shuffleArray(shuffled);
      const results: DrawResult[] = [];
      let valid = true;

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const drawn = shuffled[(i + 1) % participants.length]; // Simple circular assignment

        // Cannot draw yourself (handled by offset)
        if (participant.id === drawn.id) {
            valid = false;
            break;
        }

        // Check specific restrictions
        const restrictedIds = restrictions.get(participant.id) || [];
        if (restrictedIds.includes(drawn.id)) {
          valid = false;
          break;
        }

        results.push({ participantId: participant.id, drawnFriendId: drawn.id });
      }

      if (valid) return results;
      attempts++;
    }

    throw new Error("Não foi possível realizar o sorteio respeitando as restrições.");
  }

  private static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
