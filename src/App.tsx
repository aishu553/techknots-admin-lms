import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CodeEditor from "./pages/CodeEditor";
import Problems from "./pages/Problems";
import Leaderboard from "./pages/Leaderboard";
import RewardsShop from "./pages/RewardsShop";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";

// Admin module imports (distinct names to avoid collisions)
import AdminLayout from "./pages/admin/AdminLayout";
import AdminIndex from "./pages/admin/AdminsDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminMentorCodes from "./pages/admin/MentorCodes";
import AdminMentorRequests from "./pages/admin/MentorRequests";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCourses from "./pages/admin/CoursesAdmin";
import AdminSettings from "./pages/admin/Settings";
import AdminProfile from "./pages/admin/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/mentor-dashboard" element={<MentorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/code-editor/:id?" element={<CodeEditor />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rewards" element={<RewardsShop />} />
          <Route path="/achievements" element={<Achievements />} />

          {/* Admin module (new) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminIndex />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="mentor-codes" element={<AdminMentorCodes />} />
            <Route path="mentor-requests" element={<AdminMentorRequests />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;