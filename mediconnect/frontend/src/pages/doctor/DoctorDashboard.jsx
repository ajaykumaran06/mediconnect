import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, CheckCircle, Users, FileText, ArrowRight,
  Loader2, X, Paperclip, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { format, parseISO, isToday } from 'date-fns';
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
          <Paperclip className="w-3 h-3 shrink-0" />
          <span className="truncate">{r.file_name}</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
        </a>
      ))}
    </div>
  );
}

// ─── Queue appointment row ─────────────────────────────────────────────────
function QueueRow({ appt, idx, onUpdateStatus }) {
  const [showReports, setShowReports] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {idx + 1}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{appt.patient?.name}</p>
            <p className="text-xs text-gray-500">
              {appt.time} · Age: {appt.patient?.patients?.[0]?.age || appt.patient?.patients?.age} · {appt.patient?.patients?.[0]?.phone || appt.patient?.patients?.phone}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setShowReports(!showReports)}
            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
            title="View patient reports"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Reports
            {showReports ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onUpdateStatus(appt.id, 'completed')}
            className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Done
          </button>
          <Link
            to={`/doctor/prescriptions/new?appointmentId=${appt.id}&patientId=${appt.patient_id}`}
            className="flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Prescribe
          </Link>
          <button
            onClick={() => onUpdateStatus(appt.id, 'cancelled')}
            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {appt.notes && (
        <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">
          Note: {appt.notes}
        </p>
      )}

      {showReports && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <PatientReports appointmentId={appt.id} />
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get('/appointments/doctor').then((r) => r.data.appointments),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.put(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
    onError: () => toast.error('Update failed'),
  });

  const todayAppts = appointments.filter((a) => a.date && isToday(parseISO(a.date)));
  const pending = appointments.filter((a) => a.status === 'pending');
  const completed = appointments.filter((a) => a.status === 'completed');
  const queue = todayAppts.filter((a) => ['pending', 'confirmed'].includes(a.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Dr. {user?.name?.split(' ')[0]}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Appointments", value: todayAppts.length, icon: Calendar, color: 'bg-primary-100 text-primary-700' },
            { label: 'Pending', value: pending.length, icon: Clock, color: 'bg-amber-100 text-amber-700' },
            { label: 'Patient Queue', value: queue.length, icon: Users, color: 'bg-blue-100 text-blue-700' },
            { label: 'Completed Total', value: completed.length, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Today's Patient Queue</h2>
              <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                All appointments <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No patients queued for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((appt, idx) => (
                  <QueueRow
                    key={appt.id}
                    appt={appt}
                    idx={idx}
                    onUpdateStatus={(id, status) => updateStatus({ id, status })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            {[
              { label: 'Manage All Appointments', to: '/doctor/appointments', icon: Calendar },
              { label: 'Write Prescription', to: '/doctor/prescriptions/new', icon: FileText },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to}
                className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm group transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
              </Link>
            ))}

            {pending.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-amber-700 font-semibold text-sm">{pending.length} Pending</p>
                <p className="text-amber-600 text-xs mt-1">Appointments awaiting your confirmation</p>
                <Link to="/doctor/appointments?status=pending" className="text-amber-700 text-xs font-medium hover:underline mt-2 inline-block">
                  Review →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
