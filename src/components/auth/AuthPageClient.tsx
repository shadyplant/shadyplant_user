"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { Lock, Mail, Phone, UserRound } from "lucide-react";
import AuthLoginPanel from "@/components/auth/AuthLoginPanel";
import TopBar from "@/components/TopBar";
import SiteShell from "@/components/SiteShell";
import {
  isValidIdentifier,
  validateOtpForm,
  validateRegistrationForm,
  validateResetPasswordForm,
  type ValidationResult,
} from "@/lib/validation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";

type AuthStep =
  | "login"
  | "register"
  | "verify"
  | "forgot"
  | "forgot-verify"
  | "reset";

const OTP_LENGTH = 6;
const RESEND_OTP_COOLDOWN_SECONDS = 60;

type RegisterForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
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
  if (error instanceof ApiError && error.status === 409) {
    return "You already have an account. Please log in.";
  }

  return fallback;
}

function readNextPath(
  searchParams: { get: (name: string) => string | null } | null,
) {
  const next = searchParams?.get("next");
  return next?.startsWith("/") ? next : "/";
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildResetOtpStatusMessage(identifier: string) {
  const trimmedIdentifier = identifier.trim();
  if (trimmedIdentifier) {
    return `If ${trimmedIdentifier} is registered, we sent a reset OTP.`;
  }

  return "If the details you entered are registered, we sent a reset OTP.";
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
          className="h-14 w-12 rounded-[1rem] border border-gray-300 bg-gray-50 text-center text-lg font-semibold tracking-[0.1em] text-gray-600 outline-none transition focus:border-gray-500 focus:bg-white sm:w-14"
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
    clearError,
    errorMessage,
    isAuthenticated,
    isReady,
    loginWithGoogle,
    register,
    resendRegistrationOtp,
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
  const [loginPrefillIdentifier, setLoginPrefillIdentifier] = useState("");
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [registrationToken, setRegistrationToken] = useState("");
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
  const [registerResendOtpCooldown, setRegisterResendOtpCooldown] = useState(0);
  const [resetResendOtpCooldown, setResetResendOtpCooldown] = useState(0);
  const [statusVisible, setStatusVisible] = useState(false);

  useEffect(() => {
    if (registerResendOtpCooldown <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRegisterResendOtpCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [registerResendOtpCooldown]);

  useEffect(() => {
    if (resetResendOtpCooldown <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setResetResendOtpCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [resetResendOtpCooldown]);

  useEffect(() => {
    if (!statusMessage) {
      setStatusVisible(false);
      return;
    }

    setStatusVisible(false);
    const frameId = window.requestAnimationFrame(() => {
      setStatusVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [statusMessage]);

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
    clearError();
  }

  function startRegisterResendCooldown() {
    setRegisterResendOtpCooldown(RESEND_OTP_COOLDOWN_SECONDS);
  }

  function startResetResendCooldown() {
    setResetResendOtpCooldown(RESEND_OTP_COOLDOWN_SECONDS);
  }

  async function handleRegisterOtpResend() {
    resetFeedback();
    const email = verifyForm.identifier.trim();

    if (!email) {
      setStatusTone("error");
      setStatusMessage("We could not find the verification email.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resendRegistrationOtp(
        registrationToken ? { registrationToken } : { email },
      );
      setStatusTone("success");
      setStatusMessage(`We sent a verification OTP to ${email}.`);
      setVerifyForm((current) => ({
        ...current,
        identifier: email,
        otp: "",
      }));
      startRegisterResendCooldown();
    } catch {
      setStatusTone("error");
      setStatusMessage("Unable to resend verification OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotOtpResend() {
    resetFeedback();
    const identifier = verifyForm.identifier.trim();

    if (!isValidIdentifier(identifier)) {
      setErrors({ identifier: "Enter a valid email address or phone number." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ identifier });

      if (response.data && !response.data.accountExists) {
        setStatusTone("error");
        setStatusMessage("You don't have an account. Please sign up.");
        return;
      }

      setStatusTone("success");
      setStatusMessage(buildResetOtpStatusMessage(identifier));
      setVerifyForm((current) => ({
        ...current,
        otp: "",
      }));
      startResetResendCooldown();
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(
        getApiErrorMessage(error, "Unable to resend reset OTP."),
      );
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
      const nextRegistrationToken = response.data?.registrationToken || "";
      setStatusTone("success");
      setStatusMessage("Account created successfully. Please verify your account.");
      startTransition(() => {
        setRegistrationToken(nextRegistrationToken);
        setVerifyForm({
          identifier: response.data?.email || data.email,
          otp: "",
        });
        setStep("verify");
        startRegisterResendCooldown();
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        resetFeedback();
        setStatusTone("error");
        setStatusMessage("You already have an account. Please log in.");
        setLoginPrefillIdentifier(registerForm.email.trim());
        setRegistrationToken("");
        setStep("login");
        return;
      }

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
      const user = await loginWithGoogle();

      if (user) {
        router.replace(nextPath);
      }
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
      await verifyRegistrationOtp({
        registrationToken: registrationToken || undefined,
        identifier: data.identifier,
        otp: data.otp,
      });
      setStatusTone("success");
      setRegistrationToken("");
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

      if (response.data && !response.data.accountExists) {
        setStatusTone("error");
        setStatusMessage("You don't have an account. Please sign up.");
        return;
      }

      setStatusTone("success");
      setStatusMessage(buildResetOtpStatusMessage(identifier));
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
      startResetResendCooldown();
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
      setStatusMessage(
        "Reset OTP verified successfully. Please create a new password.",
      );
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
      await resetPassword(data);
      setStatusTone("success");
      setStatusMessage("Password updated successfully. Please log in again.");
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
      setLoginPrefillIdentifier(verifiedResetIdentifier);
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(getApiErrorMessage(error, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderFeedback = statusMessage ? (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 overflow-hidden rounded-[1.1rem] border px-4 py-3 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out ${
        statusTone === "error"
          ? "border-[#e6b8b8] bg-[#fff7f7] text-[#8f2f2f]"
          : "border-[#c6e4d8] bg-[#f5fbf8] text-[#245c45]"
      } ${
        statusVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
    >
      <p className="font-medium leading-6">{statusMessage}</p>
    </div>
  ) : null;

  return (
    <SiteShell hideHeader hideMobileBottomNav>
      <div className="min-h-screen flex flex-col items-center justify-center">

        <section className="px-4 pb-8 pt-4 md:px-6 md:pb-12 md:pt-6 w-full">
          <div className="md:border md:border-gray-200 min-h-[550px] md:rounded-[1rem] overflow-hidden mx-auto grid max-w-5xl gap-0 lg:grid-cols-[0.95fr_1.05fr] md:shadow-[0_30px_90px_rgba(0,0,0,0.12)]">
            
            {/* Left Image Panel */}
            <div
              className="hidden justify-center items-center lg:flex relative"
              style={{
                background:
                  "linear-gradient(160deg, #fcfff7 0%, #fdfff8 40%, #fafdf4 100%)",
              }}
            >
              <img
                className="w-full h-full object-cover"
                src="https://img.magnific.com/free-vector/botanical-garden-illustration_52683-111219.jpg?t=st=1783846279~exp=1783849879~hmac=620b52d44d26f7c147353ac1dc2da8781833a2fd00680719af8399a5bbb7c6d7&w=1480"
                alt="Monstera Deliciosa"
              />

               <TopBar
                 className="absolute top-0 left-0 z-50 w-full"
                 fallbackHref="/"
               />
            </div>

            {/* Right Forms Panel - Flex column & center to maintain vertical consistency */}
            <div className="bg-white p-8 md:p-10 lg:p-12 flex flex-col justify-center min-h-[500px]">
              <div className="mx-auto w-full max-w-[380px]">
                
                {renderFeedback}
                {errorMessage ? (
                  <div className="mt-4 mb-4 rounded-[1.1rem] border border-[#e6b8b8] bg-[#fff7f7] px-4 py-3 text-sm text-[#8f2f2f] shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                    <p className="font-medium leading-6">
                      We couldn&apos;t complete that action right now. Please try again.
                    </p>
                  </div>
                ) : null}

                {step === "login" ? (
                  <AuthLoginPanel
                    msgTitle="Welcome back!"
                    key={loginPrefillIdentifier || "login"}
                    nextPath={nextPath}
                    initialIdentifier={loginPrefillIdentifier}
                    onRequestRegister={() => {
                      resetFeedback();
                      setLoginPrefillIdentifier("");
                      setRegistrationToken("");
                      setStep("register");
                    }}
                    onRequestForgotPassword={() => {
                      resetFeedback();
                      setLoginPrefillIdentifier("");
                      setRegistrationToken("");
                      setVerifiedResetIdentifier("");
                      setStep("forgot");
                    }}
                  />
                ) : null}

                {step === "register" ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Let&apos;s get started!
                      </h2>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        Full name
                      </span>
                      <div className="relative">
                        <UserRound
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                          className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3 pl-4 pr-11 text-sm text-gray-600 outline-none placeholder:text-gray-400"
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
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        Email
                      </span>
                      <div className="relative">
                        <Mail
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3 pl-4 pr-11 text-sm text-gray-600 outline-none placeholder:text-gray-400"
                          placeholder="user@example.com"
                        />
                      </div>
                      {errors.email ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">
                          {errors.email}
                        </span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        Phone number
                      </span>
                      <div className="relative">
                        <Phone
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                          className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3 pl-4 pr-11 text-sm text-gray-600 outline-none placeholder:text-gray-400"
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
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        Password
                      </span>
                      <div className="relative">
                        <Lock
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="password"
                          value={registerForm.password}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3 pl-4 pr-11 text-sm text-gray-600 outline-none placeholder:text-gray-400"
                          placeholder="Create a strong password"
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
                      className="w-full rounded-full bg-[#207958] cursor-pointer px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </button>

                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-gray-300" />
                      <span className="text-xs uppercase text-gray-500">or</span>
                      <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-[0_10px_24px_rgba(33,79,20,0.05)] disabled:opacity-60 cursor-pointer transition hover:bg-gray-50 hover:text-gray-800"
                    >
                      <GoogleMark />
                      Continue with Google
                    </button>

                    <div className="border-t border-gray-200 pt-5 mt-2 text-center text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          resetFeedback();
                          setRegistrationToken("");
                          setStep("login");
                        }}
                        className="font-semibold text-gray-800 transition hover:text-gray-900 cursor-pointer"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                ) : null}

                {step === "verify" ? (
                  <form onSubmit={handleVerifySubmit} className="space-y-5">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Verify Account
                      </h2>
                      <p className="mt-3 text-sm text-gray-600">
                        {verifyForm.identifier
                          ? `Enter the OTP sent to ${verifyForm.identifier} to proceed.`
                          : "Enter the OTP sent to your email to proceed."}
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        OTP
                      </span>
                      <OtpInputGroup
                        value={verifyForm.otp}
                        onChange={(otp) =>
                          setVerifyForm((current) => ({ ...current, otp }))
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
                      className="w-full mt-2 rounded-full bg-[#207958] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    >
                      {isSubmitting ? "Verifying..." : "Verify Account"}
                    </button>

                    <div className="space-y-2 pt-1 text-center">
                      <p className="text-xs text-gray-500">
                        Didn&apos;t receive the code?
                        {registerResendOtpCooldown > 0
                          ? ` Resend available in ${formatCountdown(registerResendOtpCooldown)}`
                          : " You can resend it now."}
                      </p>
                      <button
                        type="button"
                        onClick={handleRegisterOtpResend}
                        disabled={isSubmitting || registerResendOtpCooldown > 0}
                        className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {registerResendOtpCooldown > 0
                          ? `Resend OTP (${formatCountdown(registerResendOtpCooldown)})`
                          : isSubmitting
                            ? "Sending OTP..."
                            : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                ) : null}

                {step === "forgot" ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-5">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Forgot Password?
                      </h2>
                      <p className="mt-3 text-sm text-gray-600">
                        Enter your email and we&apos;ll send you a reset OTP.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
                        Email
                      </span>
                      <input
                        type="text"
                        value={forgotForm.identifier}
                        onChange={(event) =>
                          setForgotForm({ identifier: event.target.value })
                        }
                        className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3.5 px-4 text-sm text-gray-600 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:bg-white transition-colors"
                        placeholder="user@example.com"
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
                      className="w-full mt-2 rounded-full bg-[#207958] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    >
                      {isSubmitting ? "Sending OTP..." : "Send Reset OTP"}
                    </button>
                    
                    <div className="pt-2 text-center text-sm text-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          resetFeedback();
                          setRegistrationToken("");
                          setStep("login");
                        }}
                        className="font-semibold text-gray-800 transition hover:text-gray-900 cursor-pointer"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                ) : null}

                {step === "forgot-verify" ? (
                  <form onSubmit={handleForgotVerifySubmit} className="space-y-5">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Enter Reset OTP
                      </h2>
                    </div>

                    <label className="block">
                  
                      <OtpInputGroup
                        value={verifyForm.otp}
                        onChange={(otp) =>
                          setVerifyForm((current) => ({ ...current, otp }))
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
                      className="w-full mt-2 rounded-full bg-[#207958] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    >
                      {isSubmitting ? "Verifying OTP..." : "Verify OTP"}
                    </button>

                    <div className="space-y-2 pt-1 text-center">
                      <p className="text-xs text-gray-500">
                        Didn&apos;t receive the code?
                        {resetResendOtpCooldown > 0
                          ? ` Resend available in ${formatCountdown(resetResendOtpCooldown)}`
                          : " You can resend it now."}
                      </p>
                      <button
                        type="button"
                        onClick={handleForgotOtpResend}
                        disabled={isSubmitting || resetResendOtpCooldown > 0}
                        className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resetResendOtpCooldown > 0
                          ? `Resend OTP (${formatCountdown(resetResendOtpCooldown)})`
                          : isSubmitting
                            ? "Sending OTP..."
                            : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                ) : null}

                {step === "reset" ? (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Create New Password
                      </h2>
                      <p className="mt-3 text-sm text-gray-600">
                        OTP verified for <span className="font-semibold text-[#46a780]">{verifiedResetIdentifier}</span>. Set a fresh password to finish.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
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
                        className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3.5 px-4 text-sm text-gray-600 outline-none focus:border-gray-500 focus:bg-white transition-colors"
                      />
                      {errors.newPassword ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">
                          {errors.newPassword}
                        </span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-gray-800">
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
                        className="w-full rounded-[0.5rem] border border-gray-300 bg-gray-50 py-3.5 px-4 text-sm text-gray-600 outline-none focus:border-gray-500 focus:bg-white transition-colors"
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
                      className="w-full mt-2 rounded-full bg-[#207958] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    >
                      {isSubmitting ? "Updating password..." : "Reset Password"}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
