import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface HelpItem {
  title: string;
  steps: string[];
}

const HELP_BY_ROLE: Record<string, HelpItem[]> = {
  Student: [
    {
      title: "How to register courses",
      steps: [
        "Log in with your matric number or JAMB registration number.",
        "Click 'Course Registration' in the navigation.",
        "Ensure the registration portal is open (green banner).",
        "Level 100: browse the course cards and click ✅ Select for each course.",
        "Level 200+: carryover courses are auto-selected at the top. Add remaining courses from the list below.",
        "Watch the credit tracker — stay between 16 and 24 units per semester.",
        "Click 'Submit Registration' when both semesters are complete.",
        "Print your Registration Slip for documentation.",
      ],
    },
    {
      title: "How to check your results",
      steps: [
        "Log in with your matric number.",
        "Click 'My Results' in the navigation.",
        "Use the semester tabs to switch between First and Second Semester results.",
        "Carry-over courses are highlighted in red.",
        "Your CGPA is shown at the top of the page.",
        "Results are only visible after the Registrar publishes them.",
      ],
    },
    {
      title: "How to print your transcript",
      steps: [
        "Go to 'Transcript' in the navigation.",
        "Your full academic history across all sessions will be displayed.",
        "Click 'Print Transcript' — a print-friendly view will open.",
        "Use your browser's print dialog (Ctrl+P or Cmd+P) to print or save as PDF.",
      ],
    },
    {
      title: "How to view your timetable",
      steps: [
        "Click 'Timetable' in the navigation.",
        "Your department and level timetable is displayed in a weekly grid.",
        "Check the Exam Timetable tab for examination schedules.",
      ],
    },
    {
      title: "How to rate and evaluate a lecturer",
      steps: [
        "Go to 'Course Eval' in the navigation.",
        "The evaluation window must be open (set by Registrar).",
        "Select a course and lecturer, then rate each criterion 1–5 stars.",
        "Add optional comments — these are anonymous to the lecturer.",
        "Click 'Submit Evaluation'.",
      ],
    },
    {
      title: "How to check your fee status",
      steps: [
        "Click 'Fee Status' in the navigation.",
        "Outstanding fees are shown in red. Visit the Bursary to make payment.",
        "A red banner on your dashboard also alerts you to unpaid fees.",
      ],
    },
  ],
  Lecturer: [
    {
      title: "How to enter scores for a course",
      steps: [
        "Go to 'Score Sheet' in the navigation.",
        "Select the course from the dropdown.",
        "Enter CA scores (out of 40) and Exam scores (out of 60) for each student.",
        "Total, Grade, Grade Points, and Remarks calculate automatically.",
        "Click 'Save Scores' to store your entries.",
        "Use 'Download Blank CSV Template' to fill scores offline, then upload back.",
      ],
    },
    {
      title: "How to submit results for approval",
      steps: [
        "After saving scores in the Score Sheet, click 'Submit for Approval'.",
        "The result status changes to 'Submitted'.",
        "The HOD will receive a notification and can approve or reject.",
        "You will be notified of the outcome.",
      ],
    },
    {
      title: "How to request a result amendment",
      steps: [
        "Go to 'Results Processing' and find your submitted/published result.",
        "Click 'Request Amendment' and enter the reason for correction.",
        "The HOD will review and forward to the Registrar for final confirmation.",
        "Once approved, the score sheet unlocks for editing.",
      ],
    },
    {
      title: "How to upload course documents",
      steps: [
        "Go to 'My Portal' in the Lecturer navigation.",
        "Scroll to the 'Documents' section.",
        "Click 'Upload Document', select the file type (Course Outline, Lecture Notes, etc.).",
        "Students assigned to your course can view the documents.",
      ],
    },
    {
      title: "How to mark attendance",
      steps: [
        "Go to 'Attendance' in the navigation.",
        "Select the course and click 'Start New Session'.",
        "For each student, tick the checkbox or use the camera icon for biometric capture.",
        "Click 'Save Session' to record attendance.",
      ],
    },
  ],
  HOD: [
    {
      title: "How to approve results",
      steps: [
        "Go to 'Approvals' in the navigation.",
        "Submitted results awaiting your approval are listed with a count badge.",
        "Click 'Approve' to forward to the Dean, or 'Reject' to send back with comments.",
        "The Lecturer is notified of your decision.",
      ],
    },
    {
      title: "How to assign courses to lecturers",
      steps: [
        "Go to 'Course Assignments' in the navigation.",
        "Select a course from the list.",
        "Choose the Lecturer from the dropdown, and optionally a Technical Staff for practicals.",
        "Click 'Assign'. The lecturer will see the course in their portal.",
      ],
    },
    {
      title: "How to view all department results",
      steps: [
        "Go to 'All Results' in the navigation.",
        "Filter by Level, Session, Semester, or Status.",
        "Click 'Download CSV' for a full export or 'Print' for a printed report.",
      ],
    },
    {
      title: "How to review lecturer evaluations",
      steps: [
        "Go to 'Evaluations' (or check your Lecturer Performance tab).",
        "All anonymous student evaluations are shown with full comments.",
        "Lecturers only see aggregated scores — not individual responses.",
      ],
    },
  ],
  Dean: [
    {
      title: "How to approve results",
      steps: [
        "Go to 'Approvals' in the navigation.",
        "Results forwarded from HOD are listed here.",
        "Click 'Approve' to send to the Registrar for final publication.",
        "Click 'Reject' with a reason to return to the HOD.",
      ],
    },
    {
      title: "How to view faculty reports",
      steps: [
        "Go to 'Faculty Report' in the navigation.",
        "Select the session and level to view the Faculty Presentation Report.",
        "The report shows TCO, TCP, TGP, CGPA, TP results, and Remarks per student.",
        "Click 'Print' for the full Senate-ready tabular report.",
      ],
    },
    {
      title: "How to review all department results",
      steps: [
        "Go to 'All Results' in the navigation.",
        "View results from all departments in your faculty.",
        "Use the filters to narrow down by level, session, or status.",
      ],
    },
  ],
  Registrar: [
    {
      title: "How to open the registration portal",
      steps: [
        "Go to 'Academic Calendar' in the navigation.",
        "Find the active session row.",
        "Click the 'Closed' button under Registration to toggle it to 'Open'.",
        "Students can now register courses. Set an Add/Drop deadline date.",
      ],
    },
    {
      title: "How to publish results",
      steps: [
        "Go to 'Results Processing' in the navigation.",
        "Find results with status 'Dean Approved'.",
        "Click 'Publish' to make results visible to students.",
        "Students receive an in-app notification.",
      ],
    },
    {
      title: "How to generate graduation certificates",
      steps: [
        "Go to 'Students' and filter by Status 'Graduated'.",
        "Open the student's profile and click 'Generate Certificate'.",
        "The certificate opens in a print-friendly view.",
        "Alternatively, use 'Batch Graduation' to process multiple students at once.",
      ],
    },
    {
      title: "How to import JAMB candidate data",
      steps: [
        "Go to 'JAMB Import' in the navigation or click the quick action.",
        "Upload a CSV/Excel file with JAMB candidate data, or scan a document.",
        "Review the extracted candidate list and correct any errors.",
        "Click 'Import Candidates' to add them to the admission register.",
      ],
    },
    {
      title: "How to generate result verification codes",
      steps: [
        "Go to 'Students' and find the student.",
        "Click 'Gen Code' next to the student's record.",
        "Share the code with the student. They can give it to employers.",
        "Employers use the 'Verify Result' tab on the login page to check results.",
      ],
    },
    {
      title: "How to back up system data",
      steps: [
        "Go to 'System' → 'Data Backup' in the navigation.",
        "Click 'Export All Data' to download a full JSON backup.",
        "Store the backup file securely.",
        "To restore: upload the backup file and click 'Confirm Restore'.",
      ],
    },
  ],
  SuperAdmin: [
    {
      title: "How to add or edit user accounts",
      steps: [
        "Go to 'Settings' in the navigation.",
        "Scroll to 'User Accounts Management'.",
        "Click 'Add Account' and fill in the name, role, and credentials.",
        "To edit: click the pencil icon next to any account.",
        "To delete: click the trash icon and confirm.",
      ],
    },
    {
      title: "How to configure the grading scale",
      steps: [
        "Go to 'Grade Scale' in the navigation.",
        "Adjust the score ranges for each grade (A, B, C, D, E, F).",
        "Save changes — the new scale applies to all future results.",
      ],
    },
    {
      title: "How to use the System Health dashboard",
      steps: [
        "Go to 'System Health' in the navigation.",
        "Review alerts for unregistered students, courses with no scores, pending approvals, etc.",
        "Click any alert to see the full list of affected records.",
      ],
    },
    {
      title: "How to manage institution settings",
      steps: [
        "Go to 'Settings' → 'System Initialization Wizard'.",
        "All settings (institution name, admin accounts, grading scale, session) can be edited anytime.",
        "Changes are saved immediately and reflected across all dashboards.",
      ],
    },
  ],
};

