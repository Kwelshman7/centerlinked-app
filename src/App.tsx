import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/app/AppLayout";
import { FEATURES } from "@/config/features";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RequestAccess from "./pages/RequestAccess";
import CreateOrganization from "./pages/CreateOrganization";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/app/Dashboard";
import Search from "./pages/app/Search";
import Facilities from "./pages/app/Facilities";
import Organizations from "./pages/app/Organizations";
import FacilityDetail from "./pages/app/FacilityDetail";
import Onboarding from "./pages/app/Onboarding";
import ImportFacilities from "./pages/app/ImportFacilities";
import PdfFacilityUpload from "./pages/app/PdfFacilityUpload";
import Members from "./pages/app/Members";
import Verifications from "./pages/app/Verifications";
import Settings from "./pages/app/Settings";
import Feed from "./pages/app/Feed";
import Messenger from "./pages/app/Messenger";
import SearchResults from "./pages/app/SearchResults";
import InsuranceDatabase from "./pages/app/admin/InsuranceDatabase";
import AccessRequests from "./pages/app/admin/AccessRequests";
import OrganizationClaims from "./pages/app/admin/OrganizationClaims";
import AdminCreateOrganization from "./pages/app/admin/AdminCreateOrganization";
import AdminOrganizations from "./pages/app/admin/AdminOrganizations";
import AdminOrganizationManage from "./pages/app/admin/AdminOrganizationManage";
import VerifyContracts from "./pages/app/VerifyContracts";
import ProgramSheet from "./pages/public/ProgramSheet";
import OrgSheet from "./pages/public/OrgSheet";
import AuthCallback from "./pages/AuthCallback";

const App = () => (
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/request-access" element={<RequestAccess />} />
            <Route path="/p/:slug" element={<ProgramSheet />} />
            <Route path="/o/:slug" element={<OrgSheet />} />
            <Route path="/create-organization" element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="search" element={<Search />} />
              <Route path="search/results" element={<SearchResults />} />
              <Route path="network" element={<Navigate to="/app/organizations" replace />} />
              <Route path="admin/insurance" element={<AdminRoute><InsuranceDatabase /></AdminRoute>} />
              <Route path="admin/requests" element={<AdminRoute><AccessRequests /></AdminRoute>} />
              <Route path="admin/claims" element={<AdminRoute><OrganizationClaims /></AdminRoute>} />
              <Route path="admin/organizations" element={<AdminRoute><AdminOrganizations /></AdminRoute>} />
              <Route path="admin/organizations/new" element={<AdminRoute><AdminCreateOrganization /></AdminRoute>} />
              <Route path="admin/organizations/:id" element={<AdminRoute><AdminOrganizationManage /></AdminRoute>} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="facilities/new" element={<Navigate to="/app/onboarding?add=1" replace />} />
              <Route path="facilities/import" element={<ImportFacilities />} />
              <Route path="facilities/upload-pdf" element={<PdfFacilityUpload />} />
              <Route path="facilities/:id" element={<FacilityDetail />} />
              <Route path="facilities/:id/verify" element={<VerifyContracts />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="members" element={<Members />} />
              <Route path="verifications" element={<AdminRoute><Verifications /></AdminRoute>} />
              {FEATURES.community && <Route path="feed" element={<Feed />} />}
              {FEATURES.community && <Route path="messages" element={<Messenger />} />}
              {!FEATURES.community && <Route path="feed" element={<Navigate to="/app" replace />} />}
              {!FEATURES.community && <Route path="messages" element={<Navigate to="/app" replace />} />}
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/:slug" element={<OrgSheet />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
);

export default App;
