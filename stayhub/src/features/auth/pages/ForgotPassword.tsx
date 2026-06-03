import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFormField } from "../components/AuthFormField";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { handleForgotPasswordSubmit, isSubmitting } = useForgotPassword();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSuccess = await handleForgotPasswordSubmit({ email });
    if (isSuccess) {
      navigate(PATH.PUBLIC.RESET_PASSWORD, { state: { email } });
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a code to reset your password."
      heroTitle="We've got you covered."
      heroSubtitle="Reset your password securely and get back to planning your next unforgettable trip."
      imageSeed="stayhub-forgot"
      footer={
        <div className="mt-8 text-center">
          <Link
            to={PATH.PUBLIC.LOGIN}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-brand !no-underline"
          >
            &larr; Back to Login
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthFormField
          label="Email Address"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />

        <ActionButton
          type="submit"
          variant="primary"
          disabled={isSubmitting || !email}
          className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]"
        >
          {isSubmitting ? "Sending..." : "Send Reset Code"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ActionButton>
      </form>
    </AuthLayout>
  );
}
