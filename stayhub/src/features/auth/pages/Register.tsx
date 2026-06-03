import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Phone, Calendar, Users } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useRegister } from "../hooks/useRegister";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField, authInputClass } from "../components/AuthFormField";
import { PATH } from "../../../config/routes/route";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleRegisterSubmit, isSubmitting, serverErrors } = useRegister();

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      const normalizedErrors: Record<string, string> = {};
      Object.entries(serverErrors).forEach(([key, val]) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalizedErrors[camelKey] = Array.isArray(val) ? val[0] : String(val);
      });
      setErrors((prev) => ({ ...prev, ...normalizedErrors }));
    }
  }, [serverErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match!" }));
      return;
    }

    const { confirmPassword, ...payload } = formData;
    await handleRegisterSubmit({ ...payload, dateOfBirth: payload.dateOfBirth || null });
  };

  return (
    <AuthLayout
      scrollable
      title="Create an account"
      subtitle="Fill in the details below to join StayHub."
      heroTitle="Start your journey with us."
      heroSubtitle="Create an account to discover incredible tours, manage your bookings easily, and join our global community of travelers."
      imageSeed="stayhub-register"
      footer={
        <p className="mt-10 pb-2 text-center text-sm font-medium text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-brand transition-colors hover:text-brand-hover !no-underline"
          >
            Log in here
          </Link>
        </p>
      }
    >
      <form onSubmit={handleRegister} className="space-y-5">
        <AuthFormField
          label="Full Name"
          name="fullName"
          type="text"
          icon={User}
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g. John Doe"
          error={errors.fullName}
          required
        />

        <AuthFormField
          label="Email Address"
          name="email"
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          error={errors.email}
          required
        />

        <AuthFormField
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          icon={Phone}
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="e.g. 0123456789"
          error={errors.phoneNumber}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Gender</label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={authInputClass(Boolean(errors.gender))}
                required
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {errors.gender && (
              <span className="text-xs font-medium text-rose-500">{errors.gender}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Date of Birth</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={authInputClass(Boolean(errors.dateOfBirth))}
                required
              />
            </div>
            {errors.dateOfBirth && (
              <span className="text-xs font-medium text-rose-500">{errors.dateOfBirth}</span>
            )}
          </div>
        </div>

        <AuthFormField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          error={errors.password}
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <AuthFormField
          label="Confirm Password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          required
        />

        <div className="pt-2">
          <label className="group flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand focus:ring-brand"
              required
            />
            <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
              I agree to the{" "}
              <Link
                to={PATH.PUBLIC.TERMS}
                state={{ from: PATH.PUBLIC.REGISTER }}
                className="text-brand !no-underline hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to={PATH.PUBLIC.PRIVACY}
                state={{ from: PATH.PUBLIC.REGISTER }}
                className="text-brand !no-underline hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>

      <SocialAuthButtons dividerLabel="Or register with" />
    </AuthLayout>
  );
}
