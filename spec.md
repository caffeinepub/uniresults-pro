# UniResults Pro — Version 35

## Current State

- Full academic management system with Registrar, HOD, Dean, Lecturer, Student dashboards
- Students tab in AdminDashboard has: manual Add Student form, CSV bulk upload, and an AI Smart Scanner (image upload side-by-side with editable rows)
- Student records store: S/N, Reg No (JAMB), Matric Number, Name, Department, State, LGA, Sex, Status
- No dedicated full student profile/record view exists — students are shown only in a flat table
- HODDashboard and DeanDashboard do not have access to bulk registration or AI scanner
- No Student Profile page showing all data in one combined view (courses, results, fees, attendance, etc.)

## Requested Changes (Diff)

### Add

1. **StudentProfileModal** — A full-screen or large modal/drawer showing all data for one student in one view:
   - Personal info (name, matric, reg no, dept, faculty, level, state, LGA, sex, status, DOB, email, phone, advisor)
   - Course Registrations — all sessions/semesters with registered courses and credit units
   - Academic Results — per-semester table: course code, title, CA, exam, total, grade, GP, GPA, CGPA
   - Fee/Payment Status — current balance, payment history, clearance status
   - Attendance — per-course attendance percentage
   - Academic Standing — current standing (Good Standing / Probation / Withdrawn), GPA trend
   - Library clearance status
   - Printable from the modal
   - Accessible via a "View Profile" button on every student row

2. **BulkRegistrationTab (new standalone tab)** — Available in AdminDashboard, HODDashboard, DeanDashboard:
   - Tab label: "Bulk Reg"
   - Sub-tabs: "CSV Upload" and "Scan & Import"
   - CSV Upload: download blank template, upload filled CSV, preview extracted rows, confirm import
   - Scan & Import (AI Scanner): upload image of printed OR handwritten student list; displays image on left, editable data table on right; admin fills/corrects S/N, Reg No, Name, Department, State, LGA, Sex, Status per row; supports adding/removing rows; batch import on confirm
   - Supports document types: Student Admission List, Result Sheet, Course Registration Form (selectable)
   - Import logs added to audit trail

3. **View Profile button** on all student rows in:
   - AdminDashboard StudentsTab
   - HODDashboard students view
   - DeanDashboard students view

### Modify

- AdminDashboard: add "Bulk Reg" tab to sidebar nav (in addition to existing Students tab)
- HODDashboard: add "Bulk Reg" tab to the tab list
- DeanDashboard: add "Bulk Reg" tab to the tab list
- Existing AI Scanner inside the Add Student dialog in AdminDashboard can remain as-is; the new BulkRegistrationTab is a more powerful standalone version

### Remove

- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/pages/tabs/StudentProfileModal.tsx` — full student profile view with all data sections
2. Create `src/frontend/src/pages/tabs/BulkRegistrationTab.tsx` — CSV upload + Scan & Import with image viewer and editable table
3. Update `AdminDashboard.tsx` — add "Bulk Reg" nav item, import and render BulkRegistrationTab, add "View Profile" button to each student row that opens StudentProfileModal
4. Update `HODDashboard.tsx` — add "Bulk Reg" tab, add "View Profile" button on student rows
5. Update `DeanDashboard.tsx` — add "Bulk Reg" tab, add "View Profile" button on student rows
