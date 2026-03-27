# UniResults Pro — Version 37 (Go-Live Complete Package)

## Current State

Version 36 is a comprehensive university results management system with: student records (Biology/Chemistry/Computer Science/Mathematics Education under Faculty of Science Education), results processing pipeline, score entry sheets, senate/cumulative/departmental reports, biometric attendance, ID cards, fee management, hostel, library clearance, alumni, payroll, timetable, exam scheduling, course registration, graduation clearance, department transfer, academic advisor, audit log, Internet Identity login, student matric login, result verification portal, notice board, dark mode, offline sync, bulk registration, AI smart scanner.

Levels currently go up to 500. Academic levels are referenced throughout context and reports.

## Requested Changes (Diff)

### Add

1. **Level 600 Support** — Extend all level dropdowns, filters, reports, and logic from max 500 to max 600 (for extended/postgraduate programs and spillover students)

2. **Spillover Student Handling** — Students who exceed expected graduation year are flagged as "Spillover". System tracks their minimum year of graduation (admission year + minimum programme duration) and maximum year of graduation (admission year + maximum programme duration). Spillover flag auto-set when student exceeds max graduation year without graduating.

3. **Graduation Requirements Configuration** — New settings panel (SuperAdmin/Registrar) to define per-programme:
   - Minimum total credit units required for graduation
   - Maximum total credit units allowed
   - Minimum CGPA for graduation
   - Minimum programme duration (years, e.g. 4 for a 4-year programme)
   - Maximum programme duration / maximum years of study (e.g. 7 for a 4-year programme)
   - Minimum year of graduation (derived: admission year + min duration)
   - Maximum year of graduation (derived: admission year + max duration)
   - These settings feed into graduation eligibility checks in clearance workflow

4. **Degree Classification Summary** — Auto-calculated from CGPA:
   - First Class: CGPA ≥ 4.50
   - Second Class Upper: 3.50–4.49
   - Second Class Lower: 2.40–3.49
   - Third Class: 1.50–2.39
   - Pass: 1.00–1.49
   - Fail: < 1.00
   - Displayed in transcripts, graduation list, senate report, student portal

5. **System Initialization Wizard** — First-time setup modal for new deployments:
   - Step 1: Institution name, address, phone, email
   - Step 2: Create SuperAdmin account
   - Step 3: Set active session and semester
   - Step 4: Option to generate default academic structure
   - Dismissed flag saved in localStorage; never shown again once completed

6. **Password Reset & Account Recovery** — Admins can reset any staff/student password from their record. Staff can request a password reset (generates a temporary pin). Logged in audit trail.

7. **Final Year Batch Graduation Processing** — Registrar tab: select eligible Level 400/500/600 students, run degree classification, generate graduation list, mark Graduated in batch. Eligibility checks: clearance approved, no F grades, credits meet minimum, CGPA ≥ minimum. Shows ineligible students with reasons.

8. **Student Portal Onboarding** — New students (first login) see a welcome checklist: Complete Profile → Pay Fees → Register Courses → Check Timetable. Dismissible after all steps acknowledged.

9. **Data Backup & Full Export** — SuperAdmin can export entire system data as JSON. Restore from JSON backup also available. Export logged in audit trail.

10. **Help Center / User Guide** — Floating "?" help button per dashboard. Role-specific help panel slides in with key workflow steps (e.g. Lecturer: how to enter scores; Student: how to register courses; Registrar: how to publish results).

11. **System Health Dashboard** — SuperAdmin tab showing:
    - Total students, staff, courses, departments
    - Students with no courses registered
    - Courses with no scores entered
    - Pending approvals count per stage
    - Students flagged as spillover
    - Data integrity alerts (unknown faculty, missing matric numbers)

12. **Printable Graduation List** — Registrar generates official convocation list sorted by department and degree class, with institution heading, print/CSV export.

13. **Result Amendment Workflow** — Post-publication corrections: Lecturer submits amendment request with reason → HOD approves → Registrar confirms. Amendment logged in audit trail with before/after scores.

### Modify

- All level dropdowns, filters, loops, and report sections: extend from [100,200,300,400,500] to [100,200,300,400,500,600]
- Graduation clearance eligibility: incorporate graduation requirements config (min credits, min CGPA, max years)
- Senate/cumulative reports: handle Level 600 sections
- Student academic standing: spillover flag shown in student profile and registrar view
- Transcript: show degree classification

### Remove
- Nothing removed

## Implementation Plan

1. Add `graduationRequirements` config to AppContext (per-department or system-wide): minCredits, maxCredits, minCGPA, minDuration, maxDuration
2. Extend all LEVELS arrays to include 600
3. Add spillover detection utility: compare student's current academic year vs min/max graduation year
4. Add `DegreeClassification` utility function (CGPA → class label)
5. Build `GraduationRequirementsTab` — settings form for Registrar/SuperAdmin
6. Build `SystemInitWizard` — multi-step first-time setup modal
7. Build `SystemHealthTab` — SuperAdmin dashboard panel
8. Build `BatchGraduationTab` — Registrar batch graduation processing
9. Build `ResultAmendmentTab` — amendment request/approval workflow
10. Build `DataBackupTab` — export/import JSON
11. Add Help Center floating button + role-specific content
12. Add Student Onboarding checklist to StudentDashboard
13. Add Password Reset to staff/student record dialogs
14. Add Graduation List print view to Registrar
15. Add Degree Classification to transcript, student portal, senate report
