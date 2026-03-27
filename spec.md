# UniResults Pro — Version 49

## Current State

UniResults Pro is a comprehensive Nigerian academic management system at Version 48 with:
- Role-based dashboards: SuperAdmin, Registrar, HOD, Dean, Lecturer, Exam Officer, Student
- Students from Biology Ed, Chemistry Ed, Computer Science Ed, Mathematics Ed under Faculty of Science Education
- Course registration portal: two-semester side-by-side, carryover auto-select, credit limits
- Score entry, results processing pipeline, approval workflow
- Courses for CSC, BIO, CHM, MTH, and Education departments with partial NUC course listings
- JAMB reg numbers stored on students but no dedicated import UI
- No SIWES management module
- No JAMB Admission Import feature
- GSE courses partially implemented (GSE101, GSE201, GSE301) but not complete

## Requested Changes (Diff)

### Add

1. **JAMB Admission Import Tab** (AdminDashboard and Registrar Dashboard)
   - Paste CSV text area OR file upload (CSV/Excel)
   - Expected columns: Reg No, Surname, Firstname, Other Names, Course (department), State, LGA, Sex
   - Preview table of parsed candidates before importing
   - Auto-detect department from JAMB course name (e.g. "Computer Science Education" → CSC Ed department)
   - Map to existing faculty/department or allow creating new department on import
   - Import button creates student records with jambRegNo, auto-generates matric numbers, status = Accepted
   - Duplicate detection by JAMB reg no (skip or update)
   - CSV template download

