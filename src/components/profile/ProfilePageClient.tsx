"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  Heart,
  Home,
  LogOut,
  MapPin,
  PackageSearch,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import {
  updateProfileData,
  upsertProfileAddress,
  useProfileData,
  type ProfileAddress,
} from "@/components/profileStore";

type ProfileSection = "profile" | "addresses";

type AddressFormState = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  primary: boolean;
};

function resolveSection(value: string | null): ProfileSection {
  return value === "addresses" ? "addresses" : "profile";
}

function createEmptyAddressForm(): AddressFormState {
  return {
    id: "",
    label: "",
    recipient: "",
    phone: "",
    address: "",
    primary: false,
  };
}

export default function ProfilePageClient() {
  const searchParams = useSearchParams();
  const currentSection = resolveSection(searchParams?.get("section") ?? null);
  const profileData = useProfileData();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressEditorTitle, setAddressEditorTitle] = useState("Add Address");
  const [profileForm, setProfileForm] = useState({
    firstName: profileData.firstName,
    lastName: profileData.lastName,
  });
  const [emailForm, setEmailForm] = useState(profileData.email);
  const [phoneForm, setPhoneForm] = useState(profileData.phone);
  const [addressForm, setAddressForm] = useState<AddressFormState>(
    createEmptyAddressForm(),
  );

  const sidebarItems = [
    {
      label: "Profile Information",
      href: "/profile",
      active: currentSection === "profile",
    },
    { label: "My Orders", href: "/order", active: false },
    {
      label: "Manage Addresses",
      href: "/profile?section=addresses",
      active: currentSection === "addresses",
    },
    { label: "My Wishlist", href: "/wishlist", active: false },
  ];

  function openAddAddressForm() {
    setAddressEditorTitle("Add Address");
    setAddressForm(createEmptyAddressForm());
    setIsEditingAddress(true);
  }

  function openEditAddressForm(address: ProfileAddress) {
    setAddressEditorTitle("Edit Address");
    setAddressForm(address);
    setIsEditingAddress(true);
  }

  function saveProfileName() {
    updateProfileData({
      firstName: profileForm.firstName.trim() || profileData.firstName,
      lastName: profileForm.lastName.trim() || profileData.lastName,
    });
    setIsEditingProfile(false);
  }

  function saveEmail() {
    updateProfileData({
      email: emailForm.trim() || profileData.email,
    });
    setIsEditingEmail(false);
  }

  function savePhone() {
    updateProfileData({
      phone: phoneForm.trim() || profileData.phone,
    });
    setIsEditingPhone(false);
  }

  function saveAddress() {
    const nextAddress: ProfileAddress = {
      id: addressForm.id || `address-${Date.now()}`,
      label: addressForm.label.trim() || "Address",
      recipient: addressForm.recipient.trim() || `${profileData.firstName} ${profileData.lastName}`,
      phone: addressForm.phone.trim() || profileData.phone,
      address: addressForm.address.trim(),
      primary: addressForm.primary,
    };

    if (!nextAddress.address) {
      return;
    }

    upsertProfileAddress(nextAddress);
    setIsEditingAddress(false);
    setAddressForm(createEmptyAddressForm());
  }

  function toggleProfileEditing() {
    if (!isEditingProfile) {
      setProfileForm({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
    }

    setIsEditingProfile((current) => !current);
  }

  function toggleEmailEditing() {
    if (!isEditingEmail) {
      setEmailForm(profileData.email);
    }

    setIsEditingEmail((current) => !current);
  }

  function togglePhoneEditing() {
    if (!isEditingPhone) {
      setPhoneForm(profileData.phone);
    }

    setIsEditingPhone((current) => !current);
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
                    <p className="text-sm text-[#58724f]">Hello,</p>
                    <h1 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      {profileData.firstName} {profileData.lastName}
                    </h1>
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
                    className="flex w-full items-center gap-3 text-sm font-semibold text-[#c54b4b]"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </aside>

            <div className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
              {currentSection === "addresses" ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2e7] pb-6">
                    <div>
                      <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                        Manage Addresses
                      </h2>
                      <p className="mt-2 text-sm text-[#58724f]">
                        Keep delivery addresses ready for faster checkout.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openAddAddressForm}
                      className="inline-flex items-center gap-2 rounded-full bg-[#214f14] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163915]"
                    >
                      <Plus size={16} />
                      Add New Address
                    </button>
                  </div>

                  {isEditingAddress ? (
                    <div className="mt-6 rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                          {addressEditorTitle}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="text-sm font-semibold text-[#214f14]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          value={addressForm.label}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          placeholder="Label (Home / Work)"
                          className="rounded-[1.1rem] border border-[#dbe8cd] bg-white px-4 py-3 text-sm text-[#163915] outline-none"
                        />
                        <input
                          type="text"
                          value={addressForm.recipient}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              recipient: event.target.value,
                            }))
                          }
                          placeholder="Recipient name"
                          className="rounded-[1.1rem] border border-[#dbe8cd] bg-white px-4 py-3 text-sm text-[#163915] outline-none"
                        />
                        <input
                          type="text"
                          value={addressForm.phone}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          placeholder="Phone number"
                          className="rounded-[1.1rem] border border-[#dbe8cd] bg-white px-4 py-3 text-sm text-[#163915] outline-none md:col-span-2"
                        />
                        <textarea
                          value={addressForm.address}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              address: event.target.value,
                            }))
                          }
                          placeholder="Full delivery address"
                          rows={4}
                          className="rounded-[1.1rem] border border-[#dbe8cd] bg-white px-4 py-3 text-sm text-[#163915] outline-none md:col-span-2"
                        />
                        <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#214f14] md:col-span-2">
                          <input
                            type="checkbox"
                            checked={addressForm.primary}
                            onChange={(event) =>
                              setAddressForm((current) => ({
                                ...current,
                                primary: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 accent-[#214f14]"
                          />
                          Make this the default address
                        </label>
                      </div>

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={saveAddress}
                          className="rounded-full bg-[#214f14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163915]"
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4">
                    {profileData.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
                              <Home size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-bold text-[#163915]">
                                  {address.label}
                                </p>
                                {address.primary ? (
                                  <span className="rounded-full bg-[#214f14] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-[#58724f]">
                                {address.recipient} • {address.phone}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openEditAddressForm(address)}
                            className="text-sm font-semibold text-[#214f14]"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="mt-4 rounded-[1.2rem] border border-[#dbe8cd] bg-white px-4 py-4 text-sm leading-6 text-[#58724f]">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="mt-1 shrink-0 text-[#214f14]" />
                            <p>{address.address}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-[#edf2e7] pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                        Personal Information
                      </h2>
                      <button
                        type="button"
                        onClick={toggleProfileEditing}
                        className="text-sm font-semibold text-[#214f14]"
                      >
                        {isEditingProfile ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={
                          isEditingProfile ? profileForm.firstName : profileData.firstName
                        }
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
                        disabled={!isEditingProfile}
                        className="rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-4 text-base text-[#163915] outline-none disabled:opacity-100"
                      />
                      <input
                        type="text"
                        value={
                          isEditingProfile ? profileForm.lastName : profileData.lastName
                        }
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
                        disabled={!isEditingProfile}
                        className="rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-4 text-base text-[#163915] outline-none disabled:opacity-100"
                      />
                    </div>

                    {isEditingProfile ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={saveProfileName}
                          className="rounded-full bg-[#214f14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163915]"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-b border-[#edf2e7] py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                        Email Address
                      </h3>
                      <button
                        type="button"
                        onClick={toggleEmailEditing}
                        className="text-sm font-semibold text-[#214f14]"
                      >
                        {isEditingEmail ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    <input
                      type="email"
                      value={isEditingEmail ? emailForm : profileData.email}
                      onChange={(event) => setEmailForm(event.target.value)}
                      disabled={!isEditingEmail}
                      className="mt-5 max-w-xl rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-4 text-base text-[#163915] outline-none disabled:opacity-100"
                    />

                    {isEditingEmail ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={saveEmail}
                          className="rounded-full bg-[#214f14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163915]"
                        >
                          Save Email
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-b border-[#edf2e7] py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                        Mobile Number
                      </h3>
                      <button
                        type="button"
                        onClick={togglePhoneEditing}
                        className="text-sm font-semibold text-[#214f14]"
                      >
                        {isEditingPhone ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={isEditingPhone ? phoneForm : profileData.phone}
                      onChange={(event) => setPhoneForm(event.target.value)}
                      disabled={!isEditingPhone}
                      className="mt-5 max-w-xl rounded-[1.2rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-4 text-base text-[#163915] outline-none disabled:opacity-100"
                    />

                    {isEditingPhone ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={savePhone}
                          className="rounded-full bg-[#214f14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163915]"
                        >
                          Save Number
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="py-6">
                    <h3 className="text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      Required Shortcuts
                    </h3>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <Link
                        href="/order"
                        className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 transition-colors hover:bg-[#f3f8ec]"
                      >
                        <PackageSearch size={18} className="text-[#214f14]" />
                        <p className="mt-3 text-base font-bold text-[#163915]">
                          Track Orders
                        </p>
                        <p className="mt-1 text-sm text-[#58724f]">
                          View delivery and order status.
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
                          Open saved favorite products.
                        </p>
                      </Link>

                      <Link
                        href="/profile?section=addresses"
                        className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 transition-colors hover:bg-[#f3f8ec]"
                      >
                        <MapPin size={18} className="text-[#214f14]" />
                        <p className="mt-3 text-base font-bold text-[#163915]">
                          Manage Addresses
                        </p>
                        <p className="mt-1 text-sm text-[#58724f]">
                          Update saved delivery locations.
                        </p>
                      </Link>
                    </div>

                    <div className="mt-5 rounded-[1.4rem] border border-[#dbe8cd] bg-[#f8fbf3] p-4 text-sm text-[#58724f]">
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="mt-0.5 shrink-0 text-[#214f14]" />
                        <p>
                          Your saved phone and address are used for delivery updates and
                          order coordination.
                        </p>
                      </div>
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
