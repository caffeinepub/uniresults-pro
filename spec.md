# UniResults Pro

## Current State
The system has an Exam Officer dashboard scoped to a single department (filters results by departmentId of the current user). The Dean dashboard shows faculty-level results per department separately. There is no cross-departmental result collation layer -- students in combined programmes (e.g. Education + Computer Science, NCE CSC+PHY+MAT+EDU+GSE) do not have their results merged across departments into a single compiled view.

## Requested Changes (Diff)

### Add
- **Faculty Result Collation Dashboard** (new tab in ExamOfficerDashboard): Exam Officer at faculty level sees ALL departments within the faculty and their result submission status (Submitted / Pending / Missing). Can collate all departmental results into a single faculty-wide compiled sheet.
- **Cross-Departmental Student Result Compilation**: For students in combined programmes (EDU+CSC, EDU+PHY, NCE CSC+PHY, CSC+MAT+EDU+GSE), automatically detect all courses a student is registered for across departments, merge them into one complete result record for that student.
- **Combined Programme Student Detection**: Identify students whose registered courses span multiple departments (by matching course departmentIds against student's registered courses). Flag them as "Combined Programme" students.
- **Dean Alert System**: Auto-generate in-app alerts to Dean when (a) a department is late/missing submission, (b) faculty collation is completed and ready for review, (c) result anomaly detected (missing scores, duplicate entries).
- **Faculty Collation Tab in Dean Dashboard**: Dean sees the fully collated faculty result -- all students, all their courses across departments, in one compiled view with CGPA calculated from all courses regardless of source department.
- **FacultyCollationTab.tsx**: New tab component used in both ExamOfficerDashboard and DeanDashboard.
- **CombinedResultsTab.tsx**: New tab showing combined programme student results with courses from all departments merged.
- **GSE/EDU Course Integration**: GSE (General Studies in Education) and EDU courses are treated as shared courses that appear in combined results for all students who registered them, regardless of home department.

### Modify
- **ExamOfficerDashboard.tsx**: Add "Faculty Collation" tab and "Combined Results" tab to quick actions. Expand scope -- Exam Officer can now view all departments in their faculty (not just their own department).
- **DeanDashboard.tsx**: Add "Faculty Collation" tab and Dean alerts panel showing pending collation alerts.
- **AppContext**: Add facultyCollationAlerts state, collatedResults state, and helper functions to detect combined programme students and merge cross-departmental results.

### Remove
- Nothing removed; all existing components preserved.

## Implementation Plan
1. Add `facultyCollationAlerts` and `collatedResults` arrays to AppContext with helper: `getStudentCombinedResults(studentId)` that merges all courses/results for a student across departments.
2. Add `detectCombinedProgrammeStudents(facultyId)` helper that returns students registered for courses in more than one department within a faculty.
3. Create `FacultyCollationTab.tsx`: table of all departments in the faculty with columns: Department, Total Courses, Scores Entered, Submitted, Status badge, Collate button. Bottom section shows collated result once triggered.
4. Create `CombinedResultsTab.tsx`: lists all combined-programme students with their merged course list, total credit units, CGPA from all courses combined, with print/export.
5. Update `ExamOfficerDashboard.tsx`: add Faculty Collation and Combined Results tabs, expand result scope to faculty-level.
6. Update `DeanDashboard.tsx`: add Faculty Collation tab + alerts banner for pending collation notifications.
7. Dean alert triggers: when Exam Officer clicks Collate, a notification is pushed to Dean's alerts; also auto-alert if any dept has no submissions 2 weeks after semester start.
