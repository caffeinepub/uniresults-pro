# UniResults Pro

## Current State
UniResults Pro V20 is a comprehensive university academic management system with:
- 6 role dashboards: SuperAdmin, Registrar, HOD, Dean, Lecturer, Student
- All data stored in localStorage (rich frontend state management)
- Minimal Motoko backend (basic CRUD for departments, courses, students, results)
- Authorization component already integrated (role-based access)
- Features: student/course registration, result entry, approval workflow, GPA/CGPA, bulk CSV, analytics, transcripts, timetables, exam scheduling, fee tracking, staff management, ID cards, Senate report, dark mode, etc.

## Requested Changes (Diff)

### Add
- **blob-storage**: Store student and staff profile photos uploaded for ID cards; photos persist on-chain rather than in localStorage
- **camera**: Capture live photo from webcam when generating student/staff ID cards ("Take Photo" button next to upload option)
- **qr-code**: QR code scanner to verify student/staff identity -- scan QR code on printed ID card to display student/staff record
- **user-approval**: New user registration flow where new accounts (student/staff self-registration) require admin approval before gaining access

### Modify
- Student ID Card modal: add "Take Photo" (camera) and "Upload Photo" (blob-storage) options; store photo reference
- Staff ID Card modal: same camera + blob-storage photo options
- Login page: add "Request Access" / self-registration form for new users; submitted requests go to admin approval queue
- AdminDashboard: add "Pending Registrations" tab showing user-approval queue with approve/reject actions
- Add a QR code scanner button (in Registrar or SuperAdmin dashboard) that opens a camera QR scan modal to look up a student/staff by their ID card QR

### Remove
- Nothing removed

## Implementation Plan
1. Select components: blob-storage, camera, qr-code, user-approval
2. Wire blob-storage into StudentIDCardModal and StaffIDCardModal for photo upload/display
3. Wire camera component into StudentIDCardModal and StaffIDCardModal for "Take Photo" capture
4. Add QR scanner button in Admin/Registrar dashboard that opens a modal with the qr-code camera scanner, looks up student/staff by matric or ID
5. Add self-registration form to LoginPage; wire user-approval component for pending registrations
6. Add "Pending Registrations" section to AdminDashboard wired to user-approval approval/rejection
7. Validate, build, and deploy
