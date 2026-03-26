# UniResults Pro

## Current State
The system has 7 faculties (Sciences, Engineering, Arts, Social Sciences, Law, Business, Education) and 26 departments. Computer Science Education (dept 25) and Science Education (dept 26) are under Faculty of Education (id 7). No Faculty of Science Education exists. No Biology Education or Chemistry Education departments exist. DEMO_STUDENTS has 6 sample students. ExtendedStudent has no jambRegNo field.

## Requested Changes (Diff)

### Add
- Faculty of Science Education (id 8) to FULL_FACULTIES
- Biology Education department (id 27, facultyId 8)
- Chemistry Education department (id 28, facultyId 8)
- `jambRegNo?: string` field to ExtendedStudent type
- 63 Biology Education Level 100 students (BIO/2025/001–063) extracted from uploaded admission lists
- 10 Chemistry Education Level 100 students (CHM-EDU/2025/001–010) extracted from uploaded admission list
- Merge logic in useState initializers for students/faculties/departments so new defaults are appended to any existing localStorage data

### Modify
- Computer Science Education (dept 25): change facultyId from BigInt(7) to BigInt(8) — moves it under Faculty of Science Education
- useState for faculties, departments, students: add merge logic to inject missing defaults into existing localStorage data

### Remove
- Nothing removed

## Implementation Plan
1. Update `ExtendedStudent` type to add `jambRegNo?: string`
2. Add Faculty of Science Education to FULL_FACULTIES
3. Update Computer Science Education facultyId to 8
4. Add Biology Education (27) and Chemistry Education (28) to FULL_DEPARTMENTS
5. Create `ADMISSION_2025_BIO` constant: 63 students, departmentId 27, level 100, IDs 100–162
6. Create `ADMISSION_2025_CHM` constant: 10 students, departmentId 28, level 100, IDs 200–209
7. Update DEMO_STUDENTS to spread in both admission arrays
8. Update useState for students/faculties/departments to merge missing defaults (by ID) into any saved localStorage data
