export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface Restriction {
  participantId: string;
  cannotDrawId: string;
}

export interface DrawResult {
  participantId: string;
  drawnFriendId: string;
}
