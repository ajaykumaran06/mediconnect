import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Stethoscope, Plus, X, AlertTriangle, CheckCircle, Info, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

const URGENCY_CONFIG = {
  high:   { label: 'Urgent', bg: 'bg-red-50',     border: 'border-red-200',   text: 'text-red-700',    icon: AlertTriangle },
  medium: { label: 'Soon',   bg: 'bg-amber-50',   border: 'border-amber-200', text: 'text-amber-700',  icon: Info },
  low:    { label: 'Routine',bg: 'bg-green-50',   border: 'border-green-200', text: 'text-green-700',  icon: CheckCircle },
};

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Skin Rash', 'Stomach Pain',
  'Back Pain', 'Dizziness', 'Fatigue', 'Chest Pain', 'Sore Throat',
  'Joint Pain', 'Anxiety', 'Nausea', 'Eye Pain', 'Ear Pain',
];

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [results, setResults] = useState(null);

  const { mutate: checkSymptoms, isPending } = useMutation({
    mutationFn: (syms) => api.post('/symptoms/check', { symptoms: syms }),
    onSuccess: (res) => setResults(res.data),
    onError: () => setResults(null),
  });

  const addSymptom = (s) => {
    const trimmed = s.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
    }
    setInputVal('');
  };

  const removeSymptom = (s) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSymptom(inputVal);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">Symptom Checker</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Describe your symptoms and we'll guide you to the right specialist. This is informational, not a diagnosis.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Add your symptoms</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a symptom and press Enter…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
            <button
              onClick={() => addSymptom(inputVal)}
              className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Common symptom chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => addSymptom(s)}
                disabled={symptoms.includes(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  symptoms.includes(s)
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Selected symptoms */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {symptoms.map((s) => (
                <span key={s} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm">
                  {s}
                  <button onClick={() => removeSymptom(s)} className="hover:text-primary-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => checkSymptoms(symptoms)}
          disabled={symptoms.length === 0 || isPending}
          className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
        >
          {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking…</> : <><Stethoscope className="w-5 h-5" /> Check Symptoms</>}
        </button>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Recommended Specialists</h2>

            {results.suggestions?.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <p className="text-blue-700 font-medium">General Physician recommended</p>
                <p className="text-blue-600 text-sm mt-1">{results.message}</p>
              </div>
            ) : (
              results.suggestions.map((s, i) => {
                const cfg = URGENCY_CONFIG[s.urgency];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`${cfg.bg} ${cfg.border} border rounded-2xl p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${cfg.text}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                        </div>
                        <h3 className={`font-bold text-lg ${cfg.text}`}>{s.specialist}</h3>
                        <p className="text-sm text-gray-600 mt-1">For: <em>{s.symptom}</em></p>
                        <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                      </div>
                      <Link
                        to={`/patient/book?specialization=${encodeURIComponent(s.specialist)}`}
                        className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-white border ${cfg.border} ${cfg.text} hover:shadow-sm transition-shadow`}
                      >
                        Book <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}

            <p className="text-xs text-gray-400 text-center mt-4 bg-gray-50 rounded-xl p-3">
              ⚠️ {results.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
