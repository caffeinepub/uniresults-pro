import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AcademicResult, Course, Department, Student } from "../backend.d";

export type RoleName =
  | "SuperAdmin"
  | "Registrar"
  | "HOD"
  | "Lecturer"
  | "Student"
  | "Dean"
  | null;

export interface AppUser {
  name: string;
  role: RoleName;
  principal: string;
  departmentId?: bigint;
}

export type ExtendedStudent = Student & {
  gender?: string;
  dob?: string;
  email?: string;
  phone?: string;
  previousStanding?: string;
};

export type ExtendedResult = AcademicResult & {
  rejectionReason?: string;
};

export type ExtendedDepartment = Department & {
  facultyId?: bigint;
};

export interface Faculty {
  id: bigint;
  name: string;
}

export interface InstitutionSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoText: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSaved: string | null;
}

export interface CourseRegistration {
  studentId: bigint;
  courseId: bigint;
  semester: string;
}

export interface AmendmentRequest {
  id: bigint;
  resultId: bigint;
  studentId: bigint;
  courseId: bigint;
  originalCa: number;
  originalExam: number;
  newCa: number;
  newExam: number;
  reason: string;
  lecturerName: string;
  status:
    | "pending_hod"
    | "pending_dean"
    | "pending_registrar"
    | "approved"
    | "rejected";
  createdAt: string;
}

