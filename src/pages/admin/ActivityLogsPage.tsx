// src/pages/admin/ActivityLogsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRecentLogs } from '../../lib/firebase/admin';
import type { SystemLog } from '../../types/admin';
import { format } from 'date-fns';

export const ActivityLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadLogs();
  }, [userProfile]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const logsData = await getRecentLogs(100);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      team_created: '🏆',
      coach_invited: '✉️',
      coach_activated: '✅',
      coach_deactivated: '❌',
      coach_assigned_to_team: '👥',
      player_registered: '🏀',
      bulk_update_players: '📝',
      bulk_delete_players: '🗑️',
      team_updated: '✏️',
      team_deleted: '🗑️'
    };
    return icons[action] || '📋';
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600 bg-red-50';
    if (action.includes('create') || action.includes('activate')) return 'text-green-600 bg-green-50';
    if (action.includes('update')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'all' || log.targetType === filterType;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
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
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Activity Logs</h1>
          <p className="text-gray-600 mt-1">System activity and audit trail</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Activities</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{logs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Today</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {logs.filter(l => {
                const logDate = new Date(l.performedAt).toDateString();
                return logDate === new Date().toDateString();
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">This Week</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {logs.filter(l => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(l.performedAt) >= weekAgo;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Filtered</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{filteredLogs.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Activities</option>
                <option value="user">User Activities</option>
                <option value="player">Player Activities</option>
                <option value="team">Team Activities</option>
                <option value="system">System Activities</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No activity logs found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.logId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatAction(log.action)}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.performedAt), 'MMM d, yyyy • h:mm a')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        Performed by: <span className="font-medium">{log.performedBy}</span>
                      </p>

                      {/* Details */}
                      {Object.keys(log.details).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                          <div className="space-y-1">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2 text-xs">
                                <span className="text-gray-500">{key}:</span>
                                <span className="text-gray-800 font-medium">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target Badge */}
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.targetType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export Logs */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(logs, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Export Logs
          </button>
        </div>
      </main>
    </div>
  );
};