import { DrawResult, Participant } from '../models/participant';

export class NotificationService {
  static notify(results: DrawResult[], participants: Participant[]): void {
    console.log("\n=== NOTIFICAÇÕES DO AMIGO SECRETO ===");
    results.forEach(res => {
      const p = participants.find(part => part.id === res.participantId);
      const drawn = participants.find(part => part.id === res.drawnFriendId);
      if (p && drawn) {
        console.log(`Notificando ${p.name} (${p.email}): Tirou ${drawn.name}!`);
      }
    });
    console.log("=====================================\n");
  }
}
