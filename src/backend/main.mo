import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Prim "mo:prim";
import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";

persistent actor {
  // ─── Auth state
  transient let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─── Types
  public type URole = { #SuperAdmin; #Registrar; #HOD; #Lecturer; #Student };

  public type Department = { id : Nat; name : Text };

  public type Course = {
    id : Nat;
    name : Text;
    code : Text;
    creditUnits : Nat;
    departmentId : Nat;
    lecturerPrincipal : Text;
    semester : Text;
  };

  public type Student = {
    id : Nat;
    name : Text;
    matricNumber : Text;
    departmentId : Nat;
    level : Nat;
    status : Text;
    userPrincipal : Text;
  };

  public type Result = {
    id : Nat;
    studentId : Nat;
    courseId : Nat;
    caScore : Float;
    examScore : Float;
    totalScore : Float;
    grade : Text;
    gradePoint : Float;
    status : Text;
  };

  public type Registration = { studentId : Nat; courseId : Nat };

  // ─── State
  transient var nextDeptId : Nat = 1;
  transient var nextCourseId : Nat = 1;
  transient var nextStudentId : Nat = 1;
  transient var nextResultId : Nat = 1;
  transient var nextRegId : Nat = 1;

  transient let userRoles = Map.empty<Text, URole>();
  transient let departments = Map.empty<Nat, Department>();
  transient let courses = Map.empty<Nat, Course>();
  transient let students = Map.empty<Nat, Student>();
  transient let results = Map.empty<Nat, Result>();
  transient let registrations = Map.empty<Nat, Registration>();

  // ─── Grade helper
  func calcGrade(total : Float) : (Text, Float) {
    if (total >= 70.0) { ("A", 5.0) }
    else if (total >= 60.0) { ("B", 4.0) }
    else if (total >= 50.0) { ("C", 3.0) }
    else if (total >= 45.0) { ("D", 2.0) }
    else if (total >= 40.0) { ("E", 1.0) }
    else { ("F", 0.0) }
  };

  // ─── Role Management
  public shared func setUserRole(principal : Text, role : URole) : async () {
    userRoles.add(principal, role);
  };

  public query ({ caller }) func getMyURole() : async ?URole {
    let p = debug_show(caller);
    userRoles.get(p);
  };

  public query func getAllUserRoles() : async [(Text, URole)] {
    userRoles.toArray();
  };

  // ─── Departments
  public shared func createDepartment(name : Text) : async Department {
    let dept : Department = { id = nextDeptId; name };
    departments.add(nextDeptId, dept);
    nextDeptId += 1;
    dept
  };

  public query func getDepartments() : async [Department] {
    departments.values().toArray();
  };

  // ─── Courses
  public shared func createCourse(
    name : Text,
    code : Text,
    creditUnits : Nat,
    departmentId : Nat,
    lecturerPrincipal : Text,
    semester : Text
  ) : async Course {
    let c : Course = { id = nextCourseId; name; code; creditUnits; departmentId; lecturerPrincipal; semester };
    courses.add(nextCourseId, c);
    nextCourseId += 1;
    c
  };

  public query func getCourses() : async [Course] {
    courses.values().toArray();
  };

  public query func getCoursesByDepartment(deptId : Nat) : async [Course] {
    courses.values().toArray().filter(func(c : Course) : Bool { c.departmentId == deptId });
  };

  public query ({ caller }) func getMyCourses() : async [Course] {
    let p = debug_show(caller);
    courses.values().toArray().filter(func(c : Course) : Bool { c.lecturerPrincipal == p });
  };

  // ─── Students
  public shared func createStudent(
    name : Text,
    matricNumber : Text,
    departmentId : Nat,
    level : Nat,
    userPrincipal : Text
  ) : async Student {
    let s : Student = { id = nextStudentId; name; matricNumber; departmentId; level; status = "active"; userPrincipal };
    students.add(nextStudentId, s);
    nextStudentId += 1;
    s
  };

  public query func getStudents() : async [Student] {
    students.values().toArray();
  };

  public query ({ caller }) func getMyStudentProfile() : async ?Student {
    let p = debug_show(caller);
    students.values().toArray().find(func(s : Student) : Bool { s.userPrincipal == p });
  };

  // ─── Course Registration
  public shared func registerStudentCourse(studentId : Nat, courseId : Nat) : async () {
    let reg : Registration = { studentId; courseId };
    registrations.add(nextRegId, reg);
    nextRegId += 1;
  };

  public query func getStudentCourses(studentId : Nat) : async [Course] {
    registrations.values().toArray()
      .filter(func(r : Registration) : Bool { r.studentId == studentId })
      .filterMap(func(r : Registration) : ?Course { courses.get(r.courseId) });
  };

  // ─── Results
  public shared func enterResult(
    studentId : Nat,
    courseId : Nat,
    caScore : Float,
    examScore : Float
  ) : async Result {
    let total = caScore + examScore;
    let (grade, gradePoint) = calcGrade(total);
    let r : Result = {
      id = nextResultId;
      studentId;
      courseId;
      caScore;
      examScore;
      totalScore = total;
      grade;
      gradePoint;
      status = "draft";
    };
    results.add(nextResultId, r);
    nextResultId += 1;
    r
  };

  public shared func updateResult(resultId : Nat, caScore : Float, examScore : Float) : async ?Result {
    switch (results.get(resultId)) {
      case null { null };
      case (?r) {
        if (r.status == "draft") {
          let total = caScore + examScore;
          let (grade, gradePoint) = calcGrade(total);
          let updated = { r with caScore; examScore; totalScore = total; grade; gradePoint };
          results.add(resultId, updated);
          ?updated
        } else { null };
      };
    }
  };

  func changeResultStatus(resultId : Nat, newStatus : Text) : ?Result {
    switch (results.get(resultId)) {
      case null { null };
      case (?r) {
        let updated = { r with status = newStatus };
        results.add(resultId, updated);
        ?updated
      };
    }
  };

  public shared func submitResult(resultId : Nat) : async ?Result {
    changeResultStatus(resultId, "submitted")
  };

  public shared func approveResult(resultId : Nat) : async ?Result {
    changeResultStatus(resultId, "approved")
  };

  public shared func publishResult(resultId : Nat) : async ?Result {
    changeResultStatus(resultId, "published")
  };

  public shared func rejectResult(resultId : Nat) : async ?Result {
    changeResultStatus(resultId, "draft")
  };

  public query func getResultsByStudent(studentId : Nat) : async [Result] {
    results.values().toArray().filter(func(r : Result) : Bool { r.studentId == studentId });
  };

  public query func getResultsByCourse(courseId : Nat) : async [Result] {
    results.values().toArray().filter(func(r : Result) : Bool { r.courseId == courseId });
  };

  public query func getPendingResults() : async [Result] {
    results.values().toArray().filter(func(r : Result) : Bool { r.status == "submitted" });
  };

  public query func getApprovedResults() : async [Result] {
    results.values().toArray().filter(func(r : Result) : Bool { r.status == "approved" });
  };

  public query func getAllResults() : async [Result] {
    results.values().toArray();
  };

  // ─── GPA
  public query func calculateStudentGPA(studentId : Nat) : async Float {
    let published = results.values().toArray().filter(
      func(r : Result) : Bool { r.studentId == studentId and r.status == "published" }
    );
    if (published.size() == 0) { return 0.0 };
    var totalPoints = 0.0;
    var totalCredits = 0.0;
    for (r in published.vals()) {
      switch (courses.get(r.courseId)) {
        case (?c) {
          let cu = Prim.intToFloat(c.creditUnits);
          totalPoints += r.gradePoint * cu;
          totalCredits += cu;
        };
        case null {};
      };
    };
    if (totalCredits == 0.0) { 0.0 } else { totalPoints / totalCredits }
  };
};
