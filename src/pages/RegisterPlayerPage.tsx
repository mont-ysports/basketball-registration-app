// src/pages/RegisterPlayerPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPlayer } from '../lib/firebase/firestore';
import { uploadPlayerPhoto } from '../lib/firebase/storage';
import { getCoachTeams } from '../lib/firebase/admin';
import type { Team } from '../types/admin';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';

export const RegisterPlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);  // ← ADD THIS
  const [loadingTeams, setLoadingTeams] = useState(true);  // ← ADD THIS

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    class: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    position: '',
    teamId: ''  // ← ADD THIS
  });

  const classOptions = [
    { value: 'Freshman', label: 'Freshman' },
    { value: 'Sophomore', label: 'Sophomore' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Senior', label: 'Senior' }
  ];

  const positionOptions = [
    { value: 'Point Guard', label: 'Point Guard' },
    { value: 'Shooting Guard', label: 'Shooting Guard' },
    { value: 'Small Forward', label: 'Small Forward' },
    { value: 'Power Forward', label: 'Power Forward' },
    { value: 'Center', label: 'Center' }
  ];

  // ← ADD THIS: Load coach's teams
  useEffect(() => {
    loadTeams();
  }, [user]);

  const loadTeams = async () => {
    if (!user) return;
    
    setLoadingTeams(true);
    try {
      const coachTeams = await getCoachTeams(user.uid);
      setTeams(coachTeams);
      
      // Auto-select team if coach has only one
      if (coachTeams.length === 1) {
        setFormData(prev => ({ ...prev, teamId: coachTeams[0].teamId! }));
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be under 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Photo must be JPEG, PNG, or WebP');
        return;
      }

      setPhotoFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || 
        !formData.class || !formData.heightFeet || !formData.heightInches || !formData.weight) {
      setError('Please fill in all required fields');
      return false;
    }

    // ← ADD THIS: Validate team selection if coach has teams
    if (teams.length > 0 && !formData.teamId) {
      setError('Please select a team');
      return false;
    }

    const age = calculateAge(formData.dateOfBirth);
    if (age < 5 || age > 25) {
      setError('Player must be between 5 and 25 years old');
      return false;
    }

    const feet = parseInt(formData.heightFeet);
    const inches = parseInt(formData.heightInches);
    if (feet < 3 || feet > 8 || inches < 0 || inches > 11) {
      setError('Invalid height');
      return false;
    }

    const weight = parseInt(formData.weight);
    if (weight < 80 || weight > 400) {
      setError('Weight must be between 80 and 400 lbs');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      const tempPlayerId = Date.now().toString();
      
      let photoURL = '';
      let photoPath = '';

      if (photoFile) {
        const uploadResult = await uploadPlayerPhoto(photoFile, tempPlayerId);
        photoURL = uploadResult.url;
        photoPath = uploadResult.path;
      }

      // ← ADD teamId to player creation
      await createPlayer({
        coachId: user.uid,
        teamId: formData.teamId || undefined,  // ← ADD THIS
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: new Date(formData.dateOfBirth),
          class: formData.class as 'Freshman' | 'Sophomore' | 'Junior' | 'Senior'
        },
        physicalStats: {
          heightFeet: parseInt(formData.heightFeet),
          heightInches: parseInt(formData.heightInches),
          weight: parseInt(formData.weight),
          position: formData.position || undefined
        },
        media: {
          photoURL: photoURL || undefined,
          photoPath: photoPath || undefined
        },
        metadata: {
          registeredAt: new Date(),
          registeredBy: user.uid,
          lastUpdated: new Date(),
          active: true
        }
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register player');
      setLoading(false);
    }
  };

  const calculatedAge = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  // ← ADD THIS: Show loading state while teams load
  if (loadingTeams) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Register New Player</h1>
          <p className="text-gray-600 mt-2">Add a new player to your roster</p>
        </div>

        {/* ← ADD THIS: Team warning if no teams */}
        {teams.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800">No Teams Assigned</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You haven't been assigned to any teams yet. Contact your administrator to get assigned to a team.
                  You can still register players, but they won't be assigned to a specific team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Photo
            </label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-400">📷</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors inline-block"
                >
                  Choose Photo
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Max size: 5MB • Formats: JPEG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* ← ADD THIS: Team Selection */}
          {teams.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Assignment</h3>
              <Select
                label="Select Team"
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                options={teams.map(team => ({
                  value: team.teamId!,
                  label: `${team.name} - ${team.season} (${team.ageGroup})`
                }))}
                required={teams.length > 0}
              />
              {formData.teamId && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Team:</strong> {teams.find(t => t.teamId === formData.teamId)?.name}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Sport: {teams.find(t => t.teamId === formData.teamId)?.sport} • 
                    Season: {teams.find(t => t.teamId === formData.teamId)?.season}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
              <Select
                label="Class"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                options={classOptions}
                required
              />
            </div>

            {calculatedAge !== null && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Calculated Age:</strong> {calculatedAge} years old
                </p>
              </div>
            )}
          </div>

          {/* Physical Stats */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Physical Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    name="heightFeet"
                    value={formData.heightFeet}
                    onChange={handleInputChange}
                    placeholder="Feet (3-8)"
                    min="3"
                    max="8"
                    required
                  />
                  <Input
                    type="number"
                    name="heightInches"
                    value={formData.heightInches}
                    onChange={handleInputChange}
                    placeholder="Inches (0-11)"
                    min="0"
                    max="11"
                    required
                  />
                </div>
              </div>
              <Input
                label="Weight (lbs)"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="80-400"
                min="80"
                max="400"
                required
              />
              <Select
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                options={positionOptions}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Register Player
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};