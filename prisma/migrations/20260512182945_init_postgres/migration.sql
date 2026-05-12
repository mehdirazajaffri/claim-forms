-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT,
    "sex" TEXT,
    "policyNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TEXT,
    "provider" TEXT,
    "serviceDate" TEXT,
    "symptoms" TEXT,
    "preExistingCondition" BOOLEAN NOT NULL DEFAULT false,
    "chronicMedications" BOOLEAN NOT NULL DEFAULT false,
    "familyHistory" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "clinicalFindings" TEXT,
    "cause" TEXT,
    "otherCause" TEXT,
    "assessmentAcute" BOOLEAN NOT NULL DEFAULT false,
    "assessmentChronic" BOOLEAN NOT NULL DEFAULT false,
    "assessmentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "assessmentSuspected" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "consultation" BOOLEAN NOT NULL DEFAULT false,
    "physiotherapy" BOOLEAN NOT NULL DEFAULT false,
    "laboratory" BOOLEAN NOT NULL DEFAULT false,
    "radiology" BOOLEAN NOT NULL DEFAULT false,
    "pharmacy" BOOLEAN NOT NULL DEFAULT false,
    "otherMedical" TEXT,
    "preAuthorizationRequired" BOOLEAN NOT NULL DEFAULT false,
    "preAuthorizationDetails" TEXT,
    "proposedTreatment" TEXT,
    "estimatedCost" TEXT,
    "lengthOfStay" TEXT,
    "inPatientProvider" TEXT,
    "inPatientCost" TEXT,
    "treatingPhysicianName" TEXT,
    "telFax" TEXT,
    "signature" TEXT,
    "physicianSignature" TEXT,
    "approvedTariff" BOOLEAN NOT NULL DEFAULT false,
    "approvalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cardNumber_key" ON "Patient"("cardNumber");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
