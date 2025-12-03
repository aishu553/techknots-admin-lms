import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "./firebaseClient";

const SETTINGS_DOC_REF = doc(getFirebaseDb(), "adminSettings", "site");

export type AdminSettings = {
  siteTitle?: string;
  allowSelfSignup?: boolean;
  mentorAutoApprove?: boolean;
  supportEmail?: string;
};

export async function getSettings(): Promise<AdminSettings | null> {
  const snap = await getDoc(SETTINGS_DOC_REF as any);
  if (!snap.exists()) return null;
  return snap.data() as AdminSettings;
}

export async function setSettings(data: AdminSettings) {
  await setDoc(SETTINGS_DOC_REF as any, data, { merge: true } as any);
}

export function subscribeSettings(onChange: (s: AdminSettings | null) => void, onError?: (err: unknown) => void) {
  try {
    const unsub = onSnapshot(
      SETTINGS_DOC_REF as any,
      (snap) => {
        if (!snap.exists()) return onChange(null);
        onChange(snap.data() as AdminSettings);
      },
      (err) => onError && onError(err)
    );
    return unsub;
  } catch (err) {
    // fallback to single read
    getSettings().then(onChange).catch((e) => onError && onError(e));
    return () => undefined;
  }
}
