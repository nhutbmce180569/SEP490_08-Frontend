import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { PATH } from "../../../config/routes/route";

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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-[#05073C] flex items-center justify-center text-white font-black text-xl">
          S
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-[#05073C]">
          StayHub
        </span>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#05073C] mb-2">
            Forgot Password
          </h2>
          <p className="text-slate-500 text-sm">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition-all focus:bg-white focus:border-[#EB662B] focus:ring-4 focus:ring-[#EB662B]/10"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <ActionButton type="submit" variant="primary" disabled={isSubmitting || !email} className="group !mt-6 !h-[50px] !w-full gap-2 text-[15px]">
            {isSubmitting ? "Sending..." : "Send Reset Code"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </ActionButton>
        </form>
        
      </div>

      <div className="mt-8">
        <Link to={PATH.PUBLIC.LOGIN} className="text-sm font-semibold text-slate-500 hover:text-[#EB662B] transition-colors !no-underline">
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
}