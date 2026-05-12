import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.claim.deleteMany({})
  await prisma.patient.deleteMany({})

  // Create Patient 1
  const patient1 = await prisma.patient.create({
    data: {
      cardNumber: 'AMS-2026-001',
      name: 'Ahmed Mohammed Al-Mansoori',
      birthDate: '1985-03-15',
      sex: 'M',
      policyNo: 'POL-2024-5401',
    },
  })

  // Create claims for Patient 1
  await prisma.claim.createMany({
    data: [
      {
        patientId: patient1.id,
        date: '2026-05-10',
        provider: 'Dr. Fatima Al-Mazrouei',
        serviceDate: '2026-05-08',
        symptoms: 'Persistent headache and dizziness for 3 days',
        preExistingCondition: true,
        chronicMedications: true,
        familyHistory: false,
        additionalNotes: 'History of hypertension, currently on medication',
        clinicalFindings: 'BP elevated at 145/92, no fever, normal neuro exam',
        cause: 'Physical Illness',
        assessmentAcute: true,
        assessmentChronic: false,
        assessmentConfirmed: false,
        assessmentSuspected: false,
        comments: 'Likely hypertensive headache. Recommended rest and monitoring.',
        consultation: true,
        laboratory: true,
        radiology: false,
        pharmacy: true,
        preAuthorizationRequired: false,
        proposedTreatment: 'Consultation with neurologist, CBC and metabolic panel',
        estimatedCost: '750 AED',
        treatingPhysicianName: 'Dr. Fatima Al-Mazrouei',
        telFax: '+971-4-XXX-XXXX',
        approvedTariff: true,
        approvalCode: 'AUTO-001-2026',
      },
      {
        patientId: patient1.id,
        date: '2026-04-15',
        provider: 'Dr. Hassan Al-Suwaidi',
        serviceDate: '2026-04-12',
        symptoms: 'Back pain after heavy lifting at work',
        preExistingCondition: false,
        chronicMedications: false,
        familyHistory: false,
        additionalNotes: 'Incident occurred while moving boxes',
        clinicalFindings: 'Lower back tenderness, limited mobility, no neurological deficit',
        cause: 'Work Related',
        assessmentAcute: true,
        assessmentChronic: false,
        assessmentConfirmed: false,
        assessmentSuspected: false,
        comments: 'Muscle strain. Physical therapy recommended.',
        physiotherapy: true,
        pharmacy: true,
        preAuthorizationRequired: true,
        preAuthorizationDetails: 'Need approval for 10 sessions of physiotherapy',
        proposedTreatment: 'Physical therapy sessions (10x), pain management',
        estimatedCost: '2500 AED',
        treatingPhysicianName: 'Dr. Hassan Al-Suwaidi',
        telFax: '+971-4-XXX-XXXX',
        approvedTariff: true,
        approvalCode: 'AUTO-002-2026',
      },
    ],
  })

  // Create Patient 2
  const patient2 = await prisma.patient.create({
    data: {
      cardNumber: 'AMS-2026-002',
      name: 'Layla Rashid Al-Ketbi',
      birthDate: '1992-07-22',
      sex: 'F',
      policyNo: 'POL-2024-5402',
    },
  })

  // Create claims for Patient 2
  await prisma.claim.createMany({
    data: [
      {
        patientId: patient2.id,
        date: '2026-05-09',
        provider: 'Dr. Maryam Al-Mansouri',
        serviceDate: '2026-05-08',
        symptoms: 'Severe dental pain in upper right molar',
        preExistingCondition: false,
        chronicMedications: false,
        familyHistory: true,
        additionalNotes: 'Family history of dental issues',
        clinicalFindings: 'Upper right molar with visible cavity, swelling of gum',
        cause: 'Dental',
        assessmentAcute: true,
        assessmentChronic: false,
        assessmentConfirmed: false,
        assessmentSuspected: false,
        comments: 'Requires immediate dental intervention.',
        consultation: true,
        pharmacy: true,
        preAuthorizationRequired: false,
        proposedTreatment: 'Dental extraction and antibiotics',
        estimatedCost: '1200 AED',
        treatingPhysicianName: 'Dr. Maryam Al-Mansouri',
        telFax: '+971-4-XXX-XXXX',
        approvedTariff: true,
        approvalCode: 'AUTO-003-2026',
      },
      {
        patientId: patient2.id,
        date: '2026-03-20',
        provider: 'Dr. Sara Al-Qasimi',
        serviceDate: '2026-03-18',
        symptoms: 'Routine maternity check-up at 24 weeks',
        preExistingCondition: false,
        chronicMedications: false,
        familyHistory: false,
        additionalNotes: 'Second trimester routine visit. All normal.',
        clinicalFindings: 'Ultrasound normal, fetal heart rate 155 bpm, BP normal',
        cause: 'Maternity',
        assessmentAcute: false,
        assessmentChronic: false,
        assessmentConfirmed: true,
        assessmentSuspected: false,
        comments: 'Low-risk pregnancy. Continue with prenatal care.',
        consultation: true,
        radiology: true,
        laboratory: true,
        preAuthorizationRequired: false,
        proposedTreatment: 'Continue prenatal vitamins, routine monitoring',
        estimatedCost: '850 AED',
        treatingPhysicianName: 'Dr. Sara Al-Qasimi',
        telFax: '+971-4-XXX-XXXX',
        approvedTariff: true,
        approvalCode: 'AUTO-004-2026',
      },
      {
        patientId: patient2.id,
        date: '2026-02-01',
        provider: 'Dr. Omar Al-Mansouri',
        serviceDate: '2026-02-01',
        symptoms: 'Annual preventive health screening',
        preExistingCondition: false,
        chronicMedications: false,
        familyHistory: false,
        additionalNotes: 'Routine annual check-up',
        clinicalFindings: 'All vitals normal, physical exam unremarkable',
        cause: 'Preventive',
        assessmentAcute: false,
        assessmentChronic: false,
        assessmentConfirmed: true,
        assessmentSuspected: false,
        comments: 'Patient in excellent health. Continue healthy lifestyle.',
        consultation: true,
        laboratory: true,
        radiology: true,
        preAuthorizationRequired: false,
        proposedTreatment: 'Annual blood work and imaging',
        estimatedCost: '1500 AED',
        treatingPhysicianName: 'Dr. Omar Al-Mansouri',
        telFax: '+971-4-XXX-XXXX',
        approvedTariff: true,
        approvalCode: 'AUTO-005-2026',
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${2} patients with ${5} total claims`)
  console.log('\nPatient 1:')
  console.log(`  Card: ${patient1.cardNumber}`)
  console.log(`  Name: ${patient1.name}`)
  console.log(`  Claims: 2`)
  console.log('\nPatient 2:')
  console.log(`  Card: ${patient2.cardNumber}`)
  console.log(`  Name: ${patient2.name}`)
  console.log(`  Claims: 3`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
