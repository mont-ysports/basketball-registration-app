// src/lib/firebase/admin.ts
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { Team, CoachInvitation, SystemLog, SystemStats } from '../../types/admin';
import type { UserProfile } from './auth';
import type { Player } from './firestore';

// ============================================
// TEAM MANAGEMENT
// ============================================

export const createTeam = async (teamData: Omit<Team, 'teamId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      createdAt: serverTimestamp(),
      active: true
    });
    
    await logAdminAction('team_created', teamData.createdBy, 'team', docRef.id, {
      teamName: teamData.name
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Error creating team: ${error.message}`);
  }
};

export const getAllTeams = async (): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    return querySnapshot.docs.map(doc => ({
      teamId: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate()
    })) as Team[];
  } catch (error: any) {
    throw new Error(`Error getting teams: ${error.message}`);
  }
};

export const updateTeam = async (teamId: string, updates: Partial<Team>): Promise<void> => {
  try {
    const docRef = doc(db, 'teams', teamId);
    await updateDoc(docRef, updates);
  } catch (error: any) {
    throw new Error(`Error updating team: ${error.message}`);
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'teams', teamId);
    await updateDoc(docRef, {
      active: false
    });
  } catch (error: any) {
    throw new Error(`Error deleting team: ${error.message}`);
  }
};

// ============================================
// COACH MANAGEMENT
// ============================================

export const getAllCoaches = async (): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'coach')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate()
    })) as UserProfile[];
  } catch (error: any) {
    throw new Error(`Error getting coaches: ${error.message}`);
  }
};

export const updateCoachStatus = async (
  coachId: string,
  active: boolean,
  adminId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', coachId);
    await updateDoc(docRef, { active });
    
    await logAdminAction(
      active ? 'coach_activated' : 'coach_deactivated',
      adminId,
      'user',
      coachId,
      { active }
    );
  } catch (error: any) {
    throw new Error(`Error updating coach status: ${error.message}`);
  }
};

export const assignCoachToTeam = async (
  coachId: string,
  teamId: string,
  adminId: string
): Promise<void> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }
    
    const currentCoaches = teamDoc.data().coachIds || [];
    if (!currentCoaches.includes(coachId)) {
      await updateDoc(teamRef, {
        coachIds: [...currentCoaches, coachId]
      });
      
      await logAdminAction('coach_assigned_to_team', adminId, 'user', coachId, {
        teamId,
        teamName: teamDoc.data().name
      });
    }
  } catch (error: any) {
    throw new Error(`Error assigning coach to team: ${error.message}`);
  }
};

// ============================================
// PLAYER MANAGEMENT (BULK OPERATIONS)
// ============================================

export const getAllPlayers = async (): Promise<Player[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'players'));
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const toDate = (value: any): Date => {
        if (!value) return new Date();
        if (value instanceof Date) return value;
        if (value.toDate && typeof value.toDate === 'function') {
          return value.toDate();
        }
        return new Date();
      };
      
      return {
        playerId: doc.id,
        coachId: data.coachId,
        personalInfo: {
          firstName: data.personalInfo?.firstName || '',
          lastName: data.personalInfo?.lastName || '',
          dateOfBirth: toDate(data.personalInfo?.dateOfBirth),
          class: data.personalInfo?.class || 'Freshman'
        },
        physicalStats: {
          heightFeet: data.physicalStats?.heightFeet || 0,
          heightInches: data.physicalStats?.heightInches || 0,
          weight: data.physicalStats?.weight || 0,
          position: data.physicalStats?.position
        },
        media: {
          photoURL: data.media?.photoURL,
          photoPath: data.media?.photoPath
        },
        metadata: {
          registeredAt: toDate(data.metadata?.registeredAt),
          registeredBy: data.metadata?.registeredBy || '',
          lastUpdated: toDate(data.metadata?.lastUpdated),
          active: data.metadata?.active !== false
        }
      } as Player;
    });
  } catch (error: any) {
    throw new Error(`Error getting all players: ${error.message}`);
  }
};

export const bulkUpdatePlayers = async (
  playerIds: string[],
  updates: Partial<Player>,
  adminId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    playerIds.forEach(playerId => {
      const docRef = doc(db, 'players', playerId);
      batch.update(docRef, {
        ...updates,
        'metadata.lastUpdated': serverTimestamp()
      });
    });
    
    await batch.commit();
    
    await logAdminAction('bulk_update_players', adminId, 'player', '', {
      count: playerIds.length,
      updates
    });
  } catch (error: any) {
    throw new Error(`Error bulk updating players: ${error.message}`);
  }
};

export const bulkDeletePlayers = async (
  playerIds: string[],
  adminId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    playerIds.forEach(playerId => {
      const docRef = doc(db, 'players', playerId);
      batch.update(docRef, {
        'metadata.active': false,
        'metadata.lastUpdated': serverTimestamp()
      });
    });
    
    await batch.commit();
    
    await logAdminAction('bulk_delete_players', adminId, 'player', '', {
      count: playerIds.length
    });
  } catch (error: any) {
    throw new Error(`Error bulk deleting players: ${error.message}`);
  }
};

export const exportAllPlayersData = async (): Promise<Player[]> => {
  return getAllPlayers();
};

// ============================================
// SYSTEM ANALYTICS
// ============================================

export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    // Get all coaches
    const coachesSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'coach'))
    );
    const coaches = coachesSnapshot.docs.map(doc => doc.data());
    
    // Get all players
    const playersSnapshot = await getDocs(collection(db, 'players'));
    const players = playersSnapshot.docs.map(doc => doc.data());
    
    // Get all teams
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    
    // Calculate stats
    const activeCoaches = coaches.filter(c => c.active !== false).length;
    const activePlayers = players.filter(p => p.metadata?.active !== false).length;
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = players.filter(p => {
      const regDate = p.metadata?.registeredAt?.toDate?.() || new Date(0);
      return regDate >= sevenDaysAgo;
    }).length;
    
    // Players by class
    const playersByClass = players.reduce((acc, p) => {
      const playerClass = p.personalInfo?.class || 'Unknown';
      acc[playerClass] = (acc[playerClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Players by team (coach)
    const playersByTeam = players.reduce((acc, p) => {
      const coachId = p.coachId || 'Unassigned';
      acc[coachId] = (acc[coachId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalCoaches: coaches.length,
      totalPlayers: players.length,
      totalTeams: teamsSnapshot.size,
      activeCoaches,
      activePlayers,
      recentRegistrations,
      playersByClass,
      playersByTeam
    };
  } catch (error: any) {
    throw new Error(`Error getting system stats: ${error.message}`);
  }
};

// ============================================
// ACTIVITY LOGS
// ============================================

export const logAdminAction = async (
  action: string,
  performedBy: string,
  targetType: 'user' | 'player' | 'team' | 'system',
  targetId: string,
  details: Record<string, any>
): Promise<void> => {
  try {
    await addDoc(collection(db, 'system_logs'), {
      action,
      performedBy,
      targetType,
      targetId,
      details,
      performedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error logging admin action:', error);
  }
};

export const getRecentLogs = async (limit: number = 50): Promise<SystemLog[]> => {
  try {
    const q = query(
      collection(db, 'system_logs'),
      orderBy('performedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.slice(0, limit).map(doc => ({
      logId: doc.id,
      ...doc.data(),
      performedAt: (doc.data().performedAt as Timestamp).toDate()
    })) as SystemLog[];
  } catch (error: any) {
    throw new Error(`Error getting logs: ${error.message}`);
  }
};

// ============================================
// COACH INVITATIONS
// ============================================

export const inviteCoach = async (
  email: string,
  teamId: string,
  invitedBy: string
): Promise<string> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    const docRef = await addDoc(collection(db, 'invitations'), {
      email,
      teamId,
      invitedBy,
      invitedAt: serverTimestamp(),
      status: 'pending',
      expiresAt
    });
    
    await logAdminAction('coach_invited', invitedBy, 'system', '', {
      email,
      teamId
    });
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Error inviting coach: ${error.message}`);
  }
};

export const getPendingInvitations = async (): Promise<CoachInvitation[]> => {
  try {
    const q = query(
      collection(db, 'invitations'),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      invitationId: doc.id,
      ...doc.data(),
      invitedAt: (doc.data().invitedAt as Timestamp).toDate(),
      expiresAt: (doc.data().expiresAt as Timestamp).toDate()
    })) as CoachInvitation[];
  } catch (error: any) {
    throw new Error(`Error getting invitations: ${error.message}`);
  }
};

// Get teams assigned to a specific coach
export const getCoachTeams = async (coachId: string): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    const teams = querySnapshot.docs
      .map(doc => ({
        teamId: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate()
      }) as Team)
      .filter(team => team.coachIds.includes(coachId) && team.active);
    
    return teams;
  } catch (error: any) {
    throw new Error(`Error getting coach teams: ${error.message}`);
  }
};