# UniResults Pro

## Current State
Version 42 is live with full role-based dashboards (SuperAdmin, Registrar, HOD, Dean, Lecturer, Student), score entry sheets, full approval workflow (Lecturer → HOD → Dean → Registrar → Publish), departmental results, senate report, amendment workflow, and biometric attendance. RoleName is `SuperAdmin | Registrar | HOD | Lecturer | Student | Dean | null`.

## Requested Changes (Diff)

### Add
1. **Examiner / Exam Officer role** (`ExamOfficer` added to `RoleName`)
   - New `ExamOfficerDashboard` component
   - Quick actions: Score Sheet, Results Pipeline, View All Results, Exam Schedule
   - Can enter scores for any course in their assigned department
   - Can submit results directly to HOD
   - App.tsx routes `role === 'ExamOfficer'` to `ExamOfficerDashboard`
   - Login page: "Exam Officer" option in role selector
   - Demo Exam Officer account pre-created in AppContext

2. **HOD: Lecturer Submissions Inbox** (new tab `lecturer_submissions`)
   - Shows courses where status = `submitted`, grouped by Lecturer
   - Each row: Lecturer name, course code/title, number of students, submission date, Approve/Reject buttons
   - Approve sends to Dean (`hod_approved`); Reject returns to draft with comment
   - Badge counter on tab showing pending count
   - HOD gets in-app notification when a lecturer submits results

3. **HOD: View All Results in Department** (new tab `dept_all_results`)
   - Full flat table: S/N, Matric No, Student Name, Course Code, CA, Exam, Total, Grade, GP, Status
   - Filters: Level, Session, Semester, Status (draft/submitted/approved/published)
   - Summary stats: total students, pass rate, grade distribution
   - CSV export
   - Print-friendly layout

4. **ExamOfficer: View All Department Results** 
   - Same as HOD dept_all_results but scoped to their department
   - Read-only view of all results

5. **Notification trigger on Lecturer submit**
   - When Lecturer clicks "Submit for Approval" in ScoreEntrySheetTab or ResultsProcessingTab, call `addNotification('HOD', ...)` with course name and lecturer name

### Modify
- `AppContext.tsx`: Add `ExamOfficer` to `RoleName` type; add demo ExamOfficer user account in DEMO_USERS
- `App.tsx`: Route ExamOfficer role to ExamOfficerDashboard
- `HODDashboard.tsx`: Add `lecturer_submissions` and `dept_all_results` tabs with pending badge
- `ResultsProcessingTab.tsx`: On submit action, fire `addNotification` to HOD
- `ScoreEntrySheetTab.tsx`: On submit, fire `addNotification` to HOD
- `LoginPage.tsx`: Add "Exam Officer" in role dropdown

### Remove
- Nothing removed

## Implementation Plan
1. Update `AppContext.tsx`: add `ExamOfficer` to `RoleName`, add demo ExamOfficer user
2. Create `ExamOfficerDashboard.tsx` with score entry, results pipeline, dept results view, exam schedule tabs
3. Create `LecturerSubmissionsTab.tsx` for HOD inbox of submitted results grouped by lecturer
4. Create `DeptAllResultsTab.tsx` for HOD/ExamOfficer full results table with filters and export
5. Update `HODDashboard.tsx`: add new tabs, badge counters, quick actions
6. Update `App.tsx`: add ExamOfficer routing
7. Update `LoginPage.tsx`: add ExamOfficer role option
8. Update `ResultsProcessingTab.tsx` and `ScoreEntrySheetTab.tsx`: fire HOD notification on submit
