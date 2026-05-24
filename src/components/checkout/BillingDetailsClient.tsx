"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import CheckoutPageFooter from "@/components/checkout/CheckoutPageFooter";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import SiteShell from "@/components/SiteShell";
import {
  EMPTY_BILLING_DETAILS,
  normalizeBillingDetailsDraft,
  readBillingDetailsDraft,
  readCheckoutDraft,
  writeBillingDetailsDraft,
  writeCheckoutDraft,
  type BillingDetailsDraft,
  type CheckoutPosition,
} from "@/lib/checkoutSession";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import {
  hasCompleteDeliveryAddress,
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";

type Step = 1 | 2 | 3;

type BillingForm = {
  name: string;
  contact: string;
  gstin: string;
  state: string;
  city: string;
  address: string;
};

type BillingErrors = Partial<Record<keyof BillingForm, string>>;

const steps: { id: Step; label: string }[] = [
  { id: 1, label: "Billing Details" },
  { id: 2, label: "Order Summary" },
  { id: 3, label: "Payment" },
];

const emptyForm: BillingForm = {
  name: "",
  contact: "",
  gstin: "",
  state: "",
  city: "",
  address: "",
};

// Indian States & Union Territories
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

function normalizeIndianMobileNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "");
}

function isValidIndianMobileNumber(phoneNumber: string) {
  const normalized = normalizeIndianMobileNumber(phoneNumber);
  return /^[6-9]\d{9}$/.test(normalized) && !/^(\d)\1{5}/.test(normalized);
}

function hasSavedBillingDetails(details: BillingDetailsDraft) {
  return Object.values(details).some((value) => String(value || "").trim());
}

function hasValidBillingDetailsForSync(details: BillingDetailsDraft) {
  if (!details.name.trim() || details.name.trim().length < 4) {
    return false;
  }

  if (!details.contact.trim() || !isValidIndianMobileNumber(details.contact)) {
    return false;
  }

  if (details.gstin.trim() && details.gstin.trim().length !== 15) {
    return false;
  }

  return Boolean(
    details.state.trim() && details.city.trim() && details.address.trim(),
  );
}

function extractPostalCode(address: string) {
  return address.match(/\b\d{6}\b/)?.[0] || "";
}

function buildDeliveryAddressFromBilling(
  form: BillingForm,
  preferredFormattedAddress = "",
) {
  const postalCode = extractPostalCode(form.address);

  return normalizeDeliveryAddress({
    formattedAddress:
      preferredFormattedAddress.trim() ||
      [form.address.trim(), form.city.trim(), form.state.trim(), postalCode]
        .filter(Boolean)
        .join(", "),
    line1: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode,
  });
}

