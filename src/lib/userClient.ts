import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  onSnapshot,
  limit as _limit,
} from "firebase/firestore";
import { getFirebaseDb, serverTimestamp } from "./firebaseClient";

type UserDoc = {
  name?: string;
  email?: string;
  role?: "student" | "mentor" | "admin";
  joinedAt?: any;
};

export async function createUserDoc(user: { uid: string; email?: string; name?: string; role?: UserDoc["role"] }) {
  const db = getFirebaseDb();
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    name: user.name || "",
    email: user.email || "",
    role: user.role || "student",
    joinedAt: serverTimestamp(),
  });
}

export async function getUsers(limit = 200) {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "users"), orderBy("joinedAt", "desc") as any, _limit(limit) as any);
    const snap = await getDocs(q as any);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.warn("Ordered users query failed, falling back to un-ordered read:", err);
    const snap = await getDocs(collection(db, "users"));
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    (items as any).__queryFallbackWarning = String(err);
    return items;
  }
}

export function subscribeUsers(
  onChange: (items: (UserDoc & { id: string })[]) => void,
  onError?: (err: unknown) => void,
  limit = 200
) {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "users"), orderBy("joinedAt", "desc") as any, _limit(limit) as any) as any;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        onChange(items);
      },
      (err) => {
        console.warn("onSnapshot for users failed:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("subscribeUsers query setup failed, falling back to single read:", err);
    getUsers(limit).then(onChange).catch((e) => onError && onError(e));
    return () => undefined;
  }
}

export async function updateUserRole(uid: string, role: UserDoc["role"]) {
  const db = getFirebaseDb();
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role });
}

export async function deleteUserDoc(uid: string) {
  const db = getFirebaseDb();
  const ref = doc(db, "users", uid);
  await deleteDoc(ref);
}

export async function updateUserDoc(uid: string, data: Partial<UserDoc>) {
  const db = getFirebaseDb();
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data as any);
}
