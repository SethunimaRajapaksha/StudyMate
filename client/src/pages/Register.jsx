import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import Alert from "../components/Alert";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axios";

const UNI_EMAIL = /^[a-z0-9._+-]+@itum\.mrt\.ac\.lk$/i;

export default function Register() {
  const { register, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: "",
    indexNumber: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.indexNumber.trim()) e.indexNumber = "Index number is required";
    if (!UNI_EMAIL.test(form.email.trim())) {
      e.email = "Use your university email (xxxxxxxx@itum.mrt.ac.lk)";
    }
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        indexNumber: form.indexNumber.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Only university emails are accepted."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert>{serverError}</Alert>

        <FormField
          label="Full name"
          id="name"
          name="name"
          placeholder="Your full name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <FormField
          label="Index number"
          id="indexNumber"
          name="indexNumber"
          placeholder="Your index number"
          value={form.indexNumber}
          onChange={handleChange}
          error={errors.indexNumber}
        />
        <FormField
          label="University email"
          id="email"
          name="email"
          type="email"
          placeholder="xxxxxxxx@itum.mrt.ac.lk"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          label="Password"
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
          label="Confirm password"
          id="confirm"
          name="confirm"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}