export default function BillingDetailsClient() {
  const router = useRouter();
  const { updateProfile, user } = useAuth();
  const [currentStep] = useState<Step>(1);
  const [form, setForm] = useState<BillingForm>(
    () => readBillingDetailsDraft() || emptyForm,
  );
  const [deliveryPosition, setDeliveryPosition] = useState<CheckoutPosition | null>(
    () => readCheckoutDraft()?.deliveryPosition || null,
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => readCheckoutDraft()?.deliveryAddress?.trim() || "",
  );
  const [deliveryAddressDetails, setDeliveryAddressDetails] =
    useState<DeliveryAddress>(() =>
      normalizeDeliveryAddress(readCheckoutDraft()?.deliveryAddressDetails),
    );
  const [errors, setErrors] = useState<BillingErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const lastSyncedBillingDetailsRef = useRef("");

  useEffect(() => {
    if (!user) {
      return;
    }

    lastSyncedBillingDetailsRef.current = JSON.stringify(
      normalizeBillingDetailsDraft(user.billingDetails),
    );

    const savedBillingDraft = readBillingDetailsDraft();
    if (!hasSavedBillingDetails(savedBillingDraft)) {
      queueMicrotask(() => {
        setForm(normalizeBillingDetailsDraft(user.billingDetails));
      });
    }

    const savedCheckoutDraft = readCheckoutDraft();
    if (!savedCheckoutDraft?.deliveryAddress?.trim()) {
      queueMicrotask(() => {
        setDeliveryAddress(formatDeliveryAddress(user.deliveryAddress));
        setDeliveryAddressDetails(normalizeDeliveryAddress(user.deliveryAddress));
      });
    }
  }, [user]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => {
      const nextForm = { ...current, [name]: value };
      writeBillingDetailsDraft(normalizeBillingDetailsDraft(nextForm));
      return nextForm;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitMessage("");
  }

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const normalizedBillingDetails = normalizeBillingDetailsDraft(form);
    const nextBillingDetailsKey = JSON.stringify(normalizedBillingDetails);
    const currentUserBillingKey = JSON.stringify(
      normalizeBillingDetailsDraft(user.billingDetails),
    );

    if (
      nextBillingDetailsKey === currentUserBillingKey ||
      nextBillingDetailsKey === lastSyncedBillingDetailsRef.current ||
      !hasValidBillingDetailsForSync(normalizedBillingDetails)
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      lastSyncedBillingDetailsRef.current = nextBillingDetailsKey;
      void updateProfile({
        fullName: user.fullName || normalizedBillingDetails.name,
        phoneNumber: user.phoneNumber || normalizedBillingDetails.contact,
        deliveryAddress: normalizeDeliveryAddress(user.deliveryAddress),
        billingDetails: normalizedBillingDetails,
      }).catch(() => {
        lastSyncedBillingDetailsRef.current = "";
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [form, updateProfile, user]);

  function handleDeliveryAddressChange(
    address: string,
    position?: CheckoutPosition,
    nextDeliveryAddress?: DeliveryAddress,
  ) {
    const normalizedNextDeliveryAddress = nextDeliveryAddress
      ? normalizeDeliveryAddress(nextDeliveryAddress)
      : deliveryAddressDetails;
    setDeliveryAddress(address);
    setDeliveryAddressDetails(normalizedNextDeliveryAddress);
    if (position) {
      setDeliveryPosition(position);
    }

    writeCheckoutDraft({
      deliveryAddress: address.trim(),
      deliveryAddressDetails: normalizedNextDeliveryAddress,
      deliveryPosition: position || deliveryPosition,
    });
  }

  async function handlePlaceOrder() {
    const nextErrors: BillingErrors = {};

    if (!form.name.trim()) nextErrors.name = "Enter person or business name.";
    else if (form.name.trim().length < 4) nextErrors.name = "Name must be at least 4 characters.";

    if (!form.contact.trim()) nextErrors.contact = "Enter contact number.";
    else if (!isValidIndianMobileNumber(form.contact))
      nextErrors.contact = "Enter a valid Indian mobile number.";

    if (form.gstin.trim() && form.gstin.trim().length !== 15)
      nextErrors.gstin = "GSTIN must be exactly 15 characters.";

    if (!form.state.trim()) nextErrors.state = "Select your state.";
    if (!form.city.trim()) nextErrors.city = "Enter city or town.";
    if (!form.address.trim()) nextErrors.address = "Enter full address.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSubmitMessage("Please fill all required billing details.");
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const normalizedBillingDetails = normalizeBillingDetailsDraft(form);
    const normalizedUserDeliveryAddress = normalizeDeliveryAddress(
      user?.deliveryAddress,
    );
    const deliveryAddressForProfile = hasCompleteDeliveryAddress(
      deliveryAddressDetails,
    )
      ? deliveryAddressDetails
      : hasCompleteDeliveryAddress(normalizedUserDeliveryAddress)
        ? normalizedUserDeliveryAddress
        : deliveryAddress.trim()
          ? buildDeliveryAddressFromBilling(form, deliveryAddress.trim())
          : buildDeliveryAddressFromBilling(form);

    writeBillingDetailsDraft(normalizedBillingDetails);
    writeCheckoutDraft({
      deliveryAddress: deliveryAddress.trim(),
      deliveryAddressDetails: deliveryAddressForProfile,
      deliveryPosition,
    });

    if (user) {
      try {
        await updateProfile({
          fullName: user.fullName || normalizedBillingDetails.name,
          phoneNumber: user.phoneNumber || normalizedBillingDetails.contact,
          deliveryAddress: deliveryAddressForProfile,
          billingDetails: normalizedBillingDetails,
        });
      } catch (error) {
        setSubmitMessage(
          error instanceof Error
            ? error.message
            : "Unable to save your billing details right now.",
        );
        return;
      }
    }

    router.push("/order-summary");
  }

  async function handleDeliveryAddressDone(
    address: string,
    position: CheckoutPosition,
    nextDeliveryAddress: DeliveryAddress,
  ) {
    handleDeliveryAddressChange(address, position, nextDeliveryAddress);

    if (!user) {
      return;
    }

    try {
      await updateProfile({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        deliveryAddress: nextDeliveryAddress,
        billingDetails: user.billingDetails || EMPTY_BILLING_DETAILS,
      });
    } catch {
      return;
    }
  }

  return (
    <SiteShell hideHeader hideMobileBottomNav>
      <section className="min-h-screen bg-white px-3 pb-24 pt-[5.5rem] sm:px-4 sm:pb-5 sm:pt-24 md:px-6 md:pb-10 md:pt-28">
        <div className="fixed inset-x-0 top-0 z-40 border-b border-[#e8ece3] bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:px-4 md:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E0] text-[#173d12] transition hover:bg-[#dcead2]"
              aria-label="Go back"
            >
              <ArrowLeft size={21} />
            </button>
            <h1 className="text-lg font-semibold text-[#173d12] sm:text-xl">
              Billing Details
            </h1>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[660px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="overflow-hidden rounded-[24px] border border-transparent bg-transparent shadow-none">
            {/* Stepper */}
            <div className="mx-auto flex max-w-2xl items-start px-4 pb-7 pt-2 sm:px-6 md:px-8 md:pt-6">
              {/* ... Stepper code remains same ... */}
              {steps.map((step, index) => {
                const active = step.id === currentStep;
                const done = step.id < currentStep;
                return (
                  <div key={step.id} className="flex flex-1 items-start last:flex-none">
                    <div className="flex min-w-[54px] flex-col items-center gap-2 sm:min-w-[60px]">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${active ? "border-2 border-[#C5D6B5] bg-[#4c8b5d] text-white shadow-[0_0_0_2px_rgba(47,100,39,0.18)]" : done ? "bg-[#6B9E3E] text-white" : "bg-[#E8F0E0] text-[#1A1F14]"}`}>
                        {done ? <CheckCircle2 size={18} /> : step.id}
                      </div>
                      <span className={`text-center text-[10px] md:text-xs leading-tight ${active ? "font-semibold text-[#14721c]" : "font-medium text-[#1A1F14]"}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`mx-1 mt-[18px] h-0.5 flex-1 sm:mx-3 md:mx-4 ${done ? "bg-[#6B9E3E]" : "bg-[#D8DDD0]"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-5 px-4 pb-8 sm:px-6 md:px-8 md:pb-10">
              <ProductDeliveryAddressPicker
                variant="checkout-card"
                initialAddress={deliveryAddress}
                initialPosition={deliveryPosition}
                autoResolveInitialAddress
                emptyLabel="Select delivery address"
                onAddressChange={handleDeliveryAddressChange}
                onDone={handleDeliveryAddressDone}
              />

              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#4A5240]" />
                <p className="text-sm leading-6 text-[#4A5240]">
                  Please note that delivery charges may vary if the delivery address is changed.
                </p>
              </div>

              <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                <div className="rounded-[0.5rem] p-4 sm:p-6 md:p-0">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-[#4c8b5d]" />
                    <h2 className="text-lg font-semibold">Billing Details</h2>
                  </div>

                  <div className="flex flex-col gap-5">
                    <Field label="Person / Business Name" name="name" value={form.name} onChange={handleChange} placeholder="Enter full name or business" required error={errors.name} />
                    <Field label="Contact Number" name="contact" value={form.contact} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required type="tel" error={errors.contact} />
                    <Field label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} placeholder="Optional — 15-digit GSTIN" hint="Optional" />

                    <div className="grid grid-cols-2 gap-3">
                      {/* Searchable State Input with Suggestions */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-black">
                          State <span className={errors.state ? "text-[#d93025]" : "text-[#3B5E2B]"}>*</span>
                        </label>
                        <input
                          list="indian-states"
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          placeholder="Type to search state..."
                          aria-invalid={Boolean(errors.state)}
                          className={`h-[46px] w-full rounded-xl border bg-[#cccccc10] px-4 text-sm text-black outline-none transition placeholder:text-gray-400 ${
                            errors.state
                              ? "border-[#d93025] focus:border-[#d93025] focus:ring-4 focus:ring-[#fde8e6]"
                              : "border-[#D8DDD0] focus:border-[#3B5E2B] focus:ring-4 focus:ring-[#E8F0E0]"
                          }`}
                        />
                        <datalist id="indian-states">
                          {indianStates.map((state) => (
                            <option key={state} value={state} />
                          ))}
                        </datalist>
                        {errors.state && (
                          <p className="text-xs font-semibold text-[#d93025]">{errors.state}</p>
                        )}
                      </div>

                      <Field
                        label="City / Town"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="e.g. Bongaigaon"
                        required
                        error={errors.city}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-black">
                        Full Address <span className={errors.address ? "text-[#d93025]" : "text-[#3B5E2B]"}>*</span>
                      </label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        rows={3}
                        placeholder="House / Flat no., Street, Landmark..."
                        className={`min-h-[100px] w-full resize-none rounded-xl border bg-[#cccccc10] px-4 py-3 text-sm text-black outline-none transition placeholder:text-gray-400 ${
                          errors.address
                            ? "border-[#d93025] focus:border-[#d93025] focus:ring-4 focus:ring-[#fde8e6]"
                            : "border-[#D8DDD0] focus:border-[#3B5E2B] focus:ring-4 focus:ring-[#E8F0E0]"
                        }`}
                      />
                      {errors.address && (
                        <p className="text-xs font-semibold text-[#d93025]">{errors.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {submitMessage && (
                <p className="rounded-xl border border-[#f3b4ad] bg-[#fff6f5] px-4 py-3 text-center text-sm font-semibold text-[#b42318]">
                  {submitMessage}
                </p>
              )}

              <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 px-3 py-3 shadow-[0_-10px_28px_rgba(36,54,27,0.14)] backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none">
                <div className="mx-auto w-full max-w-full md:pb-6">
                  <button
                    type="button"
                    onClick={() => void handlePlaceOrder()}
                    className="flex h-[52px] w-full items-center justify-center rounded-[0.85rem] bg-[#4c8b5d] px-6 text-[1.2rem] font-medium text-white transition hover:bg-[#427a50] active:translate-y-0.5 sm:h-[56px] sm:text-[1.35rem]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PaymentFooter />
      </section>
    </SiteShell>
  );
}

// Field Component
type FieldProps = {
  label: string;
  name: keyof BillingForm;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  hint?: string;
  type?: string;
  error?: string;
};

function Field({ label, name, value, onChange, placeholder, required, hint, type = "text", error }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-black">
        {label} {required && <span className={error ? "text-[#d93025]" : "text-[#3B5E2B]"}>*</span>}
        {hint && <span className="ml-1 font-normal text-gray-500">({hint})</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-[46px] w-full rounded-xl border bg-[#cccccc10] px-4 text-sm text-black outline-none transition placeholder:text-gray-400 ${
          error
            ? "border-[#d93025] focus:border-[#d93025] focus:ring-4 focus:ring-[#fde8e6]"
            : "border-[#D8DDD0] focus:border-[#3B5E2B] focus:ring-4 focus:ring-[#E8F0E0]"
        }`}
      />
      {error && <p className="text-xs font-semibold text-[#d93025]">{error}</p>}
    </div>
  );
}

function PaymentFooter() {
  return <CheckoutPageFooter />;

  const paymentMethods = [
    {
      name: "PhonePe",
      icon: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#5f259f" />
          <text x="16" y="21" fontSize="9" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">PhonePe</text>
        </svg>
      ),
    },
    {
      name: "Google Pay",
      icon: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#fff" />
          <text x="8" y="14" fontSize="7" fill="#4285F4" fontFamily="sans-serif" fontWeight="700">G</text>
          <text x="13" y="14" fontSize="7" fill="#EA4335" fontFamily="sans-serif" fontWeight="700">o</text>
          <text x="17" y="14" fontSize="7" fill="#FBBC05" fontFamily="sans-serif" fontWeight="700">o</text>
          <text x="21" y="14" fontSize="7" fill="#4285F4" fontFamily="sans-serif" fontWeight="700">g</text>
          <text x="10" y="23" fontSize="7" fill="#34A853" fontFamily="sans-serif" fontWeight="700">Pay</text>
        </svg>
      ),
    },
    {
      name: "Paytm",
      icon: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#00BAF2" />
          <text x="16" y="21" fontSize="9" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="800">Paytm</text>
        </svg>
      ),
    },
    {
      name: "Visa / MC",
      icon: (
        <svg width="28" height="18" viewBox="0 0 46 30" fill="none">
          <rect width="46" height="30" rx="4" fill="#1A1F71" />
          <circle cx="14" cy="15" r="7" fill="#EB001B" />
          <circle cx="32" cy="15" r="7" fill="#F7B600" />
          <path d="M23 9.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00" />
        </svg>
      ),
    },
    {
      name: "Amex",
      icon: (
        <svg width="22" height="18" viewBox="0 0 36 24" fill="none">
          <rect width="36" height="24" rx="4" fill="#016FD0" />
          <text x="18" y="16" fontSize="8" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">AMEX</text>
        </svg>
      ),
    },
    {
      name: "RuPay",
      icon: (
        <svg width="22" height="18" viewBox="0 0 36 24" fill="none">
          <rect width="36" height="24" rx="4" fill="#f5f5f5" stroke="#ddd" strokeWidth="0.5" />
          <rect x="0" y="8" width="36" height="8" fill="#E31837" />
          <text x="18" y="15" fontSize="5.5" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">RuPay</text>
        </svg>
      ),
    },
    {
      name: "Net Banking",
      icon: (
        <svg width="22" height="18" viewBox="0 0 36 24" fill="none">
          <rect width="36" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5" />
          <text x="18" y="10" fontSize="5" fill="#444" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">NET</text>
          <text x="18" y="17" fontSize="5" fill="#444" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">BANKING</text>
        </svg>
      ),
    },
  ];

  const trustItems = [
    { icon: "🔒", label: "SSL Encrypted" },
    { icon: "🛡️", label: "PCI DSS Compliant" },
    { icon: "🔄", label: "Easy Returns" },
    { icon: "🎧", label: "24/7 Support" },
  ];

  return (
    <footer className="mx-auto mt-10 w-full max-w-7xl border-t border-[#e8ece3] pt-8 pb-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a8a6a]">
        Secure Payment Methods
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {paymentMethods.map(({ name, icon }) => (
          <span
            key={name}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#d7dccf] bg-white px-3.5 py-1.5 text-sm font-medium text-[#1f2a18] shadow-none transition-colors hover:border-[#b0b8a6]"
          >
            {icon}
            {name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#d7dccf] bg-white px-3.5 py-1.5 text-xs font-medium text-[#7a8a6a]">
          ··· & more
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
        {trustItems.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-[#6a7a5a]">
            <span>{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] tracking-[0.04em] text-[#9aaa8a]">
        Copyright © ShadyPlant. All rights reserved.
      </p>
    </footer>
  );
}
