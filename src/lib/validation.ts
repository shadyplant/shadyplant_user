export type DeliveryAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  landmark: string;
  notes: string;
};

export type ValidationResult<T> = {
  data: T | null;
  errors: Record<string, string>;
};

export const EMPTY_DELIVERY_ADDRESS: DeliveryAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  landmark: "",
  notes: "",
};

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhoneNumber(phoneNumber: string) {
  return /^[0-9+\-()\s]{7,20}$/.test(phoneNumber.trim());
}

export function isValidPostalCode(postalCode: string) {
  return /^[A-Za-z0-9\s-]{4,12}$/.test(postalCode.trim());
}

export function validatePasswordStrength(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function isValidIdentifier(identifier: string) {
  return (
    isValidEmail(identifier) ||
    isValidPhoneNumber(identifier)
  );
}

export function normalizeDeliveryAddress(
  deliveryAddress: Partial<DeliveryAddress> | null | undefined,
): DeliveryAddress {
  return {
    line1: String(deliveryAddress?.line1 || "").trim(),
    line2: String(deliveryAddress?.line2 || "").trim(),
    city: String(deliveryAddress?.city || "").trim(),
    state: String(deliveryAddress?.state || "").trim(),
    postalCode: String(deliveryAddress?.postalCode || "").trim(),
    landmark: String(deliveryAddress?.landmark || "").trim(),
    notes: String(deliveryAddress?.notes || "").trim(),
  };
}

export function hasCompleteDeliveryAddress(deliveryAddress: DeliveryAddress) {
  return Boolean(
    deliveryAddress.line1 &&
      deliveryAddress.city &&
      deliveryAddress.state &&
      deliveryAddress.postalCode &&
      isValidPostalCode(deliveryAddress.postalCode),
  );
}

export function validateRegistrationForm(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  const errors: Record<string, string> = {};

  if (!input.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!isValidEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isValidPhoneNumber(input.phoneNumber)) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (!validatePasswordStrength(input.password)) {
    errors.password =
      "Use 8+ characters with uppercase, lowercase, number, and symbol.";
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          phoneNumber: input.phoneNumber.trim(),
          password: input.password,
        },
    errors,
  } satisfies ValidationResult<{
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }>;
}

export function validateLoginForm(input: {
  identifier: string;
  password: string;
}) {
  const errors: Record<string, string> = {};

  if (!isValidIdentifier(input.identifier)) {
    errors.identifier = "Enter a valid email address or phone number.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          identifier: input.identifier.trim(),
          password: input.password,
        },
    errors,
  } satisfies ValidationResult<{
    identifier: string;
    password: string;
  }>;
}

export function validateOtpForm(input: {
  identifier: string;
  otp: string;
}) {
  const errors: Record<string, string> = {};

  if (!isValidIdentifier(input.identifier)) {
    errors.identifier = "Enter a valid email address or phone number.";
  }

  if (!/^\d{6}$/.test(input.otp.trim())) {
    errors.otp = "Enter the 6-digit OTP.";
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          identifier: input.identifier.trim(),
          otp: input.otp.trim(),
        },
    errors,
  } satisfies ValidationResult<{
    identifier: string;
    otp: string;
  }>;
}

export function validateResetPasswordForm(input: {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const errors: Record<string, string> = {};

  if (!input.resetToken.trim()) {
    errors.resetToken = "Verify the OTP before setting a new password.";
  }

  if (!validatePasswordStrength(input.newPassword)) {
    errors.newPassword =
      "Use 8+ characters with uppercase, lowercase, number, and symbol.";
  }

  if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          resetToken: input.resetToken.trim(),
          newPassword: input.newPassword,
          confirmPassword: input.confirmPassword,
        },
    errors,
  } satisfies ValidationResult<{
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }>;
}

export function validateProfileForm(input: {
  fullName: string;
  phoneNumber: string;
  deliveryAddress: Partial<DeliveryAddress>;
}) {
  const errors: Record<string, string> = {};
  const deliveryAddress = normalizeDeliveryAddress(input.deliveryAddress);

  if (!input.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (input.phoneNumber.trim() && !isValidPhoneNumber(input.phoneNumber)) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  const hasAddressValue = Object.values(deliveryAddress).some(Boolean);
  if (hasAddressValue) {
    if (!deliveryAddress.line1) {
      errors.line1 = "Address line 1 is required.";
    }

    if (!deliveryAddress.city) {
      errors.city = "City is required.";
    }

    if (!deliveryAddress.state) {
      errors.state = "State is required.";
    }

    if (!deliveryAddress.postalCode) {
      errors.postalCode = "Postal code is required.";
    } else if (!isValidPostalCode(deliveryAddress.postalCode)) {
      errors.postalCode = "Enter a valid postal code.";
    }
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          fullName: input.fullName.trim(),
          phoneNumber: input.phoneNumber.trim(),
          deliveryAddress,
        },
    errors,
  } satisfies ValidationResult<{
    fullName: string;
    phoneNumber: string;
    deliveryAddress: DeliveryAddress;
  }>;
}

export function validateCheckoutForm(input: {
  sqft: string;
  deliveryDate: string;
  whatsapp: string;
}) {
  const errors: Record<string, string> = {};
  const quantitySqft = Number(input.sqft);

  if (!Number.isFinite(quantitySqft) || quantitySqft <= 0) {
    errors.sqft = "Enter a valid quantity in square feet.";
  }

  if (!input.deliveryDate) {
    errors.deliveryDate = "Select a preferred delivery date.";
  } else {
    const deliveryDate = new Date(input.deliveryDate);
    if (Number.isNaN(deliveryDate.getTime())) {
      errors.deliveryDate = "Select a valid delivery date.";
    }
  }

  if (!isValidPhoneNumber(input.whatsapp)) {
    errors.whatsapp = "Enter a valid WhatsApp number.";
  }

  return {
    data: Object.keys(errors).length
      ? null
      : {
          quantitySqft: Math.round(quantitySqft),
          deliveryDate: input.deliveryDate,
          whatsapp: input.whatsapp.trim(),
        },
    errors,
  } satisfies ValidationResult<{
    quantitySqft: number;
    deliveryDate: string;
    whatsapp: string;
  }>;
}
