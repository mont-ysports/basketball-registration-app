// src/pages/admin/ManagePlayersPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPlayers, bulkUpdatePlayers, bulkDeletePlayers, exportAllPlayersData } from '../../lib/firebase/admin';
import type { Player } from '../../lib/firebase/firestore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ManagePlayersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [filterClass, setFilterClass] = useState<string>('all');

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadPlayers();
  }, [userProfile]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const playersData = await getAllPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayers.size === filteredPlayers.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(filteredPlayers.map(p => p.playerId!)));
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedPlayers.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPlayers.size} player(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await bulkDeletePlayers(Array.from(selectedPlayers), user!.uid);
      setSelectedPlayers(new Set());
      await loadPlayers();
      alert('Players deleted successfully!');
    } catch (error) {
      console.error('Error deleting players:', error);
      alert('Failed to delete players');
    }
  };

  const handleBulkUpdateClass = async () => {
    if (selectedPlayers.size === 0) return;

    const newClass = prompt('Enter new class (Freshman/Sophomore/Junior/Senior):');
    if (!newClass || !['Freshman', 'Sophomore', 'Junior', 'Senior'].includes(newClass)) {
      alert('Invalid class');
      return;
    }

    try {
      await bulkUpdatePlayers(
        Array.from(selectedPlayers),
        { personalInfo: { class: newClass as any } } as any,
        user!.uid
      );
      setSelectedPlayers(new Set());
      await loadPlayers();
      alert('Players updated successfully!');
    } catch (error) {
      console.error('Error updating players:', error);
      alert('Failed to update players');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllPlayersData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `players_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  // Filter players
  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      `${player.personalInfo.firstName} ${player.personalInfo.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesClass = 
      filterClass === 'all' || player.personalInfo.class === filterClass;

    return matchesSearch && matchesClass && player.metadata.active;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
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
              <button
                onClick={() => navigate('/admin')}
                className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
              >
                ← Back to Admin Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Manage Players</h1>
              <p className="text-gray-600 mt-1">Bulk operations and player management</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="secondary">
                📥 Export All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Players</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{players.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Selected</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{selectedPlayers.size}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Filtered</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{filteredPlayers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {players.filter(p => p.metadata.active).length}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPlayers.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-blue-800 font-medium">
                {selectedPlayers.size} player(s) selected
              </p>
              <div className="flex gap-2">
                <Button onClick={handleBulkUpdateClass} variant="primary">
                  Update Class
                </Button>
                <Button onClick={handleBulkDelete} variant="danger">
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Search Players"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Class
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Classes</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Physical Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.playerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.has(player.playerId!)}
                        onChange={() => handleSelectPlayer(player.playerId!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {player.media.photoURL ? (
                          <img
                            src={player.media.photoURL}
                            alt={player.personalInfo.firstName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                            {player.personalInfo.firstName[0]}{player.personalInfo.lastName[0]}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {player.personalInfo.firstName} {player.personalInfo.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {player.personalInfo.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.physicalStats.heightFeet}'{player.physicalStats.heightInches}" • {player.physicalStats.weight} lbs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.metadata.registeredAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};