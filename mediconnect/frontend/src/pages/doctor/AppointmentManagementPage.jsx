import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, X, FileText,
  Filter, User, Phone, ChevronRight, Loader2, Search,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Patient Reports drawer per appointment ───────────────────────────────
function PatientReports({ appointmentId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-reports', appointmentId],
    queryFn: () => api.get(`/upload/patient-reports/${appointmentId}`).then((r) => r.data.reports),
  });

  if (isLoading) return <p className="text-xs text-gray-400 mt-2 pl-13">Loading reports…</p>;
  if (!data?.length) return <p className="text-xs text-gray-400 mt-2">No reports uploaded by patient yet.</p>;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Patient Reports</p>
      {data.map((r) => (
        <a
          key={r.id}
          href={r.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip w-3 h-3 shrink-0"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
          <span className="truncate">{r.file_name}</span>
        </a>
      ))}
    </div>
  );
}

const STATUS_OPTS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_STYLE = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  rescheduled: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function AppointmentManagementPage() {
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get('/appointments/doctor').then((r) => r.data.appointments),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.put(`/appointments/${id}/status`, { status }),
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: (_, { status }) => {
      toast.success(`Appointment marked as ${status}`);
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
    onError: () => toast.error('Update failed'),
    onSettled: () => setUpdatingId(null),
  });

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSearch = !searchTerm ||
      a.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Group by date
  const grouped = filtered.reduce((acc, appt) => {
    const key = appt.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500 mt-1">Manage your patient bookings</p>
          </div>
          <Link
            to="/doctor/prescriptions/new"
            className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-600 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" /> New Prescription
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm w-48"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${statusFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => {
            const count = appointments.filter((a) => a.status === s).length;
            const st = STATUS_STYLE[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`${st.bg} ${st.border} border rounded-xl p-3 text-left hover:opacity-80 transition-opacity`}
              >
                <p className={`text-2xl font-bold ${st.text}`}>{count}</p>
                <p className={`text-xs capitalize ${st.text} opacity-80`}>{s}</p>
              </button>
            );
          })}
        </div>

        {/* Appointment list grouped by date */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">
                  {format(parseISO(date), 'EEEE, dd MMMM yyyy')}
                </h3>
                <div className="space-y-3">
                  {grouped[date]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appt) => {
                      const st = STATUS_STYLE[appt.status] || STATUS_STYLE.pending;
                      const isUpdating = updatingId === appt.id;
                      return <AppointmentRow key={appt.id} appt={appt} st={st} isUpdating={isUpdating} updateStatus={updateStatus} />;
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentRow({ appt, st, isUpdating, updateStatus }) {
  const [showReports, setShowReports] = React.useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
            {appt.patient?.name?.[0] || 'P'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {appt.patient?.name}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {appt.time}
              </span>
              <span>Age: {appt.patient?.patients?.[0]?.age || appt.patient?.patients?.age}</span>
              {(appt.patient?.patients?.[0]?.phone || appt.patient?.patients?.phone) && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {(appt.patient?.patients?.[0]?.phone || appt.patient?.patients?.phone)}
                </span>
              )}
            </div>
            {appt.notes && (
              <p className="text-xs text-gray-400 mt-1.5 italic">
                "{appt.notes}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReports(!showReports)}
            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip w-3 h-3 shrink-0"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            Reports
          </button>

          <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${st.bg} ${st.text}`}>
            {appt.status}
          </span>
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
          ) : (
            <>
              {appt.status === 'pending' && (
                <button
                  onClick={() => updateStatus({ id: appt.id, status: 'confirmed' })}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Accept
                </button>
              )}
              {appt.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus({ id: appt.id, status: 'completed' })}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                </button>
              )}
              {appt.status !== 'cancelled' && (
                <button
                  onClick={() => updateStatus({ id: appt.id, status: 'cancelled' })}
                  className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
              {appt.status !== 'cancelled' && (
                <Link
                  to={`/doctor/prescriptions/new?appointmentId=${appt.id}&patientId=${appt.patient_id}`}
                  className="flex items-center gap-1 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Prescribe
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {showReports && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <PatientReports appointmentId={appt.id} />
        </div>
      )}
    </div>
  );
}
