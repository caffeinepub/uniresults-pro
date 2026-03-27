import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Upload,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type ExtendedStudent, useApp } from "../../context/AppContext";

interface ParsedCandidate {
  regNo: string;
  surname: string;
  firstname: string;
  otherNames: string;
  course: string;
  state: string;
  lga: string;
  sex: string;
  isDuplicate: boolean;
  selected: boolean;
  mappedDeptId: bigint | null;
  mappedDeptName: string;
}

const DEPT_COURSE_MAP: Record<string, string[]> = {
  "Biology Education": ["biology", "bio edu"],
  "Chemistry Education": ["chemistry", "chem edu"],
  "Computer Science Education": [
    "computer science",
    "csc edu",
    "edu & computer",
    "education & computer",
  ],
  "Mathematics Education": ["mathematics", "math edu", "maths edu"],
  "Science Education": ["science education", "general science"],
  "Physics Education": ["physics", "phy edu"],
};

const DEPT_CODE_MAP: Record<string, string> = {
  "Biology Education": "BIO",
  "Chemistry Education": "CHM",
  "Computer Science Education": "CSE",
  "Mathematics Education": "MTE",
  "Science Education": "SCE",
  "Physics Education": "PHY",
};

function mapCourseToDept(
  courseName: string,
  departments: Array<{ id: bigint; name: string }>,
): { deptId: bigint | null; deptName: string } {
  const lower = courseName.toLowerCase();
  // Try direct keyword match
  for (const [deptName, keywords] of Object.entries(DEPT_COURSE_MAP)) {
    if (keywords.some((k) => lower.includes(k))) {
      const dept = departments.find((d) =>
        d.name.toLowerCase().includes(deptName.toLowerCase().split(" ")[0]),
      );
      if (dept) return { deptId: dept.id, deptName: dept.name };
    }
  }
  // Try direct dept name match
  const dept = departments.find(
    (d) =>
      lower.includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes(lower),
  );
  if (dept) return { deptId: dept.id, deptName: dept.name };
  return { deptId: null, deptName: courseName };
}

