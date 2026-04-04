import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import DeanDashboard from "./pages/DeanDashboard";
import HODDashboard from "./pages/HODDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import LoginPage from "./pages/LoginPage";
import PGApplyPage from "./pages/PGApplyPage";
import ParentPortalPage from "./pages/ParentPortalPage";
import PublicResultsPage from "./pages/PublicResultsPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRegisterPage from "./pages/StudentRegisterPage";

const queryClient = new QueryClient();

function DashboardRouter() {
  const { currentUser } = useApp();
  if (window.location.pathname === "/student-register")
    return <StudentRegisterPage />;
  if (window.location.pathname === "/results") return <PublicResultsPage />;
  if (window.location.pathname === "/parent") return <ParentPortalPage />;
  if (window.location.pathname === "/pg-apply") return <PGApplyPage />;
  if (!currentUser) return <LoginPage />;
  const role = currentUser.role;
  return (
    <Layout>
      {(role === "SuperAdmin" || role === "Registrar") && <AdminDashboard />}
      {role === "HOD" && <HODDashboard />}
      {role === "Lecturer" && <LecturerDashboard />}
      {role === "Student" && <StudentDashboard />}
      {role === "Dean" && <DeanDashboard />}
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
