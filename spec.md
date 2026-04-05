# UniResults Pro

## Current State

Version 79 with full academic management system. All role dashboards (Admin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student) use a **horizontal scrollable quick-action button bar** for navigation. PGAdmissionTab has only 4 status states (pending → shortlisted → admitted → rejected) with no full workflow (no interview scheduling, no admission letter, no matriculation, no PG-specific registration). ResultAmendmentTab exists but is NOT imported/wired into any dashboard tabs — students can request via StudentDashboard but HOD/Dean/Registrar see amendments only inline in their overview, not in a dedicated tab. AccreditationReportTab is basic (staff list, course list, facilities checklist) without result statistics, graduation rates, or NUC/NCCE self-study sections.

## Requested Changes (Diff)

### Add
- **Sidebar Navigation**: Collapsible sidebar on ALL screens (Admin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student dashboards). Default closed/icon-only, expands on hover or hamburger click. Shows institution name + role at top when expanded. Groups menu items by category (Academic, Results, Administration, etc.).
- **PG Admission Full Pipeline**: Extend PGApplication interface with stages: screening_scheduled, interview_scheduled, interview_done, shortlisted, admission_letter_issued, registered, matriculated, active_pg_student. Add: interview scheduling (date/time/venue), document upload checklist, admission letter generation (printable), PG registration form (courses at 700/800 level), matriculation record.
- **Result Amendment Full Pipeline**: Wire ResultAmendmentTab into Admin, HOD, Dean dashboards as a proper tab ("result_amendment" tab key). Add "Student Amendment Request" tab in StudentDashboard so students can initiate from a dedicated tab (not just inline in results). Add evidence file attachment field to AmendmentRequest interface. Full pipeline: Student requests → Lecturer notified → HOD reviews → Dean reviews → Registrar approves/rejects → student notified in inbox.
- **Accreditation Reports Enhancement**: Add NUC/NCCE self-study sections: Student enrolment statistics by level/gender, Graduation rates by session, Staff qualifications table, Result statistics (pass rate, grade distribution by course), Facilities assessment, Programme learning outcomes, Compliance checklist. Export/print as formatted report.

### Modify
- All dashboard main layout: replace horizontal quick-action button bar with a collapsible sidebar. The sidebar is always collapsed (icon-only) by default and can be toggled. The main content area takes full width when sidebar is collapsed.
- PGAdmissionTab: extend status enum and add new workflow stages UI.
- AppContext AmendmentRequest: add `attachmentUrl?: string` and `studentInitiated: boolean` fields.

### Remove
- Horizontal quick-action button pills in Admin/HOD/Dean/Lecturer/ExamOfficer/Student dashboards (replaced by sidebar).

## Implementation Plan

1. Create a shared `DashboardSidebar.tsx` component in `src/frontend/src/components/` that renders a collapsible icon sidebar. Accept props: `items` (array of {label, tab, icon, badge?, group}), `activeTab`, `onTabChange`, `roleName`, `institutionName`. Collapsed = 56px wide showing icons + tooltips. Expanded = 220px wide. Toggle button (hamburger/chevron) at top.
2. Update `AdminDashboard.tsx`, `HODDashboard.tsx`, `DeanDashboard.tsx`, `LecturerDashboard.tsx`, `ExamOfficerDashboard.tsx`, `StudentDashboard.tsx`, and the Registrar view (if in AdminDashboard) to use DashboardSidebar instead of the button bar. Wrap content in a flex layout: sidebar on left, content on right.
3. Add `result_amendment` tab key to Admin, HOD, Dean, and Registrar navigation items. Import and render `<ResultAmendmentTab userRole={...} />` for each.
4. Add `amendments` tab in StudentDashboard showing the student's own amendment requests with status tracking and a button to file a new request.
5. Extend `PGAdmissionTab.tsx`: add interview scheduling modal, document checklist, admission letter modal (printable), PG registration step, matriculation step. Update status flow with new stages.
6. Update `PGApplyPage.tsx` public form to upload supporting documents (any file type).
7. Update `AccreditationReportTab.tsx`: add tabbed sections for Enrolment Stats, Graduation Rates, Staff Qualifications, Result Statistics, Facilities, Programme Outcomes, Compliance Checklist.
8. All changes must preserve existing functionality and all previous components.
