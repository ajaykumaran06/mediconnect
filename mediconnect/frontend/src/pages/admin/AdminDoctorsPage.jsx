import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, X, Search, Stethoscope, Loader2, Shield, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDoctorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['admin-doctors', filter],
    queryFn: async () => {
      if (filter === 'pending') {
        return api.get('/admin/doctors/pending').then((r) => r.data.doctors);
      }
      // For approved: fetch all users who are doctors via /admin/users?role=doctor
      const res = await api.get('/admin/users', { params: { role: 'doctor', limit: 100 } });
      return res.data.users || [];
    },
  });

  const { mutate: approve } = useMutation({
    mutationFn: ({ userId, approved }) =>
      api.put(`/admin/doctors/${userId}/approve`, { approved }),
    onMutate: ({ userId }) => setActingId(userId),
    onSuccess: (_, { approved }) => {
      toast.success(approved ? 'Doctor approved!' : 'Doctor rejected');
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: () => toast.error('Action failed'),
    onSettled: () => setActingId(null),
  });

  const filtered = doctors.filter((d) => {
    const name = d.users?.name || d.name || '';
    const email = d.users?.email || d.email || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Doctor Accounts</h1>
            <p className="text-gray-500 mt-1">Approve, review, and manage doctor registrations</p>
          </div>
        </div>

        {/* Tabs + search */}
        <div className="flex gap-3 flex-wrap mb-6">
          {['pending', 'approved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {tab === 'pending' ? <Clock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {tab}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm w-56"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">
              {filter === 'pending' ? 'No pending applications' : 'No approved doctors found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((doc) => {
              const name = doc.users?.name || doc.name;
              const email = doc.users?.email || doc.email;
              const userId = doc.user_id || doc.id;
              const isActing = actingId === userId;

              return (
                <div key={userId} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                        {name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">Dr. {name}</p>
                          {doc.approved && (
                            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{email}</p>
                        {doc.specialization && (
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                            <span className="bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-medium">
                              {doc.specialization}
                            </span>
                            {doc.hospital && <span>🏥 {doc.hospital}</span>}
                            {doc.experience !== undefined && <span>{doc.experience} yrs exp</span>}
                            {doc.license_no && <span>License: {doc.license_no}</span>}
                          </div>
                        )}
                        {doc.created_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Applied: {format(parseISO(doc.created_at), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>

                    {isActing ? (
                      <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                    ) : (
                      <div className="flex gap-2">
                        {!doc.approved && (
                          <button
                            onClick={() => approve({ userId, approved: true })}
                            className="flex items-center gap-1.5 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                        )}
                        {doc.approved && (
                          <button
                            onClick={() => approve({ userId, approved: false })}
                            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" /> Revoke
                          </button>
                        )}
                        {!doc.approved && (
                          <button
                            onClick={() => approve({ userId, approved: false })}
                            className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
