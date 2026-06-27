import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, FileText, Calendar, Pill,
  User, Clock, ExternalLink,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { format, parseISO } from 'date-fns';

export default function PatientHistoryPage() {
  const { patientId } = useParams();

  const { data: prescriptions = [], isLoading: loadingRx } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: () => api.get(`/prescriptions/${patientId}`).then((r) => r.data.prescriptions),
    enabled: !!patientId,
  });

  const patientName = prescriptions[0]?.patient?.users?.name;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to="/doctor/appointments"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to appointments
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-xl">
            {patientName?.[0] || 'P'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {patientName || 'Patient'}'s History
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record
            </p>
          </div>
        </div>

        {loadingRx ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No prescriptions yet for this patient</p>
          </div>
        ) : (
          <div className="space-y-5">
            {prescriptions.map((rx) => {
              const medicines = JSON.parse(rx.medicines || '[]');
              return (
                <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {rx.appointment?.date
                          ? format(parseISO(rx.appointment.date), 'dd MMMM yyyy')
                          : 'Date unknown'
                        }
                      </span>
                      {rx.appointment?.time && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" /> {rx.appointment.time}
                        </span>
                      )}
                    </div>
                    <a
                      href={`/api/prescriptions/download/${rx.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View PDF
                    </a>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Diagnosis</p>
                      <p className="text-gray-900 font-medium">{rx.diagnosis}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Pill className="w-3 h-3" /> Medicines ({medicines.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {medicines.map((med, i) => (
                          <div key={i} className="bg-primary-50 rounded-xl p-3">
                            <p className="font-semibold text-primary-800 text-sm">{med.name}</p>
                            <p className="text-xs text-primary-600">{med.dosage}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{med.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rx.notes && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-1">Notes</p>
                        <p className="text-sm text-amber-800">{rx.notes}</p>
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
