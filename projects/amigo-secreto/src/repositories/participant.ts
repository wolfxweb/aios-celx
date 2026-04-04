import { Participant } from '../models/participant';

export class ParticipantRepository {
  private participants: Map<string, Participant> = new Map();

  add(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  getById(id: string): Participant | undefined {
    return this.participants.get(id);
  }

  getAll(): Participant[] {
    return Array.from(this.participants.values());
  }

  clear(): void {
    this.participants.clear();
  }
}
