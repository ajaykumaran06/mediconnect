import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X, Loader2, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

/**
 * RescheduleModal — shown when a patient or doctor clicks "Reschedule"
 *
 * Props:
 *   appointment  — the appointment object to reschedule
 *   onClose()    — called to dismiss the modal
 */
export default function RescheduleModal({ appointment, onClose }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const { mutate: reschedule, isPending } = useMutation({
    mutationFn: () =>
      api.put(`/appointments/${appointment.id}/reschedule`, { date, time }),
    onSuccess: () => {
      toast.success('Appointment rescheduled');
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Reschedule failed'),
  });

  const canSubmit = date && time;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Reschedule Appointment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current appointment info */}
        <div className="mx-5 mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 mb-1">Current booking</p>
          <p className="text-sm font-medium text-gray-800">
            {appointment.date} at {appointment.time}
          </p>
          {appointment.doctor?.users?.name && (
            <p className="text-xs text-gray-500 mt-0.5">Dr. {appointment.doctor.users.name}</p>
          )}
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" /> New Date
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" /> New Time Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`py-2 text-xs rounded-lg border transition-all ${
                    time === slot
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 hover:border-primary-300 text-gray-600'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reschedule()}
            disabled={!canSubmit || isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Confirm</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
