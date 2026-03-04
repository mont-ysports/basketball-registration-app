// src/pages/admin/ManageCoachesPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCoaches, updateCoachStatus, assignCoachToTeam, getAllTeams } from '../../lib/firebase/admin';
import type { UserProfile } from '../../lib/firebase/auth';
import type { Team } from '../../types/admin';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ManageCoachesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCoach, setSelectedCoach] = useState<UserProfile | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coachesData, teamsData] = await Promise.all([
        getAllCoaches(),
        getAllTeams()
      ]);
      setCoaches(coachesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (coachId: string, currentStatus: boolean) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this coach?`
    );

    if (!confirmed) return;

    try {
      await updateCoachStatus(coachId, !currentStatus, user.uid);
      await loadData();
    } catch (error) {
      console.error('Error updating coach status:', error);
      alert('Failed to update coach status');
    }
  };

  const handleAssignToTeam = async (teamId: string) => {
    if (!user || !selectedCoach) return;

    try {
      await assignCoachToTeam(selectedCoach.userId, teamId, user.uid);
      setShowAssignModal(false);
      setSelectedCoach(null);
      alert('Coach assigned to team successfully!');
      await loadData();
    } catch (error) {
      console.error('Error assigning coach:', error);
      alert('Failed to assign coach to team');
    }
  };

  // Filter coaches
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && coach.active !== false) ||
      (filterStatus === 'inactive' && coach.active === false);

    return matchesSearch && matchesFilter;
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
              <h1 className="text-2xl font-bold text-gray-800">Manage Coaches</h1>
              <p className="text-gray-600 mt-1">View and manage all coaches in the system</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Coaches</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{coaches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Coaches</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {coaches.filter(c => c.active !== false).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Inactive Coaches</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {coaches.filter(c => c.active === false).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Search Coaches"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Coaches</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coaches Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No coaches found
                  </td>
                </tr>
              ) : (
                filteredCoaches.map((coach) => (
                  <tr key={coach.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {coach.profile.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {coach.profile.name}
                          </div>
                          <div className="text-sm text-gray-500">{coach.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{coach.profile.team}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{coach.profile.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coach.active !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coach.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleStatus(coach.userId, coach.active !== false)}
                        className={`${
                          coach.active !== false
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {coach.active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCoach(coach);
                          setShowAssignModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        Assign Team
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Assign Team Modal */}
      {showAssignModal && selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Assign {selectedCoach.profile.name} to Team
            </h3>
            <div className="space-y-3 mb-6">
              {teams.map((team) => (
                <button
                  key={team.teamId}
                  onClick={() => handleAssignToTeam(team.teamId!)}
                  className="w-full text-left p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-gray-800">{team.name}</div>
                  <div className="text-sm text-gray-600">
                    {team.sport} • {team.season}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedCoach(null);
              }}
              variant="secondary"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};