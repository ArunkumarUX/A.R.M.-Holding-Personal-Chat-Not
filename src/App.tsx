import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PRODUCT_NAME, PRODUCT_NAME_AR } from './config/user';
import { PPT_MASTER_ENABLED } from './config/features';
import { AppShell } from './components/layout/AppShell';
import { RequireOnboarding } from './auth/AuthGate';
import { QrGatePage } from './pages/auth/QrGatePage';
import { MobileVerifyPage } from './pages/auth/MobileVerifyPage';
import { ChatbotWelcomePage } from './pages/auth/ChatbotWelcomePage';
import { WelcomePage } from './pages/WelcomePage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const PerformancePage = lazy(() => import('./pages/PerformancePage').then((m) => ({ default: m.PerformancePage })));
const MarketPage = lazy(() => import('./pages/MarketPage').then((m) => ({ default: m.MarketPage })));
const RegulatoryPage = lazy(() => import('./pages/RegulatoryPage').then((m) => ({ default: m.RegulatoryPage })));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })));
const BriefingsPage = lazy(() => import('./pages/BriefingsPage').then((m) => ({ default: m.BriefingsPage })));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage').then((m) => ({ default: m.ArchitecturePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage').then((m) => ({ default: m.WorkflowsPage })));
const PromptsPage = lazy(() => import('./pages/PromptsPage').then((m) => ({ default: m.PromptsPage })));
const FocusAreaDetailPage = lazy(() =>
  import('./pages/FocusAreaDetailPage').then((m) => ({ default: m.FocusAreaDetailPage })),
);
const PptMasterPage = lazy(() =>
  import('./pages/PptMasterPage').then((m) => ({ default: m.PptMasterPage })),
);

function RtlSync() {
  const { settings } = useApp();
  useEffect(() => {
    const rtl = settings.language === 'ar';
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = rtl ? 'ar' : 'en';
    document.title = rtl ? PRODUCT_NAME_AR : PRODUCT_NAME;
    return () => {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      document.title = PRODUCT_NAME;
    };
  }, [settings.language]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <RtlSync />
      <Routes>
        <Route path="/" element={<QrGatePage />} />
        <Route path="/verify/:sessionId" element={<MobileVerifyPage />} />
        <Route path="/welcome" element={<ChatbotWelcomePage />} />
        <Route path="/home" element={<WelcomePage />} />
        <Route
          element={
            <RequireOnboarding>
              <AppShell />
            </RequireOnboarding>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/regulatory" element={<RegulatoryPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/briefings" element={<BriefingsPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {PPT_MASTER_ENABLED ? (
            <>
              <Route path="/create-ppt" element={<PptMasterPage />} />
              <Route path="/deck-builder" element={<Navigate to="/create-ppt" replace />} />
            </>
          ) : null}
          <Route path="/focus/:focusId" element={<FocusAreaDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
