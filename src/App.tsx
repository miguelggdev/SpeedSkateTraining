import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/components/AppLayout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import NotFound from "@/pages/NotFound"
import Placeholder from "@/pages/Placeholder"
import NewSession from "@/pages/NewSession"
import Sessions from "@/pages/Sessions"
import NfcSetup from "@/pages/NfcSetup"
import Routes from "@/pages/Routes"
import LiveSession from "@/pages/LiveSession"
import AiCoach from "@/pages/AiCoach"
import Settings from "@/pages/Settings"
import CoachDashboard from "@/pages/CoachDashboard"
import AthleteDetail from "@/pages/AthleteDetail"
import CompareAthletes from "@/pages/CompareAthletes"
import Wellness from "@/pages/Wellness"
import Equipment from "@/pages/Equipment"
import Goals from "@/pages/Goals"
import Messages from "@/pages/Messages"
import PersonalBests from "@/pages/PersonalBests"
import SplitCalculator from "@/pages/SplitCalculator"
import Gym from "@/pages/Gym"
import Calendar from "@/pages/Calendar"
import VideoAnalysis from "@/pages/VideoAnalysis"
import ClubRanking from "@/pages/ClubRanking"
import NutritionPlan from "@/pages/NutritionPlan"
import PDFExport from "@/pages/PDFExport"

const queryClient = new QueryClient()

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedLayout><Dashboard /></ProtectedLayout>
          } />
          <Route path="/sessions" element={
            <ProtectedLayout><Sessions /></ProtectedLayout>
          } />
          <Route path="/sessions/new" element={
            <ProtectedLayout><NewSession /></ProtectedLayout>
          } />
          <Route path="/routes" element={
            <ProtectedLayout><Routes /></ProtectedLayout>
          } />
          <Route path="/live-session" element={
            <ProtectedLayout><LiveSession /></ProtectedLayout>
          } />
          <Route path="/gym" element={
            <ProtectedLayout><Gym /></ProtectedLayout>
          } />
          <Route path="/calendar" element={
            <ProtectedLayout><Calendar /></ProtectedLayout>
          } />
          <Route path="/video-analysis" element={
            <ProtectedLayout><VideoAnalysis /></ProtectedLayout>
          } />
          <Route path="/club-ranking" element={
            <ProtectedLayout><ClubRanking /></ProtectedLayout>
          } />
          <Route path="/nutrition" element={
            <ProtectedLayout><NutritionPlan /></ProtectedLayout>
          } />
          <Route path="/export" element={
            <ProtectedLayout><PDFExport /></ProtectedLayout>
          } />
          <Route path="/wellness" element={
            <ProtectedLayout><Wellness /></ProtectedLayout>
          } />
          <Route path="/goals" element={
            <ProtectedLayout><Goals /></ProtectedLayout>
          } />
          <Route path="/achievements" element={
            <ProtectedLayout><Goals /></ProtectedLayout>
          } />
          <Route path="/equipment" element={
            <ProtectedLayout><Equipment /></ProtectedLayout>
          } />
          <Route path="/messages" element={
            <ProtectedLayout><Messages /></ProtectedLayout>
          } />
          <Route path="/personal-bests" element={
            <ProtectedLayout><PersonalBests /></ProtectedLayout>
          } />
          <Route path="/splits" element={
            <ProtectedLayout><SplitCalculator /></ProtectedLayout>
          } />
          <Route path="/ai-coach" element={
            <ProtectedLayout><AiCoach /></ProtectedLayout>
          } />
          <Route path="/nfc" element={
            <ProtectedLayout><NfcSetup /></ProtectedLayout>
          } />
          <Route path="/coach" element={
            <ProtectedLayout><CoachDashboard /></ProtectedLayout>
          } />
          <Route path="/coach/athlete/:id" element={
            <ProtectedLayout><AthleteDetail /></ProtectedLayout>
          } />
          <Route path="/coach/compare" element={
            <ProtectedLayout><CompareAthletes /></ProtectedLayout>
          } />
          <Route path="/settings" element={
            <ProtectedLayout><Settings /></ProtectedLayout>
          } />

          <Route path="/index" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
