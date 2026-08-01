export type NativeLocationPayload = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  bearing: number;
  timestamp: number;
};

type NativeBridge = {
  share?: (title: string, text: string) => void;
  requestLocation?: () => void;
  requestPushToken?: () => void;
  download?: (url: string, fileName?: string) => void;
};

declare global {
  interface Window {
    ShadyPlantNative?: NativeBridge;
    APP?: unknown;
    NativeApp?: unknown;
  }

  interface WindowEventMap {
    "native-location": CustomEvent<NativeLocationPayload>;
    "native-location-error": CustomEvent<{ error?: string }>;
  }
}

function getNativeBridge() {
  if (typeof window === "undefined") {
    return null;
  }

  const bridge = window.ShadyPlantNative;

  if (!bridge) {
    return null;
  }

  return bridge;
}

function logNativeDownload(message: string, details?: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof details === "undefined") {
    console.info(`[NativeDownload] ${message}`);
    return;
  }

  console.info(`[NativeDownload] ${message}`, details);
}

export function isShadyPlantApp() {
  return Boolean(getNativeBridge());
}

export function shareFromApp(title: string, text: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const bridge = getNativeBridge();
  const safeTitle = String(title || "").trim();
  const safeText = String(text || "").trim();

  if (bridge?.share) {
    bridge.share(safeTitle, safeText);
    return true;
  }

  return false;
}

export function requestAppLocation(
  onSuccess: (data: NativeLocationPayload) => void,
  onError: (message: string) => void,
) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanup = () => {
    window.removeEventListener("native-location", handleSuccess as EventListener);
    window.removeEventListener(
      "native-location-error",
      handleError as EventListener,
    );
  };

  const handleSuccess = (event: Event) => {
    const detail = (event as CustomEvent<NativeLocationPayload>).detail;

    if (
      !detail ||
      !Number.isFinite(Number(detail.latitude)) ||
      !Number.isFinite(Number(detail.longitude))
    ) {
      cleanup();
      onError("invalid_location_payload");
      return;
    }

    cleanup();
    onSuccess(detail);
  };

  const handleError = (event: Event) => {
    const detail = (event as CustomEvent<{ error?: string }>).detail;
    cleanup();
    onError(detail?.error || "location_error");
  };

  window.addEventListener("native-location", handleSuccess as EventListener);
  window.addEventListener(
    "native-location-error",
    handleError as EventListener,
  );

  const bridge = getNativeBridge();

  if (bridge?.requestLocation) {
    bridge.requestLocation();
    return;
  }

  cleanup();

  if (!navigator.geolocation) {
    onError("native_bridge_unavailable");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? 0,
        speed: position.coords.speed ?? 0,
        bearing: position.coords.heading ?? 0,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      onError(error.message || "location_error");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

export function canUseNativeShare() {
  return Boolean(getNativeBridge()?.share);
}

export function shareViaNativeApp(payload: {
  title?: string;
  text?: string;
  url?: string;
}) {
  const shareText = String(payload.text || payload.url || "").trim();
  return shareFromApp(payload.title || "", shareText);
}

export function downloadFromApp(url: string, fileName?: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const bridge = getNativeBridge();
  const safeUrl = String(url || "").trim();
  const safeFileName = String(fileName || "").trim();

  logNativeDownload("downloadFromApp called", {
    hasBridge: Boolean(bridge?.download),
    urlPrefix: safeUrl.slice(0, 48),
    fileName: safeFileName || null,
  });

  if (!bridge?.download || !safeUrl) {
    logNativeDownload("downloadFromApp skipped", {
      reason: !bridge?.download ? "bridge-missing" : "empty-url",
    });
    return false;
  }

  try {
    bridge.download(safeUrl, safeFileName || undefined);
    logNativeDownload("downloadFromApp succeeded");
    return true;
  } catch {
    logNativeDownload("downloadFromApp failed", {
      reason: "bridge-threw",
    });
    return false;
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "").trim();
      if (!result) {
        reject(new Error("empty_blob_result"));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(reader.error || new Error("blob_read_failed"));
    };

    reader.readAsDataURL(blob);
  });
}

export async function downloadBlobFromApp(
  blob: Blob,
  fileName?: string,
) {
  if (typeof window === "undefined") {
    return false;
  }

  const bridge = getNativeBridge();

  if (!bridge?.download || !blob) {
    logNativeDownload("downloadBlobFromApp skipped", {
      reason: !bridge?.download ? "bridge-missing" : "blob-missing",
    });
    return false;
  }

  try {
    logNativeDownload("downloadBlobFromApp converting blob", {
      size: blob.size,
      type: blob.type || "application/octet-stream",
      fileName: String(fileName || "").trim() || null,
    });
    const dataUrl = await blobToDataUrl(blob);
    logNativeDownload("downloadBlobFromApp converted to data url", {
      prefix: dataUrl.slice(0, 48),
      length: dataUrl.length,
    });
    bridge.download(dataUrl, String(fileName || "").trim() || undefined);
    logNativeDownload("downloadBlobFromApp succeeded");
    return true;
  } catch {
    logNativeDownload("downloadBlobFromApp failed", {
      reason: "convert-or-bridge-failed",
    });
    return false;
  }
}
