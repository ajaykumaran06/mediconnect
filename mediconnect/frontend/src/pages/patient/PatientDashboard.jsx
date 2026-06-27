import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, FileText, Stethoscope, Clock, CheckCircle, XCircle,
  ArrowRight, Plus, Upload, Loader2, Download, User, ChevronDown, ChevronUp
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-primary-50', text: 'text-primary-700', icon: CheckCircle },
  completed: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
  rescheduled: { label: 'Rescheduled', bg: 'bg-blue-50', text: 'text-blue-700', icon: Calendar },
};

// ─── Mini Prescription card (for dashboard) ────────────────────────────────
function MiniPrescriptionCard({ rx }) {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/prescriptions/download/${rx.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `prescription-${rx.id}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{rx.diagnosis}</p>
          <p className="text-xs text-gray-500">
            Dr. {rx.doctor?.name} · {rx.appointment?.date ? format(parseISO(rx.appointment.date), 'dd MMM yyyy') : ''}
          </p>
        </div>
      </div>
      <button
        onClick={handleDownload} disabled={downloading}
        className="flex items-center gap-1 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50"
      >
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
      </button>
    </div>
  );
}

// ─── Appointment card with upload ─────────────────────────────────────────
function AppointmentCard({ appt, onUpload }) {
  const st = STATUS_STYLE[appt.status] || STATUS_STYLE.pending;
  const Icon = st.icon;
  const canUpload = ['pending', 'confirmed'].includes(appt.status);

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
            {appt.doctor?.name?.[0] || 'D'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Dr. {appt.doctor?.name}</p>
            <p className="text-xs text-gray-500">
              {appt.doctor?.doctors?.[0]?.specialization || appt.doctor?.doctors?.specialization} · {appt.doctor?.doctors?.[0]?.hospital || appt.doctor?.doctors?.hospital}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {format(parseISO(appt.date), 'dd MMM yyyy')} at {appt.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
            <Icon className="w-3 h-3" /> {st.label}
          </span>
          {canUpload && (
            <button
              onClick={() => onUpload(appt)}
              className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────────────────
function UploadModal({ appt, onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('appointmentId', appt.id);
      formData.append('file', file);
      await api.post('/upload/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded successfully!');
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-1">Upload Medical Report</h3>
        <p className="text-sm text-gray-500 mb-5">
          For appointment with <span className="font-medium text-gray-700">Dr. {appt.doctor?.name}</span> on{' '}
          {format(parseISO(appt.date), 'dd MMM yyyy')}
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
        >
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-medium text-primary-600">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Click to select file</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · max 10MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { user } = useAuthStore();
  const [uploadAppt, setUploadAppt] = useState(null);

  const { data: appts, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/appointments/user').then((r) => r.data.appointments),
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['prescriptions', user?.id],
    queryFn: () => api.get(`/prescriptions/${user.id}`).then((r) => r.data.prescriptions),
    enabled: !!user?.id,
  });

  const upcoming = appts?.filter((a) => ['pending', 'confirmed'].includes(a.status)) || [];
  const past = appts?.filter((a) => ['completed', 'cancelled'].includes(a.status)) || [];
  const recentRx = prescriptions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Manage your health journey</p>
          </div>
          <Link to="/patient/book" className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> Book Appointment
          </Link>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Book Appointment', icon: Calendar, to: '/patient/book', color: 'bg-primary-500' },
            { label: 'Prescriptions', icon: FileText, to: '/patient/prescriptions', color: 'bg-blue-500' },
            { label: 'Medical History', icon: Clock, to: '/patient/history', color: 'bg-purple-500' },
            { label: 'Symptom Checker', icon: Stethoscope, to: '/symptoms', color: 'bg-amber-500' },
          ].map(({ label, icon: Icon, to, color }) => (
            <Link key={label} to={to}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-3 group">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{label}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming appointments */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
                <Link to="/patient/book" className="text-sm text-primary-600 hover:underline">Book new</Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming appointments</p>
                  <Link to="/patient/book" className="mt-3 inline-block text-primary-600 text-sm font-medium hover:underline">Book one now →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((a) => (
                    <AppointmentCard key={a.id} appt={a} onUpload={setUploadAppt} />
                  ))}
                </div>
              )}
            </div>

            {/* Past consultations */}
            {past.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">Previous Consultations</h2>
                <div className="space-y-3">
                  {past.slice(0, 3).map((a) => (
                    <AppointmentCard key={a.id} appt={a} onUpload={() => { }} />
                  ))}
                </div>
                {past.length > 3 && (
                  <Link to="/patient/history" className="mt-4 inline-block text-sm text-primary-600 font-medium hover:underline">
                    View all {past.length} past consultations →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Your Stats</h2>
              {[
                { label: 'Total Appointments', value: appts?.length || 0, color: 'text-primary-600' },
                { label: 'Completed', value: past.filter((a) => a.status === 'completed').length, color: 'text-green-600' },
                { label: 'Upcoming', value: upcoming.length, color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Recent Prescriptions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Recent Prescriptions</h2>
                {prescriptions.length > 3 && (
                  <Link to="/patient/prescriptions" className="text-xs text-primary-600 hover:underline">View all</Link>
                )}
              </div>
              {recentRx.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">No prescriptions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRx.map((rx) => <MiniPrescriptionCard key={rx.id} rx={rx} />)}
                  <Link to="/patient/prescriptions" className="block text-center text-xs text-primary-600 font-medium mt-2 hover:underline">
                    All prescriptions →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {uploadAppt && (
        <UploadModal appt={uploadAppt} onClose={() => setUploadAppt(null)} />
      )}
    </div>
  );
}
