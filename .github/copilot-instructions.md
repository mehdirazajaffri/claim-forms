# Almadallah Claims Management System - Copilot Instructions

## Project Overview
Next.js full-stack application for healthcare claim form management with:
- Patient data persistence and prefilling
- Multi-claim support per patient
- Responsive web interface
- RESTful API with Prisma ORM and SQLite

## Getting Started

### Installation & Setup
1. Dependencies installed ✓
2. Database initialized with Prisma ✓
3. All core components scaffolded ✓

### Running the Project

**Start development server:**
```bash
npm run dev
```

Navigate to http://localhost:3000

**Other useful commands:**
```bash
npm run build          # Build for production
npm start             # Start production server
npm run prisma:studio # Open Prisma database viewer
npm run lint          # Run linter
```

## Project Structure

```
claims/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── patients/        # Patient CRUD endpoints
│   │   └── claims/          # Claim CRUD endpoints
│   ├── page.tsx            # Home page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global Tailwind styles
├── components/
│   └── ClaimForm.tsx       # Main claim form UI (React Hook Form)
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   └── pdf-handler.ts     # PDF fill/generation utilities
├── prisma/
│   ├── schema.prisma      # Database schema (Patient + Claim models)
│   └── dev.db             # SQLite database (generated)
├── public/                # Static assets
├── migrations/            # Prisma migration history
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── postcss.config.js
└── README.md
```

## Key Features Implemented

✓ **Patient Management**
  - Create/search patients by card number
  - Unique card number constraint
  - Auto-create on first claim submission

✓ **Claim Management**
  - Full form with all sections from Almadallah template
  - Store to SQLite via Prisma ORM
  - Retrieve claim history per patient

✓ **Form Prefilling**
  - Search patients by card number
  - Auto-populate patient details
  - Prefill with latest claim data if available

✓ **Responsive UI**
  - React Hook Form for state management
  - Tailwind CSS for styling
  - Clean, accessible form layout
  - Success feedback

✓ **RESTful API**
  - GET/POST /api/patients (list, create/find)
  - GET /api/patients/[id] (patient + claims)
  - GET/POST /api/claims (list, create)
  - GET/PUT /api/claims/[id] (retrieve, update)

## Next Steps / Future Enhancements

1. **PDF Generation & Download**
   - Place original claim form PDF in `public/templates/claim-form.pdf`
   - Update field mappings in `lib/pdf-handler.ts`
   - Create endpoint: `POST /api/claims/[id]/download-pdf`
   - Return filled PDF with exact formatting

2. **Signature Capture**
   - Add canvas-based signature field to form
   - Store as base64 in database

3. **Authentication**
   - Add user roles: patient, physician, admin
   - Protect API endpoints

4. **Email Notifications**
   - Send claim confirmation emails
   - Notify on approval/rejection

5. **Dashboard**
   - Analytics (claims by month, status distribution)
   - Claim history view
   - Export functionality

## Database Schema

**Patient**
- id, cardNumber (unique), name, birthDate, sex, policyNo
- createdAt, updatedAt
- Relation: 1-to-many Claims

**Claim**
- id, patientId (FK), 30+ form fields
- createdAt, updatedAt
- Covers: patient info, service, assessment, medical plan, in-patient, physician

## Environment Variables

`.env.local` (already configured):
```
DATABASE_URL="file:./prisma/dev.db"
```

## Troubleshooting

**Database connection issues:**
```bash
npx prisma db push
npx prisma migrate reset  # WARNING: deletes data
```

**Port already in use:**
```bash
npm run dev -- -p 3001
```

**Rebuild database:**
```bash
rm prisma/dev.db prisma/dev.db-journal
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev --name init
```

## Tech Stack Summary

- **Next.js 14** - React framework with app router
- **TypeScript** - Type safety
- **Prisma 5.7** - ORM for SQLite
- **React Hook Form** - Form state management
- **Tailwind CSS 3.3** - Styling
- **Axios** - HTTP client
- **pdf-lib** - PDF manipulation (ready for integration)

All set! Start with `npm run dev` and navigate to http://localhost:3000.
