import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import SubmitButton from "../components/SubmitButton";
import api, { getErrorMessage } from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your university email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setSuccess(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your university email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        <FormField
          label="University email"
          id="email"
          type="email"
          placeholder="xxxxxxxx@itum.mrt.ac.lk"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  );
}