2. **Complete NUC Curriculum Course Catalogs** for all Education departments with real Nigerian university course codes/titles:

   **Biology Education (BIO Ed) — all 6 levels × 2 semesters:**
   - 100L: BIO101 (General Biology I, 3cr), BIO102 (General Biology II, 3cr), BIO103 (General Biology Practical I, 1cr), BIO104 (General Biology Practical II, 1cr), CHM101 (General Chemistry I, 3cr), PHY101 (General Physics I, 3cr), MTH101 (Elementary Mathematics I, 3cr), MTH102 (Elementary Mathematics II, 3cr), EDU101 (Introduction to Education, 2cr), EDU102 (History of Education in Nigeria, 2cr), GSE101 (Use of English I, 2cr), GSE102 (Use of English II, 2cr), GSE103 (Nigerian Peoples and Culture, 2cr)
   - 200L: BIO201 (Genetics I, 3cr), BIO202 (Cell Biology, 3cr), BIO203 (Botany I, 3cr), BIO204 (Zoology I, 3cr), BIO205 (Ecology, 3cr), BIO206 (Microbiology I, 3cr), EDU201 (Educational Psychology I, 3cr), EDU202 (Principles of Teaching, 2cr), GSE201 (Philosophy and Logic, 2cr), GSE202 (Entrepreneurship I, 2cr)
   - 300L: BIO301 (Genetics II, 3cr), BIO302 (Plant Physiology, 3cr), BIO303 (Animal Physiology, 3cr), BIO304 (Microbiology II, 3cr), BIO305 (Botany II, 3cr), EDU301 (Curriculum Development, 3cr), EDU302 (Measurement and Evaluation, 3cr), EDU303 (Educational Technology, 2cr), GSE301 (Entrepreneurship II, 2cr), SIWES (Students Industrial Work Experience Scheme, 6cr — Elective, First Sem)
   - 400L: BIO401 (Ecology and Environmental Biology, 3cr), BIO402 (Molecular Biology, 3cr), BIO403 (Research Methods in Biology, 3cr), BIO404 (Parasitology, 3cr), BIO405 (Virology, 3cr), EDU401 (Educational Administration, 2cr), EDU402 (Special Education, 2cr), EDU403 (Research Project, 6cr), EDU404 (Teaching Practice, 6cr)

   **Chemistry Education (CHM Ed) — all levels:**
   - 100L: CHM101 (General Chemistry I, 3cr), CHM102 (General Chemistry II, 3cr), CHM103 (General Chemistry Practical I, 1cr), CHM104 (General Chemistry Practical II, 1cr), MTH101 (Elementary Mathematics I, 3cr), PHY101 (General Physics I, 3cr), EDU101 (Introduction to Education, 2cr), EDU102 (History of Education in Nigeria, 2cr), GSE101 (Use of English I, 2cr), GSE102 (Use of English II, 2cr), GSE103 (Nigerian Peoples and Culture, 2cr)
   - 200L: CHM201 (Physical Chemistry I, 3cr), CHM202 (Organic Chemistry I, 3cr), CHM203 (Inorganic Chemistry I, 3cr), CHM204 (Analytical Chemistry I, 3cr), CHM205 (Physical Chemistry Practical, 1cr), EDU201 (Educational Psychology I, 3cr), EDU202 (Principles of Teaching, 2cr), GSE201 (Philosophy and Logic, 2cr), GSE202 (Entrepreneurship I, 2cr)
   - 300L: CHM301 (Physical Chemistry II, 3cr), CHM302 (Organic Chemistry II, 3cr), CHM303 (Inorganic Chemistry II, 3cr), CHM304 (Analytical Chemistry II, 3cr), CHM305 (Industrial Chemistry, 3cr), EDU301 (Curriculum Development, 3cr), EDU302 (Measurement and Evaluation, 3cr), EDU303 (Educational Technology, 2cr), SIWES (SIWES, 6cr — Elective)
   - 400L: CHM401 (Advanced Organic Chemistry, 3cr), CHM402 (Environmental Chemistry, 3cr), CHM403 (Research Methods, 3cr), CHM404 (Polymer Chemistry, 3cr), EDU401 (Educational Administration, 2cr), EDU403 (Research Project, 6cr), EDU404 (Teaching Practice, 6cr)

   **Computer Science Education (CSE) — all levels:**
   - 100L: CSC101 (Introduction to Computing, 3cr), CSC102 (Computer Programming I, 3cr), CSC103 (Computer Hardware, 2cr), MTH101 (Elementary Mathematics I, 3cr), MTH102 (Elementary Mathematics II, 3cr), EDU101 (Introduction to Education, 2cr), EDU102 (History of Education in Nigeria, 2cr), GSE101 (Use of English I, 2cr), GSE102 (Use of English II, 2cr), GSE103 (Nigerian Peoples and Culture, 2cr)
   - 200L: CSC201 (Data Structures, 3cr), CSC202 (Computer Programming II, 3cr), CSC203 (Database Systems I, 3cr), CSC204 (Systems Analysis, 3cr), CSC205 (Numerical Methods, 3cr), EDU201 (Educational Psychology I, 3cr), EDU202 (Principles of Teaching, 2cr), GSE201 (Philosophy and Logic, 2cr), GSE202 (Entrepreneurship I, 2cr)
   - 300L: CSC301 (Algorithms and Complexity, 3cr), CSC302 (Operating Systems, 3cr), CSC303 (Computer Networks, 3cr), CSC304 (Software Engineering I, 3cr), CSC305 (Database Systems II, 3cr), EDU301 (Curriculum Development, 3cr), EDU302 (Measurement and Evaluation, 3cr), EDU303 (Educational Technology, 2cr), SIWES (SIWES, 6cr — Elective)
   - 400L: CSC401 (Artificial Intelligence, 3cr), CSC402 (Software Engineering II, 3cr), CSC403 (Computer Graphics, 3cr), CSC404 (Research Methods in Computing, 3cr), CSC405 (Mobile Application Development, 3cr), EDU401 (Educational Administration, 2cr), EDU403 (Research Project, 6cr), EDU404 (Teaching Practice, 6cr)

   **Mathematics Education (MTE) — all levels:**
   - 100L: MTH101 (Elementary Mathematics I, 3cr), MTH102 (Elementary Mathematics II, 3cr), MTH103 (Logic and Set Theory, 3cr), MTH104 (Trigonometry and Analytic Geometry, 3cr), CSC101 (Introduction to Computing, 2cr), EDU101 (Introduction to Education, 2cr), EDU102 (History of Education in Nigeria, 2cr), GSE101 (Use of English I, 2cr), GSE102 (Use of English II, 2cr), GSE103 (Nigerian Peoples and Culture, 2cr)
   - 200L: MTH201 (Mathematical Analysis I, 3cr), MTH202 (Linear Algebra, 3cr), MTH203 (Abstract Algebra I, 3cr), MTH204 (Probability and Statistics I, 3cr), MTH205 (Real Analysis, 3cr), EDU201 (Educational Psychology I, 3cr), EDU202 (Principles of Teaching, 2cr), GSE201 (Philosophy and Logic, 2cr), GSE202 (Entrepreneurship I, 2cr)
   - 300L: MTH301 (Mathematical Analysis II, 3cr), MTH302 (Abstract Algebra II, 3cr), MTH303 (Numerical Analysis, 3cr), MTH304 (Probability and Statistics II, 3cr), MTH305 (Differential Equations, 3cr), EDU301 (Curriculum Development, 3cr), EDU302 (Measurement and Evaluation, 3cr), EDU303 (Educational Technology, 2cr), SIWES (SIWES, 6cr — Elective)
   - 400L: MTH401 (Functional Analysis, 3cr), MTH402 (Operations Research, 3cr), MTH403 (Research Methods in Mathematics, 3cr), MTH404 (Complex Analysis, 3cr), EDU401 (Educational Administration, 2cr), EDU403 (Research Project, 6cr), EDU404 (Teaching Practice, 6cr)

