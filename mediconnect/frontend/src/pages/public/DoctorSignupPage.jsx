import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const SPECIALIZATIONS = [
  'Cardiologist', 'Dermatologist', 'ENT Specialist', 'Gastroenterologist',
  'General Physician', 'Gynecologist', 'Neurologist', 'Oncologist',
  'Ophthalmologist', 'Orthopedist', 'Pediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Urologist',
];

export default function DoctorSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    specialization: '', hospital: '', location: '',
    experience: '', licenseNumber: '',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup/doctor', {
        ...form,
        experience: Number(form.experience),
      });
      toast.success('Account created! Awaiting admin approval.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Arun Sharma' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'doctor@hospital.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
    { key: 'hospital', label: 'Hospital / Clinic', type: 'text', placeholder: 'AIIMS Jodhpur' },
    { key: 'location', label: 'Location (City / Town)', type: 'text', placeholder: 'e.g. Vellore, Chennai, Delhi' },
    { key: 'experience', label: 'Years of Experience', type: 'number', placeholder: '5' },
    { key: 'licenseNumber', label: 'Medical License Number', type: 'text', placeholder: 'MCI-12345-2020' },
  ];

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-primary-600">
            <Heart className="w-7 h-7 fill-primary-100 text-primary-500" /> MediConnect
          </Link>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Stethoscope className="w-4 h-4 text-primary-500" />
            <p className="text-gray-500 text-sm">Register as a Doctor</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 text-sm text-amber-700">
          <strong>Note:</strong> Doctor accounts require admin approval before you can accept patients. You'll be notified by email once approved.
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type} required
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  min={type === 'number' ? 0 : undefined}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select
                required
                value={form.specialization}
                onChange={set('specialization')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
              >
                <option value="">Select your specialization…</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : 'Submit for Approval'
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
