// src/pages/PlayerDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlayer, deletePlayer, type Player } from '../lib/firebase/firestore';
import { Button } from '../components/common/Button';
import { format } from 'date-fns';

export const PlayerDetailPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPlayer();
  }, [playerId]);

  const loadPlayer = async () => {
    if (!playerId) return;

    setLoading(true);
    try {
      const playerData = await getPlayer(playerId);
      setPlayer(playerData);
    } catch (error) {
      console.error('Error loading player:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!playerId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this player? This action cannot be undone.'
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deletePlayer(playerId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
      setDeleting(false);
    }
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Player Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const age = calculateAge(player.personalInfo.dateOfBirth);
  const height = `${player.physicalStats.heightFeet}'${player.physicalStats.heightInches}"`;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Player Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Photo Header */}
          <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 relative">
            {player.media.photoURL ? (
              <img
                src={player.media.photoURL}
                alt={`${player.personalInfo.firstName} ${player.personalInfo.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-9xl font-bold">
                  {player.personalInfo.firstName[0]}{player.personalInfo.lastName[0]}
                </div>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {player.personalInfo.firstName} {player.personalInfo.lastName}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {player.personalInfo.class}
              {player.physicalStats.position && ` • ${player.physicalStats.position}`}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Age</p>
                <p className="text-2xl font-bold text-blue-600">{age}</p>
                <p className="text-xs text-gray-500">years old</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Height</p>
                <p className="text-2xl font-bold text-green-600">{height}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Weight</p>
                <p className="text-2xl font-bold text-purple-600">{player.physicalStats.weight}</p>
                <p className="text-xs text-gray-500">lbs</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">BMI</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const totalInches = player.physicalStats.heightFeet * 12 + player.physicalStats.heightInches;
                    const bmi = (player.physicalStats.weight / (totalInches * totalInches)) * 703;
                    return bmi.toFixed(1);
                  })()}
                </p>
              </div>
            </div>

            {/* Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium text-gray-800">
                    {format(player.personalInfo.dateOfBirth, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium text-gray-800">{player.personalInfo.class}</span>
                </div>
                {player.physicalStats.position && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium text-gray-800">{player.physicalStats.position}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium text-gray-800">
                    {format(player.metadata.registeredAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-800">
                    {format(player.metadata.lastUpdated, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 mt-6 pt-6 flex gap-4">
              <Button
                onClick={() => navigate(`/players/${playerId}/edit`)}
                className="flex-1"
              >
                Edit Player
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                loading={deleting}
                className="flex-1"
              >
                Delete Player
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};