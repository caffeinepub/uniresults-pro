# UniResults Pro

## Current State
Version 51 — Full academic management system for Federal University of Education Kontagora. Has University-only mode with 600-level support, role-based dashboards (SuperAdmin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student), results pipeline, score sheets, course registration, JAMB import, AI scanner for bulk student upload, and all major admin features.

`JambAdmissionScannerTab.tsx` was just created at `src/frontend/src/pages/tabs/JambAdmissionScannerTab.tsx` but not yet wired into any dashboard.

`InstitutionSettings` in AppContext has: name, address, phone, email, website, logoText — no `institutionType` field yet.

## Requested Changes (Diff)

### Add
- `institutionType` field to `InstitutionSettings` interface and state (values: `"university"` | `"nce"` | `"polytechnic"` | `"secondary"` | `"primary"` | `"pre_nursery"`)
- Institution Type Selector dropdown in SettingsTab (prominent, at the top of institution settings card) and in System Init Wizard
- `InstitutionTypeConfig` helper that returns level range, terminology, grading scale, and report labels based on selected type:
  - **University**: Levels 100–600, degrees (B.Sc, B.Ed, B.A etc.), CGPA 0–5, GPA grading
  - **NCE (College of Education)**: Levels 100–300, NCE certificates, Grade Point 0–5
  - **Polytechnic**: Levels ND1/ND2, HND1/HND2 (mapped as 100/200/300/400), OND/HND certificates
  - **Secondary (SS1–SS3 + JS1–JS3)**: Classes SS1, SS2, SS3, JS1, JS2, JS3 — percentage grading (A1–F9 WAEC scale)
  - **Primary (Primary 1–6)**: Classes P1–P6, percentage grading
  - **Pre-Nursery/Nursery (Nursery 1–3)**: Classes N1–N3, developmental assessment (Excellent/Good/Fair/Needs Improvement)
- `LevelSelector` component reused across dashboards — shows appropriate class/level options based `institutionType`
- Dashboard header shows institution type badge
- All level dropdowns (student form, course form, course registration, reports) use `institutionType` config for their options
- JAMB Admission Scanner tab wired into AdminDashboard (`tab: "jamb_import"`) with quick action button
- JAMB Admission Scanner tab also wired into HODDashboard and DeanDashboard
- For NCE: report terminology changes to "NCE Certificate Results" instead of "Senate Report"
- For Polytechnic: levels shown as ND1, ND2, HND1, HND2 in UI
- For Secondary: grading A1–F9 with subject-based results; no CGPA, use percentage and position
- For Primary/Pre-Nursery: simple grade remarks system
- `InstitutionTypeBanner` component in all dashboard headers showing the active institution type with a change link

### Modify
- `InstitutionSettings` type — add `institutionType` field
- `SettingsTab` — add institution type dropdown at top of institution settings card
- `AppContext` default settings — keep `university` as default
- Student form level dropdown — driven by `institutionType` config
- Course form level dropdown — driven by `institutionType` config
- AdminDashboard — add JAMB Import tab + Institution Type Banner
- HODDashboard — add JAMB Import tab + Institution Type Banner
- DeanDashboard — add JAMB Import tab + Institution Type Banner
- All reports (Senate, Dept, Faculty) — show appropriate title based on institution type

### Remove
- Nothing removed

## Implementation Plan
1. Add `institutionType` to `InstitutionSettings` interface and default in AppContext
2. Create `src/frontend/src/utils/institutionConfig.ts` — exports `getInstitutionConfig(type)` returning levels, levelLabels, gradeScale, reportTitle, certificateTitle, semesterLabel
3. Update `SettingsTab.tsx` — add institution type `<select>` at top of institution settings form
4. Update student add/edit form level dropdown to use `institutionConfig.levels`
5. Update course form level dropdown similarly
6. Add `InstitutionTypeBanner` in AdminDashboard, HODDashboard, DeanDashboard headers
7. Wire `JambAdmissionScannerTab` into AdminDashboard (import + tab route `jamb_import` + quick action)
8. Wire `JambAdmissionScannerTab` into HODDashboard and DeanDashboard
9. Update Senate/Faculty report titles to use institution config label
