"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Heart,
  Home,
  LogOut,
  MapPin,
  PackageSearch,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  normalizeDeliveryAddress,
  validateProfileForm,
  type DeliveryAddress,
} from "@/lib/validation";

type ProfileSection = "profile" | "addresses";

type ProfileFormState = {
  fullName: string;
  phoneNumber: string;
  deliveryAddress: DeliveryAddress;
};

function resolveSection(value: string | null): ProfileSection {
  return value === "addresses" ? "addresses" : "profile";
}

function createProfileFormState(
  fullName = "",
  phoneNumber = "",
  deliveryAddress: Partial<DeliveryAddress> | null = null,
): ProfileFormState {
  return {
    fullName,
    phoneNumber,
    deliveryAddress: normalizeDeliveryAddress(deliveryAddress),
  };
}

export default function ProfilePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSection = resolveSection(searchParams?.get("section") ?? null);
  const { isAuthenticated, isReady, logout, updateProfile, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ProfileFormState>(createProfileFormState());

  useEffect(() => {
    if (user) {
      setForm(
        createProfileFormState(
          user.fullName,
          user.phoneNumber,
          user.deliveryAddress,
        ),
      );
    }
  }, [user]);

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
      { label: "My Wishlist", href: "/wishlist", active: false },
    ],
    [currentSection],
  );

  if (!isReady) {
    return (
      <SiteShell>
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f] shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
            Loading your account...
          </div>
        </section>
      </SiteShell>
    );
  }

  if (!user) {
    return null;
  }

  async function handleSave() {
    setFeedback(null);
    const validation = validateProfileForm(form);
    setErrors(validation.errors);

    if (!validation.data) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile(validation.data);
      setFeedback("Profile updated successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/auth");
  }

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-5 shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1d661] text-[#214f14]">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-[#58724f]">Signed in as</p>
                    <h1 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      {user.fullName}
                    </h1>
                    <p className="mt-1 text-sm text-[#58724f]">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-[#dbe8cd] bg-white shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                <div className="border-b border-[#edf2e7] px-5 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
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
                          ? "bg-[#edf5e1] text-[#214f14]"
                          : "text-[#4f6647] hover:bg-[#f7faf2]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={18} />
                    </Link>
                  ))}
                </div>

                <div className="border-t border-[#edf2e7] px-5 py-4">
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

            <div className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2e7] pb-6">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                    {currentSection === "addresses"
                      ? "Delivery Address"
                      : "Personal Information"}
                  </h2>
                  <p className="mt-2 text-sm text-[#58724f]">
                    Keep your delivery profile complete so checkout and order updates work smoothly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {feedback ? (
                <div className="mt-6 rounded-[1.3rem] border border-[#dbe8cd] bg-[#f7fbf2] p-4 text-sm text-[#244119]">
                  {feedback}
                </div>
              ) : null}

              {currentSection === "addresses" ? (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Address line 1
                      </span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.line1 ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.line1}</span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Address line 2
                      </span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">City</span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.city ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.city}</span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">State</span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.state ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.state}</span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Postal code
                      </span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.postalCode ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.postalCode}</span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Landmark
                      </span>
                      <input
                        type="text"
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Delivery notes
                      </span>
                      <textarea
                        rows={4}
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
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                    </label>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-5 text-sm text-[#58724f]">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="mt-0.5 shrink-0 text-[#214f14]" />
                      <div>
                        <p className="font-semibold text-[#163915]">Saved delivery profile</p>
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
              ) : (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Full name
                      </span>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.fullName ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.fullName}</span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Phone number
                      </span>
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phoneNumber: event.target.value,
                          }))
                        }
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {errors.phoneNumber ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">{errors.phoneNumber}</span>
                      ) : null}
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Verified email
                      </span>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full rounded-[1.2rem] border border-[#dbe8cd] bg-[#f2f6ec] px-4 py-3 text-sm text-[#58724f] outline-none"
                      />
                    </label>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#f8fbf3] p-4 text-sm text-[#58724f]">
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#214f14]" />
                      <p>
                        Your email stays tied to your verified account. Update phone and
                        delivery details here so order coordination stays accurate.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Link
                      href="/order"
                      className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 transition-colors hover:bg-[#f3f8ec]"
                    >
                      <PackageSearch size={18} className="text-[#214f14]" />
                      <p className="mt-3 text-base font-bold text-[#163915]">
                        Track Orders
                      </p>
                      <p className="mt-1 text-sm text-[#58724f]">
                        View live status updates from your account.
                      </p>
                    </Link>

                    <Link
                      href="/wishlist"
                      className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 transition-colors hover:bg-[#f3f8ec]"
                    >
                      <Heart size={18} className="text-[#214f14]" />
                      <p className="mt-3 text-base font-bold text-[#163915]">
                        Wishlist
                      </p>
                      <p className="mt-1 text-sm text-[#58724f]">
                        Pick up where you left off with saved items.
                      </p>
                    </Link>

                    <Link
                      href="/profile?section=addresses"
                      className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 transition-colors hover:bg-[#f3f8ec]"
                    >
                      <Home size={18} className="text-[#214f14]" />
                      <p className="mt-3 text-base font-bold text-[#163915]">
                        Delivery Address
                      </p>
                      <p className="mt-1 text-sm text-[#58724f]">
                        Complete your address before checkout.
                      </p>
                    </Link>
                  </div>

                  <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#f8fbf3] p-4 text-sm text-[#58724f]">
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="mt-0.5 shrink-0 text-[#214f14]" />
                      <p>
                        Your saved phone and delivery address are used for dispatch
                        coordination, payment follow-up, and on-route updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
