# Almadallah Claims Management System

A full-stack Next.js application for managing healthcare claim forms with automatic patient data prefilling, multi-claim support per patient, and PDF generation.

## Features

- **Patient Management**: Create and manage patient records with unique card numbers
- **Claim Management**: Multiple claims per patient with auto-prefill from previous submissions
- **Form Prefilling**: When a patient card number is found, the form automatically prefills with:
  - Patient information (name, birthdate, sex, policy number)
  - Previous claim data (if available)
- **Data Persistence**: SQLite database (via Prisma ORM) for reliable data storage
- **Responsive UI**: Clean, accessible web interface built with React and Tailwind CSS
- **RESTful API**: Complete API endpoints for patients and claims management

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Database**: SQLite with Prisma ORM
- **PDF**: pdf-lib for PDF field mapping and generation (extensible)
- **HTTP**: Axios for API calls

## Project Structure

```
claims/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── patients/      # Patient endpoints
│   │   └── claims/        # Claim endpoints
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ClaimForm.tsx      # Main claim form component
├── lib/                   # Utility functions
│   ├── prisma.ts          # Prisma client
│   └── pdf-handler.ts     # PDF manipulation functions
├── prisma/
│   └── schema.prisma      # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- macOS, Linux, or Windows

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   npm run prisma:migrate
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to http://localhost:3000

## API Endpoints

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient (or get existing by card number)
- `GET /api/patients/[id]` - Get patient details with claims history

### Claims
- `GET /api/claims` - List all claims
- `POST /api/claims` - Create new claim
- `GET /api/claims/[id]` - Get claim details
- `PUT /api/claims/[id]` - Update claim

## Usage

### Submitting a Claim

1. **Search for Patient**: Enter the patient's card number in the search field
   - If found: Form prefills with patient info and latest claim data
   - If not found: New patient record will be created on submission

2. **Fill the Form**: Complete the required sections:
   - Patient Information
   - Service Information
   - Clinical Assessment
   - Medical Plan
   - In-Patient Details (if applicable)
   - Physician Information

3. **Submit**: Click "Submit Claim" to save the claim to the database

### Patient Prefilling

When you search for an existing patient:
- All patient information is automatically filled
- If the patient has previous claims, the latest claim's data is automatically populated in the form
- You can modify any field before resubmission

## Database Schema

### Patient Model
- `id`: Unique identifier (CUID)
- `cardNumber`: Unique card number for identification
- `name`: Patient's full name
- `birthDate`: Date of birth
- `sex`: Male/Female
- `policyNo`: Insurance policy number
- `createdAt`, `updatedAt`: Timestamps

### Claim Model
- `id`: Unique identifier (CUID)
- `patientId`: Foreign key to Patient
- All form fields from the claim form
- `createdAt`, `updatedAt`: Timestamps
- Supports up to 12 distinct medical service types
- Pre-authorization tracking
- Almadallah approval tracking

## PDF Generation & Download (Future Enhancement)

The project includes infrastructure for:
1. Reading the PDF template
2. Mapping form fields to PDF form fields
3. Filling form fields with claim data
4. Generating a filled PDF with exact formatting
5. Downloading as a filled PDF

To implement:
1. Add the original claim form PDF to `public/templates/claim-form.pdf`
2. Update `lib/pdf-handler.ts` with exact field mappings
3. Create a download endpoint: `POST /api/claims/[id]/download-pdf`

## Environment Variables

Create `.env.local` with:
```
DATABASE_URL="file:./dev.db"
```

## Development

### Database Management
- **View database in Studio**: `npm run prisma:studio`
- **Create migration**: `npm run prisma:migrate`
- **Reset database**: `npx prisma migrate reset`

### Building for Production
```bash
npm run build
npm start
```

## Future Enhancements

1. **PDF Template Integration**: Exact PDF field mapping and generation
2. **Signature Support**: Canvas-based physician signature capture
3. **Multi-language Support**: Localization for Arabic and English
4. **Email Notifications**: Send claim confirmation emails
5. **Dashboard**: Analytics and claim status tracking
6. **Authentication**: User roles (patient, physician, administrator)
7. **Audit Trail**: Track all changes for compliance

## License

MIT
