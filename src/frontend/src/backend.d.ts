import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Course {
    id: bigint;
    semester: string;
    code: string;
    name: string;
    creditUnits: bigint;
    departmentId: bigint;
    lecturerPrincipal: string;
}
export interface Department {
    id: bigint;
    name: string;
}
export interface Result {
    id: bigint;
    status: string;
    studentId: bigint;
    examScore: number;
    totalScore: number;
    grade: string;
    courseId: bigint;
    caScore: number;
    gradePoint: number;
}
export interface Student {
    id: bigint;
    status: string;
    matricNumber: string;
    name: string;
    level: bigint;
    userPrincipal: string;
    departmentId: bigint;
}
export enum URole {
    HOD = "HOD",
    Lecturer = "Lecturer",
    Registrar = "Registrar",
    SuperAdmin = "SuperAdmin",
    Student = "Student"
}
export interface backendInterface {
    approveResult(resultId: bigint): Promise<Result | null>;
    calculateStudentGPA(studentId: bigint): Promise<number>;
    createCourse(name: string, code: string, creditUnits: bigint, departmentId: bigint, lecturerPrincipal: string, semester: string): Promise<Course>;
    createDepartment(name: string): Promise<Department>;
    createStudent(name: string, matricNumber: string, departmentId: bigint, level: bigint, userPrincipal: string): Promise<Student>;
    enterResult(studentId: bigint, courseId: bigint, caScore: number, examScore: number): Promise<Result>;
    getAllResults(): Promise<Array<Result>>;
    getAllUserRoles(): Promise<Array<[string, URole]>>;
    getApprovedResults(): Promise<Array<Result>>;
    getCourses(): Promise<Array<Course>>;
    getCoursesByDepartment(deptId: bigint): Promise<Array<Course>>;
    getDepartments(): Promise<Array<Department>>;
    getMyCourses(): Promise<Array<Course>>;
    getMyStudentProfile(): Promise<Student | null>;
    getMyURole(): Promise<URole | null>;
    getPendingResults(): Promise<Array<Result>>;
    getResultsByCourse(courseId: bigint): Promise<Array<Result>>;
    getResultsByStudent(studentId: bigint): Promise<Array<Result>>;
    getStudentCourses(studentId: bigint): Promise<Array<Course>>;
    getStudents(): Promise<Array<Student>>;
    publishResult(resultId: bigint): Promise<Result | null>;
    registerStudentCourse(studentId: bigint, courseId: bigint): Promise<void>;
    rejectResult(resultId: bigint): Promise<Result | null>;
    setUserRole(principal: string, role: URole): Promise<void>;
    submitResult(resultId: bigint): Promise<Result | null>;
    updateResult(resultId: bigint, caScore: number, examScore: number): Promise<Result | null>;
}
