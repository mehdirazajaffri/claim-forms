-- CreateTable
CREATE TABLE "VisitNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "patientName" TEXT,
    "ageGender" TEXT,
    "dateOfVisit" TEXT,
    "visitTime" TEXT,
    "address" TEXT,
    "contactNumber" TEXT,
    "accompaniedBy" TEXT,
    "temperature" TEXT,
    "bloodPressure" TEXT,
    "heartRate" TEXT,
    "respiratoryRate" TEXT,
    "spo2" TEXT,
    "bloodSugar" TEXT,
    "weight" TEXT,
    "chiefComplaints" TEXT,
    "appearance" TEXT,
    "hydration" TEXT,
    "chest" TEXT,
    "cvs" TEXT,
    "perAbd" TEXT,
    "cns" TEXT,
    "musculoskeletal" TEXT,
    "pallor" TEXT,
    "icterus" TEXT,
    "cyanosis" TEXT,
    "clubbing" TEXT,
    "koilonychia" TEXT,
    "lymphadenopathy" TEXT,
    "edema" TEXT,
    "otherFindings" TEXT,
    "medicationChanges" TEXT,
    "laboratoryTests" TEXT,
    "followUpPlan" TEXT,
    "otherInstructions" TEXT,
    "doctorName" TEXT,
    "doctorContact" TEXT,
    "doctorRegNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitNote_shareToken_key" ON "VisitNote"("shareToken");

-- AddForeignKey
ALTER TABLE "VisitNote" ADD CONSTRAINT "VisitNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
