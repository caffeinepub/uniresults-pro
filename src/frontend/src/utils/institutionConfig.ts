export type InstitutionType =
  | "university"
  | "nce"
  | "polytechnic"
  | "secondary"
  | "primary"
  | "pre_nursery";

export interface InstitutionConfig {
  type: InstitutionType;
  label: string;
  shortLabel: string;
  levels: string[];
  levelLabel: string;
  programmeLabel: string;
  gradeScale: GradeEntry[];
  reportTitle: string;
  certificateTitle: string;
  semesterLabel: string;
  useGPA: boolean;
  useCGPA: boolean;
  // New fields for module-level control
  showSIWES: boolean;
  showJAMBImport: boolean;
  showGPA: boolean;
  showCGPA: boolean;
  showTP: boolean;
  showGraduation: boolean;
  showPostgraduate: boolean;
  showCreditUnits: boolean;
  creditRules: { minPerSem: number; maxPerSem: number };
}

export interface GradeEntry {
  min: number;
  max: number;
  grade: string;
  remark: string;
  points?: number;
}

export function getInstitutionConfig(type?: string): InstitutionConfig {
  switch (type) {
    case "nce":
      return {
        type: "nce",
        label: "College of Education (NCE)",
        shortLabel: "NCE",
        levels: ["100", "200", "300"],
        levelLabel: "Level",
        programmeLabel: "NCE Programme",
        gradeScale: [
          { min: 70, max: 100, grade: "A", remark: "Distinction", points: 5 },
          { min: 60, max: 69, grade: "B", remark: "Credit", points: 4 },
          { min: 50, max: 59, grade: "C", remark: "Merit", points: 3 },
          { min: 45, max: 49, grade: "D", remark: "Pass", points: 2 },
          { min: 0, max: 44, grade: "F", remark: "Fail", points: 0 },
        ],
        reportTitle: "NCE Cumulative Examination Results",
        certificateTitle: "Nigeria Certificate in Education",
        semesterLabel: "Semester",
        useGPA: true,
        useCGPA: true,
        showSIWES: false,
        showJAMBImport: true,
        showGPA: true,
        showCGPA: true,
        showTP: true,
        showGraduation: true,
        showPostgraduate: false,
        showCreditUnits: true,
        creditRules: { minPerSem: 12, maxPerSem: 21 },
      };
    case "polytechnic":
      return {
        type: "polytechnic",
        label: "Polytechnic (OND/HND)",
        shortLabel: "Poly",
        levels: ["ND1", "ND2", "HND1", "HND2"],
        levelLabel: "Level",
        programmeLabel: "ND / HND Programme",
        gradeScale: [
          { min: 70, max: 100, grade: "A", remark: "Distinction", points: 5 },
          { min: 60, max: 69, grade: "B", remark: "Upper Credit", points: 4 },
          { min: 50, max: 59, grade: "C", remark: "Lower Credit", points: 3 },
          { min: 45, max: 49, grade: "D", remark: "Pass", points: 2 },
          { min: 0, max: 44, grade: "F", remark: "Fail", points: 0 },
        ],
        reportTitle: "Polytechnic Examination Results",
        certificateTitle: "Ordinary / Higher National Diploma",
        semesterLabel: "Semester",
        useGPA: true,
        useCGPA: true,
        showSIWES: true,
        showJAMBImport: true,
        showGPA: true,
        showCGPA: true,
        showTP: false,
        showGraduation: true,
        showPostgraduate: false,
        showCreditUnits: true,
        creditRules: { minPerSem: 12, maxPerSem: 20 },
      };
    case "secondary":
      return {
        type: "secondary",
        label: "Secondary School (JS1\u2013SS3)",
        shortLabel: "Secondary",
        levels: ["JS1", "JS2", "JS3", "SS1", "SS2", "SS3"],
        levelLabel: "Class",
        programmeLabel: "Secondary Education",
        gradeScale: [
          { min: 75, max: 100, grade: "A1", remark: "Excellent" },
          { min: 70, max: 74, grade: "B2", remark: "Very Good" },
          { min: 65, max: 69, grade: "B3", remark: "Good" },
          { min: 60, max: 64, grade: "C4", remark: "Credit" },
          { min: 55, max: 59, grade: "C5", remark: "Credit" },
          { min: 50, max: 54, grade: "C6", remark: "Credit" },
          { min: 45, max: 49, grade: "D7", remark: "Pass" },
          { min: 40, max: 44, grade: "E8", remark: "Pass" },
          { min: 0, max: 39, grade: "F9", remark: "Fail" },
        ],
        reportTitle: "Terminal Examination Results",
        certificateTitle: "WAEC/NECO Certificate",
        semesterLabel: "Term",
        useGPA: false,
        useCGPA: false,
        showSIWES: false,
        showJAMBImport: false,
        showGPA: false,
        showCGPA: false,
        showTP: false,
        showGraduation: false,
        showPostgraduate: false,
        showCreditUnits: false,
        creditRules: { minPerSem: 0, maxPerSem: 0 },
      };
    case "primary":
      return {
        type: "primary",
        label: "Primary School (P1\u2013P6)",
        shortLabel: "Primary",
        levels: ["P1", "P2", "P3", "P4", "P5", "P6"],
        levelLabel: "Class",
        programmeLabel: "Primary Education",
        gradeScale: [
          { min: 80, max: 100, grade: "A", remark: "Excellent" },
          { min: 65, max: 79, grade: "B", remark: "Very Good" },
          { min: 50, max: 64, grade: "C", remark: "Good" },
          { min: 40, max: 49, grade: "D", remark: "Fair" },
          { min: 0, max: 39, grade: "F", remark: "Needs Improvement" },
        ],
        reportTitle: "End of Term Results",
        certificateTitle: "Primary School Leaving Certificate",
        semesterLabel: "Term",
        useGPA: false,
        useCGPA: false,
        showSIWES: false,
        showJAMBImport: false,
        showGPA: false,
        showCGPA: false,
        showTP: false,
        showGraduation: false,
        showPostgraduate: false,
        showCreditUnits: false,
        creditRules: { minPerSem: 0, maxPerSem: 0 },
      };
    case "pre_nursery":
      return {
        type: "pre_nursery",
        label: "Pre-Nursery / Nursery (N1\u2013N3)",
        shortLabel: "Nursery",
        levels: ["Pre-Nursery", "Nursery 1", "Nursery 2", "Nursery 3"],
        levelLabel: "Class",
        programmeLabel: "Early Childhood Education",
        gradeScale: [
          { min: 85, max: 100, grade: "E", remark: "Excellent" },
          { min: 70, max: 84, grade: "VG", remark: "Very Good" },
          { min: 55, max: 69, grade: "G", remark: "Good" },
          { min: 40, max: 54, grade: "F", remark: "Fair" },
          { min: 0, max: 39, grade: "NI", remark: "Needs Improvement" },
        ],
        reportTitle: "Developmental Progress Report",
        certificateTitle: "Early Years Completion Certificate",
        semesterLabel: "Term",
        useGPA: false,
        useCGPA: false,
        showSIWES: false,
        showJAMBImport: false,
        showGPA: false,
        showCGPA: false,
        showTP: false,
        showGraduation: false,
        showPostgraduate: false,
        showCreditUnits: false,
        creditRules: { minPerSem: 0, maxPerSem: 0 },
      };
    default: // university
      return {
        type: "university",
        label: "University (100\u2013600 Level)",
        shortLabel: "University",
        levels: ["100", "200", "300", "400", "500", "600", "700", "800"],
        levelLabel: "Level",
        programmeLabel: "Undergraduate / Postgraduate",
        gradeScale: [
          { min: 70, max: 100, grade: "A", remark: "Excellent", points: 5 },
          { min: 60, max: 69, grade: "B", remark: "Good", points: 4 },
          { min: 50, max: 59, grade: "C", remark: "Average", points: 3 },
          { min: 45, max: 49, grade: "D", remark: "Below Average", points: 2 },
          { min: 40, max: 44, grade: "E", remark: "Pass", points: 1 },
          { min: 0, max: 39, grade: "F", remark: "Fail", points: 0 },
        ],
        reportTitle: "Senate Cumulative Examination Results",
        certificateTitle: "Bachelor / Postgraduate Degree",
        semesterLabel: "Semester",
        useGPA: true,
        useCGPA: true,
        showSIWES: true,
        showJAMBImport: true,
        showGPA: true,
        showCGPA: true,
        showTP: false,
        showGraduation: true,
        showPostgraduate: true,
        showCreditUnits: true,
        creditRules: { minPerSem: 15, maxPerSem: 24 },
      };
  }
}

export const INSTITUTION_TYPE_OPTIONS: {
  value: InstitutionType;
  label: string;
}[] = [
  { value: "university", label: "University (100\u2013600 Level)" },
  { value: "nce", label: "College of Education \u2013 NCE (100\u2013300)" },
  { value: "polytechnic", label: "Polytechnic \u2013 OND/HND (ND1\u2013HND2)" },
  { value: "secondary", label: "Secondary School (JS1\u2013SS3)" },
  { value: "primary", label: "Primary School (P1\u2013P6)" },
  { value: "pre_nursery", label: "Pre-Nursery / Nursery (N1\u2013N3)" },
];
