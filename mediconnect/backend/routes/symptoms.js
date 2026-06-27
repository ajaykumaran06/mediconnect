const express = require('express');
const router = express.Router();

/**
 * Symptom → Specialist mapping
 * Extendable knowledge base for rural health guidance
 */
const SYMPTOM_MAP = {
  // Cardiology
  'chest pain': { specialist: 'Cardiologist', urgency: 'high', description: 'Could indicate cardiac issues. Seek immediate care.' },
  'palpitations': { specialist: 'Cardiologist', urgency: 'medium', description: 'Heart rhythm concerns. Schedule a cardiac evaluation.' },
  'shortness of breath': { specialist: 'Cardiologist', urgency: 'high', description: 'May indicate heart or lung problems. See a doctor soon.' },

  // Dermatology
  'skin rash': { specialist: 'Dermatologist', urgency: 'low', description: 'Skin condition assessment recommended.' },
  'acne': { specialist: 'Dermatologist', urgency: 'low', description: 'Dermatologist can recommend appropriate treatment.' },
  'hair loss': { specialist: 'Dermatologist', urgency: 'low', description: 'May have multiple causes. Dermatological evaluation advised.' },
  'itching': { specialist: 'Dermatologist', urgency: 'low', description: 'Allergic or skin condition. Consider dermatologist.' },

  // Neurology
  'headache': { specialist: 'Neurologist', urgency: 'medium', description: 'Persistent headaches warrant neurological evaluation.' },
  'migraine': { specialist: 'Neurologist', urgency: 'medium', description: 'Neurologist can provide targeted migraine management.' },
  'dizziness': { specialist: 'Neurologist', urgency: 'medium', description: 'Could be neurological or inner ear. Evaluation needed.' },
  'numbness': { specialist: 'Neurologist', urgency: 'medium', description: 'Numbness may indicate nerve issues. See a neurologist.' },

  // General/Internal Medicine
  'fever': { specialist: 'General Physician', urgency: 'medium', description: 'High or persistent fever should be evaluated promptly.' },
  'fatigue': { specialist: 'General Physician', urgency: 'low', description: 'Fatigue can have many causes. General check-up recommended.' },
  'nausea': { specialist: 'General Physician', urgency: 'low', description: 'General physician can identify the cause.' },
  'vomiting': { specialist: 'Gastroenterologist', urgency: 'medium', description: 'Persistent vomiting needs evaluation.' },

  // Gastroenterology
  'stomach pain': { specialist: 'Gastroenterologist', urgency: 'medium', description: 'Abdominal pain evaluation by GI specialist.' },
  'diarrhea': { specialist: 'Gastroenterologist', urgency: 'medium', description: 'Persistent diarrhea should be assessed.' },
  'constipation': { specialist: 'Gastroenterologist', urgency: 'low', description: 'Dietary and medical evaluation by GI specialist.' },
  'acid reflux': { specialist: 'Gastroenterologist', urgency: 'low', description: 'GERD management by gastroenterologist.' },

  // Orthopedics
  'joint pain': { specialist: 'Orthopedist', urgency: 'medium', description: 'Joint pain assessment and treatment.' },
  'back pain': { specialist: 'Orthopedist', urgency: 'medium', description: 'Spine and musculoskeletal evaluation.' },
  'fracture': { specialist: 'Orthopedist', urgency: 'high', description: 'Immediate orthopedic care required.' },

  // ENT
  'ear pain': { specialist: 'ENT Specialist', urgency: 'medium', description: 'Ear, nose, and throat specialist recommended.' },
  'sore throat': { specialist: 'ENT Specialist', urgency: 'low', description: 'ENT evaluation for persistent sore throat.' },
  'hearing loss': { specialist: 'ENT Specialist', urgency: 'medium', description: 'Audiological evaluation by ENT specialist.' },

  // Ophthalmology
  'eye pain': { specialist: 'Ophthalmologist', urgency: 'high', description: 'Eye specialist evaluation urgently recommended.' },
  'blurred vision': { specialist: 'Ophthalmologist', urgency: 'medium', description: 'Vision changes require ophthalmological assessment.' },

  // Psychiatry/Psychology
  'anxiety': { specialist: 'Psychiatrist', urgency: 'medium', description: 'Mental health evaluation and therapy options.' },
  'depression': { specialist: 'Psychiatrist', urgency: 'medium', description: 'Professional mental health support is important.' },
  'insomnia': { specialist: 'Psychiatrist', urgency: 'low', description: 'Sleep disorders evaluated by psychiatrist or neurologist.' },
};

/**
 * POST /api/symptoms/check
 * Body: { symptoms: ['fever', 'headache', ...] }
 */
router.post('/check', (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ error: 'Provide an array of symptoms' });
  }

  const results = [];
  const matched = new Set();

  for (const symptom of symptoms) {
    const normalized = symptom.toLowerCase().trim();
    const match = SYMPTOM_MAP[normalized];

    if (match && !matched.has(match.specialist)) {
      matched.add(match.specialist);
      results.push({
        symptom: symptom,
        ...match,
      });
    }
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  if (results.length === 0) {
    return res.json({
      suggestions: [],
      message: 'No specific specialist identified. Please consult a General Physician.',
      defaultSpecialist: 'General Physician',
    });
  }

  res.json({
    suggestions: results,
    primarySuggestion: results[0],
    disclaimer: 'This is an AI-assisted suggestion only. Always consult a qualified medical professional for diagnosis and treatment.',
  });
});

module.exports = router;
