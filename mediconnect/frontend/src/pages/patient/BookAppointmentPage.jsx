import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Filter, Star, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ALL_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

function DoctorCard({ doctor, onSelect, selected }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-md ${selected ? 'border-primary-500 shadow-primary-100 shadow-md' : 'border-gray-100'
        }`}
      onClick={() => onSelect(doctor)}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
          {doctor.users?.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">Dr. {doctor.users?.name}</h3>
              <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {doctor.hospital}{doctor.location ? ` · ${doctor.location}` : ''}
              </p>
            </div>
            {selected && <CheckCircle className="w-5 h-5 text-primary-500 shrink-0 mt-1" />}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doctor.experience} yrs exp</span>
            {doctor.consultation_fee > 0 && (
              <span className="text-primary-600 font-semibold">₹{doctor.consultation_fee}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch booked slots whenever doctor + date are both chosen
  const { data: slotData } = useQuery({
    queryKey: ['slots', selectedDoctor?.user_id, selectedDate],
    queryFn: () =>
      api.get('/appointments/slots', {
        params: { doctorId: selectedDoctor.user_id, date: selectedDate },
      }).then((r) => r.data),
    enabled: !!(selectedDoctor && selectedDate),
  });
  const bookedSlots = slotData?.bookedSlots || [];

  const { data: specsData } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => api.get('/doctors/meta/specializations').then((r) => r.data.specializations),
  });

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', search, specialization],
    queryFn: () => api.get('/doctors', { params: { search, specialization } }).then((r) => r.data.doctors),
  });

  const { mutate: bookAppointment, isPending } = useMutation({
    mutationFn: () => api.post('/appointments', {
      doctorId: selectedDoctor.user_id,
      date: selectedDate,
      time: selectedTime,
      notes,
    }),
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      navigate('/patient');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Booking failed'),
  });

  const minDate = new Date().toISOString().split('T')[0];
  const canBook = selectedDoctor && selectedDate && selectedTime;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
        <p className="text-gray-500 mb-8">Find the right doctor for your needs</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor list */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex gap-3 mb-5 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctor name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
                >
                  <option value="">All Specializations</option>
                  {specsData?.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Doctor cards */}
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : doctorsData?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400">No doctors found. Try a different search.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {doctorsData?.map((doc) => (
                  <DoctorCard
                    key={doc.user_id}
                    doctor={doc}
                    selected={selectedDoctor?.user_id === doc.user_id}
                    onSelect={setSelectedDoctor}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Booking panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Confirm Booking</h2>

              {selectedDoctor ? (
                <div className="bg-primary-50 rounded-xl p-3 mb-4">
                  <p className="font-semibold text-primary-800 text-sm">Dr. {selectedDoctor.users?.name}</p>
                  <p className="text-xs text-primary-600">{selectedDoctor.specialization}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">← Select a doctor first</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SLOTS.map((t) => {
                      const booked = bookedSlots.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => !booked && setSelectedTime(t)}
                          disabled={booked}
                          title={booked ? 'Already booked' : undefined}
                          className={`py-2 text-xs rounded-lg border transition-all ${booked
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                              : selectedTime === t
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-gray-200 hover:border-primary-300 text-gray-600'
                            }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Describe your symptoms briefly…"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
                  />
                </div>

                <button
                  onClick={() => bookAppointment()}
                  disabled={!canBook || isPending}
                  className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