3. **Complete GSE (General Studies Education) Course Catalog:**
   - GSE101: Use of English I (2cr, 100L, First Sem, Core)
   - GSE102: Use of English II (2cr, 100L, Second Sem, Core)
   - GSE103: Nigerian Peoples and Culture (2cr, 100L, Second Sem, Core)
   - GSE104: History and Philosophy of Science (2cr, 100L, First Sem, Core)
   - GSE201: Philosophy and Logic (2cr, 200L, First Sem, Core)
   - GSE202: Entrepreneurship I (2cr, 200L, Second Sem, Core)
   - GSE203: Peace Studies and Conflict Resolution (2cr, 200L, First Sem, Elective)
   - GSE204: Introduction to Computer Applications (2cr, 200L, Second Sem, Elective)
   - GSE301: Entrepreneurship II (2cr, 300L, First Sem, Core)
   - GSE302: Environmental and Occupational Health (2cr, 300L, Second Sem, Elective)
   - GSE303: Introduction to Public Administration (2cr, 300L, First Sem, Elective)
   All GSE courses are cross-departmental (apply to all departments in Faculty of Science Education)

4. **SIWES Course + Management Module:**
   - SIWES appears as a registerable course (code: SIWES, 6 credit units, Elective, 300L/First Sem or 200L for some depts)
   - Dedicated SIWES Management Tab (in AdminDashboard, HOD Dashboard)
   - Placement record per student: Company Name, Supervisor Name, Supervisor Phone, Start Date, End Date, Location, Status (Pending Placement, Placed, Active, Completed, Failed)
   - Log Book submission tracking: Submitted / Not Submitted
   - Supervisor evaluation: score 0–100
   - SIWES Coordinator can update placement status and log scores
   - Students who register SIWES see their placement details in student portal
   - SIWES score feeds into results as a course grade

### Modify

- Replace partial/stub EDU and CSC course entries with the full NUC curriculum above
- Update FULL_COURSES array in AppContext.tsx to include all new courses, ensuring correct department IDs and level extraction from course code
- Ensure GSE courses appear for ALL departments under Faculty of Science Education (cross-departmental)
- Ensure SIWES appears in course registration for 300-level students in all Science Education departments

### Remove

- Remove stub/duplicate course entries for EDU, CSC, BIO, CHM, MTH that are replaced by full NUC catalog

## Implementation Plan

1. Add JAMB Admission Import tab component (`JAMBImportTab.tsx`) with CSV paste/upload, preview table, department auto-detect, duplicate check, and batch import
2. Add SIWES Management tab component (`SIWESManagementTab.tsx`) with placement records, log book tracking, supervisor evaluation, and score entry
3. Add SIWES to FULL_COURSES as a real registerable course for 300L across all Science Ed departments
4. Expand FULL_COURSES in AppContext.tsx with complete NUC curriculum for BIO Ed, CHM Ed, CSE, MTE, and complete GSE catalog — all with correct codes, titles, credit units, levels, semesters, and core/elective flags
5. Wire JAMBImportTab into AdminDashboard under Admissions section and Registrar Dashboard
6. Wire SIWESManagementTab into AdminDashboard, HOD Dashboard, and Student Dashboard (read-only placement view)
7. Ensure course registration portal auto-includes SIWES for eligible 300L students
8. Add SIWES score to results processing pipeline (SIWES treated as a course result)
