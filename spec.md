# UniResults Pro

## Current State
The system has full results processing pipeline with score entry (CA+Exam), approval workflow, and various report formats including departmental, faculty, senate, and Student Academic Record. Pass/Failure/Graduating list tabs exist in Reports but do not match the official NCE format shown in the reference image.

## Requested Changes (Diff)

### Add
- **Official Pass List** in the exact format shown in the reference image:
  - Header: Institution name, "NCE [LEVEL] FULL-TIME GRADUATING STUDENTS RESULT", Session, School/Faculty, Subject Combination, "PASS LIST"
  - Study mode selector: Full-Time / Part-Time / Distance Learning
  - Table columns: S/N, Matric No, Name, then per-subject-area columns (EDU, TP, GSE, + department subjects e.g. BIO/CHE or CSC/PHY etc.), GCGPA, Carry
  - Grade labels in cells: PASS, MERIT, CREDIT, DISTINCTION (derived from CGPA per subject area)
  - Only students who passed all subject areas appear here
  - Pagination (Page X of Y), print footer with date/time
  - Print button
- **Official Failure List** same format but only students who have at least one FAIL in any subject area; shows FAIL label in affected columns
- Subject area columns are dynamic based on subject combination (e.g. BIO-CHE shows BIO and CHE columns; CSC-PHY shows CSC and PHY)
- Grade label derivation from CGPA/scores:
  - DISTINCTION: 3.50 – 4.00
  - MERIT: 2.50 – 3.49
  - CREDIT: 1.50 – 2.49
  - PASS: 1.00 – 1.49
  - FAIL: below 1.00
- These lists are accessible from: Registrar, HOD, Dean, Exam Officer dashboards under Reports tab
- Filters: Session, Level (NCE 1/2/3 or 100L/200L etc.), Department/Subject Combination, Study Mode
- Export as CSV and Print

### Modify
- Existing Pass/Failure/Graduating list tabs in Reports replaced or enhanced with the new official format

### Remove
- Nothing removed

## Implementation Plan
1. Create `PassFailListReport` component with official NCE header format
2. Grade label helper: convert CGPA per subject area to PASS/MERIT/CREDIT/DISTINCTION/FAIL
3. Subject area grouping logic: group courses by prefix (EDU/GSE/BIO/CHE/CSC/PHY/MTH etc.) and compute per-area CGPA
4. TP (Teaching Practice) detected from EDU 301/EDU 401 courses
5. Filter panel: session, level, department, study mode
6. Pass list: only students where all areas >= PASS threshold
7. Failure list: students where any area < PASS threshold, FAIL shown in red
8. Print layout with pagination footer
9. Integrate into Registrar, HOD, Dean, Exam Officer Reports tabs
