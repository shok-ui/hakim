import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import User from '../models/user.js';
import Doctor from '../models/doctor.js';

// Idempotent development seed. Running it repeatedly updates the same
// documents instead of duplicating them, which makes it safe to use in
// demos, CI pipelines and local onboarding. seedAll() only touches the
// database through the existing mongoose connection; the CLI wrapper at
// the bottom owns connect/disconnect so the same function can also run
// inside the API process in in-memory MongoDB mode.

const ACCOUNT_PASSWORD = 'Hakim#12345';

const MON_FRI = [1, 2, 3, 4, 5];
const MON_SAT = [1, 2, 3, 4, 5, 6];

const DOCTOR_USERS = [
  { name: 'Dr. Sarah Kamali', email: 'sarah.kamali@hakim.health', specialty: 'Cardiology' },
  { name: 'Dr. David Osei', email: 'david.osei@hakim.health', specialty: 'Pediatrics' },
  { name: 'Dr. Leila Farhadi', email: 'leila.farhadi@hakim.health', specialty: 'Dermatology' }
];

const DIRECTORY_DOCTORS = [
  {
    name: 'Dr. Marcus Chen',
    specialty: 'Neurology',
    city: 'Toronto',
    experienceYears: 14,
    fee: 130,
    clinicAddress: '250 Wellington Street, Suite 410',
    education: ['MD, University of Toronto', 'Residency in Neurology, Toronto Western Hospital'],
    bio: 'Neurologist focused on headache disorders, epilepsy and nerve pain. Believes clear explanations are half of the treatment.',
    schedule: { workDays: MON_FRI, startMinute: 570, endMinute: 1110, slotMinutes: 30 }
  },
  {
    name: 'Dr. Amina Yusuf',
    specialty: 'Orthopedics',
    city: 'Dubai',
    experienceYears: 11,
    fee: 110,
    clinicAddress: 'Al Wasl Road, MedCare Clinic, Floor 2',
    education: ["MBBS, King's College London", 'Fellowship in Sports Medicine, Dubai'],
    bio: 'Sports injury and joint care specialist working with amateur runners and professional athletes alike.',
    schedule: { workDays: MON_SAT, startMinute: 540, endMinute: 1020, slotMinutes: 30 }
  },
  {
    name: 'Dr. Ivan Petrov',
    specialty: 'Psychiatry',
    city: 'Berlin',
    experienceYears: 16,
    fee: 95,
    clinicAddress: 'Hauptstrasse 18, Praxis am Park',
    education: ['MD, Charite Universitaetsmedizin Berlin', 'Training in Cognitive Behavioral Therapy'],
    bio: 'Adult psychiatry with a focus on anxiety, depression and sleep disorders. First sessions are longer and unhurried.',
    schedule: { workDays: [2, 3, 4], startMinute: 600, endMinute: 1140, slotMinutes: 45 }
  },
  {
    name: 'Dr. Grace Mensah',
    specialty: 'General Medicine',
    city: 'London',
    experienceYears: 9,
    fee: 60,
    clinicAddress: '45 Harbour Lane, Riverside Practice',
    education: ['MBBS, University of Manchester', 'MRCGP'],
    bio: 'Family physician who handles everyday illness, preventive checkups and long-term condition management.',
    schedule: { workDays: MON_SAT, startMinute: 510, endMinute: 1050, slotMinutes: 20 }
  },
  {
    name: 'Dr. Sofia Rossi',
    specialty: 'Ophthalmology',
    city: 'Milan',
    experienceYears: 12,
    fee: 100,
    clinicAddress: 'Via Torino 32, Studio Oculistico Rossi',
    education: ['MD, University of Milan', 'Fellowship in Retina Surgery'],
    bio: 'Eye specialist covering vision loss, dry eye, diabetes related eye care and routine screening.',
    schedule: { workDays: MON_FRI, startMinute: 540, endMinute: 960, slotMinutes: 30 }
  },
  {
    name: 'Dr. Omar Haddad',
    specialty: 'ENT',
    city: 'Istanbul',
    experienceYears: 10,
    fee: 80,
    clinicAddress: 'Bagdat Caddesi 112, Klinik Haddad',
    education: ['MD, Istanbul University', 'Fellowship in Sinus Surgery'],
    bio: 'Ear, nose and throat surgeon with a special interest in chronic sinusitis and pediatric ENT care.',
    schedule: { workDays: MON_FRI, startMinute: 540, endMinute: 1080, slotMinutes: 30 }
  },
  {
    name: 'Dr. Emily Novak',
    specialty: 'Gynecology',
    city: 'Vienna',
    experienceYears: 15,
    fee: 120,
    clinicAddress: 'Mariahilfer Strasse 77, Praxis Novak',
    education: ['MD, Medical University of Vienna', 'Residency in Obstetrics and Gynecology'],
    bio: 'Gynecologist supporting patients through pregnancy, contraception counselling and hormonal health.',
    schedule: { workDays: [1, 2, 3, 4], startMinute: 570, endMinute: 1080, slotMinutes: 30 }
  },
  {
    name: 'Dr. Hassan Rahimi',
    specialty: 'Endocrinology',
    city: 'Amsterdam',
    experienceYears: 13,
    fee: 105,
    clinicAddress: 'Keizersgracht 210, Zorgpraktijk Centrum',
    education: ['MD, University of Amsterdam', 'Fellowship in Diabetes Care'],
    bio: 'Endocrinologist helping patients manage diabetes, thyroid disorders and metabolic health.',
    schedule: { workDays: MON_FRI, startMinute: 555, endMinute: 1035, slotMinutes: 30 }
  },
  {
    name: 'Dr. Julia Santos',
    specialty: 'Dentistry',
    city: 'Lisbon',
    experienceYears: 8,
    fee: 70,
    clinicAddress: 'Avenida da Liberdade 145, Clinica Sorriso',
    education: ['DDS, University of Lisbon', 'Postgraduate Training in Endodontics'],
    bio: 'Dentist focused on painless root canal treatment, preventive care and honest treatment plans.',
    schedule: { workDays: MON_FRI, startMinute: 540, endMinute: 1140, slotMinutes: 40 }
  }
];

