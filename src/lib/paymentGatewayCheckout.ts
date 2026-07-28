export type PaymentGatewayMode = "sandbox" | "production";
export type PaymentGatewayProvider = "phonepe" | "cashfree";

export type PaymentGatewayCheckoutSession = {
  paymentAttemptId: string;
  returnPath: string;
};

const PAYMENT_GATEWAY_SESSION_KEY = "ggn_payment_gateway_checkout";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readPaymentGatewayCheckoutSession(): PaymentGatewayCheckoutSession | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PAYMENT_GATEWAY_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as PaymentGatewayCheckoutSession;

    if (!parsedValue?.paymentAttemptId) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function writePaymentGatewayCheckoutSession(
  session: PaymentGatewayCheckoutSession,
) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.sessionStorage.setItem(PAYMENT_GATEWAY_SESSION_KEY, JSON.stringify(session));
}

export function clearPaymentGatewayCheckoutSession() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.sessionStorage.removeItem(PAYMENT_GATEWAY_SESSION_KEY);
}

export function cleanupPaymentGatewayReturnUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const nextUrl = new URL(url.toString());
  nextUrl.searchParams.delete("payment_return");
  nextUrl.searchParams.delete("payment_attempt_id");
  nextUrl.searchParams.delete("order_id");

  if (url.toString() !== nextUrl.toString()) {
    window.history.replaceState({}, "", nextUrl.toString());
  }
}

export function getPaymentGatewayReturnState() {
  if (typeof window === "undefined") {
    return {
      isReturn: false,
      paymentAttemptId: "",
      orderId: "",
    };
  }

  const url = new URL(window.location.href);

  return {
    isReturn: url.searchParams.get("payment_return") === "1",
    paymentAttemptId: url.searchParams.get("payment_attempt_id")?.trim() || "",
    orderId: url.searchParams.get("order_id")?.trim() || "",
  };
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: PaymentGatewayMode }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank";
        returnUrl?: string;
      }) => Promise<unknown>;
    };
  }
}

let cashfreeScriptPromise: Promise<void> | null = null;

function loadCashfreeScript() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Cashfree checkout is unavailable right now."),
    );
  }

  if (window.Cashfree) {
    return Promise.resolve();
  }

  if (cashfreeScriptPromise) {
    return cashfreeScriptPromise;
  }

  cashfreeScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-payment-gateway="cashfree"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load the Cashfree checkout SDK.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.paymentGateway = "cashfree";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load the Cashfree checkout SDK."));
    document.head.appendChild(script);
  });

  return cashfreeScriptPromise;
}

export async function openPaymentGatewayCheckout(options: {
  provider: string;
  redirectUrl?: string;
  paymentSessionId?: string;
  mode: PaymentGatewayMode;
  returnUrl?: string;
}) {
  if (typeof window === "undefined") {
    throw new Error("Payment gateway checkout is unavailable right now.");
  }

  const provider = String(options.provider || "").trim().toLowerCase();
  const redirectUrl = String(options.redirectUrl || "").trim();
  const paymentSessionId = String(options.paymentSessionId || "").trim();

  if (provider === "cashfree") {
    if (!paymentSessionId) {
      throw new Error("Cashfree payment session is missing.");
    }

    await loadCashfreeScript();

    if (!window.Cashfree) {
      throw new Error("Cashfree checkout SDK is unavailable right now.");
    }

    const cashfree = window.Cashfree({
      mode: options.mode,
    });

    await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_self",
      returnUrl: String(options.returnUrl || "").trim() || undefined,
    });

    return;
  }

  if (!redirectUrl) {
    throw new Error("Payment gateway redirect URL is missing.");
  }

  window.location.replace(redirectUrl);
}
