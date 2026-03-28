# UniResults Pro

## Current State
Version 66 is live with a comprehensive academic management system including: multi-institution support, full student management, course registration, results processing pipeline, role-based dashboards (SuperAdmin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student), JAMB import, bulk registration, timetables, attendance screening, lecturer evaluation, certificate generation, biometric attendance, financial clearance, alumni management, payroll, hostel management, library clearance, ID cards, audit log, data backup, notifications, result verification, and 154 component files.

## Requested Changes (Diff)

### Add
1. **Student Loan/Scholarship Tracking** -- track bursary awards, scholarships, government loans per student; payment history, application status, approval workflow
2. **Departmental Budget Management** -- HOD/Dean manage departmental allocations, expenditure records, and budget reports
3. **Staff Appraisal System** -- annual performance appraisal for academic and non-academic staff; multi-criteria scoring, period management, results visible to Admin/Dean
4. **Online CBT/Exam Module** -- computer-based test creation (question bank), timed exam sessions, auto-grading, results published to student portal; Registrar/HOD manage CBT sessions
5. **Parent Portal** -- for secondary school (JS1-SS3) and primary (P1-P6) institution types; parents can view their child's results, attendance, and fee status using a unique access code
6. **Advanced Analytics Dashboard** -- charts and trend graphs: CGPA distributions, pass rates over sessions, enrollment trends, department comparison charts; visible to SuperAdmin/Registrar
7. **E-Library / Resource Hub** -- department-level digital resource hub; lecturers upload materials (PDF, DOC, video links); students browse and download resources per course; searchable catalog

### Modify
- AdminDashboard: add tabs for scholarship, budget, staff_appraisal, cbt_module, parent_portal, analytics, elibrary
- HODDashboard: add tabs for budget, staff_appraisal, elibrary
- DeanDashboard: add tabs for budget, staff_appraisal, analytics
- StudentDashboard: add tabs for elibrary (browse resources), cbt_exams (upcoming/take exams)
- LecturerDashboard: add tabs for elibrary (upload materials), cbt_questions (create questions for assigned courses)

### Remove
- Nothing removed

## Implementation Plan
1. Create new tab component files: ScholarshipTab.tsx, BudgetManagementTab.tsx, StaffAppraisalTab.tsx, CBTExamTab.tsx, ParentPortalPage.tsx, AdvancedAnalyticsTab.tsx, ELibraryTab.tsx
2. Wire all new tabs into relevant dashboards (Admin, HOD, Dean, Student, Lecturer)
3. Add /parent-portal route with PIN/code login for secondary/primary institution types
4. All tabs use existing AppContext state pattern with localStorage persistence
5. CBT module: question bank per course, exam session scheduling by Registrar, timed exam UI for students, auto-grade and publish results
6. Analytics: use recharts (already available via shadcn chart component) for CGPA distribution histograms, pass rate line charts over sessions, enrollment bar charts
7. E-Library: per-department/course resource catalog with file type badges, upload by lecturers, download by students
8. All new features must maintain all previous components and follow existing code patterns