// Exactly two directory-only profiles start unverified so the admin panel
// has items in its verification queue on a fresh database.
const PENDING_DOCTOR_NAMES = ['Dr. Ivan Petrov', 'Dr. Julia Santos'];

const LINKED_DOCTORS = [
  {
    account: DOCTOR_USERS[0],
    directory: {
      name: 'Dr. Sarah Kamali',
      specialty: 'Cardiology',
      city: 'Toronto',
      experienceYears: 18,
      fee: 150,
      clinicAddress: '88 Queen Street East, HeartCare Centre',
      education: ['MD, McGill University', 'Residency in Cardiology, Toronto General Hospital', 'FESC'],
      bio: 'Cardiologist with 18 years of experience in preventive cardiology, arrhythmia care and heart failure follow-up.',
      schedule: { workDays: MON_FRI, startMinute: 540, endMinute: 1020, slotMinutes: 30 }
    }
  },
  {
    account: DOCTOR_USERS[1],
    directory: {
      name: 'Dr. David Osei',
      specialty: 'Pediatrics',
      city: 'London',
      experienceYears: 12,
      fee: 90,
      clinicAddress: '12 Camden High Street, LittleSteps Children Clinic',
      education: ['MBBS, University of Ghana', "Residency in Pediatrics, Guy's and St Thomas'"],
      bio: 'Pediatrician for newborns to teenagers: growth checks, vaccinations and same-day sick visits.',
      schedule: { workDays: MON_SAT, startMinute: 480, endMinute: 960, slotMinutes: 20 }
    }
  },
  {
    account: DOCTOR_USERS[2],
    directory: {
      name: 'Dr. Leila Farhadi',
      specialty: 'Dermatology',
      city: 'Berlin',
      experienceYears: 10,
      fee: 85,
      clinicAddress: 'Prenzlauer Allee 40, HautPraxis Mitte',
      education: ['MD, Humboldt University Berlin', 'Residency in Dermatology, Charite'],
      bio: 'Dermatologist treating acne, eczema, pigmentation and hair loss with evidence-based plans.',
      schedule: { workDays: MON_FRI, startMinute: 600, endMinute: 1140, slotMinutes: 30 }
    }
  }
];

async function upsertUser({ name, email, role }) {
  const passwordHash = await bcrypt.hash(ACCOUNT_PASSWORD, 10);
  return User.findOneAndUpdate(
    { email },
    { name, email, role, passwordHash },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertDoctor(directory, linkedUserId) {
  const { name } = directory;
  // The moderation state is reset on every seed run so the verification
  // queue is always reproducible for demos.
  const verified = PENDING_DOCTOR_NAMES.includes(name) ? false : true;
  return Doctor.findOneAndUpdate(
    { name },
    { ...directory, verified, user: linkedUserId ?? null, isActive: true },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

// Populates the database with demo accounts and the doctor directory.
// Expects an open mongoose connection (see the CLI wrapper below and
// src/index.js for the two supported ways of getting there).
export async function seedAll() {
  const admin = await upsertUser({ name: 'Hakim Admin', email: 'admin@hakim.health', role: 'admin' });
  const patient = await upsertUser({ name: 'Demo Patient', email: 'patient@hakim.health', role: 'patient' });

  let doctorAccounts = 0;
  for (const entry of LINKED_DOCTORS) {
    const account = await upsertUser({ ...entry.account, role: 'doctor' });
    await upsertDoctor(entry.directory, account._id);
    doctorAccounts += 1;
  }

  for (const directory of DIRECTORY_DOCTORS) {
    await upsertDoctor(directory, null);
  }

  logger.info(
    {
      adminId: admin.id,
      patientId: patient.id,
      doctorAccounts,
      doctors: LINKED_DOCTORS.length + DIRECTORY_DOCTORS.length,
      pendingDoctors: PENDING_DOCTOR_NAMES.length
    },
    'seed complete'
  );
}

// CLI wrapper: `node src/seed/seed.js` (also `npm run seed`).
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  connectDb(env.mongoUri)
    .then(seedAll)
    .then(async () => {
      if (mongoose.connection.readyState !== 0) {
        await disconnectDb();
      }
    })
    .catch(async (error) => {
      logger.error({ err: error.message }, 'seed failed');
      if (mongoose.connection.readyState !== 0) {
        await disconnectDb();
      }
      process.exit(1);
    });
}
