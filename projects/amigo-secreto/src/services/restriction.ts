import { Restriction } from '../models/participant';

export class RestrictionService {
  private restrictions: Restriction[] = [];

  addRestriction(participantId: string, cannotDrawId: string): void {
    this.restrictions.push({ participantId, cannotDrawId });
  }

  getRestrictions(participantId: string): string[] {
    return this.restrictions
      .filter(r => r.participantId === participantId)
      .map(r => r.cannotDrawId);
  }
}
