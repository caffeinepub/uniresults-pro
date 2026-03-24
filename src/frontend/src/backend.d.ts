import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type UserRole = { admin: null } | { user: null } | { guest: null };
export type URole =
  | { SuperAdmin: null }
  | { Registrar: null }
  | { HOD: null }
  | { Lecturer: null }
  | { Student: null };

export interface Department {
  id: bigint;
  name: string;
}

export interface Course {
  id: bigint;
  name: string;
  code: string;
  creditUnits: bigint;
  departmentId: bigint;
  lecturerPrincipal: string;
  semester: string;
}

export interface Student {
  id: bigint;
  name: string;
  matricNumber: string;
  departmentId: bigint;
  level: bigint;
  status: string;
  userPrincipal: string;
}

export interface AcademicResult {
  id: bigint;
  studentId: bigint;
  courseId: bigint;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  remarks: string;
  status: string;
}

export interface Registration {
  studentId: bigint;
  courseId: bigint;
}

export interface backendInterface {
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  approveResult(resultId: bigint): Promise<Option<AcademicResult>>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  calculateStudentGPA(studentId: bigint): Promise<number>;
  createCourse(
    name: string,
    code: string,
    creditUnits: bigint,
    departmentId: bigint,
    lecturerPrincipal: string,
    semester: string
  ): Promise<Course>;
  createDepartment(name: string): Promise<Department>;
  createStudent(
    name: string,
    matricNumber: string,
    departmentId: bigint,
    level: bigint,
    userPrincipal: string
  ): Promise<Student>;
  enterResult(
    studentId: bigint,
    courseId: bigint,
    caScore: number,
    examScore: number
  ): Promise<AcademicResult>;
  getAllResults(): Promise<AcademicResult[]>;
  getAllUserRoles(): Promise<[string, URole][]>;
  getApprovedResults(): Promise<AcademicResult[]>;
  getCallerUserRole(): Promise<UserRole>;
  getCourses(): Promise<Course[]>;
  getCoursesByDepartment(deptId: bigint): Promise<Course[]>;
  getDepartments(): Promise<Department[]>;
  getMyCourses(): Promise<Course[]>;
  getMyStudentProfile(): Promise<Option<Student>>;
  getMyURole(): Promise<Option<URole>>;
  getPendingResults(): Promise<AcademicResult[]>;
  getResultsByCourse(courseId: bigint): Promise<AcademicResult[]>;
  getResultsByStudent(studentId: bigint): Promise<AcademicResult[]>;
  getStudentCourses(studentId: bigint): Promise<Course[]>;
  getStudents(): Promise<Student[]>;
  isCallerAdmin(): Promise<boolean>;
  publishResult(resultId: bigint): Promise<Option<AcademicResult>>;
  registerStudentCourse(studentId: bigint, courseId: bigint): Promise<void>;
  rejectResult(resultId: bigint): Promise<Option<AcademicResult>>;
  setUserRole(principal: string, role: URole): Promise<void>;
  submitResult(resultId: bigint): Promise<Option<AcademicResult>>;
  updateResult(
    resultId: bigint,
    caScore: number,
    examScore: number
  ): Promise<Option<AcademicResult>>;
}
