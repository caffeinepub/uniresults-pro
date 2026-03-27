# UniResults Pro

## Current State
- Full academic management system at Version 41
- AppContext has `addDepartment`, `addFaculty`, `addCourse`, `updateCourse`, `removeCourse`, `addStudent`, `updateStudent`, `addStaffMember`, `updateStaffMember`, `removeStaffMember`
- Missing: `updateFaculty`, `deleteFaculty`, `updateDepartment`, `deleteDepartment`, `deleteStudent`
- No dedicated Faculty/Department management UI with inline edit/delete/search
- Courses management only in SettingsTab without inline search/edit row mode
- No shareable program link button visible to admin

## Requested Changes (Diff)

### Add
- `updateFaculty(id, updates)` and `deleteFaculty(id)` in AppContext (cascade: delete departments and set students/courses to unassigned)
- `updateDepartment(id, updates)` and `deleteDepartment(id)` in AppContext (cascade: update students/courses)
- `deleteStudent(id)` in AppContext with audit log
- New tab: `FacultyDeptManagementTab.tsx` -- full management for faculties and departments:
  - Search/filter input for faculties (live)
  - Faculty table: S/N, Name, Dept Count, Actions (Edit inline, Delete with confirm)
  - Department table: S/N, Name, Faculty, Course Count, Student Count, Actions (Edit inline, Delete with confirm)
  - Add Faculty form and Add Department form (with faculty selector)
  - Toast feedback on all operations
- New tab: `CourseManagementTab.tsx` -- full management for courses:
  - Search by code/title/department
  - Table: S/N, Code, Title, Department, Level, Credit Units, Semester, Actions (Edit inline, Delete)
  - Add course form
- `ShareProgramLink` button component -- copies current app URL to clipboard; shown in AdminDashboard header area
- Student records management improvements in existing Students tab:
  - Inline search by name/matric/reg no
  - Inline Edit button on each row → opens EditStudentModal with all fields (S/N, Reg No, Matric, Name, Dept, State, LGA, Sex, Status)
  - Delete button with confirm dialog

### Modify
- AppContext interface: add new function signatures
- AppContext provider: implement new functions
- AdminDashboard: add "Faculty & Depts" tab and "Courses" tab
- SettingsTab: add share link button showing current URL
- HODDashboard and DeanDashboard: add read-only faculty/dept view with search

### Remove
- Nothing removed

## Implementation Plan
1. Add `updateFaculty`, `deleteFaculty`, `updateDepartment`, `deleteDepartment`, `deleteStudent` to AppContext interface + implementation
2. Create `FacultyDeptManagementTab.tsx` with search, inline edit (name, faculty assignment), delete with confirmation, add forms
3. Create `CourseManagementTab.tsx` with search, inline edit, delete, add form
4. Add `ShareProgramLink` utility button to AdminDashboard top bar (copies window.location.href to clipboard)
5. Enhance Students tab in AdminDashboard with inline search (name/matric/regNo), Edit modal, Delete with confirm
6. Wire new tabs into AdminDashboard nav and expose to HOD/Dean as read-only view
7. Validate and deploy
