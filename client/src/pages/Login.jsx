import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axios";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in with your university email to continue."
      footer={
        <>
          New to StudyMate?{" "}
          <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Alert>{error}</Alert>

        <FormField
          label="University email"
          id="email"
          name="email"
          type="email"
          placeholder="xxxxxxxx@itum.mrt.ac.lk"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
        />

        <div>
          <FormField
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-brand-500 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthLayout>
  );
}