/*
  Warnings:

  - You are about to drop the column `assessment` on the `Claim` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Claim" (
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
    "approvedTariff" BOOLEAN NOT NULL DEFAULT false,
    "approvalCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Claim" ("additionalNotes", "approvalCode", "approvedTariff", "cause", "chronicMedications", "clinicalFindings", "comments", "consultation", "createdAt", "date", "estimatedCost", "familyHistory", "id", "inPatientCost", "inPatientProvider", "laboratory", "lengthOfStay", "otherCause", "otherMedical", "patientId", "pharmacy", "physiotherapy", "preAuthorizationDetails", "preAuthorizationRequired", "preExistingCondition", "proposedTreatment", "provider", "radiology", "serviceDate", "signature", "symptoms", "telFax", "treatingPhysicianName", "updatedAt") SELECT "additionalNotes", "approvalCode", "approvedTariff", "cause", "chronicMedications", "clinicalFindings", "comments", "consultation", "createdAt", "date", "estimatedCost", "familyHistory", "id", "inPatientCost", "inPatientProvider", "laboratory", "lengthOfStay", "otherCause", "otherMedical", "patientId", "pharmacy", "physiotherapy", "preAuthorizationDetails", "preAuthorizationRequired", "preExistingCondition", "proposedTreatment", "provider", "radiology", "serviceDate", "signature", "symptoms", "telFax", "treatingPhysicianName", "updatedAt" FROM "Claim";
DROP TABLE "Claim";
ALTER TABLE "new_Claim" RENAME TO "Claim";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
