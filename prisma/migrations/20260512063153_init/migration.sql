-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT,
    "sex" TEXT,
    "policyNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "assessment" TEXT,
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
    "approvedTariff" BOOLEAN NOT NULL DEFAULT false,
    "approvalCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cardNumber_key" ON "Patient"("cardNumber");
