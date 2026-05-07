export type CashfreeMode = "sandbox" | "production";

export type CashfreeCheckoutSession = {
  paymentAttemptId: string;
  shouldSimulateWebhook: boolean;
  returnPath: string;
};

const CASHFREE_SCRIPT_ID = "cashfree-sdk-v3";
const CASHFREE_SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";
const CASHFREE_SESSION_KEY = "ggn_cashfree_checkout";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readCashfreeCheckoutSession(): CashfreeCheckoutSession | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(CASHFREE_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as CashfreeCheckoutSession;

    if (!parsedValue?.paymentAttemptId) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function writeCashfreeCheckoutSession(session: CashfreeCheckoutSession) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.sessionStorage.setItem(CASHFREE_SESSION_KEY, JSON.stringify(session));
}

export function clearCashfreeCheckoutSession() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.sessionStorage.removeItem(CASHFREE_SESSION_KEY);
}

export function cleanupCashfreeReturnUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const nextUrl = new URL(url.toString());
  nextUrl.searchParams.delete("cashfree_return");
  nextUrl.searchParams.delete("payment_attempt_id");
  nextUrl.searchParams.delete("order_id");

  const normalizedCurrentUrl = url.toString();
  const normalizedNextUrl = nextUrl.toString();

  if (normalizedCurrentUrl !== normalizedNextUrl) {
    window.history.replaceState({}, "", normalizedNextUrl);
  }
}

export function getCashfreeReturnState() {
  if (typeof window === "undefined") {
    return {
      isReturn: false,
      paymentAttemptId: "",
      orderId: "",
    };
  }

  const url = new URL(window.location.href);

  return {
    isReturn: url.searchParams.get("cashfree_return") === "1",
    paymentAttemptId: url.searchParams.get("payment_attempt_id")?.trim() || "",
    orderId: url.searchParams.get("order_id")?.trim() || "",
  };
}

export function loadCashfreeSdk() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Cashfree) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById(CASHFREE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = CASHFREE_SCRIPT_ID;
    script.src = CASHFREE_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openCashfreeCheckout(options: {
  mode: CashfreeMode;
  paymentSessionId: string;
}) {
  if (typeof window === "undefined" || !window.Cashfree) {
    throw new Error("Cashfree is unavailable right now.");
  }

  const cashfree = window.Cashfree({
    mode: options.mode,
  });

  const result = await cashfree.checkout({
    paymentSessionId: options.paymentSessionId,
    redirectTarget: "_self",
  });

  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    result.error &&
    typeof result.error.message === "string"
  ) {
    throw new Error(result.error.message);
  }

  return result;
}
