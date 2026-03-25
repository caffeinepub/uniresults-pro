const PREFIX = "unires_";

export function getInstitutionName(): string {
  try {
    const s = localStorage.getItem(`${PREFIX}institutionSettings`);
    if (s)
      return (
        JSON.parse(s).name ||
        "Federal University of Education Kontagora, Niger State"
      );
  } catch {}
  return "Federal University of Education Kontagora, Niger State";
}

export function getInstitutionSettings() {
  try {
    const s = localStorage.getItem(`${PREFIX}institutionSettings`);
    if (s) return JSON.parse(s);
  } catch {}
  return {
    name: "Federal University of Education Kontagora, Niger State",
    address: "P.M.B. 39, Kontagora, Niger State",
    phone: "+234 803 000 0000",
    email: "registry@fuekos.edu.ng",
    website: "www.fuekos.edu.ng",
    logoText: "FUEK",
  };
}

// Camera access log helper
export function logCameraAccess(role: string, action: "start" | "stop") {
  try {
    const key = "cameraAccessLog";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ role, action, timestamp: new Date().toISOString() });
    // Keep last 200 entries
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
  } catch {}
}

// Report activity log helper
export function logReportActivity(
  reportType: "Senate" | "Departmental",
  department: string,
  session: string,
  generatedBy: string,
  action: "Print" | "CSV",
) {
  try {
    const key = "reportActivityLog";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({
      reportType,
      department,
      session,
      generatedBy,
      action,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
  } catch {}
}
