import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ─── Doctors ──────────────────────────────────────────────────────
export function useDoctors(params = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => api.get('/doctors', { params }).then((r) => r.data),
  });
}

export function useDoctor(id) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.get(`/doctors/${id}`).then((r) => r.data.doctor),
    enabled: !!id,
  });
}

export function useSpecializations() {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: () => api.get('/doctors/meta/specializations').then((r) => r.data.specializations),
    staleTime: 1000 * 60 * 10, // 10 min cache
  });
}

// ─── Appointments ────────────────────────────────────────────────
export function usePatientAppointments() {
  return useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/appointments/user').then((r) => r.data.appointments),
  });
}

export function useDoctorAppointments() {
  return useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get('/appointments/doctor').then((r) => r.data.appointments),
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/appointments', data),
    onSuccess: () => {
      toast.success('Appointment booked!');
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Booking failed'),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.put(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });
}

// ─── Prescriptions ───────────────────────────────────────────────
export function usePatientPrescriptions(patientId) {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => api.get(`/prescriptions/${patientId}`).then((r) => r.data.prescriptions),
    enabled: !!patientId,
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/prescriptions', data),
    onSuccess: () => {
      toast.success('Prescription saved!');
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Save failed'),
  });
}

// ─── Symptom Checker ─────────────────────────────────────────────
export function useSymptomCheck() {
  return useMutation({
    mutationFn: (symptoms) => api.post('/symptoms/check', { symptoms }).then((r) => r.data),
    onError: () => toast.error('Symptom check failed'),
  });
}

// ─── Medical Records ─────────────────────────────────────────────
export function useMedicalRecords() {
  return useQuery({
    queryKey: ['medical-records'],
    queryFn: () => api.get('/upload/records').then((r) => r.data.records),
  });
}

// ─── Admin ────────────────────────────────────────────────────────
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
  });
}

export function usePendingDoctors() {
  return useQuery({
    queryKey: ['pending-doctors'],
    queryFn: () => api.get('/admin/doctors/pending').then((r) => r.data.doctors),
  });
}

export function useApproveDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, approved }) =>
      api.put(`/admin/doctors/${userId}/approve`, { approved }),
    onSuccess: (_, { approved }) => {
      toast.success(approved ? 'Doctor approved' : 'Doctor rejected');
      qc.invalidateQueries({ queryKey: ['pending-doctors'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
    onError: () => toast.error('Action failed'),
  });
}
