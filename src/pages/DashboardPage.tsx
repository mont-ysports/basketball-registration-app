// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayersByCoach, type Player } from '../lib/firebase/firestore';
import { logOut } from '../lib/firebase/auth';
import { Button } from '../components/common/Button';
import { StatsCard } from '../components/dashboard/StatsCard';
import { PlayerCard } from '../components/dashboard/PlayerCard';
import { getCoachTeams } from '../lib/firebase/admin';
import type { Team } from '../types/admin';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  

  useEffect(() => {
    loadPlayers();
  }, [user]);

  const loadPlayers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [playerData, teamData] = await Promise.all([
        getPlayersByCoach(user.uid),
        getCoachTeams(user.uid)
      ]);
      setPlayers(playerData);
      setTeams(teamData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Calculate statistics
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const stats = {
    totalPlayers: players.length,
    avgAge: players.length > 0
      ? (players.reduce((sum, p) => sum + calculateAge(p.personalInfo.dateOfBirth), 0) / players.length).toFixed(1)
      : '0',
    avgHeight: players.length > 0
      ? (() => {
          const totalInches = players.reduce((sum, p) => {
            return sum + (p.physicalStats.heightFeet * 12 + p.physicalStats.heightInches);
          }, 0);
          const avgInches = totalInches / players.length;
          const feet = Math.floor(avgInches / 12);
          const inches = Math.round(avgInches % 12);
          return `${feet}'${inches}"`;
        })()
      : '0\'0"',
    avgWeight: players.length > 0
      ? Math.round(players.reduce((sum, p) => sum + p.physicalStats.weight, 0) / players.length)
      : 0
  };

  // Filter players by search term
  const filteredPlayers = players.filter(player => {
    const matchesSearch =
      `${player.personalInfo.firstName} ${player.personalInfo.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
  
  const matchesTeam = 
    selectedTeam === 'all' || player.teamId === selectedTeam;

  return matchesSearch && matchesTeam;
});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🏀 Basketball Registration
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {userProfile?.profile.name || 'Coach'}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Show Admin Dashboard button if user is admin */}
              {userProfile?.role === 'admin' && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="secondary"
                >
                  🔐 Admin Dashboard
                </Button>
              )}
              <Button
                onClick={() => navigate('/register-player')}
                variant="primary"
              >
                + Add Player
              </Button>
              <Button
                onClick={handleLogout}
                variant="secondary"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Players"
            value={stats.totalPlayers}
            icon="👥"
            color="blue"
          />
          <StatsCard
            title="Average Age"
            value={`${stats.avgAge} yrs`}
            icon="📅"
            color="green"
          />
          <StatsCard
            title="Avg Height"
            value={stats.avgHeight}
            icon="📏"
            color="purple"
          />
          <StatsCard
            title="Avg Weight"
            value={`${stats.avgWeight} lbs`}
            icon="⚖️"
            color="orange"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
         <input
           type="text"
           placeholder="Search players..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {/* ← ADD THIS: Team Filter */}
  {teams.length > 0 && (
    <select
      value={selectedTeam}
      onChange={(e) => setSelectedTeam(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    >
      <option value="all">All Teams</option>
      {teams.map(team => (
        <option key={team.teamId} value={team.teamId}>
          {team.name}
        </option>
      ))}
    </select>
  )}
</div>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchTerm ? 'No players found' : 'No players registered yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try a different search term'
                : 'Get started by adding your first player'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/register-player')}>
                Register First Player
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.playerId}
                player={player}
                teams={teams}
                onClick={() => navigate(`/players/${player.playerId}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};