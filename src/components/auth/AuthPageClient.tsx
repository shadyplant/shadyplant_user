"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { ApiError } from "@/lib/api";
import {
  isValidIdentifier,
  validateLoginForm,
  validateOtpForm,
  validateRegistrationForm,
  validateResetPasswordForm,
  type ValidationResult,
} from "@/lib/validation";
import { useAuth } from "@/components/auth/AuthProvider";

type AuthStep =
  | "login"
  | "register"
  | "verify"
  | "forgot"
  | "forgot-verify"
  | "reset";

const OTP_LENGTH = 6;

type RegisterForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type LoginForm = {
  identifier: string;
  password: string;
};

type OtpForm = {
  identifier: string;
  otp: string;
};

type ResetForm = {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function readNextPath(
  searchParams: { get: (name: string) => string | null } | null,
) {
  const next = searchParams?.get("next");
  return next?.startsWith("/") ? next : "/profile";
}

function OtpInputGroup({
  value,
  length = OTP_LENGTH,
  onChange,
}: {
  value: string;
  length?: number;
  onChange: (value: string) => void;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] || "");

  function updateValue(nextDigits: string[]) {
    onChange(nextDigits.join("").replace(/\D/g, "").slice(0, length));
  }

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(event) => {
            const nextChar = event.target.value.replace(/\D/g, "").slice(-1);
            const nextDigits = [...digits];
            nextDigits[index] = nextChar;
            updateValue(nextDigits);

            if (nextChar && index < length - 1) {
              focusInput(index + 1);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              event.preventDefault();
              focusInput(index - 1);
            }

            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              focusInput(index - 1);
            }

            if (event.key === "ArrowRight" && index < length - 1) {
              event.preventDefault();
              focusInput(index + 1);
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pastedValue = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length);
            if (!pastedValue) {
              return;
            }

            const nextDigits = Array.from(
              { length },
              (_, digitIndex) => pastedValue[digitIndex] || "",
            );
            updateValue(nextDigits);
            focusInput(Math.min(pastedValue.length, length) - 1);
          }}
          className="h-14 w-12 rounded-[1rem] border border-[#dbe8cd] bg-[#fbfdf8] text-center text-lg font-semibold tracking-[0.1em] text-[#163915] outline-none transition focus:border-[#214f14] focus:bg-white sm:w-14"
        />
      ))}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      width="30px"
      height="30px"
      viewBox="-3 0 262 262"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
    >
      <path
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
        fill="#4285F4"
      />
      <path
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
        fill="#34A853"
      />
      <path
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
        fill="#FBBC05"
      />
      <path
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
        fill="#EB4335"
      />
    </svg>
  );
}

