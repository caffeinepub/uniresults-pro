# UniResults Pro — Version 58

## Current State
Version 57 is a comprehensive academic management system with role-based dashboards (SuperAdmin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student), multi-institution support, full results pipeline, course registration, timetable, attendance, financial clearance, ID card generation, staff login, student self-registration, audit log, data backup, help center, and more. Existing tabs: 42 tab files in /pages/tabs/, AppContext.tsx holds all state in localStorage.

## Requested Changes (Diff)

### Add
1. **InboxBroadcastTab** (or enhance existing AdminInboxTab/StudentInboxTab) — Registrar/HOD can bulk-message all students in a department/level at once with one click; broadcast message appears in every recipient's student inbox.
2. **TranscriptRequestTab** — Students formally request official transcript from student portal; Registrar sees pending requests, approves and generates a printable stamped transcript with institution letterhead.
3. **AccreditationReportTab** — Registrar/Admin generates NUC/NCCE-formatted accreditation report for a department: staff list, student count by level, course load, pass rates, facilities checklist.
4. **ExamSupervisionTab** — Registrar/HOD assigns invigilators (from staff list) to exam halls per course/date/time; view/print invigilation schedule; clash detection for same invigilator double-booked.
5. **StudentClearanceTab** — Multi-department clearance form for graduating students: Library, Bursary, Hostel, Department, Faculty — each clears independently; Registrar sees overall clearance status; student sees progress tracker in their portal.
6. **NoticeBoardTab** — Registrar/HOD posts announcements with title, body, target audience (All, Students, Staff, specific Department); visible on every relevant dashboard as a pinned notice card; notices can be pinned/unpinned/deleted.
7. **ResultSlipModal** — Students can print a single-page semester result slip showing all courses, grades, GPA, CGPA, and remarks for that semester; accessible from the student results tab with a "Print Result Slip" button.
8. **AcademicCalendarEventsTab** — Visual monthly calendar; Registrar adds events (holidays, resumption, exam periods, semester start/end); all roles see upcoming events on their dashboard sidebar.
9. **CourseOutlineTab** (in Lecturer portal) — Lecturers upload official course outline/scheme of work PDF per course per semester; students can see and download from their course registration view.
10. **ThesisTrackerTab** — PG students and supervisors track thesis/project progress through stages: Proposal Submitted → Approved → Draft Submitted → Defense Scheduled → Defense Passed → Final Submission → Completed; HOD/Dean sees all PG students' thesis status.

### Modify
- **StudentDashboard**: Add Transcript Request button/tab, Result Slip print button, Clearance status tracker, Notice board panel, Course outline download links per registered course.
- **LecturerDashboard**: Add Course Outline upload tab, Thesis Supervisor view (for PG supervisors), Notice board panel.
- **HODDashboard / AdminDashboard / DeanDashboard**: Add Notice Board management, Accreditation Report, Exam Supervision, Student Clearance overview tabs.
- **AppContext**: Add state for broadcastMessages, transcriptRequests, accreditationData, examSupervision, studentClearance, notices, academicCalendarEvents, courseOutlines, thesisTrackers.

### Remove
- Nothing removed; all previous features maintained.

## Implementation Plan
1. Extend AppContext with new state slices for all 10 features.
2. Create 10 new tab components (or enhance existing ones where overlap exists).
3. Wire new tabs into appropriate dashboards with tab navigation entries.
4. Add "Print Result Slip" button in StudentDashboard results view.
5. Add notice board panel on all dashboards (collapsible sidebar widget or pinned cards).
6. Add academic calendar events widget on dashboard sidebars.
7. Add course outline download links in student course registration view.
8. Ensure all new features are audit-logged and work offline via localStorage.
