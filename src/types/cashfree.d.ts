export {};

type CashfreeCheckoutResult = {
  error?: {
    message?: string;
  };
  redirect?: boolean;
};

type CashfreeCheckoutOptions = {
  paymentSessionId: string;
  redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
};

type CashfreeInstance = {
  checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult | void>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}
