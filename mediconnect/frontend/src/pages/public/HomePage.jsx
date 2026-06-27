import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, FileText, Shield, Star, ArrowRight, Heart, Stethoscope, Users, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';

const SPECIALIZATIONS = [
  'Cardiologist', 'Dermatologist', 'General Physician', 'Neurologist',
  'Orthopedist', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
  'Gastroenterologist', 'ENT Specialist', 'Ophthalmologist',
];

const TESTIMONIALS = [
  { name: 'Priya Rajan', location: 'Tirunelveli, Tamil Nadu', text: 'Found a specialist in minutes. No more 3-hour bus rides to the city hospital.', rating: 5 },
  { name: 'Ramesh Kumar', location: 'Vizag District, AP', text: 'My prescription is always ready on the app. The PDF download saved me so much time.', rating: 5 },
  { name: 'Anita Devi', location: 'Jharkhand', text: 'The symptom checker helped me understand I needed a cardiologist, not a general doctor.', rating: 5 },
];

const FEATURES = [
  { icon: Calendar, title: 'Book Appointments Online', desc: 'Choose doctor, date, and slot in under 2 minutes.' },
  { icon: FileText, title: 'Digital Prescriptions', desc: 'Receive, store, and download prescriptions as PDF.' },
  { icon: Shield, title: 'Secure Medical Records', desc: 'HIPAA-aligned encryption for all your health data.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ doctors: '200+', patients: '10,000+', appointments: '50,000+' });

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/patient/book?specialization=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-primary-300 blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" /> Rural Health Access Platform
            </span>
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Quality Healthcare,<br />
              <span className="text-primary-500">Wherever You Are</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
              Connect with verified doctors, book appointments, and manage your health records — from any device, in any language, from any corner of the country.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by specialization…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  list="specializations"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 shadow-sm"
                />
                <datalist id="specializations">
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <button type="submit" className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2 justify-center shadow-md shadow-primary-200">
                Find Doctors <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick stats */}
            <div className="flex gap-8 mt-12">
              {[
                { label: 'Verified Doctors', value: stats.doctors },
                { label: 'Patients Served', value: stats.patients },
                { label: 'Appointments', value: stats.appointments },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Designed for patients in underserved regions who need reliable healthcare access</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Symptom Checker CTA */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white">
            <h2 className="font-display text-3xl font-bold mb-3">Not Sure Which Doctor You Need?</h2>
            <p className="text-primary-100 max-w-md">Our AI-powered symptom checker guides you to the right specialist.</p>
          </div>
          <Link
            to="/symptoms"
            className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg"
          >
            <Stethoscope className="w-5 h-5" /> Check Symptoms
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Trusted by Thousands</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — sign up */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Start Your Health Journey</h2>
          <p className="text-gray-500 mb-10">Join as a patient and get access to verified doctors across India.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/signup" className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors">
              Sign Up as Patient
            </Link>
            <Link to="/signup/doctor" className="border-2 border-primary-500 text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
              Join as Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-primary-400" />
            <span className="font-display font-bold text-white text-lg">MediConnect</span>
          </div>
          <p className="text-sm max-w-sm">Bridging the healthcare gap for millions in rural and underserved communities across India.</p>
          <div className="mt-8 pt-8 border-t border-gray-800 text-xs">© 2025 MediConnect. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