function getDeptCode(deptName: string): string {
  for (const [name, code] of Object.entries(DEPT_CODE_MAP)) {
    if (deptName.toLowerCase().includes(name.toLowerCase().split(" ")[0]))
      return code;
  }
  return (
    deptName
      .replace(/[^A-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "STD"
  );
}

function parseCSV(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

function downloadTemplate() {
  const header = "Reg No,Surname,Firstname,Other Names,Course,State,LGA,Sex";
  const sample =
    "19XXXXXXXXXX,IBRAHIM,AHMED,USMAN,Biology Education,Niger,Kontagora,Male";
  const blob = new Blob([`${header}\n${sample}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jamb_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function JAMBImportTab() {
  const { students, departments, addStudent, logAudit, currentUser } = useApp();
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedCandidate[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? "");
      toast.success('File loaded. Click "Parse & Preview" to continue.');
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      toast.error("No data rows found. Please check your CSV.");
      return;
    }
    // Skip header row
    const data = rows.slice(1);
    const allDepts = [...departments];

    const parsed: ParsedCandidate[] = data.map((cols) => {
      const regNo = cols[0] ?? "";
      const surname = cols[1] ?? "";
      const firstname = cols[2] ?? "";
      const otherNames = cols[3] ?? "";
      const course = cols[4] ?? "";
      const state = cols[5] ?? "";
      const lga = cols[6] ?? "";
      const sex = cols[7] ?? "";
      const isDuplicate = students.some(
        (s) => s.jambRegNo && s.jambRegNo === regNo,
      );
      const { deptId, deptName } = mapCourseToDept(course, allDepts);
      return {
        regNo,
        surname,
        firstname,
        otherNames,
        course,
        state,
        lga,
        sex,
        isDuplicate,
        selected: !isDuplicate,
        mappedDeptId: deptId,
        mappedDeptName: deptId ? deptName : course,
      };
    });
    setParsedRows(parsed);
    setImportDone(null);
    toast.success(`Parsed ${parsed.length} rows. Review below.`);
  };

  const toggleSelect = (idx: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)),
    );
  };

  const handleImport = async (onlySelected = true) => {
    const toImport = onlySelected
      ? parsedRows.filter((r) => r.selected && !r.isDuplicate)
      : parsedRows.filter((r) => !r.isDuplicate);
    if (toImport.length === 0) {
      toast.error("No rows to import.");
      return;
    }
    setImporting(true);
    setImportProgress(0);
    let imported = 0;
    let skipped = 0;
    const year = new Date().getFullYear();

    // Count existing students per dept to generate matric numbers
    const deptCounters: Record<string, number> = {};
    for (const s of students) {
      const did = String(s.departmentId ?? "");
      deptCounters[did] = (deptCounters[did] ?? 0) + 1;
    }

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
      await new Promise((r) => setTimeout(r, 10));

      if (!row.mappedDeptId) {
        skipped++;
        continue;
      }
      const deptId = row.mappedDeptId;
      const deptKey = String(deptId);
      deptCounters[deptKey] = (deptCounters[deptKey] ?? 0) + 1;
      const sn = String(deptCounters[deptKey]).padStart(3, "0");
      const deptCode = getDeptCode(row.mappedDeptName);
      const matric = `${deptCode}/${year}/${sn}`;
      const fullName = [row.firstname, row.otherNames, row.surname]
        .filter(Boolean)
        .join(" ");

      const student: ExtendedStudent = {
        id: BigInt(Date.now() + i),
        name: fullName || row.surname,
        matricNumber: matric,
        departmentId: deptId,
        level: BigInt(100),
        status: "accepted",
        userPrincipal: `student-jamb-${row.regNo}`,
        gender: row.sex.toLowerCase().startsWith("f") ? "Female" : "Male",
        state: row.state,
        lga: row.lga,
        jambRegNo: row.regNo,
        regNo: row.regNo,
        admissionYear: year,
        programmeType: "Undergraduate",
      };
      addStudent(student);
      imported++;
    }
    setImporting(false);
    setImportDone({ imported, skipped });
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Registrar",
      "JAMB Import",
      `Imported ${imported} students from JAMB list`,
    );
    toast.success(`Import complete: ${imported} imported, ${skipped} skipped.`);
  };

  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const selectedCount = parsedRows.filter(
    (r) => r.selected && !r.isDuplicate,
  ).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            JAMB Admission Import
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Import JAMB candidates from CSV — paste text or upload a file
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          data-ocid="jamb_import.upload_button"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>
      </div>

      {/* Input section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">Paste CSV</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="pt-3">
            <Label className="text-sm font-medium mb-2 block">
              Paste CSV content here
            </Label>
            <Textarea
              data-ocid="jamb_import.textarea"
              className="font-mono text-xs min-h-[160px]"
              placeholder={
                "Reg No,Surname,Firstname,Other Names,Course,State,LGA,Sex\n19XXXXXXXXXX,IBRAHIM,AHMED,USMAN,Biology Education,Niger,Kontagora,Male\n19YYYYYYYYYY,ABUBAKAR,FATIMA,,Chemistry Education,Kogi,Lokoja,Female"
              }
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="upload" className="pt-3">
            <button
              type="button"
              className="w-full border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              data-ocid="jamb_import.dropzone"
            >
              <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag &amp; drop a CSV file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Accepts .csv files
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </button>
            {csvText && (
              <p className="text-xs text-success mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> File loaded (
                {csvText.split("\n").length} lines)
              </p>
            )}
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleParse}
          data-ocid="jamb_import.primary_button"
          disabled={!csvText.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Parse &amp; Preview
        </Button>
      </div>

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {parsedRows.length} candidates parsed
              </span>
              {duplicateCount > 0 && (
                <Badge variant="destructive">{duplicateCount} duplicates</Badge>
              )}
              <Badge variant="secondary">{selectedCount} selected</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                data-ocid="jamb_import.secondary_button"
                onClick={() => handleImport(true)}
                disabled={importing || selectedCount === 0}
              >
                Import Selected ({selectedCount})
              </Button>
              <Button
                size="sm"
                data-ocid="jamb_import.submit_button"
                onClick={() => handleImport(false)}
                disabled={importing}
              >
                Import All Non-Duplicates
              </Button>
            </div>
          </div>

          {importing && (
            <div
              className="px-4 py-3 border-b border-border"
              data-ocid="jamb_import.loading_state"
            >
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Importing... {importProgress}%
              </p>
            </div>
          )}

          {importDone && (
            <div
              className="px-4 py-3 border-b border-border bg-success/10 flex items-center gap-2"
              data-ocid="jamb_import.success_state"
            >
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">
                {importDone.imported} students imported, {importDone.skipped}{" "}
                skipped
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table data-ocid="jamb_import.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={parsedRows.every(
                        (r) => r.isDuplicate || r.selected,
                      )}
                      onCheckedChange={(v) =>
                        setParsedRows((prev) =>
                          prev.map((r) =>
                            r.isDuplicate ? r : { ...r, selected: !!v },
                          ),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>S/N</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Course / Department</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>LGA</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((row, idx) => (
                  <TableRow
                    key={`${row.regNo}-${idx}`}
                    data-ocid={`jamb_import.item.${idx + 1}`}
                    className={row.isDuplicate ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={row.selected}
                        disabled={row.isDuplicate}
                        onCheckedChange={() => toggleSelect(idx)}
                        data-ocid={`jamb_import.checkbox.${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.regNo}
                    </TableCell>
                    <TableCell>
                      {[row.firstname, row.otherNames, row.surname]
                        .filter(Boolean)
                        .join(" ")}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{row.course}</div>
                        {row.mappedDeptId ? (
                          <div className="text-success text-xs">
                            → {row.mappedDeptName}
                          </div>
                        ) : (
                          <div className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> No match
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{row.state}</TableCell>
                    <TableCell className="text-xs">{row.lga}</TableCell>
                    <TableCell className="text-xs">{row.sex}</TableCell>
                    <TableCell>
                      {row.isDuplicate ? (
                        <Badge variant="destructive">Duplicate</Badge>
                      ) : (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {parsedRows.length === 0 && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="jamb_import.empty_state"
        >
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Paste or upload a JAMB candidate list, then click "Parse &amp;
            Preview"
          </p>
        </div>
      )}
    </div>
  );
}