export default function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = readNextPath(searchParams);
  const {
    isAuthenticated,
    isReady,
    login,
    loginWithGoogle,
    register,
    requestPasswordReset,
    resetPassword,
    verifyPasswordResetOtp,
    verifyRegistrationOtp,
  } = useAuth();
  const initialStep = (searchParams?.get("step") as AuthStep | null) || "login";
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginForm, setLoginForm] = useState<LoginForm>({
    identifier: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [verifyForm, setVerifyForm] = useState<OtpForm>({
    identifier: "",
    otp: "",
  });
  const [forgotForm, setForgotForm] = useState({
    identifier: "",
  });
  const [resetForm, setResetForm] = useState<ResetForm>({
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [verifiedResetIdentifier, setVerifiedResetIdentifier] = useState("");

  const stepTitle = useMemo(() => {
    switch (step) {
      case "register":
        return "Create your account";
      case "verify":
        return "Verify your account";
      case "forgot":
        return "Request password reset";
      case "forgot-verify":
        return "Verify reset OTP";
      case "reset":
        return "Choose a new password";
      default:
        return "Sign in to continue";
    }
  }, [step]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isReady, nextPath, router]);

  function handleValidation<T>(result: ValidationResult<T>) {
    setErrors(result.errors);
    return result.data;
  }

  function resetFeedback() {
    setStatusMessage(null);
    setStatusTone("success");
    setErrors({});
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const data = handleValidation(validateLoginForm(loginForm));

    if (!data) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(data);
      router.replace(nextPath);
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const data = handleValidation(validateRegistrationForm(registerForm));

    if (!data) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register(data);
      setStatusTone("success");
      setStatusMessage(response.message);
      startTransition(() => {
        setVerifyForm({
          identifier: data.email,
          otp: "",
        });
        setStep("verify");
      });
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to create account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    resetFeedback();
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
      router.replace(nextPath);
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(
        getApiErrorMessage(error, "Unable to sign in with Google."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const data = handleValidation(validateOtpForm(verifyForm));

    if (!data) {
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyRegistrationOtp(data);
      setStatusTone("success");
      router.replace(nextPath);
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to verify OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const identifier = forgotForm.identifier.trim();

    if (!isValidIdentifier(identifier)) {
      setErrors({ identifier: "Enter a valid email address or phone number." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ identifier });
      setStatusTone("success");
      setStatusMessage(response.message);
      setVerifyForm({
        identifier,
        otp: "",
      });
      setVerifiedResetIdentifier("");
      setResetForm({
        resetToken: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep("forgot-verify");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(
        getApiErrorMessage(error, "Unable to request reset OTP."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotVerifySubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    resetFeedback();
    const data = handleValidation(validateOtpForm(verifyForm));

    if (!data) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyPasswordResetOtp({
        identifier: data.identifier,
        otp: data.otp,
      });
      setStatusTone("success");
      setStatusMessage(response.message);
      setVerifiedResetIdentifier(data.identifier);
      setResetForm({
        resetToken: response.data.resetToken,
        newPassword: "",
        confirmPassword: "",
      });
      setStep("reset");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to verify OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const data = handleValidation(validateResetPasswordForm(resetForm));

    if (!data) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword(data);
      setStatusTone("success");
      setStatusMessage(response.message);
      setVerifiedResetIdentifier("");
      setResetForm({
        resetToken: "",
        newPassword: "",
        confirmPassword: "",
      });
      setVerifyForm({
        identifier: "",
        otp: "",
      });
      setStep("login");
      setLoginForm({
        identifier: verifiedResetIdentifier,
        password: "",
      });
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderFeedback = statusMessage ? (
    <div
      className={`rounded-[1.25rem] border p-4 text-sm ${
        statusTone === "error"
          ? "border-[#f0c8c8] bg-[#fff5f5] text-[#8f2f2f]"
          : "border-[#dbe8cd] bg-[#f7fbf2] text-[#244119]"
      }`}
    >
      <p className="font-semibold">{statusMessage}</p>
    </div>
  ) : null;

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="border border-[#dbe8cd] rounded-[1rem] overflow-hidden mx-auto grid max-w-6xl gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div
            className=" flex justify-center items-center"
            style={{
              background:
                "linear-gradient(160deg, #fcfff7 0%, #fdfff8 40%, #fafdf4 100%)",
            }}
          >
            <PlantHeroPanel
              name="Monstera Deliciosa"
              subtitle="Swiss Cheese Plant"
              eyebrow="Featured plant"
              imageUrl="/hero_image.png"
              badges={[
                { label: "Low light ok", type: "light" },
                { label: "Pet caution", type: "pet" },
                { label: "Easy care", type: "care" },
              ]}
            />
          </div>
          {/* Haramisala */}

          {/* ----------- */}

          <div className="bg-white p-6 md:p-8">
            <div>{renderFeedback}</div>

            {step === "login" ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-[#dbe8cd] bg-white px-5 py-3 text-sm font-semibold text-[#163915] shadow-[0_10px_24px_rgba(33,79,20,0.05)] disabled:opacity-60"
                >
                  <GoogleMark />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#e6ecde]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8aa07d]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[#e6ecde]" />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Email or phone number
                  </span>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
                      size={18}
                    />
                    <input
                      type="text"
                      value={loginForm.identifier}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          identifier: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-11 pr-4 text-sm text-[#163915] outline-none"
                      placeholder="user@example.com or +91 98765 43210"
                    />
                  </div>
                  {errors.identifier ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.identifier}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Password
                  </span>
                  <div className="relative">
                    <KeyRound
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
                      size={18}
                    />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-11 pr-4 text-sm text-[#163915] outline-none"
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.password}
                    </span>
                  ) : null}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-[#edf2e7] pt-4 text-sm text-[#58724f]">
                  <span>New here?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setStep("register");
                    }}
                    className="font-semibold text-[#214f14]"
                  >
                    Register
                  </button>
                  <span className="text-[#b7c5ad]">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setVerifiedResetIdentifier("");
                      setStep("forgot");
                    }}
                    className="font-semibold text-[#214f14]"
                  >
                    Forgot Password
                  </button>
                </div>
              </form>
            ) : null}

            {step === "register" ? (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-[#dbe8cd] bg-white px-5 py-3 text-sm font-semibold text-[#163915] shadow-[0_10px_24px_rgba(33,79,20,0.05)] disabled:opacity-60"
                >
                  <GoogleMark />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#e6ecde]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8aa07d]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[#e6ecde]" />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Full name
                  </span>
                  <div className="relative">
                    <UserRound
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
                      size={18}
                    />
                    <input
                      type="text"
                      value={registerForm.fullName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-11 pr-4 text-sm text-[#163915] outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.fullName ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.fullName}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                    placeholder="user@example.com"
                  />
                  {errors.email ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.email}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Phone number
                  </span>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
                      size={18}
                    />
                    <input
                      type="tel"
                      value={registerForm.phoneNumber}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-11 pr-4 text-sm text-[#163915] outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phoneNumber ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.phoneNumber}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Password
                  </span>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                    placeholder="Create a strong password"
                  />
                  {errors.password ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.password}
                    </span>
                  ) : (
                    <span className="mt-2 block text-xs text-[#6f8167]">
                      8+ characters, uppercase, lowercase, number, and symbol.
                    </span>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </button>

                <div className="border-t border-[#edf2e7] pt-4 text-center text-sm text-[#58724f]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setStep("login");
                    }}
                    className="font-semibold text-[#214f14]"
                  >
                    Login
                  </button>
                </div>
              </form>
            ) : null}

            {step === "verify" ? (
              <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Email or phone number
                  </span>
                  <input
                    type="text"
                    value={verifyForm.identifier}
                    onChange={(event) =>
                      setVerifyForm((current) => ({
                        ...current,
                        identifier: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                  />
                  {errors.identifier ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.identifier}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    OTP
                  </span>
                  <OtpInputGroup
                    value={verifyForm.otp}
                    onChange={(otp) =>
                      setVerifyForm((current) => ({
                        ...current,
                        otp,
                      }))
                    }
                  />
                  {errors.otp ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.otp}
                    </span>
                  ) : null}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Verifying..." : "Verify Account"}
                </button>
              </form>
            ) : null}

            {step === "forgot" ? (
              <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Email or phone number
                  </span>
                  <input
                    type="text"
                    value={forgotForm.identifier}
                    onChange={(event) =>
                      setForgotForm({
                        identifier: event.target.value,
                      })
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                    placeholder="user@example.com or +91 98765 43210"
                  />
                  {errors.identifier ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.identifier}
                    </span>
                  ) : null}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Sending OTP..." : "Send Reset OTP"}
                </button>
              </form>
            ) : null}

            {step === "forgot-verify" ? (
              <form
                onSubmit={handleForgotVerifySubmit}
                className="mt-6 space-y-5"
              >
                <div className="rounded-[1.4rem] border border-[#e4edd9] bg-[#f9fbf6] p-4 text-sm text-[#58724f]">
                  We sent a six-digit reset code to the email linked with this
                  account.
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Email or phone number
                  </span>
                  <input
                    type="text"
                    value={verifyForm.identifier}
                    onChange={(event) =>
                      setVerifyForm((current) => ({
                        ...current,
                        identifier: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                  />
                  {errors.identifier ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.identifier}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    OTP
                  </span>
                  <OtpInputGroup
                    value={verifyForm.otp}
                    onChange={(otp) =>
                      setVerifyForm((current) => ({
                        ...current,
                        otp,
                      }))
                    }
                  />
                  <span className="mt-2 block text-xs text-[#6f8167]">
                    Enter the 6-digit code from your email before continuing.
                  </span>
                  {errors.otp ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.otp}
                    </span>
                  ) : null}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Verifying OTP..." : "Verify OTP"}
                </button>
              </form>
            ) : null}

            {step === "reset" ? (
              <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
                <div className="rounded-[1.4rem] border border-[#e4edd9] bg-[#f9fbf6] p-4 text-sm text-[#58724f]">
                  OTP verified for{" "}
                  <span className="font-semibold text-[#214f14]">
                    {verifiedResetIdentifier}
                  </span>
                  . Set a fresh password to finish.
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    New password
                  </span>
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                  />
                  {errors.newPassword ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.newPassword}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                    Confirm password
                  </span>
                  <input
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                  />
                  {errors.confirmPassword ? (
                    <span className="mt-2 block text-xs text-[#c54b4b]">
                      {errors.confirmPassword}
                    </span>
                  ) : null}
                </label>

                {errors.resetToken ? (
                  <span className="block text-xs text-[#c54b4b]">
                    {errors.resetToken}
                  </span>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Updating password..." : "Reset Password"}
                </button>
              </form>
            ) : null}

            <div className="mt-6 text-sm text-[#58724f]">
              <Link href="/" className="font-semibold text-[#214f14]">
                Back to storefront
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

interface PlantHeroPanelProps {
  name: string;
  subtitle: string;
  eyebrow?: string;
  imageUrl: string;
  badges?: { label: string; type: "light" | "pet" | "care" }[];
}

function PlantHeroPanel({
  name = "Monstera Deliciosa",
  subtitle = "Swiss Cheese Plant",
  eyebrow = "Featured plant",
  imageUrl,
  badges = [
    { label: "Low light ok", type: "light" },
    { label: "Pet caution", type: "pet" },
    { label: "Easy care", type: "care" },
  ],
}: PlantHeroPanelProps) {
  const badgeStyles = {
    light: {
      className: "bg-green-100/30 text-green-800 border border-green-300/40",
      dot: "bg-green-500",
    },
    pet: {
      className: "bg-yellow-100/30 text-yellow-800 border border-yellow-300/40",
      dot: "bg-yellow-400",
    },
    care: {
      className: "bg-teal-100/30 text-teal-800 border border-teal-300/40",
      dot: "bg-teal-500",
    },
  };

  return (
    <div
      className="relative overflow-hidden rounded-[28px] flex flex-col items-center justify-between gap-4 w-full min-h-[520px] px-7 pt-8 pb-7"
      // style={{
      //   background:
      //     "linear-gradient(160deg, #fcfff7 0%, #fdfff8 40%, #fafdf4 100%)",
      // }}
    >
      {/* Header */}
      <div className="text-center z-10 w-full">
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-green-600 mb-1.5">
          {eyebrow}
        </p>
        <h2 className="italic text-[26px] text-green-950 m-0 leading-tight">
          {name}
          <span className="not-italic text-sm text-green-500 block mt-0.5">
            {subtitle}
          </span>
        </h2>
      </div>

      {/* Plant Image */}
      <div className="relative z-10 w-full flex items-end justify-center flex-1 py-3">
        {/* Shadow ellipse */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-7 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(100,140,60,0.18) 0%, transparent 70%)",
          }}
        />
        <Image
          src={imageUrl}
          alt={name}
          width={240}
          height={320}
          className="w-60 h-auto object-contain"
          style={{
            filter: "drop-shadow(0 20px 30px rgba(40,100,10,0.18))",
            animation: "floatPlant 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Badges */}
      <div className="flex gap-2 z-10 flex-wrap justify-center">
        {badges.map((b, i) => {
          const s = badgeStyles[b.type];
          return (
            <span
              key={i}
              className={`text-[11px] font-medium px-3 py-1 rounded-xs flex items-center gap-1.5 ${s.className}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full inline-block ${s.dot}`}
              />
              {b.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
