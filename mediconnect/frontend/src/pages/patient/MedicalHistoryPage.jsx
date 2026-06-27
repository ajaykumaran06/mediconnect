import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock, FileText, Upload, ExternalLink, Calendar,
  User, AlertCircle, Loader2, CheckCircle,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  rescheduled: 'bg-purple-50 text-purple-700',
};

export default function MedicalHistoryPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/appointments/user').then((r) => r.data.appointments),
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['medical-records'],
    queryFn: () => api.get('/upload/records').then((r) => r.data.records),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or PDF files allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/upload/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded successfully');
      qc.invalidateQueries({ queryKey: ['medical-records'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const pastAppts = appointments.filter((a) =>
    ['completed', 'cancelled'].includes(a.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Medical History</h1>
          <p className="text-gray-500 mt-1">Your past consultations and uploaded records</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Past appointments */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" /> Past Consultations
            </h2>

            {loadingAppts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : pastAppts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No past consultations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastAppts.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                          {appt.doctor?.name?.[0] || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            Dr. {appt.doctor?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appt.doctor?.doctors?.[0]?.specialization || appt.doctor?.doctors?.specialization} · {appt.doctor?.doctors?.[0]?.hospital || appt.doctor?.doctors?.hospital}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(appt.date), 'dd MMM yyyy')} at {appt.time}
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 italic">
                              "{appt.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize shrink-0 ${STATUS_COLORS[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Uploaded Reports */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Reports & Documents
            </h2>

            {/* Upload button */}
            <div
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 p-6 text-center cursor-pointer transition-colors mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-primary-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Uploading…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm font-medium text-gray-600">Upload Report</p>
                  <p className="text-xs">JPEG, PNG or PDF · Max 10MB</p>
                </div>
              )}
            </div>

            {/* Records list */}
            {loadingRecords ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {rec.file_name || 'Medical Report'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(rec.uploaded_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <a
                      href={rec.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-primary-500 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
