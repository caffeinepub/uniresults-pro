# UniResults Pro V26: Score Entry Sheet

## Current State
V25 has result entry in the approval workflow but no dedicated score entry sheet per course showing all enrolled students at once, with a print-ready format, signature blocks, and download/upload.

## Requested Changes (Diff)

### Add
- ScoreEntrySheetTab.tsx: accessible from Lecturer, HOD, and Registrar dashboards
- Score table per selected course: S/N, Matric Number, Student Name, CA (input, /40), Exam (input, /60), Total (auto), Grade (auto), GP (auto), Remarks (auto)
- Sheet header: Institution name, Faculty, Department, Course Code/Title/Credit Units, Semester/Session, Lecturer in Charge
- Signature block at bottom (print-friendly, blank line + printed name): Lecturer, HOD, Dean, Moderator (typed name input)
- Download blank CSV template button
- Download filled CSV export button
- Upload CSV with validation (matric numbers must match enrolled students)
- Offline sync: score changes queued; offline banner
- Print button: hides UI chrome, shows clean A4 sheet

### Modify
- LecturerDashboard: add Score Sheet tab
- HODDashboard: add Score Sheet tab
- AdminDashboard (Registrar): add Score Sheet tab
- AppContext: add moderator name storage per course; add enrolled-students-per-course helper

### Remove
- Nothing

## Implementation Plan
1. Create ScoreEntrySheetTab.tsx with course selector, inline score table, header, signature block, download/upload, print support
2. Wire into LecturerDashboard, HODDashboard, AdminDashboard
3. Persist score sheet data via localStorage/AppContext
4. Offline sync integration
