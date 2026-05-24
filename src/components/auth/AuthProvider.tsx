"use client";

import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, requestJson, type ApiResponse } from "@/lib/api";
import {
  EMPTY_BILLING_DETAILS,
  normalizeBillingDetailsDraft,
  type BillingDetailsDraft,
} from "@/lib/checkoutSession";
import {
  EMPTY_DELIVERY_ADDRESS,
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as signOutFromFirebase,
} from "firebase/auth";

export type AuthUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  authProvider: string;
  authMethods?: {
    hasPasswordLogin: boolean;
    hasGoogleLogin: boolean;
  };
  profileImage: string | null;
  isVerified: boolean;
  isVip: boolean;
  paymentAccess: {
    cashOnDelivery: boolean;
    onlinePayment: boolean;
    emi: boolean;
  };
  deliveryAddress: DeliveryAddress;
  billingDetails: BillingDetailsDraft;
  createdAt: string;
  updatedAt: string;
};

type AuthSessionData = {
  accessToken: string;
  user: AuthUser;
  expiresIn: string;
};

type AuthResponse = ApiResponse<AuthSessionData>;

type MessageResponse = {
  message: string;
  data?: unknown;
};

type PasswordResetVerificationData = {
  resetToken: string;
  expiresIn: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  errorMessage: string | null;
  clearError: () => void;
  login: (input: { identifier: string; password: string }) => Promise<AuthUser>;
  loginWithGoogle: () => Promise<AuthUser>;
  register: (input: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => Promise<MessageResponse>;
  verifyRegistrationOtp: (input: {
    identifier: string;
    otp: string;
  }) => Promise<AuthUser>;
  requestPasswordReset: (input: { identifier: string }) => Promise<MessageResponse>;
  verifyPasswordResetOtp: (input: {
    identifier: string;
    otp: string;
  }) => Promise<MessageResponse & { data: PasswordResetVerificationData }>;
  resetPassword: (input: {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    fullName: string;
    phoneNumber: string;
    deliveryAddress: DeliveryAddress;
    billingDetails?: BillingDetailsDraft;
  }) => Promise<AuthUser>;
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  refreshSession: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: Partial<AuthUser>) {
  return {
    id: String(user.id || ""),
    fullName: String(user.fullName || ""),
    phoneNumber: String(user.phoneNumber || ""),
    email: String(user.email || ""),
    authProvider: String(user.authProvider || "local"),
    authMethods:
      typeof user.authMethods === "object" && user.authMethods
        ? {
            hasPasswordLogin: Boolean(user.authMethods.hasPasswordLogin),
            hasGoogleLogin: Boolean(user.authMethods.hasGoogleLogin),
          }
        : undefined,
    profileImage:
      typeof user.profileImage === "string" ? user.profileImage : null,
    isVerified: Boolean(user.isVerified),
    isVip: Boolean(user.isVip),
    paymentAccess:
      typeof user.paymentAccess === "object" && user.paymentAccess
        ? {
            cashOnDelivery: Boolean(user.paymentAccess.cashOnDelivery),
            onlinePayment: Boolean(user.paymentAccess.onlinePayment),
            emi: Boolean(user.paymentAccess.emi),
          }
        : {
            cashOnDelivery: true,
            onlinePayment: true,
            emi: false,
          },
    deliveryAddress: normalizeDeliveryAddress(user.deliveryAddress),
    billingDetails: normalizeBillingDetailsDraft(
      user.billingDetails || EMPTY_BILLING_DETAILS,
    ),
    createdAt: String(user.createdAt || ""),
    updatedAt: String(user.updatedAt || ""),
  } satisfies AuthUser;
}

function buildAuthHeader(accessToken: string | null, headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);

  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return nextHeaders;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthUser | null> | null>(null);

  const applySession = useCallback((payload: AuthSessionData) => {
    const nextUser = normalizeUser(payload.user);
    accessTokenRef.current = payload.accessToken;
    startTransition(() => {
      setUser(nextUser);
      setErrorMessage(null);
    });
    return nextUser;
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    startTransition(() => {
      setUser(null);
    });
  }, []);

  const clearError = () => {
    startTransition(() => setErrorMessage(null));
  };

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const response = await requestJson<AuthResponse>("/auth/refresh", {
          method: "POST",
        });
        return applySession(response.data);
      } catch {
        clearSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [applySession, clearSession]);

  const fetchWithAuth = useCallback(async <T,>(
    path: string,
    init: RequestInit = {},
  ) => {
    const execute = async (accessToken: string | null) =>
      requestJson<T>(path, {
        ...init,
        headers: buildAuthHeader(accessToken, init.headers),
      });

    if (!accessTokenRef.current) {
      await refreshSession();
    }

    try {
      return await execute(accessTokenRef.current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const nextUser = await refreshSession();
        if (!nextUser || !accessTokenRef.current) {
          throw error;
        }

        return execute(accessTokenRef.current);
      }

      throw error;
    }
  }, [refreshSession]);

  useEffect(() => {
    let isActive = true;

    refreshSession()
      .catch(() => null)
      .finally(() => {
        if (isActive) {
          startTransition(() => setIsReady(true));
        }
      });

    return () => {
      isActive = false;
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      errorMessage,
      clearError,
      async login(input) {
        const response = await requestJson<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email_or_phone: input.identifier,
            password: input.password,
          }),
        });

        return applySession(response.data);
      },
      async loginWithGoogle() {
        const auth = getFirebaseAuth();
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: "select_account",
        });

        try {
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();
          const response = await requestJson<AuthResponse>("/auth/google", {
            method: "POST",
            body: JSON.stringify({ idToken }),
          });

          return applySession(response.data);
        } finally {
          await signOutFromFirebase(auth).catch(() => undefined);
        }
      },
      async register(input) {
        return requestJson<MessageResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: input.fullName,
            email: input.email,
            phoneNumber: input.phoneNumber,
            password: input.password,
          }),
        });
      },
      async verifyRegistrationOtp(input) {
        const response = await requestJson<AuthResponse>("/auth/register/verify-otp", {
          method: "POST",
          body: JSON.stringify({
            email_or_phone: input.identifier,
            otp: input.otp,
          }),
        });

        return applySession(response.data);
      },
      async requestPasswordReset(input) {
        return requestJson<MessageResponse>("/auth/forgot-password/request", {
          method: "POST",
          body: JSON.stringify({
            email_or_phone: input.identifier,
          }),
        });
      },
      async verifyPasswordResetOtp(input) {
        return requestJson<MessageResponse & { data: PasswordResetVerificationData }>(
          "/auth/forgot-password/verify-otp",
          {
          method: "POST",
          body: JSON.stringify({
            email_or_phone: input.identifier,
            otp: input.otp,
          }),
          },
        );
      },
      async resetPassword(input) {
        return requestJson<MessageResponse>("/auth/forgot-password/reset", {
          method: "POST",
          body: JSON.stringify({
            resetToken: input.resetToken,
            newPassword: input.newPassword,
            confirmPassword: input.confirmPassword,
          }),
        });
      },
      async logout() {
        try {
          await requestJson<MessageResponse>("/auth/logout", {
            method: "POST",
          });
        } finally {
          clearSession();
        }
      },
      async updateProfile(input) {
        const response = await fetchWithAuth<ApiResponse<{ user: AuthUser }>>(
          "/auth/me",
          {
            method: "PUT",
            body: JSON.stringify({
              fullName: input.fullName,
              phoneNumber: input.phoneNumber,
              deliveryAddress: input.deliveryAddress,
              billingDetails: input.billingDetails,
            }),
          },
        );

        const nextUser = normalizeUser(response.data.user);
        startTransition(() => setUser(nextUser));
        return nextUser;
      },
      fetchWithAuth,
      refreshSession,
    }),
    [
      user,
      isReady,
      errorMessage,
      applySession,
      clearSession,
      fetchWithAuth,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

export function useOptionalUser() {
  const context = useContext(AuthContext);
  return context?.user ?? null;
}

export function getEmptyDeliveryAddress() {
  return { ...EMPTY_DELIVERY_ADDRESS };
}
