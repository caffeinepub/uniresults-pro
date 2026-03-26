# UniResults Pro

## Current State
SenateReportTab.tsx renders a two-row grouped header table per department per level. All subject-area columns (EDU, CSC, PHY, etc.) use the same 4 sub-columns: TCO, TCP, TGP, and either Grade (education depts) or CGPA. TP is treated like any other prefix and gets the same 4 sub-columns.

## Requested Changes (Diff)

### Add
- A new "Faculty Presentation Report" display format (replace/update the existing Senate Report table rendering) with the following exact column structure:
  - **S/No** (rowspan)
  - **Matric Number** (rowspan)
  - **Name** (rowspan)
  - **EDU** group column → 5 sub-cols: TCO=, TCP=, TGP=, CGPA=, Grade= (Grade shows Distinction/Credit/Merit/Pass/Fail based on CGPA)
  - **TP** single column (no sub-rows) → displays one grade label: Distinction / Credit / Merit / Pass / Fail (derived from TP course result)
  - **Department subject column** (auto-detected: CSC, PHY, CHM, etc. — the non-EDU, non-TP prefix for this dept) → 5 sub-cols: TCO=, TCP=, TGP=, CGPA=, Grade=
  - **GCGPA=** (rowspan)
  - **Outstanding Courses** (rowspan)
  - **Remarks** (rowspan) — Promoted / Probation / Withdrawn for years 1-3; "March, YYYY" for final year
  - **Graduating Year** (rowspan)
- For non-education departments: all subject-area prefixes use 5 sub-cols (TCO, TCP, TGP, CGPA, Grade), no TP special column
- "Load Demo Data" button populates sample students with EDU, TP, and department-specific course results so the new format is visible

### Modify
- `SenateReportTab.tsx`: update table rendering logic to:
  - Detect TP prefix specially: render it as a single-cell column showing the grade label, not 5 sub-cols
  - Render EDU prefix with 5 sub-cols (TCO, TCP, TGP, CGPA, Grade=)
  - Render other prefixes (CSC, PHY, etc.) with 5 sub-cols (TCO, TCP, TGP, CGPA, Grade=)
  - The two-row header must reflect: row1 = group labels (EDU span5, TP span1, CSC/PHY span5, GCGPA, Outstanding, Remarks, Grad Year); row2 = sub-col labels under each group
  - Grade= column shows label (Distinction/Credit/Merit/Pass/Fail) derived from subject-area CGPA
  - TP grade label derived from TP course results specifically (highest/only TP course grade label)
- Update CSV export to include the new columns/format
- AppContext `loadSenateSampleData`: ensure sample students have EDU, TP, and CSC/PHY course results populated

### Remove
- Nothing removed; this replaces/updates the existing table column structure in SenateReportTab

## Implementation Plan
1. In `SenateReportTab.tsx`, update `calcSubjectAreaStats` or add a separate `calcTPGradeLabel` function that returns a single grade label for TP courses
2. Update the two-row `<thead>` to handle:
   - EDU group: colSpan=5, sub-cols: TCO | TCP | TGP | CGPA | Grade
   - TP group: colSpan=1 (no sub-row needed, or rowSpan=2 with label "Grade")
   - Other prefix groups: colSpan=5, sub-cols: TCO | TCP | TGP | CGPA | Grade
3. Update `<tbody>` rows to render accordingly
4. Update CSV export columns
5. Ensure `loadSenateSampleData` in AppContext includes TP course results for sample students