export default function HelpCenter({ role }: { role: string }) {
  const [open, setOpen] = useState(false);

  const helpItems = HELP_BY_ROLE[role] ?? HELP_BY_ROLE.SuperAdmin;

  return (
    <>
      {/* Floating ? button */}
      <button
        type="button"
        data-ocid="help_center.open_modal_button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 no-print"
        title="Help Center"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/30 z-[60] no-print"
              onClick={() => setOpen(false)}
            />
            {/* Panel */}
            <motion.div
              data-ocid="help_center.panel"
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[380px] max-w-full bg-card border-l border-border shadow-2xl z-[70] flex flex-col no-print"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="font-bold text-foreground">Help Center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role} guide — step-by-step instructions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  data-ocid="help_center.close_button"
                  className="w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 py-3">
                <Accordion type="multiple" className="space-y-1">
                  {helpItems.map((item, i) => (
                    <AccordionItem
                      key={item.title}
                      value={`item-${i}`}
                      className="border border-border/50 rounded-lg px-3 data-[state=open]:bg-muted/20"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ol className="space-y-2">
                          {item.steps.map((step, stepIdx) => (
                            <li
                              key={step.slice(0, 30)}
                              className="flex gap-2.5 text-xs text-muted-foreground"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {stepIdx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-1">
                    Still need help?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contact your system administrator or use the Feedback tab to
                    report issues.
                  </p>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
