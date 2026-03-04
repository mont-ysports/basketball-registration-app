// src/pages/admin/AnalyticsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSystemStats, getAllPlayers } from '../../lib/firebase/admin';
import type { SystemStats } from '../../types/admin';
import { Button } from '../../components/common/Button';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAnalytics();
  }, [userProfile]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [systemStats, allPlayers] = await Promise.all([
        getSystemStats(),
        getAllPlayers()
      ]);
      setStats(systemStats);
      setPlayers(allPlayers);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional analytics
  const calculateAgeDistribution = () => {
    const ageGroups: Record<string, number> = {
      '5-12': 0,
      '13-14': 0,
      '15-16': 0,
      '17-18': 0,
      '19+': 0
    };

    players.forEach(player => {
      const birthDate = new Date(player.personalInfo.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      if (age <= 12) ageGroups['5-12']++;
      else if (age <= 14) ageGroups['13-14']++;
      else if (age <= 16) ageGroups['15-16']++;
      else if (age <= 18) ageGroups['17-18']++;
      else ageGroups['19+']++;
    });

    return ageGroups;
  };

  const calculateHeightDistribution = () => {
    const heightGroups: Record<string, number> = {
      'Under 5\'6"': 0,
      '5\'6" - 6\'0"': 0,
      '6\'0" - 6\'6"': 0,
      'Over 6\'6"': 0
    };

    players.forEach(player => {
      const totalInches = player.physicalStats.heightFeet * 12 + player.physicalStats.heightInches;
      
      if (totalInches < 66) heightGroups['Under 5\'6"']++;
      else if (totalInches < 72) heightGroups['5\'6" - 6\'0"']++;
      else if (totalInches < 78) heightGroups['6\'0" - 6\'6"']++;
      else heightGroups['Over 6\'6"']++;
    });

    return heightGroups;
  };

  const calculateWeightDistribution = () => {
    const weightGroups: Record<string, number> = {
      'Under 150 lbs': 0,
      '150-180 lbs': 0,
      '180-210 lbs': 0,
      'Over 210 lbs': 0
    };

    players.forEach(player => {
      const weight = player.physicalStats.weight;
      
      if (weight < 150) weightGroups['Under 150 lbs']++;
      else if (weight < 180) weightGroups['150-180 lbs']++;
      else if (weight < 210) weightGroups['180-210 lbs']++;
      else weightGroups['Over 210 lbs']++;
    });

    return weightGroups;
  };

  const calculateRegistrationTrend = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: 0
      };
    });

    players.forEach(player => {
      const regDate = new Date(player.metadata.registeredAt);
      const dateStr = regDate.toISOString().split('T')[0];
      const day = last30Days.find(d => d.date === dateStr);
      if (day) day.count++;
    });

    return last30Days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ageDistribution = calculateAgeDistribution();
  const heightDistribution = calculateHeightDistribution();
  const weightDistribution = calculateWeightDistribution();
  const registrationTrend = calculateRegistrationTrend();

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
          <h1 className="text-2xl font-bold text-gray-800">System Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed statistics and insights</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Players"
            value={stats?.totalPlayers || 0}
            subtitle={`${stats?.activePlayers || 0} active`}
            trend="+12% from last month"
            color="blue"
          />
          <MetricCard
            title="Total Coaches"
            value={stats?.totalCoaches || 0}
            subtitle={`${stats?.activeCoaches || 0} active`}
            trend="+5% from last month"
            color="green"
          />
          <MetricCard
            title="Teams"
            value={stats?.totalTeams || 0}
            subtitle="Active teams"
            trend="Stable"
            color="purple"
          />
          <MetricCard
            title="This Week"
            value={stats?.recentRegistrations || 0}
            subtitle="New registrations"
            trend="+8% from last week"
            color="orange"
          />
        </div>

        {/* Class Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Players by Class</h2>
          <BarChart data={stats?.playersByClass || {}} color="blue" />
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Age Distribution</h2>
          <BarChart data={ageDistribution} color="green" />
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Height Distribution</h2>
            <BarChart data={heightDistribution} color="purple" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Weight Distribution</h2>
            <BarChart data={weightDistribution} color="orange" />
          </div>
        </div>

        {/* Registration Trend */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Registration Trend (Last 30 Days)
          </h2>
          <LineChart data={registrationTrend} />
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Export Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => alert('Exporting analytics report...')}>
              📊 Export Analytics
            </Button>
            <Button onClick={() => alert('Exporting player data...')} variant="secondary">
              👥 Export Players
            </Button>
            <Button onClick={() => alert('Exporting coach data...')} variant="secondary">
              👨‍💼 Export Coaches
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className={`text-4xl font-bold ${colorClasses[color]} mt-2`}>{value}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      <p className="text-green-600 text-xs mt-2 font-medium">{trend}</p>
    </div>
  );
};

interface BarChartProps {
  data: Record<string, number>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const BarChart: React.FC<BarChartProps> = ({ data, color }) => {
  const maxValue = Math.max(...Object.values(data), 1);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{key}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${colorClasses[color]} transition-all duration-500`}
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

interface LineChartProps {
  data: { date: string; count: number }[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
        <span>{maxValue}</span>
        <span>{Math.floor(maxValue / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-8 relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end justify-between gap-1">
          {data.map((point, index) => {
            const height = (point.count / maxValue) * chartHeight;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer relative group"
                style={{ height: `${height}px`, minHeight: point.count > 0 ? '2px' : '0' }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {point.date}: {point.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-8 mt-2 flex justify-between text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};