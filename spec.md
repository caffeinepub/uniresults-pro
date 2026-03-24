# UniResults Pro

## Current State

Full academic management system with:
- 6 role dashboards: SuperAdmin, Registrar, HOD, Dean, Lecturer, Student
- Result entry, CA+Exam auto-calc, approval workflow (Lecturer → HOD → Dean → Registrar)
- GPA/CGPA calculation, grade distribution charts
- Student registration (manual + CSV bulk), course registration (add/drop per semester)
- Bulk result upload (Lecturer), amendment/correction workflow
- HOD analytics: pass rates, at-risk panel, level breakdown, CSV export
- Results processing: publication, semester summaries, carry-over tracking, statistics
- Student transcript: print-friendly PDF-style with CGPA, degree classification
- Persistent localStorage
- Layout: top nav + mobile nav, AnimatePresence transitions

## Requested Changes (Diff)

### Add
1. **Academic Calendar Management** (SuperAdmin/Registrar tab "calendar")
   - AcademicCalendar data type: { id, session (e.g. "2024/2025"), semester ("First"|"Second"), isActive, startDate, endDate }
   - Stored in AppContext/localStorage as `academicCalendars`
   - Admin UI: table of sessions, button to set one as active, create new session form
   - Active session/semester shown in header or banner on all dashboards
   - All result submission, course registration default to active semester

2. **Grade Appeal Workflow** (new tab "appeals" in Student portal; review tab in Lecturer and HOD)
   - GradeAppeal type: { id, resultId, studentId, studentName, courseId, courseName, reason, desiredGrade, status: "pending_lecturer"|"pending_hod"|"resolved_upheld"|"resolved_revised", lecturerResponse, hodResponse, createdAt }
   - Student: form to submit appeal (select course, write reason), list of own appeals with status
   - Lecturer: incoming appeals tab, can respond (uphold/suggest revision) and route to HOD
   - HOD: final resolution -- uphold or approve revision, with comment
   - Stored in AppContext/localStorage as `gradeAppeals`

3. **In-App Notification Panel** (Bell icon in header for all roles)
   - Notification type: { id, recipientRole, message, link (tab id), read, createdAt }
   - Triggers:
     - Student: results published, amendment approved/rejected, carry-over flagged, appeal resolved
     - Lecturer: result rejected (already has badge, add notification), appeal received
     - HOD: new results to approve, appeal escalated
     - Dean: new results to approve
     - Registrar: new results to approve
   - Bell icon in top nav shows unread count badge
   - Dropdown panel listing notifications, click marks as read and navigates to relevant tab
   - Stored in AppContext/localStorage as `notifications`
   - Helper: `addNotification(role, message, tabId)` in AppContext

4. **SuperAdmin Audit Log** (new tab "audit" in SuperAdmin)
   - AuditEntry type: { id, actorName, actorRole, action, details, timestamp }
   - Actions logged:
     - Login/logout
     - Result submitted, approved at each step, rejected, published
     - Student registered
     - Course added/removed
     - Amendment submitted/approved/rejected
     - Grade appeal submitted/resolved
     - Academic calendar activated
   - UI: filterable table (by role, action type, date range), download CSV
   - Stored in AppContext/localStorage as `auditLog`
   - Helper: `logAudit(actorName, actorRole, action, details)` in AppContext

5. **Improved Student Portal**
   - "My Results" tab: card-based layout per semester instead of plain table; each course shows colored grade badge (A=green, B=teal, C=blue, D=yellow, E=orange, F=red), CA/Exam breakdown, carry-over flag if failed
   - "Dashboard" (overview): GPA trend mini-chart, quick stats (total courses, passed, failed, CGPA), carry-over courses count highlighted in orange
   - "Semester Summary" tab: semester selector pill nav, summary card per semester showing GPA, total credits, pass/fail counts
   - General: smoother layout, section headers, empty states

### Modify
- `AppContext.tsx`: add `academicCalendars`, `gradeAppeals`, `notifications`, `auditLog` state; add helper actions; persist all new state to localStorage; call `logAudit` at key action points; call `addNotification` when publishing results, rejecting results, approving amendments
- `Layout.tsx`: add Bell notification icon in top nav with unread badge; add notification dropdown panel; show active academic session/semester in header; add "calendar" and "audit" to SuperAdmin/Registrar nav; add "appeals" to Student nav; add "appeals" review to Lecturer and HOD nav
- `AdminDashboard.tsx`: add AcademicCalendarTab and AuditLogTab components, wire to new nav tabs
- `StudentDashboard.tsx`: overhaul results and overview tabs with card layout and grade badges
- `HODDashboard.tsx`: add appeals review tab
- `LecturerDashboard.tsx`: add appeals incoming tab

### Remove
- Nothing removed

## Implementation Plan

1. Extend AppContext with new types, state slices, helpers (addNotification, logAudit), localStorage persistence
2. Update Layout to show active session in header, Bell icon with dropdown, and new nav items per role
3. Add AcademicCalendarTab to AdminDashboard
4. Add AuditLogTab to AdminDashboard
5. Add grade appeal submission to StudentDashboard; overhaul results cards and overview
6. Add appeal review tabs to LecturerDashboard and HODDashboard
7. Wire notifications at key action points in AppContext (publish, reject, amendment, appeal)
8. Wire audit logging at key action points
