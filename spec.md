# UniResults Pro

## Current State
Version 13 is live with 6 dashboards (SuperAdmin, Registrar, HOD, Dean, Lecturer, Student), full approval chain, analytics, results processing, transcripts, academic calendar, grade appeals, notifications, audit log, graduation clearance, timetable, fee tracking, staff management, search, attendance tracking, student progress, documents, deferral, course assignments, benchmarking, and mobile responsiveness.

Bulk CSV upload exists for: student registration (Registrar), result upload (Lecturer).
Faculty and Department management exists in Registrar dashboard but without bulk upload.
Course management exists but without bulk upload.

## Requested Changes (Diff)

### Add
1. **Exam Scheduling & Invigilation** -- Registrar creates exam timetable (date, time, venue, invigilator); students and lecturers see their exam schedule in a dedicated tab
2. **Student Clearance Certificate** -- Printable certificate generated after graduation clearance is fully approved; includes student details, clearance date, HOD/Dean/Registrar signatures
3. **Course Evaluation / Feedback** -- Students rate courses (1-5 stars) and submit comments at end of semester; HOD/Dean view aggregated ratings and comments per course
4. **Lecturer Performance Report** -- HOD generates per-lecturer report: courses taught, average student scores, pass rates, feedback ratings; exportable as CSV
5. **Carry-Over Registration Automation** -- On semester change, students with failed courses are auto-prompted to re-register; carry-overs appear in a dedicated section in Student portal
6. **Bulk Upload for Courses** -- CSV template download + upload for batch course creation (course code, name, credit units, department, level)
7. **Bulk Upload for Faculties** -- CSV template download + upload for batch faculty creation (faculty name, dean name, faculty code)
8. **Bulk Upload for Departments** -- CSV template download + upload for batch department creation (dept name, dept code, faculty, HOD name)

### Modify
- Registrar dashboard: add Exam Schedule tab, enhance Faculty/Department management with bulk upload buttons
- HOD dashboard: add Lecturer Performance Report tab, Course Feedback view
- Dean dashboard: add Course Feedback aggregated view
- Student dashboard: add Exam Schedule tab, Carry-Over auto-registration prompt, Course Evaluation tab
- Lecturer dashboard: add Exam Schedule tab
- Graduation clearance: add Print Certificate button when status is fully approved

### Remove
- Nothing removed

## Implementation Plan
1. Add examSchedule data model to AppContext (list of exam entries with course, date, time, venue, invigilator)
2. Add courseFeedback data model (studentId, courseCode, rating, comment, session, semester)
3. Add lecturerPerformance derived data (computed from results + feedback)
4. Add ExamScheduleTab component for Registrar (CRUD), and read-only views for Lecturer and Student
5. Add CourseEvaluationTab for Student dashboard (submit rating + comment per registered course)
6. Add CourseFeedbackTab for HOD/Dean dashboards (aggregated ratings, comments, per course)
7. Add LecturerPerformanceTab for HOD dashboard (per-lecturer stats table, CSV export)
8. Add clearance certificate print section in graduation clearance when approved
9. Add carry-over auto-prompt logic in Student dashboard when active semester changes and student has failed courses
10. Add bulk upload (CSV download template + upload + preview + import) to Course Management in Registrar
11. Add bulk upload to Faculty Management in Registrar
12. Add bulk upload to Department Management in Registrar
