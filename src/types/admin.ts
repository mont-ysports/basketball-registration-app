// src/types/admin.ts
export interface Team {
  teamId?: string;
  name: string;
  sport: string;
  season: string;
  ageGroup: string;
  coachIds: string[];
  createdAt: Date;
  createdBy: string;
  active: boolean;
}

export interface CoachInvitation {
  invitationId?: string;
  email: string;
  teamId: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
}

export interface SystemLog {
  logId?: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  targetType: 'user' | 'player' | 'team' | 'system';
  targetId?: string;
}

export interface SystemStats {
  totalCoaches: number;
  totalPlayers: number;
  totalTeams: number;
  activeCoaches: number;
  activePlayers: number;
  recentRegistrations: number;
  playersByClass: Record<string, number>;
  playersByTeam: Record<string, number>;
}