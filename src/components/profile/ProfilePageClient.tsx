"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
  Home,
  LogOut,
  MapPin,
  PackageSearch,
  UserRound,
  X,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import ProductDeliveryAddressPicker, {
  DELIVERY_ADDRESS_EVENT,
} from "@/components/ProductDeliveryAddressPicker";
import {
  normalizeBillingDetailsDraft,
  type BillingDetailsDraft,
} from "@/lib/checkoutSession";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import {
  isValidPhoneNumber,
  isValidPostalCode,
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";

type ProfileSection = "profile" | "addresses" | "billing";

type ProfileFormState = {
  fullName: string;
  phoneNumber: string;
  deliveryAddress: DeliveryAddress;
  billingDetails: BillingDetailsDraft;
};

function resolveSection(value: string | null): ProfileSection {
  if (value === "billing") {
    return "billing";
  }

  return value === "addresses" ? "addresses" : "profile";
}

function createProfileFormState(
  fullName = "",
  phoneNumber = "",
  deliveryAddress: Partial<DeliveryAddress> | null = null,
  billingDetails: Partial<BillingDetailsDraft> | null = null,
): ProfileFormState {
  return {
    fullName,
    phoneNumber,
    deliveryAddress: normalizeDeliveryAddress(deliveryAddress),
    billingDetails: normalizeBillingDetailsDraft(billingDetails),
  };
}

export default function ProfilePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedSection = searchParams?.get("section") ?? null;
  const currentSection = resolveSection(requestedSection);
  const isMobileOverview = !requestedSection;
  const { isAuthenticated, isReady, logout, updateProfile, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ProfileFormState>(createProfileFormState());
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm(
        createProfileFormState(
          user.fullName,
          user.phoneNumber,
          user.deliveryAddress,
          user.billingDetails,
        ),
      );
    }
  }, [user]);

  useEffect(() => {
    function handleDeliveryAddressUpdate(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const nextDeliveryAddress =
        event.detail?.deliveryAddress &&
        typeof event.detail.deliveryAddress === "object"
          ? normalizeDeliveryAddress(event.detail.deliveryAddress)
          : null;

      if (!nextDeliveryAddress) {
        return;
      }

      setForm((current) => ({
        ...current,
        deliveryAddress: nextDeliveryAddress,
      }));
    }

    window.addEventListener(DELIVERY_ADDRESS_EVENT, handleDeliveryAddressUpdate);

    return () => {
      window.removeEventListener(
        DELIVERY_ADDRESS_EVENT,
        handleDeliveryAddressUpdate,
      );
    };
  }, []);

  function resetFormFromUser() {
    if (!user) {
      return;
    }

    setForm(
      createProfileFormState(
        user.fullName,
        user.phoneNumber,
        user.deliveryAddress,
        user.billingDetails,
      ),
    );
  }

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/auth?next=/profile");
    }
  }, [isAuthenticated, isReady, router]);

  const sidebarItems = useMemo(
    () => [
      {
        label: "Profile Information",
        href: "/profile",
        active: currentSection === "profile",
      },
      { label: "My Orders", href: "/order", active: false },
      {
        label: "Delivery Address",
        href: "/profile?section=addresses",
        active: currentSection === "addresses",
      },
      {
        label: "Billing Details",
        href: "/profile?section=billing",
        active: currentSection === "billing",
      },
      { label: "My Wishlist", href: "/wishlist", active: false },
    ],
    [currentSection],
  );

  if (!isReady) {
    return (
      <SiteShell>
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
            Loading your account...
          </div>
        </section>
      </SiteShell>
    );
  }

  if (!user) {
    return null;
  }

  const profileUser = user;

  async function handleSaveProfileField() {
    setFeedback(null);
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (form.phoneNumber.trim() && !isValidPhoneNumber(form.phoneNumber)) {
      nextErrors.phoneNumber = "Enter a valid phone number.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        deliveryAddress: normalizeDeliveryAddress(user?.deliveryAddress),
        billingDetails: normalizeBillingDetailsDraft(user?.billingDetails),
      });
      setActiveField(null);
      setFeedback("Profile updated successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAddressField() {
    setFeedback(null);
    const normalizedDeliveryAddress = normalizeDeliveryAddress(form.deliveryAddress);
    const hasAddressValue = Object.values(normalizedDeliveryAddress).some(Boolean);
    const nextErrors: Record<string, string> = {};

    if (hasAddressValue) {
      if (!normalizedDeliveryAddress.line1) {
        nextErrors.line1 = "Address line 1 is required.";
      }

      if (!normalizedDeliveryAddress.city) {
        nextErrors.city = "City is required.";
      }

      if (!normalizedDeliveryAddress.state) {
        nextErrors.state = "State is required.";
      }

      if (!normalizedDeliveryAddress.postalCode) {
        nextErrors.postalCode = "Postal code is required.";
      } else if (!isValidPostalCode(normalizedDeliveryAddress.postalCode)) {
        nextErrors.postalCode = "Enter a valid postal code.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        fullName: user?.fullName || form.fullName.trim(),
        phoneNumber: user?.phoneNumber || form.phoneNumber.trim(),
        deliveryAddress: normalizedDeliveryAddress,
        billingDetails: normalizeBillingDetailsDraft(user?.billingDetails),
      });
      setActiveField(null);
      setFeedback("Delivery address updated successfully.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to update delivery address.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveBillingField() {
    setFeedback(null);
    const normalizedBillingDetails = normalizeBillingDetailsDraft(form.billingDetails);
    const nextErrors: Record<string, string> = {};

    if (
      normalizedBillingDetails.contact &&
      !isValidPhoneNumber(normalizedBillingDetails.contact)
    ) {
      nextErrors.billingContact = "Enter a valid phone number.";
    }

    if (
      normalizedBillingDetails.gstin &&
      normalizedBillingDetails.gstin.length !== 15
    ) {
      nextErrors.billingGstin = "GST number must be 15 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        fullName: user?.fullName || form.fullName.trim(),
        phoneNumber: user?.phoneNumber || form.phoneNumber.trim(),
        deliveryAddress: normalizeDeliveryAddress(user?.deliveryAddress),
        billingDetails: normalizedBillingDetails,
      });
      setActiveField(null);
      setFeedback("Billing details updated successfully.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to update billing details.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startFieldEdit(field: string) {
    setFeedback(null);
    setErrors({});
    setActiveField(field);
  }

  function cancelFieldEdit() {
    setFeedback(null);
    setErrors({});
    setActiveField(null);
    resetFormFromUser();
  }

  function handleDeliveryAddressChange(
    address: string,
    _position?: { lat: number; lng: number },
    deliveryAddress?: DeliveryAddress,
  ) {
    setFeedback(null);
    setForm((current) => ({
      ...current,
      deliveryAddress: deliveryAddress
        ? normalizeDeliveryAddress(deliveryAddress)
        : {
            ...current.deliveryAddress,
            formattedAddress: String(address || "").trim(),
          },
    }));
  }

  async function handleDeliveryAddressDone(
    _address: string,
    _position: { lat: number; lng: number },
    deliveryAddress: DeliveryAddress,
  ) {
    const normalizedDeliveryAddress = normalizeDeliveryAddress(deliveryAddress);
    setForm((current) => ({
      ...current,
      deliveryAddress: normalizedDeliveryAddress,
    }));
    setFeedback(null);
    setIsSaving(true);

    try {
      await updateProfile({
        fullName: user?.fullName || form.fullName.trim(),
        phoneNumber: user?.phoneNumber || form.phoneNumber.trim(),
        deliveryAddress: normalizedDeliveryAddress,
        billingDetails: normalizeBillingDetailsDraft(user?.billingDetails),
      });
      setFeedback("Delivery address updated successfully.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to update delivery address.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/auth");
  }

  const sectionTitle =
    currentSection === "addresses"
      ? "Delivery Address"
      : currentSection === "billing"
        ? "Billing Details"
        : "Personal Information";

  function renderSectionPanel(className = "p-6 md:p-8 shadow-[0_22px_60px_rgba(33,79,20,0.08)]") {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl text-[#163915]">
              {sectionTitle}
            </h2>
          </div>
        </div>

        {feedback ? (
          <div className="mt-6 rounded-[1.3rem] border border-gray-300 bg-[#f7fbf2] p-4 text-sm text-[#244119]">
            {feedback}
          </div>
        ) : null}

        {currentSection === "addresses" ? (
          <div className="mt-6 space-y-5">
            <ProductDeliveryAddressPicker
              variant="checkout-card"
              initialAddress={formatDeliveryAddress(form.deliveryAddress)}
              persistToProfile={false}
              onAddressChange={handleDeliveryAddressChange}
              onDone={handleDeliveryAddressDone}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span className="text-gray-500">Address line 1</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("line1")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "line1"}
                  value={form.deliveryAddress.line1}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        line1: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {errors.line1 ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.line1}</span>
                ) : null}
                {activeField === "line1" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelFieldEdit}
                      className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAddressField}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span className="text-gray-500">Address line 2</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("line2")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "line2"}
                  value={form.deliveryAddress.line2}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        line2: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {activeField === "line2" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span className="text-gray-500">City</span><button type="button" onClick={() => startFieldEdit("city")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="text"
                  disabled={activeField !== "city"}
                  value={form.deliveryAddress.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        city: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {errors.city ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.city}</span>
                ) : null}
                {activeField === "city" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span className="text-gray-500">State</span><button type="button" onClick={() => startFieldEdit("state")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="text"
                  disabled={activeField !== "state"}
                  value={form.deliveryAddress.state}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        state: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {errors.state ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.state}</span>
                ) : null}
                {activeField === "state" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span className="text-gray-500">Postal code</span><button type="button" onClick={() => startFieldEdit("postalCode")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="text"
                  disabled={activeField !== "postalCode"}
                  value={form.deliveryAddress.postalCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        postalCode: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {errors.postalCode ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.postalCode}</span>
                ) : null}
                {activeField === "postalCode" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span className="text-gray-500">Landmark</span><button type="button" onClick={() => startFieldEdit("landmark")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="text"
                  disabled={activeField !== "landmark"}
                  value={form.deliveryAddress.landmark}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        landmark: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {activeField === "landmark" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span className="text-gray-500">Delivery notes</span><button type="button" onClick={() => startFieldEdit("notes")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <textarea
                  rows={4}
                  disabled={activeField !== "notes"}
                  value={form.deliveryAddress.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryAddress: {
                        ...current.deliveryAddress,
                        notes: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500 md:rounded-[0.5rem]"
                />
                {activeField === "notes" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveAddressField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>
            </div>

            <div className="rounded-[0.5rem] border border-gray-200 bg-white p-5 text-sm text-gray-700 md:rounded-[0.5rem]">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gray-700" />
                <div>
                  <p className="font-semibold text-gray-700">Saved delivery profile</p>
                  <p className="mt-2 leading-6">
                    {[
                      form.deliveryAddress.line1,
                      form.deliveryAddress.line2,
                      form.deliveryAddress.city,
                      form.deliveryAddress.state,
                      form.deliveryAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Add your address to speed up checkout."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : currentSection === "billing" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>Personal/Business Name</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingName")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "billingName"}
                  value={form.billingDetails.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        name: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {activeField === "billingName" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </span>
                <input
                  type="email"
                  value={profileUser.email}
                  disabled
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>Phone</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingContact")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="tel"
                  disabled={activeField !== "billingContact"}
                  value={form.billingDetails.contact}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        contact: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {errors.billingContact ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.billingContact}</span>
                ) : null}
                {activeField === "billingContact" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>GST Number</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingGstin")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "billingGstin"}
                  value={form.billingDetails.gstin}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        gstin: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {errors.billingGstin ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.billingGstin}</span>
                ) : null}
                {activeField === "billingGstin" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>State</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingState")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "billingState"}
                  value={form.billingDetails.state}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        state: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {activeField === "billingState" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>City</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingCity")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <input
                  type="text"
                  disabled={activeField !== "billingCity"}
                  value={form.billingDetails.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        city: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {activeField === "billingCity" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>Address</span>
                  <button
                    type="button"
                    onClick={() => startFieldEdit("billingAddress")}
                    className="inline-flex items-center gap-1 text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                </span>
                <textarea
                  rows={4}
                  disabled={activeField !== "billingAddress"}
                  value={form.billingDetails.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingDetails: {
                        ...current.billingDetails,
                        address: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                {activeField === "billingAddress" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveBillingField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span>Full name</span><button type="button" onClick={() => startFieldEdit("fullName")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="text"
                  disabled={activeField !== "fullName"}
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-white disabled:text-gray-700"
                />
                {errors.fullName ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.fullName}</span>
                ) : null}
                {activeField === "fullName" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700"><span>Phone number</span><button type="button" onClick={() => startFieldEdit("phoneNumber")} className="inline-flex items-center gap-1 text-gray-700"><Edit3 size={14} /></button></span>
                <input
                  type="tel"
                  disabled={activeField !== "phoneNumber"}
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-white disabled:text-gray-700"
                />
                {errors.phoneNumber ? (
                  <span className="mt-2 block text-xs text-[#c54b4b]">{errors.phoneNumber}</span>
                ) : null}
                {activeField === "phoneNumber" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={cancelFieldEdit} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"><X size={14} />Cancel</button>
                    <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#214f14] px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
                  </div>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-gray-700">
                  Verified email
                </span>
                <input
                  type="email"
                  value={profileUser.email}
                  disabled
                  className="w-full rounded-[0.5rem] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/order"
                className="rounded-[1.4rem] border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <PackageSearch size={18} className="text-gray-700" />
                <p className="mt-3 text-base font-bold text-gray-700">
                  Track Orders
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  View live status updates from your account.
                </p>
              </Link>

              <Link
                href="/wishlist"
                className="rounded-[1.4rem] border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <Heart size={18} className="text-gray-700" />
                <p className="mt-3 text-base font-bold text-gray-700">
                  Wishlist
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Pick up where you left off with saved items.
                </p>
              </Link>

              <Link
                href="/profile?section=addresses"
                className="rounded-[1.4rem] border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <Home size={18} className="text-gray-700" />
                <p className="mt-3 text-sm font-semibold text-gray-700">
                  Delivery Address
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Complete your address before checkout.
                </p>
              </Link>

              <Link
                href="/profile?section=billing"
                className="rounded-[1.4rem] border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <Home size={18} className="text-gray-700" />
                <p className="mt-3 text-sm font-semibold text-gray-700">
                  Billing Details
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Manage invoice and GST information.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <SiteShell hideMobileHeader>
      <section className="px-0 py-0 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="md:hidden">
            {isMobileOverview ? (
              <div className="overflow-hidden rounded-b-[2rem] bg-[#0f2c0d] text-white shadow-[0_22px_60px_rgba(18,46,14,0.22)]">
                <div className="relative p-5 pb-7">
                  <div className="absolute -right-6 top-5 h-16 w-16 rounded-[1.6rem] bg-[#335c23]/70" />
                  <div className="absolute left-6 top-16 h-8 w-8 rounded-br-[1.4rem] rounded-tl-[1.4rem] bg-[#436d2f]/70" />
                  <div className="absolute bottom-5 right-8 h-10 w-10 rounded-t-full bg-[#2b4f1c]/80" />
                  <p className="relative text-xl font-semibold">Profile</p>

                  <div className="relative mt-10 flex flex-col items-center text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                      <UserRound size={42} />
                    </div>
                    <p className="mt-5 text-[1.45rem] font-semibold leading-tight">
                      {profileUser.fullName}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      {profileUser.phoneNumber || profileUser.email}
                    </p>
                  </div>
                </div>

                <div className="rounded-t-[1.8rem] bg-white px-4 pb-24 pt-5 text-[#1d1d1d]">
                  <p className="px-2 text-sm font-bold text-[#3e3e3e]">
                    Account Overview
                  </p>

                  <div className="mt-3 overflow-hidden rounded-[1.3rem]">
                    <Link href="/profile?section=profile" className="flex items-center justify-between px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f3] text-[#8a8a8a]">
                          <UserRound size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-gray-700">My Profile</span>
                      </div>
                      <ChevronRight size={18} className="text-[#737373]" />
                    </Link>

                    <Link href="/order" className="flex items-center justify-between px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f3] text-[#8a8a8a]">
                          <PackageSearch size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-gray-700">My Orders</span>
                      </div>
                      <ChevronRight size={18} className="text-[#737373]" />
                    </Link>

                    <Link href="/profile?section=addresses" className="flex items-center justify-between px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f3] text-[#8a8a8a]">
                          <MapPin size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-gray-700">Delivery Address</span>
                      </div>
                      <ChevronRight size={18} className="text-[#737373]" />
                    </Link>

                    <Link href="/profile?section=billing" className="flex items-center justify-between px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f3] text-[#8a8a8a]">
                          <Home size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-gray-700">Billing Details</span>
                      </div>
                      <ChevronRight size={18} className="text-[#737373]" />
                    </Link>

                    <Link href="/wishlist" className="flex items-center justify-between px-3 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f3] text-[#8a8a8a]">
                          <Heart size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-gray-700">My Wishlist</span>
                      </div>
                      <ChevronRight size={18} className="text-[#737373]" />
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between px-3 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1f1] text-[#c54b4b]">
                          <LogOut size={17} />
                        </span>
                        <span className="text-[15px] font-medium text-[#2e2e2e]">Logout</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-b-[1.8rem] bg-white pb-24 shadow-[0_22px_60px_rgba(33,79,20,0.08)]">
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7f1] text-gray-700"
                    aria-label="Back to profile overview"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <p className="text-lg font-semibold text-[#163915]">{sectionTitle}</p>
                    <p className="text-xs text-[#6b8b58]">Manage your account details</p>
                  </div>
                </div>
                {renderSectionPanel("px-8 pb-4 pt-5")}
              </div>
            )}
          </div>

          <div className="hidden gap-6 md:grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4 shadow-[0_22px_60px_rgba(33,79,20,0.08)]">
              <div className=" p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1d661] text-gray-700">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <h1 className="text-2xl  text-[#163915]">
                      {profileUser.fullName}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">{profileUser.email}</p>
                    {profileUser.isVip ? (
                      <span className="mt-3 inline-flex items-center rounded-full bg-[#f5edc4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b5b08]">
                        VIP Customer
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden ">
                <div className="border-b border-gray-200 px-5 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
                    Account
                  </p>
                </div>

                <div className="flex flex-col">
                  {sidebarItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors ${
                        item.active
                          ? "bg-[#207958] text-gray-100"
                          : "text-gray-700 hover:bg-[#f7faf2]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={18} />
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 text-sm font-semibold text-[#c54b4b]"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </aside>

            {renderSectionPanel()}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
