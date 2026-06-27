import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2, FileText, Loader2, Save } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const EMPTY_MEDICINE = { name: '', dosage: '', instructions: '' };

export default function CreatePrescriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || '';
  const patientId = searchParams.get('patientId') || '';

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);

  const addMedicine = () => setMedicines([...medicines, { ...EMPTY_MEDICINE }]);
  const removeMedicine = (i) => setMedicines(medicines.filter((_, idx) => idx !== i));
  const updateMedicine = (i, field, value) => {
    const updated = [...medicines];
    updated[i] = { ...updated[i], [field]: value };
    setMedicines(updated);
  };

  const { mutate: savePrescription, isPending } = useMutation({
    mutationFn: () => api.post('/prescriptions', {
      appointmentId,
      patientId,
      diagnosis,
      medicines,
      notes,
    }),
    onSuccess: () => {
      toast.success('Prescription saved successfully!');
      navigate('/doctor');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save prescription'),
  });

  const isValid = diagnosis.trim() && medicines.every((m) => m.name && m.dosage && m.instructions);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Write Prescription</h1>
            <p className="text-gray-500 text-sm">Fill in the details and save</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis *</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              placeholder="Enter the diagnosis…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
            />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Medicines *</label>
              <button onClick={addMedicine}
                className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:text-primary-700">
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {medicines.map((med, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                  {medicines.length > 1 && (
                    <button onClick={() => removeMedicine(i)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol 500mg"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                        placeholder="e.g., 1 tablet twice daily"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                        placeholder="e.g., Take after meals for 5 days"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Follow-up instructions, dietary advice, rest…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/doctor')}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => savePrescription()}
              disabled={!isValid || isPending}
              className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Prescription</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