export interface AcademicCalendar {
  id: bigint;
  session: string;
  semester: "First" | "Second";
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface GradeAppeal {
  id: bigint;
  resultId: bigint;
  studentId: bigint;
  studentName: string;
  courseId: bigint;
  courseName: string;
  originalGrade: string;
  reason: string;
  status:
    | "pending_lecturer"
    | "pending_hod"
    | "resolved_upheld"
    | "resolved_revised";
  lecturerResponse?: string;
  hodResponse?: string;
  createdAt: string;
}

export interface AppNotification {
  id: bigint;
  recipientRole: string;
  message: string;
  tabLink?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: bigint;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface GraduationApplication {
  id: bigint;
  studentId: bigint;
  studentName: string;
  matric: string;
  department: string;
  session: string;
  submittedAt: string;
  status:
    | "pending_hod"
    | "pending_dean"
    | "pending_registrar"
    | "approved"
    | "rejected";
  hodNote?: string;
  deanNote?: string;
  registrarNote?: string;
  creditCheck: boolean;
  carryoverCheck: boolean;
}

export interface TimetableEntry {
  id: bigint;
  courseId: bigint;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
  venue: string;
  semester: string;
}

export interface StudentFeeRecord {
  id: bigint;
  studentId: bigint;
  session: string;
  tuitionAmount: number;
  amountPaid: number;
  paymentDate?: string;
  status: "paid" | "partial" | "outstanding";
  notes?: string;
}

export interface StaffMember {
  id: bigint;
  name: string;
  staffId: string;
  departmentId: bigint;
  facultyId: bigint;
  qualification: string;
  designation:
    | "Graduate Assistant"
    | "Assistant Lecturer"
    | "Lecturer II"
    | "Lecturer I"
    | "Senior Lecturer"
    | "Associate Professor"
    | "Professor";
  courseIds: bigint[];
  dateJoined: string;
  email?: string;
  phone?: string;
}

export interface SemesterSeal {
  id: bigint;
  semester: string;
  session: string;
  sealedAt: string;
  sealedBy: string;
}

export interface DeferralApplication {
  id: bigint;
  studentId: bigint;
  studentName: string;
  matric: string;
  reason: string;
  returnDate: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  registrarNote?: string;
}

export interface AttendanceSession {
  id: bigint;
  courseId: bigint;
  date: string;
  lecturerName: string;
  records: { studentId: bigint; present: boolean }[];
}

export interface StudentDocument {
  id: bigint;
  studentId: bigint;
  name: string;
  docType: "admission_letter" | "id_card" | "certificate" | "other";
  uploadedAt: string;
  dataUrl: string;
}

export interface ExamScheduleEntry {
  id: bigint;
  courseCode: string;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  invigilator: string;
  session: string;
  semester: string;
}

export interface CourseFeedback {
  id: bigint;
  studentId: bigint;
  studentName: string;
  courseCode: string;
  courseName: string;
  rating: number;
  comment: string;
  session: string;
  semester: string;
  submittedAt: string;
}

interface AppState {
  currentUser: AppUser | null;
  departments: ExtendedDepartment[];
  faculties: Faculty[];
  courses: Course[];
  students: ExtendedStudent[];
  results: ExtendedResult[];
  courseRegistrations: CourseRegistration[];
  amendmentRequests: AmendmentRequest[];
  academicCalendars: AcademicCalendar[];
  gradeAppeals: GradeAppeal[];
  notifications: AppNotification[];
  auditLog: AuditEntry[];
  graduationApplications: GraduationApplication[];
  timetableEntries: TimetableEntry[];
  feeRecords: StudentFeeRecord[];
  staffMembers: StaffMember[];
  semesterSeals: SemesterSeal[];
  deferralApplications: DeferralApplication[];
  attendanceSessions: AttendanceSession[];
  studentDocuments: StudentDocument[];
  examSchedule: ExamScheduleEntry[];
  courseFeedback: CourseFeedback[];
  institutionSettings: InstitutionSettings;
  syncStatus: SyncStatus;
  seeded: boolean;
  moderatorNames: Record<string, string>;
}

interface AppContextValue extends AppState {
  login: (user: AppUser) => void;
  logout: () => void;
  addDepartment: (dept: ExtendedDepartment) => void;
  addFaculty: (faculty: Faculty) => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  removeCourse: (courseId: bigint) => void;
  addStudent: (student: ExtendedStudent) => void;
  upsertResult: (result: ExtendedResult) => void;
  updateResultStatus: (
    resultId: bigint,
    status: string,
    rejectionReason?: string,
  ) => void;
  publishSemesterResults: (semester: string, courses: Course[]) => void;
  addCourseRegistration: (
    studentId: bigint,
    courseId: bigint,
    semester: string,
  ) => void;
  dropCourseRegistration: (
    studentId: bigint,
    courseId: bigint,
    semester: string,
  ) => void;
  addAmendmentRequest: (req: AmendmentRequest) => void;
  updateAmendmentStatus: (
    id: bigint,
    status: AmendmentRequest["status"],
  ) => void;
  approveAmendmentFinal: (id: bigint) => void;
  rejectAmendment: (id: bigint) => void;
  addAcademicCalendar: (cal: AcademicCalendar) => void;
  setActiveCalendar: (id: bigint) => void;
  submitGradeAppeal: (appeal: GradeAppeal) => void;
  respondToAppeal: (
    id: bigint,
    response: string,
    newStatus: GradeAppeal["status"],
  ) => void;
  addNotification: (role: string, message: string, tabLink?: string) => void;
  markNotificationRead: (id: bigint) => void;
  markAllNotificationsRead: (role: string) => void;
  logAudit: (
    actorName: string,
    actorRole: string,
    action: string,
    details: string,
  ) => void;
  submitGraduationApplication: (app: GraduationApplication) => void;
  updateGraduationStatus: (
    id: bigint,
    status: GraduationApplication["status"],
    note?: string,
    noteField?: "hodNote" | "deanNote" | "registrarNote",
  ) => void;
  addTimetableEntry: (entry: TimetableEntry) => void;
  removeTimetableEntry: (id: bigint) => void;
  upsertFeeRecord: (record: StudentFeeRecord) => void;
  addStaffMember: (member: StaffMember) => void;
  updateStaffMember: (member: StaffMember) => void;
  removeStaffMember: (id: bigint) => void;
  sealSemester: (semester: string, session: string) => void;
  submitDeferralApplication: (app: DeferralApplication) => void;
  updateDeferralStatus: (
    id: bigint,
    status: DeferralApplication["status"],
    note?: string,
  ) => void;
  addAttendanceSession: (session: AttendanceSession) => void;
  updateAttendanceSession: (session: AttendanceSession) => void;
  addStudentDocument: (doc: StudentDocument) => void;
  removeStudentDocument: (id: bigint) => void;
  addExamScheduleEntry: (entry: ExamScheduleEntry) => void;
  updateExamScheduleEntry: (entry: ExamScheduleEntry) => void;
  removeExamScheduleEntry: (id: bigint) => void;
  addCourseFeedback: (feedback: CourseFeedback) => void;
  bulkAddFaculties: (faculties: Faculty[]) => void;
  bulkAddDepartments: (depts: ExtendedDepartment[]) => void;
  bulkAddCourses: (courses: Course[]) => void;
  resetToDefaultData: () => void;
  updateInstitutionSettings: (settings: InstitutionSettings) => void;
  loadSenateSampleData: () => void;
  setModeratorName: (courseId: bigint, name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const FULL_FACULTIES: Faculty[] = [
  { id: BigInt(1), name: "Faculty of Sciences" },
  { id: BigInt(2), name: "Faculty of Engineering" },
  { id: BigInt(3), name: "Faculty of Arts & Humanities" },
  { id: BigInt(4), name: "Faculty of Social Sciences" },
  { id: BigInt(5), name: "Faculty of Law" },
  { id: BigInt(6), name: "Faculty of Business & Management" },
  { id: BigInt(7), name: "Faculty of Education" },
];

const DEMO_FACULTIES = FULL_FACULTIES;

const FULL_DEPARTMENTS: ExtendedDepartment[] = [
  { id: BigInt(1), name: "Computer Science", facultyId: BigInt(1) },
  { id: BigInt(2), name: "Mathematics", facultyId: BigInt(1) },
  { id: BigInt(3), name: "Physics", facultyId: BigInt(1) },
  { id: BigInt(4), name: "Chemistry", facultyId: BigInt(1) },
  { id: BigInt(5), name: "Electrical Engineering", facultyId: BigInt(2) },
  { id: BigInt(6), name: "Civil Engineering", facultyId: BigInt(2) },
  { id: BigInt(7), name: "Mechanical Engineering", facultyId: BigInt(2) },
  { id: BigInt(8), name: "Chemical Engineering", facultyId: BigInt(2) },
  { id: BigInt(9), name: "English Language", facultyId: BigInt(3) },
  { id: BigInt(10), name: "History", facultyId: BigInt(3) },
  { id: BigInt(11), name: "Philosophy", facultyId: BigInt(3) },
  { id: BigInt(12), name: "Fine Arts", facultyId: BigInt(3) },
  { id: BigInt(13), name: "Sociology", facultyId: BigInt(4) },
  { id: BigInt(14), name: "Political Science", facultyId: BigInt(4) },
  { id: BigInt(15), name: "Mass Communication", facultyId: BigInt(4) },
  { id: BigInt(16), name: "Psychology", facultyId: BigInt(4) },
  { id: BigInt(17), name: "Private Law", facultyId: BigInt(5) },
  { id: BigInt(18), name: "Public Law", facultyId: BigInt(5) },
  { id: BigInt(19), name: "International Law", facultyId: BigInt(5) },
  { id: BigInt(20), name: "Commercial Law", facultyId: BigInt(5) },
  { id: BigInt(21), name: "Accounting", facultyId: BigInt(6) },
  { id: BigInt(22), name: "Business Administration", facultyId: BigInt(6) },
  { id: BigInt(23), name: "Economics", facultyId: BigInt(6) },
  { id: BigInt(24), name: "Finance", facultyId: BigInt(6) },
  { id: BigInt(25), name: "Computer Science Education", facultyId: BigInt(7) },
  { id: BigInt(26), name: "Science Education", facultyId: BigInt(7) },
];

const DEMO_DEPARTMENTS = FULL_DEPARTMENTS;

const FULL_COURSES: Course[] = [
  // Computer Science (dept 1)
  {
    id: BigInt(1),
    name: "Introduction to Computing",
    code: "CSC101",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(2),
    name: "Programming in C",
    code: "CSC102",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(3),
    name: "Data Structures & Algorithms",
    code: "CSC201",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(4),
    name: "Computer Architecture",
    code: "CSC202",
    creditUnits: BigInt(2),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(5),
    name: "Database Management Systems",
    code: "CSC301",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(6),
    name: "Operating Systems",
    code: "CSC302",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(7),
    name: "Software Engineering",
    code: "CSC401",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(8),
    name: "Artificial Intelligence",
    code: "CSC402",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  // Mathematics (dept 2)
  {
    id: BigInt(9),
    name: "Elementary Mathematics I",
    code: "MTH101",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(10),
    name: "Elementary Mathematics II",
    code: "MTH102",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(11),
    name: "Calculus I",
    code: "MTH201",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(12),
    name: "Linear Algebra",
    code: "MTH202",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(13),
    name: "Real Analysis",
    code: "MTH301",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(14),
    name: "Numerical Analysis",
    code: "MTH302",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(15),
    name: "Abstract Algebra",
    code: "MTH401",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(16),
    name: "Mathematical Statistics",
    code: "MTH402",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  // Physics (dept 3)
  {
    id: BigInt(17),
    name: "General Physics I",
    code: "PHY101",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(18),
    name: "General Physics II",
    code: "PHY102",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(19),
    name: "Mechanics",
    code: "PHY201",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(20),
    name: "Electromagnetism",
    code: "PHY202",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(21),
    name: "Thermodynamics",
    code: "PHY301",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(22),
    name: "Quantum Mechanics",
    code: "PHY401",
    creditUnits: BigInt(3),
    departmentId: BigInt(3),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Chemistry (dept 4)
  {
    id: BigInt(23),
    name: "General Chemistry I",
    code: "CHM101",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(24),
    name: "General Chemistry II",
    code: "CHM102",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(25),
    name: "Organic Chemistry I",
    code: "CHM201",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(26),
    name: "Inorganic Chemistry",
    code: "CHM202",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(27),
    name: "Physical Chemistry",
    code: "CHM301",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(28),
    name: "Analytical Chemistry",
    code: "CHM401",
    creditUnits: BigInt(3),
    departmentId: BigInt(4),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Electrical Engineering (dept 5)
  {
    id: BigInt(29),
    name: "Circuit Theory",
    code: "EEE101",
    creditUnits: BigInt(3),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(30),
    name: "Digital Electronics",
    code: "EEE102",
    creditUnits: BigInt(3),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(31),
    name: "Signals and Systems",
    code: "EEE201",
    creditUnits: BigInt(3),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(32),
    name: "Electromagnetic Fields",
    code: "EEE202",
    creditUnits: BigInt(2),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(33),
    name: "Power Systems",
    code: "EEE301",
    creditUnits: BigInt(3),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(34),
    name: "Control Systems",
    code: "EEE401",
    creditUnits: BigInt(3),
    departmentId: BigInt(5),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Civil Engineering (dept 6)
  {
    id: BigInt(35),
    name: "Engineering Mathematics",
    code: "CVE101",
    creditUnits: BigInt(3),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(36),
    name: "Engineering Drawing",
    code: "CVE102",
    creditUnits: BigInt(2),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(37),
    name: "Strength of Materials",
    code: "CVE201",
    creditUnits: BigInt(3),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(38),
    name: "Fluid Mechanics",
    code: "CVE202",
    creditUnits: BigInt(3),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(39),
    name: "Structural Analysis",
    code: "CVE301",
    creditUnits: BigInt(3),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(40),
    name: "Geotechnical Engineering",
    code: "CVE401",
    creditUnits: BigInt(3),
    departmentId: BigInt(6),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Mechanical Engineering (dept 7)
  {
    id: BigInt(41),
    name: "Engineering Mechanics",
    code: "MEE101",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(42),
    name: "Materials Science",
    code: "MEE102",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(43),
    name: "Thermodynamics I",
    code: "MEE201",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(44),
    name: "Machine Design",
    code: "MEE301",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(45),
    name: "Manufacturing Processes",
    code: "MEE302",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(46),
    name: "Heat Transfer",
    code: "MEE401",
    creditUnits: BigInt(3),
    departmentId: BigInt(7),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Chemical Engineering (dept 8)
  {
    id: BigInt(47),
    name: "Chemical Engineering Principles",
    code: "CHE101",
    creditUnits: BigInt(3),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(48),
    name: "Mass Transfer",
    code: "CHE201",
    creditUnits: BigInt(3),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(49),
    name: "Heat Transfer Operations",
    code: "CHE202",
    creditUnits: BigInt(3),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(50),
    name: "Reaction Engineering",
    code: "CHE301",
    creditUnits: BigInt(3),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(51),
    name: "Process Control",
    code: "CHE401",
    creditUnits: BigInt(3),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(52),
    name: "Plant Design",
    code: "CHE402",
    creditUnits: BigInt(4),
    departmentId: BigInt(8),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  // English Language (dept 9)
  {
    id: BigInt(53),
    name: "Use of English I",
    code: "ENG101",
    creditUnits: BigInt(2),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(54),
    name: "Use of English II",
    code: "ENG102",
    creditUnits: BigInt(2),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(55),
    name: "Introduction to Literature",
    code: "ENG201",
    creditUnits: BigInt(3),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(56),
    name: "Grammar and Linguistics",
    code: "ENG202",
    creditUnits: BigInt(3),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(57),
    name: "African Literature",
    code: "ENG301",
    creditUnits: BigInt(3),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(58),
    name: "Creative Writing",
    code: "ENG401",
    creditUnits: BigInt(3),
    departmentId: BigInt(9),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // History (dept 10)
  {
    id: BigInt(59),
    name: "Introduction to History",
    code: "HIS101",
    creditUnits: BigInt(3),
    departmentId: BigInt(10),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(60),
    name: "African History",
    code: "HIS201",
    creditUnits: BigInt(3),
    departmentId: BigInt(10),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(61),
    name: "Nigerian History",
    code: "HIS202",
    creditUnits: BigInt(3),
    departmentId: BigInt(10),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(62),
    name: "World History",
    code: "HIS301",
    creditUnits: BigInt(3),
    departmentId: BigInt(10),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(63),
    name: "Colonial History",
    code: "HIS401",
    creditUnits: BigInt(3),
    departmentId: BigInt(10),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  // Philosophy (dept 11)
  {
    id: BigInt(64),
    name: "Introduction to Philosophy",
    code: "PHL101",
    creditUnits: BigInt(3),
    departmentId: BigInt(11),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(65),
    name: "Logic and Critical Thinking",
    code: "PHL102",
    creditUnits: BigInt(3),
    departmentId: BigInt(11),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(66),
    name: "Ethics",
    code: "PHL201",
    creditUnits: BigInt(3),
    departmentId: BigInt(11),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(67),
    name: "African Philosophy",
    code: "PHL301",
    creditUnits: BigInt(3),
    departmentId: BigInt(11),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(68),
    name: "Metaphysics",
    code: "PHL401",
    creditUnits: BigInt(3),
    departmentId: BigInt(11),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  // Fine Arts (dept 12)
  {
    id: BigInt(69),
    name: "Drawing and Painting I",
    code: "FAR101",
    creditUnits: BigInt(3),
    departmentId: BigInt(12),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(70),
    name: "Sculpture and Ceramics",
    code: "FAR201",
    creditUnits: BigInt(3),
    departmentId: BigInt(12),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(71),
    name: "Art History",
    code: "FAR202",
    creditUnits: BigInt(3),
    departmentId: BigInt(12),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(72),
    name: "Graphic Design",
    code: "FAR301",
    creditUnits: BigInt(3),
    departmentId: BigInt(12),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(73),
    name: "Digital Arts",
    code: "FAR401",
    creditUnits: BigInt(3),
    departmentId: BigInt(12),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Sociology (dept 13)
  {
    id: BigInt(74),
    name: "Introduction to Sociology",
    code: "SOC101",
    creditUnits: BigInt(3),
    departmentId: BigInt(13),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(75),
    name: "Social Research Methods",
    code: "SOC201",
    creditUnits: BigInt(3),
    departmentId: BigInt(13),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(76),
    name: "Social Stratification",
    code: "SOC202",
    creditUnits: BigInt(3),
    departmentId: BigInt(13),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(77),
    name: "Urban Sociology",
    code: "SOC301",
    creditUnits: BigInt(3),
    departmentId: BigInt(13),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(78),
    name: "Development Sociology",
    code: "SOC401",
    creditUnits: BigInt(3),
    departmentId: BigInt(13),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  // Political Science (dept 14)
  {
    id: BigInt(79),
    name: "Introduction to Political Science",
    code: "POL101",
    creditUnits: BigInt(3),
    departmentId: BigInt(14),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(80),
    name: "Nigerian Government",
    code: "POL201",
    creditUnits: BigInt(3),
    departmentId: BigInt(14),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(81),
    name: "International Relations",
    code: "POL202",
    creditUnits: BigInt(3),
    departmentId: BigInt(14),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(82),
    name: "Comparative Politics",
    code: "POL301",
    creditUnits: BigInt(3),
    departmentId: BigInt(14),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(83),
    name: "Public Policy Analysis",
    code: "POL401",
    creditUnits: BigInt(3),
    departmentId: BigInt(14),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  // Mass Communication (dept 15)
  {
    id: BigInt(84),
    name: "Introduction to Mass Communication",
    code: "MAC101",
    creditUnits: BigInt(3),
    departmentId: BigInt(15),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(85),
    name: "Journalism Practice",
    code: "MAC201",
    creditUnits: BigInt(3),
    departmentId: BigInt(15),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(86),
    name: "Broadcasting",
    code: "MAC202",
    creditUnits: BigInt(3),
    departmentId: BigInt(15),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(87),
    name: "Public Relations",
    code: "MAC301",
    creditUnits: BigInt(3),
    departmentId: BigInt(15),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(88),
    name: "Media Management",
    code: "MAC401",
    creditUnits: BigInt(3),
    departmentId: BigInt(15),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Psychology (dept 16)
  {
    id: BigInt(89),
    name: "Introduction to Psychology",
    code: "PSY101",
    creditUnits: BigInt(3),
    departmentId: BigInt(16),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(90),
    name: "Developmental Psychology",
    code: "PSY201",
    creditUnits: BigInt(3),
    departmentId: BigInt(16),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(91),
    name: "Social Psychology",
    code: "PSY202",
    creditUnits: BigInt(3),
    departmentId: BigInt(16),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(92),
    name: "Abnormal Psychology",
    code: "PSY301",
    creditUnits: BigInt(3),
    departmentId: BigInt(16),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(93),
    name: "Counselling Psychology",
    code: "PSY401",
    creditUnits: BigInt(3),
    departmentId: BigInt(16),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  // Private Law (dept 17)
  {
    id: BigInt(94),
    name: "Law of Contract",
    code: "PRL101",
    creditUnits: BigInt(3),
    departmentId: BigInt(17),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(95),
    name: "Law of Tort",
    code: "PRL102",
    creditUnits: BigInt(3),
    departmentId: BigInt(17),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(96),
    name: "Family Law",
    code: "PRL201",
    creditUnits: BigInt(3),
    departmentId: BigInt(17),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(97),
    name: "Property Law",
    code: "PRL301",
    creditUnits: BigInt(3),
    departmentId: BigInt(17),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(98),
    name: "Succession Law",
    code: "PRL401",
    creditUnits: BigInt(3),
    departmentId: BigInt(17),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  // Public Law (dept 18)
  {
    id: BigInt(99),
    name: "Constitutional Law",
    code: "PBL101",
    creditUnits: BigInt(3),
    departmentId: BigInt(18),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(100),
    name: "Administrative Law",
    code: "PBL201",
    creditUnits: BigInt(3),
    departmentId: BigInt(18),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(101),
    name: "Criminal Law",
    code: "PBL202",
    creditUnits: BigInt(3),
    departmentId: BigInt(18),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(102),
    name: "Human Rights Law",
    code: "PBL301",
    creditUnits: BigInt(3),
    departmentId: BigInt(18),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(103),
    name: "Electoral Law",
    code: "PBL401",
    creditUnits: BigInt(3),
    departmentId: BigInt(18),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // International Law (dept 19)
  {
    id: BigInt(104),
    name: "Public International Law",
    code: "INL101",
    creditUnits: BigInt(3),
    departmentId: BigInt(19),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(105),
    name: "International Trade Law",
    code: "INL201",
    creditUnits: BigInt(3),
    departmentId: BigInt(19),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(106),
    name: "Diplomatic Law",
    code: "INL301",
    creditUnits: BigInt(3),
    departmentId: BigInt(19),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(107),
    name: "Maritime Law",
    code: "INL401",
    creditUnits: BigInt(3),
    departmentId: BigInt(19),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  // Commercial Law (dept 20)
  {
    id: BigInt(108),
    name: "Company Law",
    code: "CML101",
    creditUnits: BigInt(3),
    departmentId: BigInt(20),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(109),
    name: "Banking Law",
    code: "CML201",
    creditUnits: BigInt(3),
    departmentId: BigInt(20),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(110),
    name: "Intellectual Property Law",
    code: "CML301",
    creditUnits: BigInt(3),
    departmentId: BigInt(20),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(111),
    name: "Securities Law",
    code: "CML401",
    creditUnits: BigInt(3),
    departmentId: BigInt(20),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  // Accounting (dept 21)
  {
    id: BigInt(112),
    name: "Principles of Accounting",
    code: "ACC101",
    creditUnits: BigInt(3),
    departmentId: BigInt(21),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(113),
    name: "Financial Accounting",
    code: "ACC102",
    creditUnits: BigInt(3),
    departmentId: BigInt(21),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(114),
    name: "Cost Accounting",
    code: "ACC201",
    creditUnits: BigInt(3),
    departmentId: BigInt(21),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(115),
    name: "Management Accounting",
    code: "ACC301",
    creditUnits: BigInt(3),
    departmentId: BigInt(21),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(116),
    name: "Auditing",
    code: "ACC401",
    creditUnits: BigInt(3),
    departmentId: BigInt(21),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  // Business Administration (dept 22)
  {
    id: BigInt(117),
    name: "Business Organisation",
    code: "BUS101",
    creditUnits: BigInt(3),
    departmentId: BigInt(22),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(118),
    name: "Human Resource Management",
    code: "BUS201",
    creditUnits: BigInt(3),
    departmentId: BigInt(22),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(119),
    name: "Marketing Management",
    code: "BUS202",
    creditUnits: BigInt(3),
    departmentId: BigInt(22),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(120),
    name: "Strategic Management",
    code: "BUS301",
    creditUnits: BigInt(3),
    departmentId: BigInt(22),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(121),
    name: "Entrepreneurship",
    code: "BUS401",
    creditUnits: BigInt(3),
    departmentId: BigInt(22),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  // Economics (dept 23)
  {
    id: BigInt(122),
    name: "Principles of Economics",
    code: "ECO101",
    creditUnits: BigInt(3),
    departmentId: BigInt(23),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(123),
    name: "Microeconomics",
    code: "ECO201",
    creditUnits: BigInt(3),
    departmentId: BigInt(23),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(124),
    name: "Macroeconomics",
    code: "ECO202",
    creditUnits: BigInt(3),
    departmentId: BigInt(23),
    lecturerPrincipal: "lecturer-1",
    semester: "Second",
  },
  {
    id: BigInt(125),
    name: "Econometrics",
    code: "ECO301",
    creditUnits: BigInt(3),
    departmentId: BigInt(23),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(126),
    name: "Development Economics",
    code: "ECO401",
    creditUnits: BigInt(3),
    departmentId: BigInt(23),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  // Finance (dept 24)
  {
    id: BigInt(127),
    name: "Introduction to Finance",
    code: "FIN101",
    creditUnits: BigInt(3),
    departmentId: BigInt(24),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(128),
    name: "Corporate Finance",
    code: "FIN201",
    creditUnits: BigInt(3),
    departmentId: BigInt(24),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(129),
    name: "Investment Analysis",
    code: "FIN202",
    creditUnits: BigInt(3),
    departmentId: BigInt(24),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(130),
    name: "Financial Markets",
    code: "FIN301",
    creditUnits: BigInt(3),
    departmentId: BigInt(24),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(131),
    name: "Risk Management",
    code: "FIN401",
    creditUnits: BigInt(3),
    departmentId: BigInt(24),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  // Computer Science Education (dept 25) - BSc Ed
  {
    id: BigInt(132),
    name: "Foundation of Education",
    code: "EDU101",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(133),
    name: "Teaching Practice I",
    code: "TP101",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(134),
    name: "General Studies in Education I",
    code: "GSE101",
    creditUnits: BigInt(2),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(135),
    name: "Computer Science for Education I",
    code: "CSC101E",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(136),
    name: "Foundation of Education II",
    code: "EDU201",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(137),
    name: "Teaching Practice II",
    code: "TP201",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(138),
    name: "General Studies in Education II",
    code: "GSE201",
    creditUnits: BigInt(2),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(139),
    name: "Computer Science for Education II",
    code: "CSC201E",
    creditUnits: BigInt(3),
    departmentId: BigInt(25),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  // Science Education (dept 26) - BSc Ed
  {
    id: BigInt(140),
    name: "Foundation of Education",
    code: "EDU101S",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(141),
    name: "Teaching Practice I",
    code: "TP101S",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(142),
    name: "General Studies in Education I",
    code: "GSE101S",
    creditUnits: BigInt(2),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(143),
    name: "Physics for Education I",
    code: "PHY101E",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(144),
    name: "Foundation of Education II",
    code: "EDU201S",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(145),
    name: "Teaching Practice II",
    code: "TP201S",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
  {
    id: BigInt(146),
    name: "General Studies in Education II",
    code: "GSE201S",
    creditUnits: BigInt(2),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(147),
    name: "Physics for Education II",
    code: "PHY201E",
    creditUnits: BigInt(3),
    departmentId: BigInt(26),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
];

const DEMO_COURSES = FULL_COURSES;

const DEMO_STUDENTS: ExtendedStudent[] = [
  {
    id: BigInt(1),
    name: "Amara Okonkwo",
    matricNumber: "CSC/2021/001",
    departmentId: BigInt(1),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-1",
    gender: "Female",
    dob: "2002-03-15",
    email: "amara.okonkwo@university.edu",
    phone: "08012345678",
  },
  {
    id: BigInt(2),
    name: "Chidi Eze",
    matricNumber: "CSC/2021/002",
    departmentId: BigInt(1),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-2",
    gender: "Male",
    dob: "2001-07-22",
    email: "chidi.eze@university.edu",
    phone: "08023456789",
  },
  {
    id: BigInt(3),
    name: "Ngozi Adeyemi",
    matricNumber: "CSC/2021/003",
    departmentId: BigInt(1),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-3",
    gender: "Female",
    dob: "2002-11-08",
    email: "ngozi.adeyemi@university.edu",
    phone: "08034567890",
  },
  {
    id: BigInt(4),
    name: "Emeka Nwachukwu",
    matricNumber: "EEE/2021/001",
    departmentId: BigInt(2),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-4",
    gender: "Male",
    dob: "2001-05-30",
    email: "emeka.nwachukwu@university.edu",
    phone: "08045678901",
  },
  {
    id: BigInt(5),
    name: "Fatima Bello",
    matricNumber: "CSC/2021/004",
    departmentId: BigInt(1),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-5",
    gender: "Female",
    dob: "2003-01-17",
    email: "fatima.bello@university.edu",
    phone: "08056789012",
  },
  {
    id: BigInt(6),
    name: "Taiwo Abiodun",
    matricNumber: "EEE/2021/002",
    departmentId: BigInt(2),
    level: BigInt(300),
    status: "active",
    userPrincipal: "student-6",
    gender: "Male",
    dob: "2002-09-04",
    email: "taiwo.abiodun@university.edu",
    phone: "08067890123",
  },
];

export function calcGradePoint(total: number): {
  grade: string;
  gradePoint: number;
  remarks: string;
} {
  if (total >= 70)
    return { grade: "A", gradePoint: 5.0, remarks: "Distinction" };
  if (total >= 60) return { grade: "B", gradePoint: 4.0, remarks: "Credit" };
  if (total >= 50) return { grade: "C", gradePoint: 3.0, remarks: "Merit" };
  if (total >= 45) return { grade: "D", gradePoint: 2.0, remarks: "Pass" };
  if (total >= 40)
    return { grade: "E", gradePoint: 1.0, remarks: "Marginal Pass" };
  return { grade: "F", gradePoint: 0.0, remarks: "Fail" };
}

export function getAcademicStanding(gpa: number): {
  label: string;
  color: string;
  badgeClass: string;
} {
  if (gpa >= 2.0)
    return {
      label: "Good Standing",
      color: "text-success",
      badgeClass: "bg-success/10 text-success border border-success/20",
    };
  if (gpa >= 1.0)
    return {
      label: "Probation",
      color: "text-warning",
      badgeClass: "bg-warning/10 text-warning border border-warning/20",
    };
  return {
    label: "Withdrawal Risk",
    color: "text-destructive",
    badgeClass:
      "bg-destructive/10 text-destructive border border-destructive/20",
  };
}

function makeResult(
  id: bigint,
  studentId: bigint,
  courseId: bigint,
  ca: number,
  exam: number,
  status: string,
): ExtendedResult {
  const total = ca + exam;
  const { grade, gradePoint, remarks } = calcGradePoint(total);
  return {
    id,
    studentId,
    courseId,
    caScore: ca,
    examScore: exam,
    totalScore: total,
    grade,
    gradePoint,
    remarks,
    status,
  };
}

const DEMO_RESULTS: ExtendedResult[] = [
  makeResult(BigInt(1), BigInt(1), BigInt(1), 35, 55, "published"),
  makeResult(BigInt(2), BigInt(1), BigInt(2), 38, 50, "published"),
  makeResult(BigInt(3), BigInt(2), BigInt(1), 30, 42, "approved"),
  makeResult(BigInt(4), BigInt(2), BigInt(2), 32, 48, "submitted"),
  makeResult(BigInt(5), BigInt(3), BigInt(1), 40, 58, "submitted"),
  makeResult(BigInt(6), BigInt(3), BigInt(2), 36, 52, "hod_approved"),
  makeResult(BigInt(7), BigInt(4), BigInt(4), 38, 54, "published"),
  makeResult(BigInt(8), BigInt(5), BigInt(1), 28, 38, "published"),
  makeResult(BigInt(9), BigInt(5), BigInt(3), 34, 44, "submitted"),
  makeResult(BigInt(10), BigInt(6), BigInt(4), 40, 60, "hod_approved"),
];

const SENATE_SAMPLE_STUDENTS: ExtendedStudent[] = [
  // Level 100 - Computer Science
  {
    id: BigInt(101),
    name: "Adaeze Okafor",
    matricNumber: "CSC/2025/001",
    departmentId: BigInt(1),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-1",
    gender: "Female",
    dob: "2006-03-10",
    email: "adaeze.okafor@university.edu",
    phone: "08011000101",
  },
  {
    id: BigInt(102),
    name: "Babatunde Ogundimu",
    matricNumber: "CSC/2025/002",
    departmentId: BigInt(1),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-2",
    gender: "Male",
    dob: "2006-07-14",
    email: "babatunde.ogundimu@university.edu",
    phone: "08011000102",
  },
  {
    id: BigInt(103),
    name: "Chisom Nwosu",
    matricNumber: "CSC/2025/003",
    departmentId: BigInt(1),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-3",
    gender: "Female",
    dob: "2006-01-22",
    email: "chisom.nwosu@university.edu",
    phone: "08011000103",
  },
  {
    id: BigInt(104),
    name: "Damilola Adesanya",
    matricNumber: "CSC/2025/004",
    departmentId: BigInt(1),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-4",
    gender: "Male",
    dob: "2006-11-05",
    email: "damilola.adesanya@university.edu",
    phone: "08011000104",
  },
  // Level 100 - Physics
  {
    id: BigInt(111),
    name: "Ibrahim Usman",
    matricNumber: "PHY/2025/001",
    departmentId: BigInt(3),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-5",
    gender: "Male",
    dob: "2006-05-18",
    email: "ibrahim.usman@university.edu",
    phone: "08011000111",
  },
  {
    id: BigInt(112),
    name: "Josephine Okoye",
    matricNumber: "PHY/2025/002",
    departmentId: BigInt(3),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-6",
    gender: "Female",
    dob: "2006-09-30",
    email: "josephine.okoye@university.edu",
    phone: "08011000112",
  },
  {
    id: BigInt(113),
    name: "Kayode Afolabi",
    matricNumber: "PHY/2025/003",
    departmentId: BigInt(3),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-7",
    gender: "Male",
    dob: "2006-04-12",
    email: "kayode.afolabi@university.edu",
    phone: "08011000113",
  },
  // Level 100 - Chemistry
  {
    id: BigInt(121),
    name: "Olumide Adeleke",
    matricNumber: "CHM/2025/001",
    departmentId: BigInt(4),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-8",
    gender: "Male",
    dob: "2006-08-25",
    email: "olumide.adeleke@university.edu",
    phone: "08011000121",
  },
  {
    id: BigInt(122),
    name: "Patience Nwachukwu",
    matricNumber: "CHM/2025/002",
    departmentId: BigInt(4),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-9",
    gender: "Female",
    dob: "2006-02-07",
    email: "patience.nwachukwu@university.edu",
    phone: "08011000122",
  },
  {
    id: BigInt(123),
    name: "Quadri Ibrahim",
    matricNumber: "CHM/2025/003",
    departmentId: BigInt(4),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-10",
    gender: "Male",
    dob: "2006-12-19",
    email: "quadri.ibrahim@university.edu",
    phone: "08011000123",
  },
  // Level 100 - Electrical Engineering
  {
    id: BigInt(131),
    name: "Uchenna Okeke",
    matricNumber: "EEE/2025/001",
    departmentId: BigInt(5),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-11",
    gender: "Male",
    dob: "2006-06-03",
    email: "uchenna.okeke@university.edu",
    phone: "08011000131",
  },
  {
    id: BigInt(132),
    name: "Victor Idoko",
    matricNumber: "EEE/2025/002",
    departmentId: BigInt(5),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-12",
    gender: "Male",
    dob: "2006-10-16",
    email: "victor.idoko@university.edu",
    phone: "08011000132",
  },
  {
    id: BigInt(133),
    name: "Wuese Atsev",
    matricNumber: "EEE/2025/003",
    departmentId: BigInt(5),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-demo-13",
    gender: "Female",
    dob: "2006-03-28",
    email: "wuese.atsev@university.edu",
    phone: "08011000133",
  },
  // Level 200 - Computer Science
  {
    id: BigInt(201),
    name: "Ekene Obi",
    matricNumber: "CSC/2024/001",
    departmentId: BigInt(1),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-14",
    gender: "Male",
    dob: "2005-07-09",
    email: "ekene.obi@university.edu",
    phone: "08011000201",
  },
  {
    id: BigInt(202),
    name: "Funke Adeyemi",
    matricNumber: "CSC/2024/002",
    departmentId: BigInt(1),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-15",
    gender: "Female",
    dob: "2005-11-21",
    email: "funke.adeyemi@university.edu",
    phone: "08011000202",
  },
  {
    id: BigInt(203),
    name: "Gbenga Olawale",
    matricNumber: "CSC/2024/003",
    departmentId: BigInt(1),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-16",
    gender: "Male",
    dob: "2005-04-14",
    email: "gbenga.olawale@university.edu",
    phone: "08011000203",
    previousStanding: "Probation",
  },
  {
    id: BigInt(204),
    name: "Hadiza Musa",
    matricNumber: "CSC/2024/004",
    departmentId: BigInt(1),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-17",
    gender: "Female",
    dob: "2005-08-02",
    email: "hadiza.musa@university.edu",
    phone: "08011000204",
  },
  // Level 200 - Physics
  {
    id: BigInt(211),
    name: "Lilian Okonkwo",
    matricNumber: "PHY/2024/001",
    departmentId: BigInt(3),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-18",
    gender: "Female",
    dob: "2005-01-15",
    email: "lilian.okonkwo@university.edu",
    phone: "08011000211",
  },
  {
    id: BigInt(212),
    name: "Mohammed Bello",
    matricNumber: "PHY/2024/002",
    departmentId: BigInt(3),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-19",
    gender: "Male",
    dob: "2005-06-27",
    email: "mohammed.bello@university.edu",
    phone: "08011000212",
  },
  {
    id: BigInt(213),
    name: "Nkechi Eze",
    matricNumber: "PHY/2024/003",
    departmentId: BigInt(3),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-20",
    gender: "Female",
    dob: "2005-10-08",
    email: "nkechi.eze@university.edu",
    phone: "08011000213",
  },
  // Level 200 - Chemistry
  {
    id: BigInt(221),
    name: "Rofiat Salami",
    matricNumber: "CHM/2024/001",
    departmentId: BigInt(4),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-21",
    gender: "Female",
    dob: "2005-03-19",
    email: "rofiat.salami@university.edu",
    phone: "08011000221",
  },
  {
    id: BigInt(222),
    name: "Segun Bamidele",
    matricNumber: "CHM/2024/002",
    departmentId: BigInt(4),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-22",
    gender: "Male",
    dob: "2005-09-11",
    email: "segun.bamidele@university.edu",
    phone: "08011000222",
  },
  {
    id: BigInt(223),
    name: "Titilayo Olusanya",
    matricNumber: "CHM/2024/003",
    departmentId: BigInt(4),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-23",
    gender: "Female",
    dob: "2005-12-24",
    email: "titilayo.olusanya@university.edu",
    phone: "08011000223",
  },
  // Level 200 - Electrical Engineering
  {
    id: BigInt(231),
    name: "Yetunde Ayeni",
    matricNumber: "EEE/2024/001",
    departmentId: BigInt(5),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-24",
    gender: "Female",
    dob: "2005-05-06",
    email: "yetunde.ayeni@university.edu",
    phone: "08011000231",
  },
  {
    id: BigInt(232),
    name: "Zainab Badmus",
    matricNumber: "EEE/2024/002",
    departmentId: BigInt(5),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-25",
    gender: "Female",
    dob: "2005-02-18",
    email: "zainab.badmus@university.edu",
    phone: "08011000232",
  },
  {
    id: BigInt(233),
    name: "Abubakar Tanko",
    matricNumber: "EEE/2024/003",
    departmentId: BigInt(5),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-demo-26",
    gender: "Male",
    dob: "2005-07-30",
    email: "abubakar.tanko@university.edu",
    phone: "08011000233",
  },
  // Level 100 - Computer Science Education (BSc Ed)
  {
    id: BigInt(301),
    name: "Amaka Obi",
    matricNumber: "CSE/2025/001",
    departmentId: BigInt(25),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-1",
    gender: "Female",
    dob: "2006-03-10",
    email: "amaka.obi@university.edu",
    phone: "08022000301",
  },
  {
    id: BigInt(302),
    name: "Bola Adewale",
    matricNumber: "CSE/2025/002",
    departmentId: BigInt(25),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-2",
    gender: "Female",
    dob: "2006-07-14",
    email: "bola.adewale@university.edu",
    phone: "08022000302",
  },
  {
    id: BigInt(303),
    name: "Chibuzor Nnam",
    matricNumber: "CSE/2025/003",
    departmentId: BigInt(25),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-3",
    gender: "Male",
    dob: "2006-01-22",
    email: "chibuzor.nnam@university.edu",
    phone: "08022000303",
  },
  {
    id: BigInt(304),
    name: "Dupe Oladele",
    matricNumber: "CSE/2025/004",
    departmentId: BigInt(25),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-4",
    gender: "Female",
    dob: "2006-11-05",
    email: "dupe.oladele@university.edu",
    phone: "08022000304",
  },
  // Level 100 - Science Education (BSc Ed)
  {
    id: BigInt(311),
    name: "Emeka Nnadi",
    matricNumber: "SCE/2025/001",
    departmentId: BigInt(26),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-5",
    gender: "Male",
    dob: "2006-05-18",
    email: "emeka.nnadi@university.edu",
    phone: "08022000311",
  },
  {
    id: BigInt(312),
    name: "Fatimah Sule",
    matricNumber: "SCE/2025/002",
    departmentId: BigInt(26),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-6",
    gender: "Female",
    dob: "2006-09-30",
    email: "fatimah.sule@university.edu",
    phone: "08022000312",
  },
  {
    id: BigInt(313),
    name: "Gideon Ameh",
    matricNumber: "SCE/2025/003",
    departmentId: BigInt(26),
    level: BigInt(100),
    status: "active",
    userPrincipal: "senate-ed-7",
    gender: "Male",
    dob: "2006-04-12",
    email: "gideon.ameh@university.edu",
    phone: "08022000313",
  },
  // Level 200 - Computer Science Education (BSc Ed)
  {
    id: BigInt(401),
    name: "Helen Okonkwo",
    matricNumber: "CSE/2024/001",
    departmentId: BigInt(25),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-8",
    gender: "Female",
    dob: "2005-07-09",
    email: "helen.okonkwo@university.edu",
    phone: "08022000401",
  },
  {
    id: BigInt(402),
    name: "Ikenna Chukwu",
    matricNumber: "CSE/2024/002",
    departmentId: BigInt(25),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-9",
    gender: "Male",
    dob: "2005-11-21",
    email: "ikenna.chukwu@university.edu",
    phone: "08022000402",
  },
  {
    id: BigInt(403),
    name: "Juliet Obi",
    matricNumber: "CSE/2024/003",
    departmentId: BigInt(25),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-10",
    gender: "Female",
    dob: "2005-04-14",
    email: "juliet.obi@university.edu",
    phone: "08022000403",
  },
  // Level 200 - Science Education (BSc Ed)
  {
    id: BigInt(411),
    name: "Kemi Adeola",
    matricNumber: "SCE/2024/001",
    departmentId: BigInt(26),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-11",
    gender: "Female",
    dob: "2005-01-15",
    email: "kemi.adeola@university.edu",
    phone: "08022000411",
  },
  {
    id: BigInt(412),
    name: "Laminu Garba",
    matricNumber: "SCE/2024/002",
    departmentId: BigInt(26),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-12",
    gender: "Male",
    dob: "2005-06-27",
    email: "laminu.garba@university.edu",
    phone: "08022000412",
  },
  {
    id: BigInt(413),
    name: "Maryam Abdullahi",
    matricNumber: "SCE/2024/003",
    departmentId: BigInt(26),
    level: BigInt(200),
    status: "active",
    userPrincipal: "senate-ed-13",
    gender: "Female",
    dob: "2005-10-08",
    email: "maryam.abdullahi@university.edu",
    phone: "08022000413",
  },
];

const SENATE_SAMPLE_RESULTS: ExtendedResult[] = [
  // CSC Level 100 (courses 1, 2)
  makeResult(BigInt(500), BigInt(101), BigInt(1), 35, 55, "published"), // 90 A
  makeResult(BigInt(501), BigInt(101), BigInt(2), 30, 42, "published"), // 72 A
  makeResult(BigInt(502), BigInt(102), BigInt(1), 28, 40, "published"), // 68 B
  makeResult(BigInt(503), BigInt(102), BigInt(2), 25, 33, "published"), // 58 C
  makeResult(BigInt(504), BigInt(103), BigInt(1), 38, 52, "published"), // 90 A
  makeResult(BigInt(505), BigInt(103), BigInt(2), 32, 46, "published"), // 78 A
  makeResult(BigInt(506), BigInt(104), BigInt(1), 15, 20, "published"), // 35 F
  makeResult(BigInt(507), BigInt(104), BigInt(2), 26, 38, "published"), // 64 B
  // PHY Level 100 (courses 17, 18)
  makeResult(BigInt(510), BigInt(111), BigInt(17), 36, 54, "published"), // 90 A
  makeResult(BigInt(511), BigInt(111), BigInt(18), 30, 42, "published"), // 72 A
  makeResult(BigInt(512), BigInt(112), BigInt(17), 28, 40, "published"), // 68 B
  makeResult(BigInt(513), BigInt(112), BigInt(18), 15, 20, "published"), // 35 F
  makeResult(BigInt(514), BigInt(113), BigInt(17), 25, 33, "published"), // 58 C
  makeResult(BigInt(515), BigInt(113), BigInt(18), 32, 46, "published"), // 78 A
  // CHM Level 100 (courses 23, 24)
  makeResult(BigInt(520), BigInt(121), BigInt(23), 35, 55, "published"), // 90 A
  makeResult(BigInt(521), BigInt(121), BigInt(24), 28, 40, "published"), // 68 B
  makeResult(BigInt(522), BigInt(122), BigInt(23), 30, 44, "published"), // 74 A
  makeResult(BigInt(523), BigInt(122), BigInt(24), 15, 20, "published"), // 35 F
  makeResult(BigInt(524), BigInt(123), BigInt(23), 26, 36, "published"), // 62 B
  makeResult(BigInt(525), BigInt(123), BigInt(24), 33, 47, "published"), // 80 A
  // EEE Level 100 (courses 29, 30)
  makeResult(BigInt(530), BigInt(131), BigInt(29), 38, 57, "published"), // 95 A
  makeResult(BigInt(531), BigInt(131), BigInt(30), 30, 42, "published"), // 72 A
  makeResult(BigInt(532), BigInt(132), BigInt(29), 25, 33, "published"), // 58 C
  makeResult(BigInt(533), BigInt(132), BigInt(30), 15, 20, "published"), // 35 F
  makeResult(BigInt(534), BigInt(133), BigInt(29), 28, 40, "published"), // 68 B
  makeResult(BigInt(535), BigInt(133), BigInt(30), 32, 46, "published"), // 78 A
  // CSC Level 200 (courses 3, 4)
  makeResult(BigInt(540), BigInt(201), BigInt(3), 35, 55, "published"), // 90 A
  makeResult(BigInt(541), BigInt(201), BigInt(4), 30, 42, "published"), // 72 A
  makeResult(BigInt(542), BigInt(202), BigInt(3), 28, 40, "published"), // 68 B
  makeResult(BigInt(543), BigInt(202), BigInt(4), 33, 48, "published"), // 81 A
  makeResult(BigInt(544), BigInt(203), BigInt(3), 15, 20, "published"), // 35 F
  makeResult(BigInt(545), BigInt(203), BigInt(4), 26, 38, "published"), // 64 B
  makeResult(BigInt(546), BigInt(204), BigInt(3), 38, 54, "published"), // 92 A
  makeResult(BigInt(547), BigInt(204), BigInt(4), 25, 33, "published"), // 58 C
  // PHY Level 200 (courses 19, 20)
  makeResult(BigInt(550), BigInt(211), BigInt(19), 36, 54, "published"), // 90 A
  makeResult(BigInt(551), BigInt(211), BigInt(20), 30, 44, "published"), // 74 A
  makeResult(BigInt(552), BigInt(212), BigInt(19), 28, 40, "published"), // 68 B
  makeResult(BigInt(553), BigInt(212), BigInt(20), 15, 20, "published"), // 35 F
  makeResult(BigInt(554), BigInt(213), BigInt(19), 25, 33, "published"), // 58 C
  makeResult(BigInt(555), BigInt(213), BigInt(20), 33, 47, "published"), // 80 A
  // CHM Level 200 (courses 25, 26)
  makeResult(BigInt(560), BigInt(221), BigInt(25), 35, 55, "published"), // 90 A
  makeResult(BigInt(561), BigInt(221), BigInt(26), 30, 42, "published"), // 72 A
  makeResult(BigInt(562), BigInt(222), BigInt(25), 15, 20, "published"), // 35 F
  makeResult(BigInt(563), BigInt(222), BigInt(26), 28, 40, "published"), // 68 B
  makeResult(BigInt(564), BigInt(223), BigInt(25), 32, 46, "published"), // 78 A
  makeResult(BigInt(565), BigInt(223), BigInt(26), 25, 33, "published"), // 58 C
  // EEE Level 200 (courses 31, 32)
  makeResult(BigInt(570), BigInt(231), BigInt(31), 38, 57, "published"), // 95 A
  makeResult(BigInt(571), BigInt(231), BigInt(32), 30, 42, "published"), // 72 A
  makeResult(BigInt(572), BigInt(232), BigInt(31), 28, 40, "published"), // 68 B
  makeResult(BigInt(573), BigInt(232), BigInt(32), 15, 20, "published"), // 35 F
  makeResult(BigInt(574), BigInt(233), BigInt(31), 25, 35, "published"), // 60 B
  makeResult(BigInt(575), BigInt(233), BigInt(32), 33, 47, "published"), // 80 A
  // CSE Level 100 (courses 132=EDU101, 133=TP101, 134=GSE101, 135=CSC101E)
  makeResult(BigInt(600), BigInt(301), BigInt(132), 35, 52, "published"), // 87 Distinction
  makeResult(BigInt(601), BigInt(301), BigInt(133), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(602), BigInt(301), BigInt(134), 28, 35, "published"), // 63 Credit
  makeResult(BigInt(603), BigInt(301), BigInt(135), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(604), BigInt(302), BigInt(132), 26, 38, "published"), // 64 Credit
  makeResult(BigInt(605), BigInt(302), BigInt(133), 22, 32, "published"), // 54 Merit
  makeResult(BigInt(606), BigInt(302), BigInt(134), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(607), BigInt(302), BigInt(135), 18, 28, "published"), // 46 Pass
  makeResult(BigInt(608), BigInt(303), BigInt(132), 38, 55, "published"), // 93 Distinction
  makeResult(BigInt(609), BigInt(303), BigInt(133), 28, 40, "published"), // 68 Credit
  makeResult(BigInt(610), BigInt(303), BigInt(134), 25, 37, "published"), // 62 Credit
  makeResult(BigInt(611), BigInt(303), BigInt(135), 15, 20, "published"), // 35 Fail
  makeResult(BigInt(612), BigInt(304), BigInt(132), 20, 28, "published"), // 48 Pass
  makeResult(BigInt(613), BigInt(304), BigInt(133), 24, 34, "published"), // 58 Merit
  makeResult(BigInt(614), BigInt(304), BigInt(134), 30, 44, "published"), // 74 Distinction
  makeResult(BigInt(615), BigInt(304), BigInt(135), 28, 38, "published"), // 66 Credit
  // SCE Level 100 (courses 140=EDU101S, 141=TP101S, 142=GSE101S, 143=PHY101E)
  makeResult(BigInt(620), BigInt(311), BigInt(140), 36, 54, "published"), // 90 Distinction
  makeResult(BigInt(621), BigInt(311), BigInt(141), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(622), BigInt(311), BigInt(142), 25, 35, "published"), // 60 Credit
  makeResult(BigInt(623), BigInt(311), BigInt(143), 28, 40, "published"), // 68 Credit
  makeResult(BigInt(624), BigInt(312), BigInt(140), 22, 30, "published"), // 52 Merit
  makeResult(BigInt(625), BigInt(312), BigInt(141), 18, 27, "published"), // 45 Pass
  makeResult(BigInt(626), BigInt(312), BigInt(142), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(627), BigInt(312), BigInt(143), 15, 20, "published"), // 35 Fail
  makeResult(BigInt(628), BigInt(313), BigInt(140), 35, 50, "published"), // 85 Distinction
  makeResult(BigInt(629), BigInt(313), BigInt(141), 28, 38, "published"), // 66 Credit
  makeResult(BigInt(630), BigInt(313), BigInt(142), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(631), BigInt(313), BigInt(143), 26, 36, "published"), // 62 Credit
  // CSE Level 200 (courses 136=EDU201, 137=TP201, 138=GSE201, 139=CSC201E)
  makeResult(BigInt(640), BigInt(401), BigInt(136), 35, 52, "published"), // 87 Distinction
  makeResult(BigInt(641), BigInt(401), BigInt(137), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(642), BigInt(401), BigInt(138), 28, 35, "published"), // 63 Credit
  makeResult(BigInt(643), BigInt(401), BigInt(139), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(644), BigInt(402), BigInt(136), 25, 35, "published"), // 60 Credit
  makeResult(BigInt(645), BigInt(402), BigInt(137), 22, 32, "published"), // 54 Merit
  makeResult(BigInt(646), BigInt(402), BigInt(138), 18, 28, "published"), // 46 Pass
  makeResult(BigInt(647), BigInt(402), BigInt(139), 15, 20, "published"), // 35 Fail
  makeResult(BigInt(648), BigInt(403), BigInt(136), 38, 55, "published"), // 93 Distinction
  makeResult(BigInt(649), BigInt(403), BigInt(137), 28, 40, "published"), // 68 Credit
  makeResult(BigInt(650), BigInt(403), BigInt(138), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(651), BigInt(403), BigInt(139), 26, 37, "published"), // 63 Credit
  // SCE Level 200 (courses 144=EDU201S, 145=TP201S, 146=GSE201S, 147=PHY201E)
  makeResult(BigInt(660), BigInt(411), BigInt(144), 36, 54, "published"), // 90 Distinction
  makeResult(BigInt(661), BigInt(411), BigInt(145), 30, 42, "published"), // 72 Distinction
  makeResult(BigInt(662), BigInt(411), BigInt(146), 28, 35, "published"), // 63 Credit
  makeResult(BigInt(663), BigInt(411), BigInt(147), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(664), BigInt(412), BigInt(144), 22, 30, "published"), // 52 Merit
  makeResult(BigInt(665), BigInt(412), BigInt(145), 18, 25, "published"), // 43 Pass
  makeResult(BigInt(666), BigInt(412), BigInt(146), 30, 44, "published"), // 74 Distinction
  makeResult(BigInt(667), BigInt(412), BigInt(147), 15, 20, "published"), // 35 Fail
  makeResult(BigInt(668), BigInt(413), BigInt(144), 35, 50, "published"), // 85 Distinction
  makeResult(BigInt(669), BigInt(413), BigInt(145), 28, 38, "published"), // 66 Credit
  makeResult(BigInt(670), BigInt(413), BigInt(146), 32, 46, "published"), // 78 Distinction
  makeResult(BigInt(671), BigInt(413), BigInt(147), 25, 35, "published"), // 60 Credit
];

const DEMO_COURSE_REGISTRATIONS: CourseRegistration[] = [
  { studentId: BigInt(1), courseId: BigInt(1), semester: "First" },
  { studentId: BigInt(1), courseId: BigInt(2), semester: "First" },
  { studentId: BigInt(1), courseId: BigInt(5), semester: "First" },
  { studentId: BigInt(2), courseId: BigInt(1), semester: "First" },
  { studentId: BigInt(2), courseId: BigInt(2), semester: "First" },
];

const DEMO_CALENDARS: AcademicCalendar[] = [
  {
    id: BigInt(1),
    session: "2024/2025",
    semester: "First",
    isActive: true,
    startDate: "2024-09-01",
    endDate: "2025-01-31",
  },
];

const DEMO_TIMETABLE: TimetableEntry[] = [
  {
    id: BigInt(1),
    courseId: BigInt(1),
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    venue: "Room 101",
    semester: "First",
  },
  {
    id: BigInt(2),
    courseId: BigInt(2),
    day: "Tuesday",
    startTime: "10:00",
    endTime: "12:00",
    venue: "Room 102",
    semester: "First",
  },
  {
    id: BigInt(3),
    courseId: BigInt(4),
    day: "Wednesday",
    startTime: "08:00",
    endTime: "10:00",
    venue: "Lab 1",
    semester: "First",
  },
  {
    id: BigInt(4),
    courseId: BigInt(5),
    day: "Thursday",
    startTime: "14:00",
    endTime: "16:00",
    venue: "Room 103",
    semester: "First",
  },
];

const DEMO_FEE_RECORDS: StudentFeeRecord[] = [
  {
    id: BigInt(1),
    studentId: BigInt(1),
    session: "2024/2025",
    tuitionAmount: 150000,
    amountPaid: 150000,
    paymentDate: "2024-09-05",
    status: "paid",
    notes: "Full payment received",
  },
  {
    id: BigInt(2),
    studentId: BigInt(2),
    session: "2024/2025",
    tuitionAmount: 150000,
    amountPaid: 75000,
    paymentDate: "2024-09-10",
    status: "partial",
    notes: "First installment paid",
  },
  {
    id: BigInt(3),
    studentId: BigInt(3),
    session: "2024/2025",
    tuitionAmount: 150000,
    amountPaid: 0,
    status: "outstanding",
    notes: "",
  },
  {
    id: BigInt(4),
    studentId: BigInt(4),
    session: "2024/2025",
    tuitionAmount: 165000,
    amountPaid: 165000,
    paymentDate: "2024-08-28",
    status: "paid",
  },
  {
    id: BigInt(5),
    studentId: BigInt(5),
    session: "2024/2025",
    tuitionAmount: 150000,
    amountPaid: 50000,
    paymentDate: "2024-09-15",
    status: "partial",
  },
];

const DEMO_STAFF: StaffMember[] = [
  {
    id: BigInt(1),
    name: "Dr. Emeka Obi",
    staffId: "CSC/STF/001",
    departmentId: BigInt(1),
    facultyId: BigInt(1),
    qualification: "Ph.D Computer Science, University of Lagos",
    designation: "Senior Lecturer",
    courseIds: [BigInt(1), BigInt(2)],
    dateJoined: "2015-03-01",
    email: "e.obi@university.edu",
    phone: "08011111111",
  },
  {
    id: BigInt(2),
    name: "Mrs. Chioma Eze",
    staffId: "CSC/STF/002",
    departmentId: BigInt(1),
    facultyId: BigInt(1),
    qualification: "M.Sc Computer Science, Obafemi Awolowo University",
    designation: "Lecturer I",
    courseIds: [BigInt(3), BigInt(5), BigInt(6)],
    dateJoined: "2018-09-01",
    email: "c.eze@university.edu",
    phone: "08022222222",
  },
  {
    id: BigInt(3),
    name: "Prof. Adewale Balogun",
    staffId: "EEE/STF/001",
    departmentId: BigInt(2),
    facultyId: BigInt(2),
    qualification: "Ph.D Electrical Engineering, University of Ibadan",
    designation: "Professor",
    courseIds: [BigInt(4), BigInt(7), BigInt(8)],
    dateJoined: "2010-01-15",
    email: "a.balogun@university.edu",
    phone: "08033333333",
  },
  {
    id: BigInt(4),
    name: "Mr. Tunde Adesanya",
    staffId: "CSC/STF/003",
    departmentId: BigInt(1),
    facultyId: BigInt(1),
    qualification: "M.Sc Artificial Intelligence, Covenant University",
    designation: "Lecturer II",
    courseIds: [],
    dateJoined: "2022-01-10",
    email: "t.adesanya@university.edu",
    phone: "08044444444",
  },
];

export function getActiveCalendar(
  cals: AcademicCalendar[],
): AcademicCalendar | undefined {
  return cals.find((c) => c.isActive);
}

// ---- localStorage helpers ----
const PREFIX = "unires_";

function replacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return { __bigint: value.toString() };
  return value;
}

function reviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && "__bigint" in (value as object)) {
    return BigInt((value as { __bigint: string }).__bigint);
  }
  return value;
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw, reviver) as T;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value, replacer));
  } catch {
    // ignore quota errors
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const currentUserRef = useRef<AppUser | null>(null);

  const [departments, setDepartments] = useState<ExtendedDepartment[]>(
    () => lsGet<ExtendedDepartment[]>("departments") ?? DEMO_DEPARTMENTS,
  );
  const [faculties, setFaculties] = useState<Faculty[]>(
    () => lsGet<Faculty[]>("faculties") ?? DEMO_FACULTIES,
  );
  const [courses, setCourses] = useState<Course[]>(
    () => lsGet<Course[]>("courses") ?? DEMO_COURSES,
  );
  const [students, setStudents] = useState<ExtendedStudent[]>(
    () => lsGet<ExtendedStudent[]>("students") ?? DEMO_STUDENTS,
  );
  const [results, setResults] = useState<ExtendedResult[]>(
    () => lsGet<ExtendedResult[]>("results") ?? DEMO_RESULTS,
  );
  const [courseRegistrations, setCourseRegistrations] = useState<
    CourseRegistration[]
  >(
    () =>
      lsGet<CourseRegistration[]>("courseRegistrations") ??
      DEMO_COURSE_REGISTRATIONS,
  );
  const [amendmentRequests, setAmendmentRequests] = useState<
    AmendmentRequest[]
  >(() => lsGet<AmendmentRequest[]>("amendmentRequests") ?? []);
  const [academicCalendars, setAcademicCalendars] = useState<
    AcademicCalendar[]
  >(() => lsGet<AcademicCalendar[]>("academicCalendars") ?? DEMO_CALENDARS);
  const [gradeAppeals, setGradeAppeals] = useState<GradeAppeal[]>(
    () => lsGet<GradeAppeal[]>("gradeAppeals") ?? [],
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => lsGet<AppNotification[]>("notifications") ?? [],
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(
    () => lsGet<AuditEntry[]>("auditLog") ?? [],
  );
  const [graduationApplications, setGraduationApplications] = useState<
    GraduationApplication[]
  >(() => lsGet<GraduationApplication[]>("graduationApplications") ?? []);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    () => lsGet<TimetableEntry[]>("timetableEntries") ?? DEMO_TIMETABLE,
  );
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>(
    () => lsGet<StudentFeeRecord[]>("feeRecords") ?? DEMO_FEE_RECORDS,
  );
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(
    () => lsGet<StaffMember[]>("staffMembers") ?? DEMO_STAFF,
  );
  const [semesterSeals, setSemesterSeals] = useState<SemesterSeal[]>(
    () => lsGet<SemesterSeal[]>("semesterSeals") ?? [],
  );
  const [deferralApplications, setDeferralApplications] = useState<
    DeferralApplication[]
  >(() => lsGet<DeferralApplication[]>("deferralApplications") ?? []);
  const [attendanceSessions, setAttendanceSessions] = useState<
    AttendanceSession[]
  >(() => lsGet<AttendanceSession[]>("attendanceSessions") ?? []);
  const [studentDocuments, setStudentDocuments] = useState<StudentDocument[]>(
    () => lsGet<StudentDocument[]>("studentDocuments") ?? [],
  );
  const [examSchedule, setExamSchedule] = useState<ExamScheduleEntry[]>(
    () => lsGet<ExamScheduleEntry[]>("examSchedule") ?? [],
  );
  const [courseFeedback, setCourseFeedback] = useState<CourseFeedback[]>(
    () => lsGet<CourseFeedback[]>("courseFeedback") ?? [],
  );
  const [seeded] = useState(true);
  const [moderatorNames, setModeratorNamesState] = useState<
    Record<string, string>
  >(() => {
    try {
      const raw = localStorage.getItem("unirp_moderatorNames");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const DEFAULT_INSTITUTION: InstitutionSettings = {
    name: "Federal University of Education Kontagora, Niger State",
    address: "P.M.B. 39, Kontagora, Niger State",
    phone: "+234 801 234 5678",
    email: "registry@fuekos.edu.ng",
    website: "www.fuekos.edu.ng",
    logoText: "FUEK",
  };

  const [institutionSettings, setInstitutionSettings] =
    useState<InstitutionSettings>(
      () =>
        lsGet<InstitutionSettings>("institutionSettings") ??
        DEFAULT_INSTITUTION,
    );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSaved: null,
  });

  useEffect(() => {
    lsSet("institutionSettings", institutionSettings);
  }, [institutionSettings]);

  useEffect(() => {
    const handleOnline = () => setSyncStatus((s) => ({ ...s, isOnline: true }));
    const handleOffline = () =>
      setSyncStatus((s) => ({ ...s, isOnline: false }));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const count =
      students.length + results.length + courses.length + departments.length;
    if (count >= 0)
      setSyncStatus((s) => ({ ...s, lastSaved: new Date().toISOString() }));
  }, [students, results, courses, departments]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    lsSet("departments", departments);
  }, [departments]);
  useEffect(() => {
    lsSet("faculties", faculties);
  }, [faculties]);
  useEffect(() => {
    lsSet("courses", courses);
  }, [courses]);
  useEffect(() => {
    lsSet("students", students);
  }, [students]);
  useEffect(() => {
    lsSet("results", results);
  }, [results]);
  useEffect(() => {
    lsSet("courseRegistrations", courseRegistrations);
  }, [courseRegistrations]);
  useEffect(() => {
    lsSet("amendmentRequests", amendmentRequests);
  }, [amendmentRequests]);
  useEffect(() => {
    lsSet("academicCalendars", academicCalendars);
  }, [academicCalendars]);
  useEffect(() => {
    lsSet("gradeAppeals", gradeAppeals);
  }, [gradeAppeals]);
  useEffect(() => {
    lsSet("notifications", notifications);
  }, [notifications]);
  useEffect(() => {
    lsSet("auditLog", auditLog);
  }, [auditLog]);
  useEffect(() => {
    lsSet("graduationApplications", graduationApplications);
  }, [graduationApplications]);
  useEffect(() => {
    lsSet("timetableEntries", timetableEntries);
  }, [timetableEntries]);
  useEffect(() => {
    lsSet("feeRecords", feeRecords);
  }, [feeRecords]);
  useEffect(() => {
    lsSet("staffMembers", staffMembers);
  }, [staffMembers]);
  useEffect(() => {
    lsSet("semesterSeals", semesterSeals);
  }, [semesterSeals]);
  useEffect(() => {
    lsSet("deferralApplications", deferralApplications);
  }, [deferralApplications]);
  useEffect(() => {
    lsSet("attendanceSessions", attendanceSessions);
  }, [attendanceSessions]);
  useEffect(() => {
    lsSet("studentDocuments", studentDocuments);
  }, [studentDocuments]);
  useEffect(() => {
    lsSet("examSchedule", examSchedule);
  }, [examSchedule]);
  useEffect(() => {
    lsSet("courseFeedback", courseFeedback);
  }, [courseFeedback]);

  const logAudit = useCallback(
    (actorName: string, actorRole: string, action: string, details: string) => {
      const entry: AuditEntry = {
        id: BigInt(Date.now()),
        actorName,
        actorRole,
        action,
        details,
        timestamp: new Date().toISOString(),
      };
      setAuditLog((prev) => [entry, ...prev].slice(0, 500));
    },
    [],
  );

  const addNotification = useCallback(
    (role: string, message: string, tabLink?: string) => {
      const notif: AppNotification = {
        id: BigInt(Date.now()),
        recipientRole: role,
        message,
        tabLink,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    },
    [],
  );

  const login = useCallback(
    (user: AppUser) => {
      setCurrentUser(user);
      logAudit(
        user.name,
        user.role ?? "",
        "Login",
        `${user.name} logged in as ${user.role}`,
      );
    },
    [logAudit],
  );

  const logout = useCallback(() => {
    const u = currentUserRef.current;
    if (u) logAudit(u.name, u.role ?? "", "Logout", `${u.name} logged out`);
    setCurrentUser(null);
  }, [logAudit]);

  const addDepartment = useCallback(
    (dept: ExtendedDepartment) => setDepartments((prev) => [...prev, dept]),
    [],
  );

  const addFaculty = useCallback(
    (faculty: Faculty) => setFaculties((prev) => [...prev, faculty]),
    [],
  );

  const addCourse = useCallback(
    (course: Course) => {
      setCourses((prev) => [...prev, course]);
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Course Added",
          `Added course ${course.code} - ${course.name}`,
        );
    },
    [logAudit],
  );

  const updateCourse = useCallback(
    (course: Course) =>
      setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c))),
    [],
  );

  const removeCourse = useCallback(
    (courseId: bigint) => {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Course Removed",
          `Removed course ID ${courseId}`,
        );
    },
    [logAudit],
  );

  const addStudent = useCallback(
    (student: ExtendedStudent) => {
      setStudents((prev) => [...prev, student]);
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Student Registered",
          `Registered ${student.name} (${student.matricNumber})`,
        );
    },
    [logAudit],
  );

  const upsertResult = useCallback(
    (result: ExtendedResult) => {
      setResults((prev) => {
        const idx = prev.findIndex((r) => r.id === result.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Result Submitted",
          `Result ID ${result.id} submitted/updated`,
        );
    },
    [logAudit],
  );

  const updateResultStatus = useCallback(
    (resultId: bigint, status: string, rejectionReason?: string) => {
      setResults((prev) =>
        prev.map((r) => {
          if (r.id !== resultId) return r;
          const updated: ExtendedResult = { ...r, status };
          if (rejectionReason !== undefined) {
            updated.rejectionReason = rejectionReason;
          } else {
            updated.rejectionReason = undefined;
          }
          return updated;
        }),
      );
      const u = currentUserRef.current;
      if (u) {
        logAudit(
          u.name,
          u.role ?? "",
          "Result Status Changed",
          `Result ${resultId} → ${status}`,
        );
        if (status === "rejected" && rejectionReason) {
          addNotification(
            "Lecturer",
            `Result rejected: ${rejectionReason}`,
            "results",
          );
        }
      }
    },
    [logAudit, addNotification],
  );

  const publishSemesterResults = useCallback(
    (semester: string, coursesList: Course[]) => {
      const semesterCourseIds = new Set(
        coursesList.filter((c) => c.semester === semester).map((c) => c.id),
      );
      setResults((prev) =>
        prev.map((r) => {
          if (r.status !== "dean_approved") return r;
          if (!semesterCourseIds.has(r.courseId)) return r;
          return { ...r, status: "published" };
        }),
      );
      addNotification(
        "Student",
        `Results published for ${semester} semester`,
        "results",
      );
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Results Published",
          `Published ${semester} semester results`,
        );
    },
    [addNotification, logAudit],
  );

  const addCourseRegistration = useCallback(
    (studentId: bigint, courseId: bigint, semester: string) => {
      setCourseRegistrations((prev) => {
        const exists = prev.some(
          (r) =>
            r.studentId === studentId &&
            r.courseId === courseId &&
            r.semester === semester,
        );
        if (exists) return prev;
        return [...prev, { studentId, courseId, semester }];
      });
    },
    [],
  );

  const dropCourseRegistration = useCallback(
    (studentId: bigint, courseId: bigint, semester: string) => {
      setCourseRegistrations((prev) =>
        prev.filter(
          (r) =>
            !(
              r.studentId === studentId &&
              r.courseId === courseId &&
              r.semester === semester
            ),
        ),
      );
    },
    [],
  );

  const addAmendmentRequest = useCallback(
    (req: AmendmentRequest) => {
      setAmendmentRequests((prev) => [...prev, req]);
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Amendment Submitted",
          `Amendment for result ${req.resultId} by ${req.lecturerName}`,
        );
    },
    [logAudit],
  );

  const updateAmendmentStatus = useCallback(
    (id: bigint, status: AmendmentRequest["status"]) => {
      setAmendmentRequests((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    },
    [],
  );

  const approveAmendmentFinal = useCallback(
    (id: bigint) => {
      setAmendmentRequests((prev) => {
        const req = prev.find((a) => a.id === id);
        if (!req) return prev;
        setResults((rPrev) =>
          rPrev.map((r) => {
            if (r.id !== req.resultId) return r;
            const total = req.newCa + req.newExam;
            const { grade, gradePoint, remarks } = calcGradePoint(total);
            return {
              ...r,
              caScore: req.newCa,
              examScore: req.newExam,
              totalScore: total,
              grade,
              gradePoint,
              remarks,
            };
          }),
        );
        addNotification(
          "Lecturer",
          "Amendment approved for your submission",
          "results",
        );
        const u = currentUserRef.current;
        if (u)
          logAudit(
            u.name,
            u.role ?? "",
            "Amendment Approved",
            `Amendment ${id} approved`,
          );
        return prev.map((a) =>
          a.id === id ? { ...a, status: "approved" } : a,
        );
      });
    },
    [addNotification, logAudit],
  );

  const rejectAmendment = useCallback(
    (id: bigint) => {
      setAmendmentRequests((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)),
      );
      addNotification("Lecturer", "Amendment request was rejected", "results");
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Amendment Rejected",
          `Amendment ${id} rejected`,
        );
    },
    [addNotification, logAudit],
  );

  const addAcademicCalendar = useCallback((cal: AcademicCalendar) => {
    setAcademicCalendars((prev) => [...prev, cal]);
  }, []);

  const setActiveCalendar = useCallback(
    (id: bigint) => {
      setAcademicCalendars((prev) =>
        prev.map((c) => ({ ...c, isActive: c.id === id })),
      );
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Academic Calendar Activated",
          `Calendar ID ${id} set as active`,
        );
    },
    [logAudit],
  );

  const submitGradeAppeal = useCallback(
    (appeal: GradeAppeal) => {
      setGradeAppeals((prev) => [...prev, appeal]);
      addNotification(
        "Lecturer",
        `New grade appeal from ${appeal.studentName} for ${appeal.courseName}`,
        "appeals",
      );
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Grade Appeal Submitted",
          `${appeal.studentName} appealed ${appeal.originalGrade} in ${appeal.courseName}`,
        );
    },
    [addNotification, logAudit],
  );

  const respondToAppeal = useCallback(
    (id: bigint, response: string, newStatus: GradeAppeal["status"]) => {
      setGradeAppeals((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const updated = { ...a, status: newStatus };
          if (newStatus === "pending_hod") {
            updated.lecturerResponse = response;
          } else {
            updated.hodResponse = response;
          }
          return updated;
        }),
      );
      const u = currentUserRef.current;
      if (u) {
        logAudit(
          u.name,
          u.role ?? "",
          "Appeal Response",
          `Appeal ${id} → ${newStatus}`,
        );
        if (
          newStatus === "resolved_upheld" ||
          newStatus === "resolved_revised"
        ) {
          addNotification(
            "Student",
            `Your grade appeal has been resolved: ${newStatus === "resolved_revised" ? "Revision approved" : "Upheld"}`,
            "appeals",
          );
        }
      }
    },
    [logAudit, addNotification],
  );

  const markNotificationRead = useCallback((id: bigint) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback((role: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.recipientRole === role ? { ...n, read: true } : n)),
    );
  }, []);

  const submitGraduationApplication = useCallback(
    (app: GraduationApplication) => {
      setGraduationApplications((prev) => [...prev, app]);
      addNotification(
        "HOD",
        `New graduation application from ${app.studentName}`,
        "graduation",
      );
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Graduation Application",
          `${app.studentName} applied for graduation`,
        );
    },
    [addNotification, logAudit],
  );

  const updateGraduationStatus = useCallback(
    (
      id: bigint,
      status: GraduationApplication["status"],
      note?: string,
      noteField?: "hodNote" | "deanNote" | "registrarNote",
    ) => {
      setGraduationApplications((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const updated = { ...a, status };
          if (note && noteField)
            (updated as Record<string, unknown>)[noteField] = note;
          return updated;
        }),
      );
      if (status === "approved") {
        addNotification(
          "Student",
          "Your graduation application has been approved!",
          "graduation",
        );
      } else if (status === "rejected") {
        addNotification(
          "Student",
          "Your graduation application was rejected. Check your portal for details.",
          "graduation",
        );
      }
    },
    [addNotification],
  );

  const addTimetableEntry = useCallback((entry: TimetableEntry) => {
    setTimetableEntries((prev) => [...prev, entry]);
  }, []);

  const removeTimetableEntry = useCallback((id: bigint) => {
    setTimetableEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const upsertFeeRecord = useCallback(
    (record: StudentFeeRecord) => {
      // Auto-compute status
      let status: StudentFeeRecord["status"] = "outstanding";
      if (record.amountPaid >= record.tuitionAmount) status = "paid";
      else if (record.amountPaid > 0) status = "partial";
      const normalized = { ...record, status };
      setFeeRecords((prev) => {
        const idx = prev.findIndex((f) => f.id === record.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = normalized;
          return next;
        }
        return [...prev, normalized];
      });
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Fee Record Updated",
          `Fee record for student ${record.studentId} updated`,
        );
    },
    [logAudit],
  );

  const addStaffMember = useCallback(
    (member: StaffMember) => {
      setStaffMembers((prev) => [...prev, member]);
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Staff Added",
          `${member.name} (${member.staffId}) added`,
        );
    },
    [logAudit],
  );

  const updateStaffMember = useCallback((member: StaffMember) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === member.id ? member : s)),
    );
  }, []);

  const removeStaffMember = useCallback(
    (id: bigint) => {
      setStaffMembers((prev) => prev.filter((s) => s.id !== id));
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Staff Removed",
          `Staff ID ${id} removed`,
        );
    },
    [logAudit],
  );

  const sealSemester = useCallback(
    (semester: string, session: string) => {
      const u = currentUserRef.current;
      const alreadySealed = semesterSeals.some(
        (s) => s.semester === semester && s.session === session,
      );
      if (alreadySealed) return;
      const seal: SemesterSeal = {
        id: BigInt(Date.now()),
        semester,
        session,
        sealedAt: new Date().toISOString(),
        sealedBy: u?.name ?? "Registrar",
      };
      setSemesterSeals((prev) => [...prev, seal]);
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Semester Sealed",
          `${semester} semester (${session}) sealed`,
        );
    },
    [semesterSeals, logAudit],
  );

  const submitDeferralApplication = useCallback(
    (app: DeferralApplication) => {
      setDeferralApplications((prev) => [...prev, app]);
      addNotification(
        "Registrar",
        `New deferral application from ${app.studentName} (${app.matric})`,
        "deferrals",
      );
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Deferral Applied",
          `${app.studentName} applied for deferral`,
        );
    },
    [addNotification, logAudit],
  );

  const updateDeferralStatus = useCallback(
    (id: bigint, status: DeferralApplication["status"], note?: string) => {
      setDeferralApplications((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          return { ...a, status, registrarNote: note ?? a.registrarNote };
        }),
      );
      const app = deferralApplications.find((a) => a.id === id);
      if (status === "approved") {
        addNotification(
          "Student",
          `Your deferral application has been approved. Expected return: ${app?.returnDate ?? ""}`,
          "deferral",
        );
      } else if (status === "rejected") {
        addNotification(
          "Student",
          "Your deferral application was rejected. Check your portal for details.",
          "deferral",
        );
      }
      const u = currentUserRef.current;
      if (u)
        logAudit(
          u.name,
          u.role ?? "",
          "Deferral Status Updated",
          `Deferral ${id} → ${status}`,
        );
    },
    [deferralApplications, addNotification, logAudit],
  );

  const addAttendanceSession = useCallback((session: AttendanceSession) => {
    setAttendanceSessions((prev) => [...prev, session]);
  }, []);

  const updateAttendanceSession = useCallback((session: AttendanceSession) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s)),
    );
  }, []);

