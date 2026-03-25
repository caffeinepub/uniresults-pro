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
  seeded: boolean;
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
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_FACULTIES: Faculty[] = [
  { id: BigInt(1), name: "Faculty of Sciences" },
  { id: BigInt(2), name: "Faculty of Engineering" },
  { id: BigInt(3), name: "Faculty of Arts & Social Sciences" },
];

const DEMO_DEPARTMENTS: ExtendedDepartment[] = [
  { id: BigInt(1), name: "Computer Science", facultyId: BigInt(1) },
  { id: BigInt(2), name: "Electrical Engineering", facultyId: BigInt(2) },
];

const DEMO_COURSES: Course[] = [
  {
    id: BigInt(1),
    name: "Data Structures & Algorithms",
    code: "CSC301",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(2),
    name: "Database Management Systems",
    code: "CSC302",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-1",
    semester: "First",
  },
  {
    id: BigInt(3),
    name: "Computer Networks",
    code: "CSC303",
    creditUnits: BigInt(2),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(4),
    name: "Circuit Theory",
    code: "EEE301",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(5),
    name: "Software Engineering",
    code: "CSC304",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "First",
  },
  {
    id: BigInt(6),
    name: "Operating Systems",
    code: "CSC305",
    creditUnits: BigInt(3),
    departmentId: BigInt(1),
    lecturerPrincipal: "lecturer-2",
    semester: "Second",
  },
  {
    id: BigInt(7),
    name: "Digital Electronics",
    code: "EEE302",
    creditUnits: BigInt(3),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "First",
  },
  {
    id: BigInt(8),
    name: "Power Systems",
    code: "EEE303",
    creditUnits: BigInt(2),
    departmentId: BigInt(2),
    lecturerPrincipal: "lecturer-3",
    semester: "Second",
  },
];

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

  const bulkAddCourses = useCallback((newCourses: Course[]) => {
    setCourses((prev) => {
      const existing = new Set(prev.map((c) => c.code.toLowerCase()));
      const toAdd = newCourses.filter(
        (c) => !existing.has(c.code.toLowerCase()),
      );
      return [...prev, ...toAdd];
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
