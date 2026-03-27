# UniResults Pro

## Current State
Staff members (Lecturers, HODs, Deans, Exam Officers, Registrar, Admin) exist in the system as `StaffMember` records with name, staffId, departmentId, email, phone, etc. Login for staff currently only works via Demo Login (role selection from a dropdown with no authentication) or Internet Identity. There are no individual username/password credentials per staff member.

## Requested Changes (Diff)

### Add
- `username` and `password` fields to `StaffMember` interface
- Default credentials auto-generated: username = staffId (e.g. `CSC/STF/001`), password = first name + `@123` (e.g. `Emeka@123`)
- `role` field to `StaffMember` to map them to HOD/Dean/Lecturer/Exam Officer/Registrar/SuperAdmin
- "Staff Login" tab on the Login page with username + password fields
- Staff login lookup: search staffMembers by username, verify password, derive role, log in
- Staff Credentials card in Settings → User Accounts Management: list all staff with their username, masked password, and a reset-password button
- When a new staff member is added (in SettingsTab or elsewhere), auto-generate credentials and show them
- Show staff login credentials (username + temp password) in a modal after creating a new staff account

### Modify
- `StaffMember` interface: add `username?: string`, `password?: string`, `role?: RoleName`
- DEMO_STAFF: add username and password to each demo staff member
- SettingsTab: User Accounts Management section shows staff credentials table with reset-password action
- LoginPage: add a "Staff Login" tab alongside Demo/Student/II tabs; staff enter username + password

### Remove
- Nothing removed; Demo Login tab remains for backward compatibility during testing

## Implementation Plan
1. Update `StaffMember` interface in AppContext to include `username`, `password`, `role`
2. Update DEMO_STAFF with auto-generated credentials and roles
3. Add `handleStaffLogin` function in LoginPage
4. Add Staff Login tab to LoginPage UI with username/password fields
5. Update SettingsTab to show Staff Credentials management (view username, reset password)
6. When new staff is added, show credentials modal