  const addStudentDocument = useCallback((doc: StudentDocument) => {
    setStudentDocuments((prev) => [...prev, doc]);
  }, []);

  const removeStudentDocument = useCallback((id: bigint) => {
    setStudentDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addExamScheduleEntry = useCallback((entry: ExamScheduleEntry) => {
    setExamSchedule((prev) => [...prev, entry]);
  }, []);

  const updateExamScheduleEntry = useCallback((entry: ExamScheduleEntry) => {
    setExamSchedule((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
  }, []);

  const removeExamScheduleEntry = useCallback((id: bigint) => {
    setExamSchedule((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addCourseFeedback = useCallback((feedback: CourseFeedback) => {
    setCourseFeedback((prev) => [...prev, feedback]);
  }, []);

  const bulkAddFaculties = useCallback((newFaculties: Faculty[]) => {
    setFaculties((prev) => {
      const existing = new Set(prev.map((f) => f.name.toLowerCase()));
      const toAdd = newFaculties.filter(
        (f) => !existing.has(f.name.toLowerCase()),
      );
      return [...prev, ...toAdd];
    });
  }, []);

  const bulkAddDepartments = useCallback((newDepts: ExtendedDepartment[]) => {
    setDepartments((prev) => {
      const existing = new Set(prev.map((d) => d.name.toLowerCase()));
      const toAdd = newDepts.filter((d) => !existing.has(d.name.toLowerCase()));
      return [...prev, ...toAdd];
    });
  }, []);

  const resetToDefaultData = useCallback(() => {
    setFaculties(FULL_FACULTIES);
    setDepartments(FULL_DEPARTMENTS);
    setCourses(FULL_COURSES);
    const u = currentUserRef.current;
    if (u)
      logAudit(
        u.name,
        u.role ?? "",
        "Data Reset",
        "Default Nigerian university data generated",
      );
  }, [logAudit]);

  const bulkAddCourses = useCallback((newCourses: Course[]) => {
    setCourses((prev) => {
      const existing = new Set(prev.map((c) => c.code.toLowerCase()));
      const toAdd = newCourses.filter(
        (c) => !existing.has(c.code.toLowerCase()),
      );
      return [...prev, ...toAdd];
    });
  }, []);

  const updateInstitutionSettings = useCallback(
    (settings: InstitutionSettings) => {
      setInstitutionSettings(settings);
      setSyncStatus((s) => ({ ...s, lastSaved: new Date().toISOString() }));
    },
    [],
  );

  const setModeratorName = useCallback((courseId: bigint, name: string) => {
    setModeratorNamesState((prev) => {
      const next = { ...prev, [courseId.toString()]: name };
      try {
        localStorage.setItem("unirp_moderatorNames", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const loadSenateSampleData = useCallback(() => {
    setStudents((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = SENATE_SAMPLE_STUDENTS.filter(
        (s) => !existingIds.has(s.id),
      );
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    setResults((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = SENATE_SAMPLE_RESULTS.filter((r) => !existingIds.has(r.id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        departments,
        faculties,
        courses,
        students,
        results,
        courseRegistrations,
        amendmentRequests,
        academicCalendars,
        gradeAppeals,
        notifications,
        auditLog,
        graduationApplications,
        timetableEntries,
        feeRecords,
        staffMembers,
        semesterSeals,
        deferralApplications,
        seeded,
        login,
        logout,
        addDepartment,
        addFaculty,
        addCourse,
        updateCourse,
        removeCourse,
        addStudent,
        upsertResult,
        updateResultStatus,
        publishSemesterResults,
        addCourseRegistration,
        dropCourseRegistration,
        addAmendmentRequest,
        updateAmendmentStatus,
        approveAmendmentFinal,
        rejectAmendment,
        addAcademicCalendar,
        setActiveCalendar,
        submitGradeAppeal,
        respondToAppeal,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        logAudit,
        submitGraduationApplication,
        updateGraduationStatus,
        addTimetableEntry,
        removeTimetableEntry,
        upsertFeeRecord,
        addStaffMember,
        updateStaffMember,
        removeStaffMember,
        sealSemester,
        submitDeferralApplication,
        updateDeferralStatus,
        attendanceSessions,
        studentDocuments,
        addAttendanceSession,
        updateAttendanceSession,
        addStudentDocument,
        removeStudentDocument,
        examSchedule,
        courseFeedback,
        addExamScheduleEntry,
        updateExamScheduleEntry,
        removeExamScheduleEntry,
        addCourseFeedback,
        bulkAddFaculties,
        bulkAddDepartments,
        bulkAddCourses,
        resetToDefaultData,
        institutionSettings,
        syncStatus,
        updateInstitutionSettings,
        loadSenateSampleData,
        moderatorNames,
        setModeratorName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
