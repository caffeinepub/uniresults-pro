# UniResults Pro

## Current State
Version 27 is live. The Senate Report tab (accessible to Registrar, HOD, Dean) already has:
- Faculty Presentation Format with EDU (TCO/TCP/TGP/CGPA/Grade), TP, GSE, Dept subject columns, GCGPA, Outstanding Courses, Remarks
- Level-separated sections with full institutional heading
- Load Demo Data button
- BSc and BSc Ed side-by-side programs
- Education departments use grade labels (Distinction/Credit/Merit/Pass/Fail)
- Promoted/Probation/Withdrawn status based on CGPA
- Graduation month for Level 400

## Requested Changes (Diff)

### Add
- New "Cumulative Results" report format (second Senate format) as a new section/tab or sub-tab within the Senate Report
- Document heading block per level per academic session:
  1. Federal University of Education Kontagora (from institution settings)
  2. Faculty of [auto-detected from student data]
  3. Department of [auto-detected from student data]
  4. [Session Year] Academic Session (e.g. "2024/2025 Academic Session")
  5. "Cumulative Examination Results -- Level [100/200/300/400] -- Undergraduate Full Time"
- Each level+session combination generates a separate document section
- Column structure:
  - S/No
  - Matric Number
  - Student Name
  - EDU: sub-columns TCO, TCP, TGP, CGPA, Grade
  - TP: Nil for levels 100-300; single grade label (Distinction/Credit/Merit/Pass/Fail) for Level 400
  - GSE: sub-columns TCO, TCP, TGP, CGPA, Grade
  - Dept subject (CSC/PHY/etc): sub-columns TCO, TCP, TGP, CGPA, Grade
  - GCGPA
  - Outstanding Courses
  - Remarks:
    - Level 100 → 200: "Promoted" or "Probation"
    - Level 200 → 300: "Promoted", "Probation", or "Withdrawn" (two consecutive probations = Withdrawn)
    - Level 400: "[Month, Year] Graduated" (e.g. "March, 2026") or "Failed"
- Remarks logic: two consecutive probations (e.g. Probation at Level 100 AND Probation at Level 200) = Withdrawn when processing Level 300
- Print-friendly output with all nav/header hidden
- CSV export per level section

### Modify
- Senate Report tab to include this second "Cumulative Results" format as a switchable view
- Demo data to include previousStanding field to simulate two-consecutive-probation cases
- Offline sync: changes saved to localStorage

### Remove
- Nothing removed; previous Senate Report format preserved

## Implementation Plan
1. Add a format toggle in Senate Report tab: "Faculty Presentation" (existing) vs "Cumulative Results" (new)
2. New CumulativeResultsReport component:
   - Groups students by session + level + faculty + department
   - Generates separate document section for each group
   - Heading block: Institution name (from settings), Faculty, Department, Session, Level, "Undergraduate Full Time"
   - Table with grouped sub-column headers (EDU/TP/GSE/Dept)
   - TP logic: Nil badge for L100-300, grade label for L400
   - Remarks logic: Promoted/Probation for L100-L200; Promoted/Probation/Withdrawn (2 consecutive) for L200-L300; Graduated month+year / Failed for L400
3. Update Load Demo Data to add previousStanding and session fields to sample students
4. CSV export per level section
5. Print optimization: @media print shows only report content
6. Offline sync: data persists in localStorage
