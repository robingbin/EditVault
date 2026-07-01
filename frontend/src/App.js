import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import AdminClientPortal from "./pages/ClientPortal";
import AdminClientPortalDetail from "./pages/ClientPortalDetail";
import ClientHome from "./pages/ClientHome";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { Loader2 } from "lucide-react";

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-[#0a0e0f]"><Loader2 className="w-6 h-6 text-[#2dd4bf] animate-spin" /></div>);
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/reset" element={<Navigate to="/login" replace />} />
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="portal" element={<AdminClientPortal />} />
              <Route path="portal/:id" element={<AdminClientPortalDetail />} />
            </Route>
            <Route path="/portal" element={<ProtectedRoute requireRole="client"><Layout /></ProtectedRoute>}>
              <Route index element={<ClientHome />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
