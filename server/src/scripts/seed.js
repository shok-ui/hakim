// Seeds demo data: one admin, ten specialties, eight verified demo doctors and
// one demo patient. Safe to run multiple times - it replaces demo collections.
// Usage: npm run seed
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Specialty } from '../models/Specialty.js';
import { Doctor } from '../models/Doctor.js';
import { logger } from '../utils/logger.js';

const SPECIALTIES = [
  ['Cardiology', 'cardiology', 'Heart and blood vessel care.'],
  ['Dermatology', 'dermatology', 'Skin, hair and nail health.'],
  ['Neurology', 'neurology', 'Brain, spine and nervous system.'],
  ['Pediatrics', 'pediatrics', 'Medical care for children.'],
  ['Orthopedics', 'orthopedics', 'Bones, joints and muscles.'],
  ['Psychiatry', 'psychiatry', 'Mental health and wellbeing.'],
  ['Ophthalmology', 'ophthalmology', 'Eye and vision care.'],
  ['Dentistry', 'dentistry', 'Teeth and oral health.'],
  ['General Medicine', 'general-medicine', 'Primary care and checkups.'],
  ['Gynecology', 'gynecology', "Women's health."]
];

const DOCTORS = [
  {
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@hakim.health',
    specialtySlug: 'cardiology',
    city: 'Boston',
    fee: 120,
    years: 12,
    clinic: '122 Beacon Street, Suite 4, Boston',
    bio: 'Interventional cardiologist focused on preventive heart care, hypertension and arrhythmia management.'
  },
  {
    name: 'Dr. James Okafor',
    email: 'james.okafor@hakim.health',
    specialtySlug: 'neurology',
    city: 'New York',
    fee: 180,
    years: 15,
    clinic: '88 Fifth Avenue, 3rd floor, New York',
    bio: 'Neurologist specializing in headache medicine, epilepsy and movement disorders.'
  },
  {
    name: 'Dr. Elena Petrova',
    email: 'elena.petrova@hakim.health',
    specialtySlug: 'dermatology',
    city: 'Chicago',
    fee: 90,
    years: 8,
    clinic: '401 N Michigan Avenue, Chicago',
    bio: 'Dermatologist treating acne, eczema, psoriasis and offering full skin cancer screenings.'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@hakim.health',
    specialtySlug: 'pediatrics',
    city: 'San Francisco',
    fee: 80,
    years: 10,
    clinic: '925 Pike Street, Suite 2, San Francisco',
    bio: 'Pediatrician caring for newborns through teens: growth checks, vaccinations and acute care.'
  },
  {
    name: 'Dr. Amira Hassan',
    email: 'amira.hassan@hakim.health',
    specialtySlug: 'psychiatry',
    city: 'Austin',
    fee: 140,
    years: 9,
    clinic: '301 Congress Avenue, Austin',
    bio: 'Psychiatrist working with anxiety, depression and burnout, combining therapy with medication management.'
  },
  {
    name: 'Dr. Robert Kim',
    email: 'robert.kim@hakim.health',
    specialtySlug: 'orthopedics',
    city: 'Seattle',
    fee: 150,
    years: 14,
    clinic: '765 Pine Street, Seattle',
    bio: 'Orthopedic surgeon specialized in sports injuries, knee and shoulder arthroscopy.'
  },
  {
    name: 'Dr. Laura Gomez',
    email: 'laura.gomez@hakim.health',
    specialtySlug: 'dentistry',
    city: 'Miami',
    fee: 70,
    years: 6,
    clinic: '2200 Coral Way, Miami',
    bio: 'Dentist focused on preventive care, cosmetic dentistry and painless root canal treatment.'
  },
  {
    name: 'Dr. David Cohen',
    email: 'david.cohen@hakim.health',
    specialtySlug: 'general-medicine',
    city: 'Denver',
    fee: 60,
    years: 5,
    clinic: '1500 Blake Street, Denver',
    bio: 'General practitioner for annual checkups, chronic disease management and same-day sick visits.'
  }
];

async function main() {
  await connectDatabase();

  // Replace demo data so the seed stays idempotent.
  await Promise.all([User.deleteMany({}), Specialty.deleteMany({}), Doctor.deleteMany({})]);

  await Specialty.insertMany(
    SPECIALTIES.map(([name, slug, description]) => ({ name, slug, description }))
  );
  const specialties = await Specialty.find().lean();
  const bySlug = Object.fromEntries(specialties.map((s) => [s.slug, s._id]));

  const admin = new User({ name: 'Platform Admin', email: 'admin@hakim.health', role: 'admin' });
  await admin.setPassword('Admin@12345');
  await admin.save();

  for (const d of DOCTORS) {
    const user = new User({ name: d.name, email: d.email, role: 'doctor' });
    await user.setPassword('Doctor@123');
    await user.save();
    await Doctor.create({
      user: user._id,
      specialty: bySlug[d.specialtySlug],
      city: d.city,
      bio: d.bio,
      clinicAddress: d.clinic,
      experienceYears: d.years,
      consultationFee: d.fee,
      verified: true
    });
  }

  const patient = new User({ name: 'Demo Patient', email: 'patient@hakim.health', role: 'patient' });
  await patient.setPassword('Patient@123');
  await patient.save();

  logger.info('Seed complete. Demo accounts:');
  logger.info('  admin@hakim.health / Admin@12345   (admin)');
  logger.info('  patient@hakim.health / Patient@123 (patient)');
  logger.info('  any doctor email above / Doctor@123 (doctor)');

  await disconnectDatabase();
}

main().catch((err) => {
  logger.error({ err: err.message }, 'Seed failed');
  process.exit(1);
});
