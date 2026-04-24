"use client";

import { useSyncExternalStore } from "react";

export type ProfileAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  primary: boolean;
};

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: ProfileAddress[];
};

const STORAGE_KEY = "ggn-profile";
const PROFILE_EVENT = "ggn-profile-change";
const EMPTY_SNAPSHOT = "";

const defaultProfileData: ProfileData = {
  firstName: "Junak",
  lastName: "Das",
  email: "junakdas93@gmail.com",
  phone: "+91 98765 43210",
  addresses: [
    {
      id: "home",
      label: "Home",
      recipient: "Junak Das",
      phone: "+91 98765 43210",
      address: "House 18, Hajo Road, Guwahati, Assam 781001",
      primary: true,
    },
    {
      id: "work",
      label: "Work",
      recipient: "Junak Das",
      phone: "+91 98765 43210",
      address: "Beltola Main Road, Guwahati, Assam 781028",
      primary: false,
    },
  ],
};

function sanitizeAddress(address: unknown): ProfileAddress | null {
  if (!address || typeof address !== "object") {
    return null;
  }

  const candidate = address as Partial<ProfileAddress>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.recipient !== "string" ||
    typeof candidate.phone !== "string" ||
    typeof candidate.address !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    label: candidate.label,
    recipient: candidate.recipient,
    phone: candidate.phone,
    address: candidate.address,
    primary: Boolean(candidate.primary),
  };
}

export function parseProfileData(snapshot: string): ProfileData {
  if (!snapshot) {
    return defaultProfileData;
  }

  try {
    const parsedValue = JSON.parse(snapshot) as Partial<ProfileData>;
    const addresses = Array.isArray(parsedValue.addresses)
      ? parsedValue.addresses.flatMap((address) => {
          const sanitizedAddress = sanitizeAddress(address);
          return sanitizedAddress ? [sanitizedAddress] : [];
        })
      : defaultProfileData.addresses;

    return {
      firstName:
        typeof parsedValue.firstName === "string"
          ? parsedValue.firstName
          : defaultProfileData.firstName,
      lastName:
        typeof parsedValue.lastName === "string"
          ? parsedValue.lastName
          : defaultProfileData.lastName,
      email:
        typeof parsedValue.email === "string"
          ? parsedValue.email
          : defaultProfileData.email,
      phone:
        typeof parsedValue.phone === "string"
          ? parsedValue.phone
          : defaultProfileData.phone,
      addresses: addresses.length ? addresses : defaultProfileData.addresses,
    };
  } catch {
    return defaultProfileData;
  }
}

export function readProfileData() {
  if (typeof window === "undefined") {
    return defaultProfileData;
  }

  return parseProfileData(window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT);
}

export function writeProfileData(data: ProfileData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function updateProfileData(patch: Partial<ProfileData>) {
  const currentProfileData = readProfileData();

  writeProfileData({
    ...currentProfileData,
    ...patch,
  });
}

export function upsertProfileAddress(address: ProfileAddress) {
  const currentProfileData = readProfileData();
  const existingAddresses = currentProfileData.addresses.filter(
    (item) => item.id !== address.id,
  );

  const nextAddress = address.primary
    ? { ...address, primary: true }
    : { ...address, primary: existingAddresses.length === 0 };

  const nextAddresses = [...existingAddresses, nextAddress].map((item) =>
    nextAddress.primary && item.id !== nextAddress.id
      ? { ...item, primary: false }
      : item,
  );

  writeProfileData({
    ...currentProfileData,
    addresses: nextAddresses,
  });
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(PROFILE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(PROFILE_EVENT, handleChange);
  };
}

function getProfileSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function useProfileData() {
  const profileSnapshot = useSyncExternalStore(
    subscribe,
    getProfileSnapshot,
    getServerSnapshot,
  );

  return parseProfileData(profileSnapshot);
}
