// src/pages/AdminDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSystemStats } from '../lib/firebase/admin';
import type { SystemStats } from '../types/admin';
import { Button } from '../components/common/Button';
import { logOut } from '../lib/firebase/auth';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadStats();
  }, [userProfile]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const systemStats = await getSystemStats();
      setStats(systemStats);
    } catch (error) {
      console.error('Error loading stats:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🔐 Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                System-wide management and analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
              >
                Coach View
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Coaches"
            value={stats?.totalCoaches || 0}
            subtitle={`${stats?.activeCoaches || 0} active`}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Players"
            value={stats?.totalPlayers || 0}
            subtitle={`${stats?.activePlayers || 0} active`}
            icon="🏀"
            color="green"
          />
          <StatCard
            title="Total Teams"
            value={stats?.totalTeams || 0}
            subtitle="Active teams"
            icon="🏆"
            color="purple"
          />
          <StatCard
            title="New This Week"
            value={stats?.recentRegistrations || 0}
            subtitle="Recent registrations"
            icon="📈"
            color="orange"
          />
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ManagementCard
            title="Manage Coaches"
            description="View, edit, and manage all coaches"
            icon="👨‍💼"
            onClick={() => navigate('/admin/coaches')}
          />
          <ManagementCard
            title="Manage Players"
            description="Bulk operations and player management"
            icon="🏃"
            onClick={() => navigate('/admin/players')}
          />
          <ManagementCard
            title="Manage Teams"
            description="Create and manage team assignments"
            icon="👕"
            onClick={() => navigate('/admin/teams')}
          />
          <ManagementCard
            title="System Analytics"
            description="View detailed system statistics"
            icon="📊"
            onClick={() => navigate('/admin/analytics')}
          />
          <ManagementCard
            title="Activity Logs"
            description="View system activity and audit logs"
            icon="📋"
            onClick={() => navigate('/admin/logs')}
          />
          <ManagementCard
            title="Invite Coaches"
            description="Send invitations to new coaches"
            icon="✉️"
            onClick={() => navigate('/admin/invitations')}
          />
        </div>
      </main>
    </div>
  );
};

// Helper Components
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className={`${colorClasses[color]} w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ManagementCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

const ManagementCard: React.FC<ManagementCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all text-left hover:scale-105"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </button>
  );
};