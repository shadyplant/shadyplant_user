"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };

  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value || String(value).startsWith("replace-with-"))
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(
      `Firebase web auth is not configured. Missing: ${missingKeys.join(", ")}.`,
    );
  }

  return config;
}

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length
    ? getApp()
    : initializeApp(getFirebaseConfig());

  return firebaseApp;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
