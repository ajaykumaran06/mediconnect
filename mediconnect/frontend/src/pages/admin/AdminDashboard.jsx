import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserCheck, Calendar, FileText, CheckCircle, X, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const qc = useQueryClient();

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
  });

  const { data: pendingDoctors = [], isLoading } = useQuery({
    queryKey: ['pending-doctors'],
    queryFn: () => api.get('/admin/doctors/pending').then((r) => r.data.doctors),
  });

  const { mutate: approveDoctor } = useMutation({
    mutationFn: ({ userId, approved }) => api.put(`/admin/doctors/${userId}/approve`, { approved }),
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? 'Doctor approved!' : 'Doctor rejected');
      qc.invalidateQueries({ queryKey: ['pending-doctors'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: () => toast.error('Action failed'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform management and oversight</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Patients', value: analytics?.users?.patients, icon: Users, color: 'bg-blue-100 text-blue-700' },
            { label: 'Total Doctors', value: analytics?.users?.doctors, icon: UserCheck, color: 'bg-primary-100 text-primary-700' },
            { label: 'Appointments', value: analytics?.appointments?.total, icon: Calendar, color: 'bg-purple-100 text-purple-700' },
            { label: 'Prescriptions', value: analytics?.prescriptions?.total, icon: FileText, color: 'bg-amber-100 text-amber-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Pending doctor approvals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Pending Doctor Approvals</h2>
            {pendingDoctors.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingDoctors.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          ) : pendingDoctors.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">All doctors are approved. No pending requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingDoctors.map((doc) => (
                <div key={doc.user_id} className="py-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">Dr. {doc.users?.name}</p>
                    <p className="text-sm text-gray-500">{doc.users?.email}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span>{doc.specialization}</span>
                      <span>·</span>
                      <span>{doc.hospital}</span>
                      <span>·</span>
                      <span>{doc.experience} yrs exp</span>
                      <span>·</span>
                      <span>License: {doc.license_no}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveDoctor({ userId: doc.user_id, approved: true })}
                      className="flex items-center gap-1.5 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => approveDoctor({ userId: doc.user_id, approved: false })}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment breakdown */}
        {analytics?.appointments?.byStatus && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Appointment Status Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(analytics.appointments.byStatus).map(([status, count]) => (
                <div key={status} className="text-center bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
