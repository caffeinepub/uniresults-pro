# UniResults Pro

## Current State
Version 53 is a full-stack academic management system for Nigerian institutions. It has:
- Multi-institution support (University, NCE, Polytechnic, Secondary, Primary, Pre-Nursery)
- Role-based dashboards: SuperAdmin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student
- Student login via matric number from LoginPage
- JAMB Admission Import (CSV/Excel and AI Scanner) in JAMBImportTab.tsx
- Full student records with JAMB Reg No, Matric No, Name, Department, State, LGA, Sex, Status
- Course registration portal for students
- AppContext.tsx manages all state including students array with fields: id, matricNo, regNo, name, dept, state, lga, sex, status, password, etc.
- App.tsx handles routing with paths: /, /feedback, and role-based views
- FeedbackPage.tsx is an existing public page accessible without login

## Requested Changes (Diff)

### Add
- New public page `/student-register` -- StudentRegisterPage.tsx
- Student self-registration flow:
  - Step 1: Enter JAMB Reg Number
    - If found in system: show pre-filled form to confirm details, set password, activate account
    - If not found: show full registration form with JAMB number as ID
  - Step 2: Full registration form fields:
    - JAMB Registration Number (pre-filled/required)
    - NIN (National Identification Number)
    - Full Name (first, middle, last)
    - Sex (Male/Female)
    - Date of Birth
    - State of Origin, LGA
    - Department / Programme (dropdown from departments list)
    - O-Level / GCSE results (subject + grade rows, add/remove)
    - Passport Photo: webcam capture OR file upload
    - Password + Confirm Password
  - On submit: save student record to AppContext students array; if existing record found, update it with new fields and set password
  - Redirect to student portal after successful registration
- Login enhancement: students can log in with JAMB reg number OR matric number (whichever matches)
- Registrar portal: toggle to open/close self-registration portal (stored in AppContext settings)
- Share link for `/student-register` in Admin/Registrar header or Settings
- Route `/student-register` added to App.tsx

### Modify
- LoginPage.tsx: student login (matric number tab) should also accept JAMB reg number -- check both fields when authenticating
- AppContext.tsx: add `selfRegistrationOpen` boolean to settings; add `nin` and `dateOfBirth` and `oLevelResults` and `photoUrl` fields to student type; ensure password field exists on student records
- App.tsx: add `/student-register` route pointing to StudentRegisterPage
- AdminDashboard.tsx / SettingsTab.tsx: add toggle for self-registration portal open/close and share link button for `/student-register`

### Remove
- Nothing removed

## Implementation Plan
1. Update AppContext: add `selfRegistrationOpen` to settings, add `nin`, `dateOfBirth`, `oLevelResults`, `photoUrl` fields to student type
2. Create `src/frontend/src/pages/StudentRegisterPage.tsx` with:
   - JAMB number lookup step
   - Full multi-step form with webcam/upload photo capture
   - O-Level results table (add rows)
   - Password setup
   - Save to AppContext on submit and redirect to student portal
3. Update `App.tsx`: add `/student-register` route
4. Update `LoginPage.tsx`: student authentication checks JAMB reg number OR matric number
5. Update `SettingsTab.tsx` or `AdminDashboard.tsx`: self-registration portal toggle + share link
