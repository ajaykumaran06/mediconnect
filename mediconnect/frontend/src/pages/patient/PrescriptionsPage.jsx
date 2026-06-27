import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Search, Calendar, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

function MedicineTag({ med }) {
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-3">
      <p className="font-semibold text-primary-800 text-sm">{med.name}</p>
      <p className="text-xs text-primary-600 mt-0.5">Dosage: {med.dosage}</p>
      <p className="text-xs text-gray-500 mt-0.5">{med.instructions}</p>
    </div>
  );
}

function PrescriptionCard({ rx }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const medicines = Array.isArray(rx.medicines) ? rx.medicines : JSON.parse(rx.medicines || '[]');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/prescriptions/download/${rx.id}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${rx.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prescription downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{rx.diagnosis}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Dr. {rx.doctor?.name} · {rx.doctor?.doctors?.[0]?.specialization || rx.doctor?.doctors?.specialization}
              </span>
              {rx.appointment?.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(rx.appointment.date), 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            PDF
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Medicines</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {medicines.map((med, i) => <MedicineTag key={i} med={med} />)}
          </div>
          {rx.notes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Doctor's Notes</p>
              <p className="text-sm text-gray-700">{rx.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrescriptionsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', user?.id],
    queryFn: () => api.get(`/prescriptions/${user.id}`).then((r) => r.data.prescriptions),
    enabled: !!user?.id,
  });

  const filtered = prescriptions.filter((rx) =>
    rx.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    rx.doctor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-500 mt-1">Your complete prescription history</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search diagnosis or doctor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No prescriptions yet</p>
            <p className="text-gray-300 text-sm mt-1">Prescriptions from your doctors will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rx) => (
              <PrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
