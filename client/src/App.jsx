import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Placeholder from "./pages/Placeholder";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Login wela inna ayata witharai */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Placeholder title="Home" />} />
        <Route path="/explore" element={<Placeholder title="Explore Notes" />} />
        <Route path="/upload" element={<Placeholder title="Upload Notes" />} />
        <Route path="/notes/:id" element={<Placeholder title="Note Hub" />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}