// src/pages/admin/ManageTeamsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '../../lib/firebase/admin';
import type { Team } from '../../types/admin';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ManageTeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sport: 'Basketball',
    season: '',
    ageGroup: ''
  });

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadTeams();
  }, [userProfile]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const teamsData = await getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !formData.name || !formData.season || !formData.ageGroup) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createTeam({
        name: formData.name,
        sport: formData.sport,
        season: formData.season,
        ageGroup: formData.ageGroup,
        coachIds: [],
        createdAt: new Date(),
        createdBy: user.uid,
        active: true
      });

      setShowCreateModal(false);
      setFormData({ name: '', sport: 'Basketball', season: '', ageGroup: '' });
      await loadTeams();
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !formData.name || !formData.season || !formData.ageGroup) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await updateTeam(editingTeam.teamId!, {
        name: formData.name,
        sport: formData.sport,
        season: formData.season,
        ageGroup: formData.ageGroup
      });

      setEditingTeam(null);
      setFormData({ name: '', sport: 'Basketball', season: '', ageGroup: '' });
      await loadTeams();
      alert('Team updated successfully!');
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this team?');
    if (!confirmed) return;

    try {
      await deleteTeam(teamId);
      await loadTeams();
      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      sport: team.sport,
      season: team.season,
      ageGroup: team.ageGroup
    });
  };

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
              <h1 className="text-2xl font-bold text-gray-800">Manage Teams</h1>
              <p className="text-gray-600 mt-1">Create and manage team assignments</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Team
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Teams</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{teams.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Teams</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {teams.filter(t => t.active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Coaches Assigned</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {teams.reduce((sum, t) => sum + t.coachIds.length, 0)}
            </p>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-3 bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No teams yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first team</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Team
              </Button>
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.teamId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.sport}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      team.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {team.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📅</span>
                    <span>{team.season}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👥</span>
                    <span>Age Group: {team.ageGroup}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👨‍💼</span>
                    <span>{team.coachIds.length} Coach(es)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(team)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.teamId!)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create/Edit Team Modal */}
      {(showCreateModal || editingTeam) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>

            <div className="space-y-4">
              <Input
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Eagles"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Basketball">Basketball</option>
                  <option value="Football">Football</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Volleyball">Volleyball</option>
                </select>
              </div>

              <Input
                label="Season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="2024-25"
                required
              />

              <Input
                label="Age Group"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                placeholder="U16"
                required
              />
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                className="flex-1"
              >
                {editingTeam ? 'Update Team' : 'Create Team'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                  setFormData({ name: '', sport: 'Basketball', season: '', ageGroup: '' });
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};