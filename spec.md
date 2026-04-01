# UniResults Pro

## Current State
Version 74 with Student Academic Record format (NCE 1/2/3 per year, per-subject row summaries, TCO/TCP/TGP/CGPA/GRADE/REMARK). Score entry pipeline exists (Lecturer → HOD → Dean → Registrar). Biology Education (71 courses) and Computer Science Education (73 courses) are official; others auto-generated. Results visible in role-based dashboards.

## Requested Changes (Diff)

### Add
- Public matric number lookup page (`/results`) -- no login required; enter matric number → view full Student Academic Record for that student (published results only)
- Auto-populate Student Academic Record from published score entry data (CA + Exam totals, grades, GPs calculated from actual score sheets)
- Institution-type-aware format: NCE (NCE 1/2/3), University (100L/200L/300L/400L/500L/600L), Polytechnic (ND1/ND2/HND1/HND2)
- Per-subject row summaries per year/level: EDU, GSE, CSC, CHE, BIO, PHY, MTH etc. with TCO, TCP, TGP, CGPA, GRADE, REMARK
- Cumulative summary section across all years/levels
- Student Academic Record tab/button on ALL role dashboards (Admin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student)
- Results only show in Academic Record once Registrar has published them

### Modify
- Student Academic Record component: wire to actual score data instead of mock/static data
- All dashboards: add prominent "View Academic Record" quick action
- Student portal: show own Academic Record auto-populated from published results

### Remove
- Nothing removed

## Implementation Plan
1. Create `AcademicRecordViewer` component that reads from published score data in localStorage, groups by year/level and subject area, calculates TCO/TCP/TGP/CGPA per group and cumulative
2. Add institution-type adapter: NCE uses NCE1/2/3 labels, University uses 100L-600L, Polytechnic uses ND1/ND2/HND1/HND2
3. Add `/results` public route with matric number search input → renders AcademicRecordViewer for matched student (published only)
4. Add "Academic Record" button/tab to Admin, Registrar, HOD, Dean, Lecturer, Exam Officer dashboards with student search
5. Wire Student portal Academic Record tab to actual published score data
6. Print-ready styling for the record
