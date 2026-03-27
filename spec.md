# UniResults Pro

## Current State

- AcademicCalendar has `registrationOpen` and `addDropOpen` booleans, toggled manually by Registrar
- No deadline date for add/drop auto-close
- No postgraduate programme support (MSc, PGDE, PhD, PGD)
- Student levels are 100-600 (undergraduate only)
- Course registration portal in StudentDashboard shows portal status but no PG-specific flows
- No portal status banner prominently shown to students when portal is closed

## Requested Changes (Diff)

### Add
- `addDropDeadline` (optional date string) to AcademicCalendar interface — Registrar sets mid-semester break cutoff date; system auto-flags when deadline passed
- `programmeType` field to ExtendedStudent: "Undergraduate" | "Postgraduate"
- `pgLevel` field to ExtendedStudent: "MSc" | "PGDE" | "PhD" | "PGD" | "MBA" | "MEd" | "MA" | null
- PG course registration flow in StudentDashboard — PG students see all postgraduate courses for their department with PG credit rules (min 9, max 18 units per semester for Masters; min 6, max 12 for PhD)
- PG programmes section in Registrar/AdminDashboard — add students as PG (MSc/PGDE/PhD/PGD/MBA/MEd/MA), assign to departments
- Portal status banner in StudentDashboard course registration — clearly shows whether registration portal is open or closed with reason
- Add/Drop period status badge — shows open/closed with deadline date if set
- PG courses seed data — sample PG-level courses (700-level) for existing departments
- Registrar portal management panel — dedicated "Portal Management" sub-tab in Academic Calendar showing all sessions with open/close buttons and deadline picker in one clean view

### Modify
- AcademicCalendar interface: add `addDropDeadline?: string`
- ExtendedStudent type: add `programmeType?: string` and `pgLevel?: string`
- DEMO_CALENDARS: add `addDropDeadline` field
- AcademicCalendarTab in AdminDashboard: add deadline date picker for add/drop, show auto-expired badge if deadline passed
- StudentDashboard course registration: detect PG students and show PG-appropriate credit rules and courses
- Add Student form: add Programme Type selector (Undergraduate/Postgraduate) and PG Level selector when PG is selected

### Remove
- Nothing removed

## Implementation Plan

1. Update `AcademicCalendar` interface in AppContext to add `addDropDeadline?: string`
2. Update `ExtendedStudent` type in AppContext to add `programmeType` and `pgLevel`
3. Add PG seed courses (700/800-level) to DEMO_COURSES or initial data
4. Update `AcademicCalendarTab` in AdminDashboard:
   - Add deadline date picker in the Add Session dialog and inline edit for existing sessions
   - Show auto-close badge when current date > addDropDeadline
   - Add a Portal Status summary card at the top showing active semester registration/add-drop status
5. Update `Add Student` dialog in AdminDashboard/BulkRegistrationTab:
   - Add Programme Type (UG/PG) dropdown
   - Show PG Level selector (MSc/PGDE/PhD/PGD/MBA/MEd/MA) when PG is selected
6. Update StudentDashboard course registration:
   - Detect if student is PG (`programmeType === 'Postgraduate'`)
   - Show PG-specific credit limits and available PG courses (level 700/800)
   - Show prominent portal open/closed banner with deadline info
7. Update DEMO_CALENDARS to include `addDropDeadline`
8. Validate, build, deploy
