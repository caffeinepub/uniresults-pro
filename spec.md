# UniResults Pro

## Current State
Version 70 is live. Biology Education has 71 official courses. All other departments use auto-generated courses. The Courses tab in Admin shows all courses with Official/Auto-Generated badges. There is no document scanning feature for course uploads.

## Requested Changes (Diff)

### Add
- **Course Document Scanner** -- a new "Scan Courses" tab/button in the Admin Courses section that allows uploading any document format (PDF, image, Word, Excel, CSV) containing a course list
- Scanner extracts course data: course code, title, credit units, level, semester, status (Core/Elective)
- Side-by-side review: uploaded document preview on the left, extracted course table on the right for editing before import
- Support for pasting raw course data (copy from Word/Excel) as an alternative to file upload
- After review and correction, one-click import integrates the scanned courses into the selected department
- Scanned course history tab showing all previously scanned course documents with thumbnails and extracted data
- "Extra Courses" support -- ability to add extra/elective courses beyond the official list for a department without replacing the official courses

### Modify
- Courses tab in Admin: add "Scan & Import Courses" button alongside existing add/upload options
- Department course view: show count of Official, Auto-Generated, and Extra courses separately

### Remove
- Nothing removed

## Implementation Plan
1. Add "Scan Courses" modal with three tabs: Upload File, Paste Data, Scan History
2. File upload accepts PDF, DOC, DOCX, XLS, XLSX, CSV, and image formats
3. Parser extracts rows into editable table: S/N, Course Code, Title, Units, Level, Semester, Status
4. Department selector and session selector before confirming import
5. Imported courses marked as "Official" and replace auto-generated ones for that department
6. Extra courses tab: add individual courses to a department without affecting official list
7. Scan history: list of all scanned documents with date, department, course count, and re-view option
8. Visual badge in Courses tab: Official (green) / Auto-Generated (gray) / Extra (blue)
