import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  User, Hospital, Clock, FileText, Save, Loader2,
  CheckCircle, Star, DollarSign, Calendar,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'Cardiologist', 'Dermatologist', 'ENT Specialist', 'Gastroenterologist',
  'General Physician', 'Gynecologist', 'Neurologist', 'Oncologist',
  'Ophthalmologist', 'Orthopedist', 'Pediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Urologist',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const { data: doctorData, isLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: () => api.get(`/doctors/${user?.id}`).then((r) => r.data.doctor),
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    name: user?.name || '',
    specialization: '',
    hospital: '',
    experience: '',
    bio: '',
    consultationFee: '',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  });

  // Hydrate form once doctor data loads
  React.useEffect(() => {
    if (doctorData) {
      setForm({
        name: doctorData.users?.name || user?.name || '',
        specialization: doctorData.specialization || '',
        hospital: doctorData.hospital || '',
        experience: String(doctorData.experience || ''),
        bio: doctorData.bio || '',
        consultationFee: String(doctorData.consultation_fee || ''),
        availableDays: doctorData.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });
    }
  }, [doctorData]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: () =>
      api.put('/doctors/profile', {
        specialization: form.specialization,
        hospital: form.hospital,
        experience: Number(form.experience),
        bio: form.bio,
        consultationFee: Number(form.consultationFee),
        availableDays: form.availableDays,
        name: form.name,
      }),
    onSuccess: () => {
      updateUser({ name: form.name });
      toast.success('Profile updated');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const tabs = [
    { id: 'profile',       label: 'Practice Info',    icon: Hospital  },
    { id: 'availability',  label: 'Availability',     icon: Calendar  },
    { id: 'bio',           label: 'Bio & Fees',        icon: FileText  },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Doctor Profile</h1>
          <p className="text-gray-500 mt-1">Keep your profile up to date for patients</p>
        </div>

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">Dr. {user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-medium">
                {doctorData?.specialization || 'Doctor'}
              </span>
              {doctorData?.approved ? (
                <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
                  Pending Approval
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="ml-auto hidden sm:flex gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{doctorData?.experience || 0}</p>
              <p className="text-xs text-gray-400">Yrs Exp.</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {doctorData?.consultation_fee > 0 ? `₹${doctorData.consultation_fee}` : 'Free'}
              </p>
              <p className="text-xs text-gray-400">Consult</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Practice Info */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Practice Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text" value={form.name} onChange={set('name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                placeholder="Dr. Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select
                value={form.specialization} onChange={set('specialization')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
              >
                <option value="">Select specialization…</option>
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Hospital className="w-4 h-4 text-gray-400" /> Hospital / Clinic</span>
              </label>
              <input
                type="text" value={form.hospital} onChange={set('hospital')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                placeholder="Apollo Hospitals, Chennai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Years of Experience</span>
              </label>
              <input
                type="number" min="0" max="60" value={form.experience} onChange={set('experience')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                placeholder="8"
              />
            </div>

            <SaveButton isPending={isPending} saved={saved} onSave={saveProfile} />
          </div>
        )}

        {/* Tab: Availability */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Available Days</h2>
            <p className="text-gray-500 text-sm mb-5">
              Patients can only book appointments on your available days.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {DAYS.map((day) => {
                const active = form.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                    {active && <span className="block text-xs mt-0.5 text-primary-500">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Time Slot Info</p>
              <p className="text-blue-600">
                Patients can book from 9:00 AM – 4:30 PM in 30-minute slots on your available days.
                Slot conflicts are prevented automatically.
              </p>
            </div>

            <div className="mt-5">
              <SaveButton isPending={isPending} saved={saved} onSave={saveProfile} />
            </div>
          </div>
        )}

        {/* Tab: Bio & Fees */}
        {activeTab === 'bio' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Bio & Consultation Fee</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Professional Bio</span>
              </label>
              <textarea
                value={form.bio} onChange={set('bio')} rows={5}
                placeholder="Write a short bio about your practice, qualifications, and areas of expertise…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length} / 500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-gray-400" /> Consultation Fee (₹)</span>
              </label>
              <input
                type="number" min="0" step="50" value={form.consultationFee} onChange={set('consultationFee')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                placeholder="300"
              />
              <p className="text-xs text-gray-400 mt-1">Enter 0 for free consultations</p>
            </div>

            <SaveButton isPending={isPending} saved={saved} onSave={saveProfile} />
          </div>
        )}
      </div>
    </div>
  );
}

function SaveButton({ isPending, saved, onSave }) {
  return (
    <button
      onClick={() => onSave()}
      disabled={isPending}
      className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
      ) : saved ? (
        <><CheckCircle className="w-4 h-4" /> Saved!</>
      ) : (
        <><Save className="w-4 h-4" /> Save Changes</>
      )}
    </button>
  );
}
