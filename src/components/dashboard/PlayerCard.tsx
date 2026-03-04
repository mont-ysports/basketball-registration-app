// src/components/dashboard/PlayerCard.tsx
import React from 'react';
import type { Player } from '../../lib/firebase/firestore';
import type { Team } from '../../types/admin';
import { format } from 'date-fns';

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
  teams?: Team[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, teams }) => {
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(player.personalInfo.dateOfBirth);
  const height = `${player.physicalStats.heightFeet}'${player.physicalStats.heightInches}"`;
  const playerTeam = teams?.find(t => t.teamId === player.teamId);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
    >
      {/* Player Photo */}
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
        {player.media.photoURL ? (
          <img
            src={player.media.photoURL}
            alt={`${player.personalInfo.firstName} ${player.personalInfo.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
            {player.personalInfo.firstName[0]}{player.personalInfo.lastName[0]}
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800">
          {player.personalInfo.firstName} {player.personalInfo.lastName}
        </h3>
        
        {/* Team Badge */}
        {playerTeam && (
          <div className="mt-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🏆 {playerTeam.name}
            </span>
          </div>
        )}
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">📚</span>
            <span className="text-sm">{player.personalInfo.class}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">🎂</span>
            <span className="text-sm">{age} years old</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">📏</span>
            <span className="text-sm">{height} • {player.physicalStats.weight} lbs</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Registered: {format(player.metadata.registeredAt, 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
};