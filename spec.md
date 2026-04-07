# UniResults Pro

## Current State
Version 81 is a comprehensive academic management system with ~103 tabs/components. All major features are built: student management, course management, results processing pipeline, Faculty/Department/Senate reports, Student Academic Record, Pass/Fail lists, PG Admission, CBT, Parent Portal, Staff Appraisal, Budget Management, Scholarship, Invigilation, Multi-Clearance, Academic Calendar, E-Library, Analytics, Sidebar Navigation, etc.

## Requested Changes (Diff)

### Add
- **SIWES Management tab** integrated into Admin, HOD, and Lecturer dashboards (SIWESManagementTab.tsx exists but is not wired to any dashboard sidebar)
- **Feedback Management tab** integrated into Admin dashboard (FeedbackManagementTab.tsx exists but not wired)
- **Staff Directory tab** -- printable list of all academic and non-academic staff with photo, role, department, contact info, and qualifications; accessible from Admin and HOD dashboards
- **Graduation Programme (Convocation Booklet)** -- printable/print-preview formatted convocation booklet listing all graduating students by faculty/department with degree and distinction
- **Course History tab** -- HOD can view the full history of a course: all students who took it each session, grade distributions, pass rates over time
- **Student Progress Report** -- HOD/Dean can generate a full academic progress report for individual students from 100L to current level
- **In-App Announcement board for lecturers** -- Lecturers see announcements from HOD/Registrar in their dashboard (NoticeBoardPanel integration)
- **System Settings summary page** -- single-page view of all system configuration (institution name, grading scale, session, departments count, student count) for Admin quick reference

### Modify
- Admin dashboard sidebar: add `siwes`, `feedback_mgmt`, `staff_directory`, `convocation_booklet`, `system_summary` sidebar items
- HOD dashboard sidebar: add `siwes`, `course_history`, `student_progress`, `staff_directory` sidebar items
- Lecturer dashboard: add NoticeBoardPanel integration so lecturers see HOD/Registrar notices
- Dean dashboard: add `student_progress`, `convocation_booklet` sidebar items

### Remove
- Nothing removed

## Implementation Plan
1. Create `StaffDirectoryTab.tsx` -- full staff listing with search, filter by dept/role, print, export CSV
2. Create `ConvocationBookletTab.tsx` -- printable convocation booklet with all graduating students grouped by faculty/dept, with degree classifications
3. Create `CourseHistoryTab.tsx` (wire existing) -- course selection, then show all session/semester records for that course
4. Create `StudentProgressReportTab.tsx` -- pick a student, show academic progress report across all levels
5. Create `SystemSummaryTab.tsx` -- system config overview with counts and key settings
6. Wire `SIWESManagementTab` into Admin (sidebar: siwes, group: Academic) and HOD (sidebar: siwes, group: Academic) dashboards
7. Wire `FeedbackManagementTab` into Admin dashboard (sidebar: feedback_mgmt, group: System)
8. Add `NoticeBoardPanel userRole='Lecturer'` to LecturerDashboard
9. Update all relevant dashboards with new sidebar items and tab handlers
