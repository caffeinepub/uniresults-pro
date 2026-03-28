# UniResults Pro

## Current State
Version 59 is live with course registration showing both semesters side by side, carryover auto-selection, Core/Elective badges, credit tracking (min 16 / max 24), and auto-suggest buttons. Student records do not currently distinguish UTME vs DE entry mode, and no prerequisite enforcement exists.

## Requested Changes (Diff)

### Add
- Entry Mode field (UTME / Direct Entry) on student records (registration form, edit form, student profile, bulk import)
- Prerequisite configuration per course: Admin/HOD can set prerequisite course(s) for any course
- Prerequisite enforcement in registration portal: if a course has a prerequisite that the student has not passed, the Select button is disabled with a tooltip showing the required prerequisite
- DE-specific rule: when a DE student opens Course Registration, all 100-level GST courses are shown at the top of the First Semester column and auto-selected/locked (must register them first)
- Graduation eligibility panel updates: show UTME vs DE credit requirement (120 vs 90), all-core-courses check, and semester count vs min/max (UTME: 8-12, DE: 6-10)
- Semester count tracker per student: counts semesters they have been registered; shown in student profile and graduation panel
- Graduation requirements display in student portal: progress bar showing credits passed vs required (120 UTME / 90 DE), core courses outstanding, semesters used vs limit

### Modify
- Credit limits per semester: change min from 16 to 15; max stays at 24
- Carryover enforcement: carryover courses are auto-selected AND locked (cannot be deselected) -- they must be registered first for returning students
- Student add/edit form: add Entry Mode dropdown (UTME / Direct Entry)
- Batch Graduation processing: use UTME/DE-aware credit requirement (120 vs 90) when checking eligibility
- Student profile modal: show Entry Mode, semesters registered, credits passed vs required

### Remove
- Nothing removed

## Implementation Plan
1. Add `entryMode: 'UTME' | 'DE'` field to student data model and default existing students to 'UTME'
2. Add Entry Mode dropdown to Add Student form, Edit Student form, and Self-Registration form
3. Update course registration credit minimum from 16 to 15 across all level rules
4. Lock carryover courses (non-removable) in registration portal for returning students
5. Add prerequisite field to course data model; Admin/HOD course edit form gets a 'Prerequisite Course' multi-select
6. In registration portal, check if student has a passing grade in prerequisite before allowing selection; show disabled state with tooltip
7. Add DE rule: for DE students, extract all 100-level GST courses, show them locked at top of First Semester column
8. Update graduation eligibility panel: use entryMode to pick 120 vs 90 credit requirement; check all core courses passed; calculate semesters registered vs UTME(8-12)/DE(6-10) limits
9. Add semester counter to student records (increments each time a registration is submitted for a new semester)
10. Display graduation progress in student portal overview: credits bar, core courses status, semester count
11. Update Batch Graduation report to use UTME/DE-aware thresholds
