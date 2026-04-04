# UniResults Pro

## Current State
Version 77 of UniResults Pro is a comprehensive academic management system with:
- Multi-institution support (University, NCE, Polytechnic, Secondary, Primary, Pre-Nursery)
- Full student management, JAMB import, course registration, results pipeline
- Role-based dashboards: Admin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student
- Result reports: Department, Faculty, Senate, Academic Record (NCE/University/Polytechnic)
- Pass List, Failure List, Graduating List, Dean's List
- Accreditation reports (AccreditationReportTab.tsx) -- EXISTS
- Broadcast in-app SMS (BroadcastInboxTab.tsx) -- EXISTS
- Result amendment requests (ResultAmendmentTab.tsx) -- EXISTS
- Advanced analytics, E-Library, PG Thesis Tracker, Scholarship tracking, etc.

## Requested Changes (Diff)

### Add
1. **Departmental Budget Management** -- New tab `DepartmentBudgetTab.tsx`
   - HOD/Dean set departmental budget allocations per category (Personnel, Equipment, Library, Research, Admin, Misc)
   - Track expenditures against allocations with remaining balance
   - Budget approval workflow: HOD proposes → Dean approves → Registrar/Admin finalizes
   - Print/export budget reports per department and session
   - Wire into HODDashboard (tab: "dept_budget"), DeanDashboard (tab: "dept_budget"), AdminDashboard (tab: "dept_budget")

2. **Staff Appraisal System** -- New tab `StaffAppraisalTab.tsx`
   - Annual performance appraisal form for academic and non-academic staff
   - Criteria: Teaching/Work Effectiveness, Research Output, Community Service, Punctuality/Attendance, Cooperation, Student Feedback Score
   - Self-appraisal section (staff fills their own), HOD assessment section, Dean endorsement
   - Appraisal status workflow: Draft → Submitted → HOD Reviewed → Dean Endorsed
   - Aggregated scores, printable appraisal report per staff member
   - Wire into AdminDashboard (tab: "staff_appraisal"), HODDashboard (tab: "staff_appraisal"), DeanDashboard (tab: "staff_appraisal")

3. **Online CBT/Exam Module** -- New tab `CBTExamTab.tsx`
   - Question bank: Admin/Lecturer creates questions (MCQ, True/False, Short Answer) per course
   - Schedule CBT exams: assign course, duration, date/time, allowed students
   - Student-facing exam interface: countdown timer, question navigator, submit button
   - Auto-grading for MCQ/True-False; manual grading for Short Answer
   - Results appear in CBT results dashboard with score, grade, pass/fail
   - Wire into AdminDashboard (tab: "cbt_exam"), LecturerDashboard (tab: "cbt_exam"), StudentDashboard (tab: "cbt_exam")

4. **Parent Portal** -- New page `ParentPortalPage.tsx` with route `/parent`
   - Login page for parents using ward's matric number + a parent PIN
   - Dashboard shows: ward's photo, name, level, dept, CGPA, attendance %, fee status
   - Results tab: view published results per semester (read-only)
   - Attendance tab: see attendance % per course, highlight below 75%
   - Fees tab: see outstanding fees and payment status
   - Inbox tab: receive messages from Registrar/HOD
   - Add "Parent Login" tab to LoginPage.tsx alongside existing Student/Staff tabs
   - Add parent PIN management to student records in AppContext and Admin student forms

5. **Postgraduate Admission Portal** -- New tab `PGAdmissionTab.tsx`
   - Public-facing PG application form at `/pg-apply` (no login required)
   - Form fields: Full Name, Email, Phone, Date of Birth, NIN, Previous Qualification (BSc/HND/etc.), Class of Degree, Institution, Year, Programme Applied (MSc/PGDE/PhD/MBA), Department, Session
   - Upload supporting documents (transcript, certificate, referee letters)
   - Application status tracking by application reference number
   - Admin/Registrar dashboard view: list all PG applications, filter by programme/status, approve/reject/shortlist with reason
   - Shortlisted applicants converted to student records with PG level (700/800)
   - Wire into AdminDashboard (tab: "pg_admission"), and add link to LoginPage

### Modify
- **AdminDashboard.tsx**: Add routing and quick action buttons for: `dept_budget`, `staff_appraisal`, `cbt_exam`, `pg_admission`
- **HODDashboard.tsx**: Add routing for `dept_budget`, `staff_appraisal`
- **DeanDashboard.tsx**: Add routing for `dept_budget`, `staff_appraisal`
- **LecturerDashboard.tsx**: Add routing for `cbt_exam`
- **StudentDashboard.tsx**: Add routing for `cbt_exam`
- **App.tsx**: Add routes for `/parent` (ParentPortalPage) and `/pg-apply` (public PG application)
- **LoginPage.tsx**: Add Parent Login tab and PG Apply link
- **AppContext.tsx**: Add state for budgets, appraisals, cbt questions/exams, parent PINs, pg applications

### Remove
- Nothing removed

## Implementation Plan
1. Extend AppContext with new state slices: budgets, appraisals, cbtQuestions, cbtExams, cbtResults, parentPins, pgApplications
2. Create DepartmentBudgetTab.tsx with allocation table, expenditure tracking, approval workflow, print
3. Create StaffAppraisalTab.tsx with self-appraisal form, HOD assessment, Dean endorsement, status badges
4. Create CBTExamTab.tsx with question bank CRUD, exam scheduler, student exam-taking interface, auto-grading, results
5. Create ParentPortalPage.tsx with login, results/attendance/fees/inbox read-only views
6. Create PGAdmissionTab.tsx (admin side) and a public PGApplyPage.tsx at /pg-apply
7. Wire all new tabs into respective dashboards with quick action buttons
8. Add Parent Login tab and PG Apply link to LoginPage.tsx
9. Add routes in App.tsx
