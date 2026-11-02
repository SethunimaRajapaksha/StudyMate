import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import SubmitButton from "../components/SubmitButton";
import api, { getErrorMessage } from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const found = {};
    if (form.password.length < 8) found.password = "Password must be at least 8 characters";
    if (form.confirm !== form.password) found.confirm = "Passwords do not match";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      setSuccess(data.message);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      {success ? (
        <div className="space-y-5">
          <Alert type="success">{success}</Alert>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-brand-500 py-3 text-center text-sm font-bold text-white hover:bg-brand-700"
          >
            Go to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Alert>{serverError}</Alert>

          <FormField
            label="New password"
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <FormField
            label="Confirm new password"
            id="confirm"
            name="confirm"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />

          <SubmitButton loading={loading}>Update password</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}