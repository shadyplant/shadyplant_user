"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
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

  useEffect(() => {
    if (!user) {
      return;
    }

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
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitMessage("");
  }

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
    <SiteShell hideMobileHeader hideMobileBottomNav>
      <section className="min-h-screen bg-[#F7F8F4] px-3 pb-24 pt-5 sm:px-4 sm:pb-5 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="overflow-hidden rounded-[24px] border border-transparent bg-transparent shadow-none">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E0] text-[#173d12] transition hover:bg-[#dcead2] md:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={21} />
            </button>

            {/* Stepper */}
            <div className="mx-auto flex max-w-2xl items-start px-1 pb-7 pt-2 sm:px-6 md:pt-6">
              {/* ... Stepper code remains same ... */}
              {steps.map((step, index) => {
                const active = step.id === currentStep;
                const done = step.id < currentStep;
                return (
                  <div key={step.id} className="flex flex-1 items-start last:flex-none">
                    <div className="flex min-w-[54px] flex-col items-center gap-2 sm:min-w-[60px]">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${active ? "border-2 border-[#C5D6B5] bg-[#2f6427] text-white shadow-[0_0_0_2px_rgba(47,100,39,0.18)]" : done ? "bg-[#6B9E3E] text-white" : "bg-[#E8F0E0] text-[#1A1F14]"}`}>
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

            <div className="space-y-5 px-0 pb-8 sm:px-2">
              <ProductDeliveryAddressPicker
                variant="checkout-card"
                initialAddress={deliveryAddress}
                initialPosition={deliveryPosition}
                autoResolveInitialAddress
                emptyLabel="Select delivery address"
                onAddressChange={handleDeliveryAddressChange}
                onDone={handleDeliveryAddressDone}
              />

              <div className="flex items-start gap-2 px-1">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#4A5240]" />
                <p className="text-sm leading-6 text-[#4A5240]">
                  Please note that delivery charges may vary if the delivery address is changed.
                </p>
              </div>

              <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                <div className="rounded-[20px] border border-[#D8DDD0] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-[#3B5E2B]" />
                    <h2 className="text-lg font-extrabold text-black">Billing Details</h2>
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
                          className={`h-[46px] w-full rounded-xl border bg-[#F7F8F4] px-4 text-sm text-black outline-none transition placeholder:text-gray-400 ${
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
                        className={`min-h-[100px] w-full resize-none rounded-xl border bg-[#F7F8F4] px-4 py-3 text-sm text-black outline-none transition placeholder:text-gray-400 ${
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

              <div className="fixed inset-x-0 bottom-0 z-40 bg-[#F7F8F4]/95 px-3 py-2 shadow-[0_-10px_28px_rgba(36,54,27,0.14)] backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
                <div className="mx-auto w-full max-w-[560px]">
                  <button
                    type="button"
                    onClick={() => void handlePlaceOrder()}
                    className="group flex h-[58px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#356b27] text-base font-extrabold text-white transition hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    Continue
                    <ChevronRight size={18} className="transition group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
        className={`h-[46px] w-full rounded-xl border bg-[#F7F8F4] px-4 text-sm text-black outline-none transition placeholder:text-gray-400 ${
          error
            ? "border-[#d93025] focus:border-[#d93025] focus:ring-4 focus:ring-[#fde8e6]"
            : "border-[#D8DDD0] focus:border-[#3B5E2B] focus:ring-4 focus:ring-[#E8F0E0]"
        }`}
      />
      {error && <p className="text-xs font-semibold text-[#d93025]">{error}</p>}
    </div>
  );
}
