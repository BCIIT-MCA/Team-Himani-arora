import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ChatInterface from "./pages/ChatInterface";
import CounselingPage from "./pages/CounselingPage";
import ResourcesPage from "./pages/ResourcesPage";
import CommunityPage from "./pages/CommunityPage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { CreatePostPage } from "./pages/CreatePostPage";
import AdminDashboard from "./pages/AdminDashboard";
import AssessmentPage from "./pages/AssessmentPage";
import NotFound from "./pages/NotFound";
import { GlobalNotificationsProvider } from "./components/providers/GlobalNotificationsProvider";
import { I18nProvider } from "./contexts/I18nContext";
import {
  PWAProvider,
  InstallPrompt,
  UpdateNotification,
  OfflineIndicator,
} from "./contexts/PWAContext";
import { CrisisMonitoringProvider } from "./contexts/CrisisMonitoringContext";
import { Suspense } from "react";
import "./lib/i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              Loading...
            </div>
          }
        >
          <PWAProvider>
            <I18nProvider>
              <CrisisMonitoringProvider>
                <GlobalNotificationsProvider>
                  <OfflineIndicator />
                  <InstallPrompt />
                  <UpdateNotification />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/chat" element={<ChatInterface />} />
                    <Route path="/counseling" element={<CounselingPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route
                      path="/community/post/:postId"
                      element={<PostDetailPage />}
                    />
                    <Route
                      path="/community/create-post"
                      element={<CreatePostPage />}
                    />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/assessment" element={<AssessmentPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </GlobalNotificationsProvider>
              </CrisisMonitoringProvider>
            </I18nProvider>
          </PWAProvider>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
