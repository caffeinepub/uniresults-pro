import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import DeanDashboard from "./pages/DeanDashboard";
import ExamOfficerDashboard from "./pages/ExamOfficerDashboard";
import FeedbackPage from "./pages/FeedbackPage";
import HODDashboard from "./pages/HODDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import LoginPage from "./pages/LoginPage";
import PGApplyPage from "./pages/PGApplyPage";
import ParentPortalPage from "./pages/ParentPortalPage";
import PublicResultsPage from "./pages/PublicResultsPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRegisterPage from "./pages/StudentRegisterPage";

const queryClient = new QueryClient();

function getPublicRoute(): string | null {
  const path = window.location.pathname;
  if (path === "/student-register" || path.startsWith("/student-register/"))
    return "student-register";
  if (path === "/results" || path.startsWith("/results/")) return "results";
  if (path === "/parent" || path.startsWith("/parent/")) return "parent";
  if (path === "/pg-apply" || path.startsWith("/pg-apply/")) return "pg-apply";
  if (path === "/feedback" || path.startsWith("/feedback/")) return "feedback";
  return null;
}

function DashboardRouter() {
  const { currentUser } = useApp();
  const publicRoute = getPublicRoute();

  if (publicRoute === "student-register") return <StudentRegisterPage />;
  if (publicRoute === "results") return <PublicResultsPage />;
  if (publicRoute === "parent") return <ParentPortalPage />;
  if (publicRoute === "pg-apply") return <PGApplyPage />;
  if (publicRoute === "feedback") return <FeedbackPage />;

  if (!currentUser) return <LoginPage />;
  const role = currentUser.role;
  return (
    <Layout>
      {(role === "SuperAdmin" || role === "Registrar") && <AdminDashboard />}
      {role === "HOD" && <HODDashboard />}
      {role === "Lecturer" && <LecturerDashboard />}
      {role === "Student" && <StudentDashboard />}
      {role === "Dean" && <DeanDashboard />}
      {role === "ExamOfficer" && <ExamOfficerDashboard />}
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <DashboardRouter />
          <Toaster />
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
