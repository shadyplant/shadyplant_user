"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { validateLoginForm } from "@/lib/validation";

type LoginForm = {
  identifier: string;
  password: string;
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

type AuthLoginPanelProps = {
  nextPath: string;
  initialIdentifier?: string;
  onSuccess?: () => void;
  onRequestRegister?: () => void;
  onRequestForgotPassword?: () => void;
  className?: string;
  submitLabel?: string;
};

export default function AuthLoginPanel({
  nextPath,
  initialIdentifier = "",
  onSuccess,
  onRequestRegister,
  onRequestForgotPassword,
  className = "mt-6 space-y-4",
  submitLabel = "Sign In",
}: AuthLoginPanelProps) {
  const router = useRouter();
  const { clearError, login, loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginForm, setLoginForm] = useState<LoginForm>({
    identifier: initialIdentifier,
    password: "",
  });

  useEffect(() => {
    setLoginForm((current) => ({
      identifier: initialIdentifier,
      password: current.identifier === initialIdentifier ? current.password : "",
    }));
  }, [initialIdentifier]);

  function resetFeedback() {
    setStatusMessage(null);
    setErrors({});
    clearError();
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const result = validateLoginForm(loginForm);
    setErrors(result.errors);

    if (!result.data) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(result.data);
      onSuccess?.();
      router.replace(nextPath);
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error, "Unable to sign in."));
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
        onSuccess?.();
        router.replace(nextPath);
      }
    } catch (error) {
      setStatusMessage(
        getApiErrorMessage(error, "Unable to sign in with Google."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleLoginSubmit} className={className}>
      {statusMessage ? (
        <div className="rounded-[1.25rem] border border-[#f0c8c8] bg-[#fff5f5] p-4 text-sm text-[#8f2f2f]">
          <p className="font-semibold">{statusMessage}</p>
        </div>
      ) : null}

      <div className="space-y-1 text-center mb-8">
        <h2 className="text-2xl font-bold text-[#214f14]">Welcome back</h2>
        <p className="text-sm text-[#58724f]">
          Please enter your details to sign in to your account.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[#214f14]">
          Enter email address
        </span>
        <div className="relative">
          <Mail
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
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
            className="w-full rounded-[0.5rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-4 pr-11 text-sm text-[#163915] outline-none"
            placeholder="abcd123@email.com"
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
          Enter password
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f8167]"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <input
            type={isPasswordVisible ? "text" : "password"}
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            className="w-full rounded-[0.5rem] border border-[#dbe8cd] bg-[#fbfdf8] py-3 pl-4 pr-11 text-sm text-[#163915] outline-none"
            placeholder="********"
          />
        </div>
        {errors.password ? (
          <span className="mt-2 block text-xs text-[#c54b4b]">
            {errors.password}
          </span>
        ) : null}
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            resetFeedback();
            onRequestForgotPassword?.();
          }}
          className="text-sm text-[#214f14]"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[0.5rem] bg-[#4c8b5d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : submitLabel}
      </button>




        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-2 text-sm text-[#58724f]">
        <button
          type="button"
          onClick={() => {
            resetFeedback();
            onRequestRegister?.();
          }}
          className=" text-[#214f14]"
        >
          CREATE A NEW ACCOUNT
        </button>
        </div>


       <div className="flex items-center gap-3 py-4">
        <div className="h-px flex-1 bg-[#e6ecde]" />
        <span className="text-xs uppercase text-[#8aa07d]">
          or login with
        </span>
        <div className="h-px flex-1 bg-[#e6ecde]" />
      </div>

       <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-3 rounded-[0.5rem] border border-[#dbe8cd] bg-white px-5 py-3 text-sm font-semibold text-[#163915] shadow-[0_10px_24px_rgba(33,79,20,0.05)] disabled:opacity-60"
      >
        <GoogleMark />
        Continue with Google
      </button>

    </form>
  );
}
