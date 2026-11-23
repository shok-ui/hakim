// Symptom to specialty mapping that powers the "find the right doctor"
// recommendation endpoint. Keys are lowercase everyday symptom phrases and
// values are specialties from the Doctor model enum.

export const SYMPTOM_GUIDE = [
  { symptom: 'chest pain', specialties: ['Cardiology'] },
  { symptom: 'palpitations', specialties: ['Cardiology'] },
  { symptom: 'high blood pressure', specialties: ['Cardiology'] },
  { symptom: 'rash', specialties: ['Dermatology'] },
  { symptom: 'acne', specialties: ['Dermatology'] },
  { symptom: 'skin allergy', specialties: ['Dermatology'] },
  { symptom: 'hair loss', specialties: ['Dermatology'] },
  { symptom: 'fever', specialties: ['General Medicine', 'Pediatrics'] },
  { symptom: 'cough', specialties: ['General Medicine'] },
  { symptom: 'cold and flu', specialties: ['General Medicine'] },
  { symptom: 'annual checkup', specialties: ['General Medicine'] },
  { symptom: 'child illness', specialties: ['Pediatrics'] },
  { symptom: 'vaccination', specialties: ['Pediatrics'] },
  { symptom: 'headache', specialties: ['Neurology', 'General Medicine'] },
  { symptom: 'migraine', specialties: ['Neurology'] },
  { symptom: 'dizziness', specialties: ['Neurology', 'ENT'] },
  { symptom: 'numbness', specialties: ['Neurology'] },
  { symptom: 'back pain', specialties: ['Orthopedics'] },
  { symptom: 'joint pain', specialties: ['Orthopedics'] },
  { symptom: 'knee injury', specialties: ['Orthopedics'] },
  { symptom: 'sports injury', specialties: ['Orthopedics'] },
  { symptom: 'anxiety', specialties: ['Psychiatry'] },
  { symptom: 'depression', specialties: ['Psychiatry'] },
  { symptom: 'sleep problems', specialties: ['Psychiatry', 'Neurology'] },
  { symptom: 'blurred vision', specialties: ['Ophthalmology'] },
  { symptom: 'eye pain', specialties: ['Ophthalmology'] },
  { symptom: 'ear pain', specialties: ['ENT'] },
  { symptom: 'sore throat', specialties: ['ENT', 'General Medicine'] },
  { symptom: 'sinusitis', specialties: ['ENT'] },
  { symptom: 'hearing loss', specialties: ['ENT'] },
  { symptom: 'pregnancy', specialties: ['Gynecology'] },
  { symptom: 'irregular cycle', specialties: ['Gynecology'] },
  { symptom: 'toothache', specialties: ['Dentistry'] },
  { symptom: 'gum bleeding', specialties: ['Dentistry'] },
  { symptom: 'diabetes', specialties: ['Endocrinology'] },
  { symptom: 'thyroid problems', specialties: ['Endocrinology'] },
  { symptom: 'weight gain', specialties: ['Endocrinology'] }
];

// Returns the specialties that best match a free-text symptom query plus the
// matched phrases, so the client can explain the recommendation.
export function matchSpecialties(query) {
  const normalized = String(query ?? '')
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return { matched: [], specialties: [] };
  }

  const matched = [];
  const specialties = new Set();

  for (const entry of SYMPTOM_GUIDE) {
    const phrase = entry.symptom;
    const hit = normalized.includes(phrase) || (phrase.includes(normalized) && normalized.length >= 4);
    if (hit) {
      matched.push(phrase);
      for (const specialty of entry.specialties) specialties.add(specialty);
    }
  }

  // Fall back to general medicine so the user always gets a useful answer.
  if (specialties.size === 0) {
    specialties.add('General Medicine');
  }

  return { matched, specialties: [...specialties] };
}
