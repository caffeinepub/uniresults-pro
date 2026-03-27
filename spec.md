# UniResults Pro

## Current State

- Student and staff photos are only captured/displayed inside the ID Card modals (`StudentIDCardModal`, `StaffIDCardModal`), stored in localStorage under `student_photo_url_<id>` and `staff_photo_url_<staffId>` keys.
- `ExtendedStudent` type has no `photoUrl` field.
- `StaffMember` type has no `photoUrl` field.
- StudentDashboard `OverviewTab` header shows only text (name + matric number), no photo avatar.
- LecturerDashboard has no profile header at all.
- `StudentProfileModal` uses a generic `<User>` icon placeholder instead of the stored photo.
- Staff portals (Lecturer/HOD/Dean) have no photo section.

## Requested Changes (Diff)

### Add
- Photo avatar display in the StudentDashboard OverviewTab header (reads from `student_photo_url_<id>` localStorage key, with webcam/upload inline capture)
- Photo upload section in the StudentDashboard portal so students can update their own photo (webcam or file upload)
- Photo avatar in LecturerDashboard profile header area with upload/webcam capability
- Photo display in HODDashboard and DeanDashboard staff profile header (staff photo)
- `photoUrl?: string` field to `ExtendedStudent` type (optional, for type consistency)
- `photoUrl?: string` field to `StaffMember` type (optional, for type consistency)
- Photo display in `StudentProfileModal` header (replacing the generic User icon with the stored photo)
- A reusable `PhotoAvatar` component that: reads from localStorage by key, shows initials fallback if no photo, and provides an upload/webcam dialog trigger

### Modify
- `StudentDashboard` OverviewTab: add photo avatar next to the student name/matric header; add a small camera icon button to update photo
- `StudentProfileModal`: replace `<User>` icon placeholder with the stored student photo
- `LecturerDashboard`: add a profile card at top of CoursesView showing lecturer photo, name, department, designation
- Student portal info display: ensure the Overview tab shows all relevant student information (name, matric, level, department, faculty, CGPA, classification, advisor, fee status, registration status)

### Remove
- Nothing removed

## Implementation Plan

1. Add `photoUrl?: string` to `ExtendedStudent` and `StaffMember` in `AppContext.tsx`
2. Create a reusable `PhotoAvatar` component (`src/pages/tabs/PhotoAvatar.tsx`) that:
   - Takes `photoKey` (localStorage key), `name` (for initials fallback), `size` (sm/md/lg)
   - Has optional `editable` prop that shows a camera icon button to open upload/webcam dialog
   - Uses existing `useCamera` and `ExternalBlob` patterns from `StudentIDCardModal`
3. Update `StudentDashboard` OverviewTab header: add `<PhotoAvatar>` with `editable` next to name/matric
4. Update `StudentProfileModal` header: replace `<User>` icon with `<PhotoAvatar>` reading from `student_photo_url_<studentId>`
5. Update `LecturerDashboard` CoursesView: add staff photo avatar at top with lecturer info card
6. Ensure student portal Overview shows complete student info (department, faculty, level, status, advisor, fee info, registration status)
7. Add photo to staff-facing student lists (StudentProfileModal already has photo after step 4)
