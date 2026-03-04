// src/lib/firebase/firestore.ts
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface Player {
  playerId?: string;
  coachId: string;
  teamId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    class: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
  };
  physicalStats: {
    heightFeet: number;
    heightInches: number;
    weight: number;
    position?: string;
  };
  media: {
    photoURL?: string;
    photoPath?: string;
  };
  metadata: {
    registeredAt: Date;
    registeredBy: string;
    lastUpdated: Date;
    active: boolean;
  };
}

// Create new player
export const createPlayer = async (playerData: Omit<Player, 'playerId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'players'), {
      ...playerData,
      metadata: {
        ...playerData.metadata,
        registeredAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      }
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Error creating player: ${error.message}`);
  }
};

// Get player by ID
export const getPlayer = async (playerId: string): Promise<Player | null> => {
  try {
    const docRef = doc(db, 'players', playerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        playerId: docSnap.id,
        ...data,
        personalInfo: {
          ...data.personalInfo,
          dateOfBirth: (data.personalInfo.dateOfBirth as Timestamp).toDate()
        },
        metadata: {
          ...data.metadata,
          registeredAt: (data.metadata.registeredAt as Timestamp).toDate(),
          lastUpdated: (data.metadata.lastUpdated as Timestamp).toDate()
        }
      } as Player;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Error getting player: ${error.message}`);
  }
};

// Get all players for a coach
export const getPlayersByCoach = async (coachId: string): Promise<Player[]> => {
  try {
    const q = query(
      collection(db, 'players'),
      where('coachId', '==', coachId),
      where('metadata.active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const players: Player[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      players.push({
        playerId: doc.id,
        ...data,
        personalInfo: {
          ...data.personalInfo,
          dateOfBirth: (data.personalInfo.dateOfBirth as Timestamp).toDate()
        },
        metadata: {
          ...data.metadata,
          registeredAt: (data.metadata.registeredAt as Timestamp).toDate(),
          lastUpdated: (data.metadata.lastUpdated as Timestamp).toDate()
        }
      } as Player);
    });

    return players;
  } catch (error: any) {
    throw new Error(`Error getting players: ${error.message}`);
  }
};

// Update player
export const updatePlayer = async (
  playerId: string,
  updates: Partial<Player>
): Promise<void> => {
  try {
    const docRef = doc(db, 'players', playerId);
    await updateDoc(docRef, {
      ...updates,
      'metadata.lastUpdated': serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(`Error updating player: ${error.message}`);
  }
};

// Delete player (soft delete)
export const deletePlayer = async (playerId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'players', playerId);
    await updateDoc(docRef, {
      'metadata.active': false,
      'metadata.lastUpdated': serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(`Error deleting player: ${error.message}`);
  }
};