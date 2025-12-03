import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  limit as _limit,
} from "firebase/firestore";
import { getFirebaseDb, serverTimestamp } from "./firebaseClient";

type CourseDoc = {
  title: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function createCourse(data: { title: string; description?: string }) {
  const db = getFirebaseDb();
  const ref = collection(db, "courses");
  const added = await addDoc(ref as any, {
    title: data.title,
    description: data.description || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return added.id;
}

export async function updateCourse(id: string, data: Partial<CourseDoc>) {
  const db = getFirebaseDb();
  const ref = doc(db, "courses", id);
  await updateDoc(ref as any, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCourse(id: string) {
  const db = getFirebaseDb();
  const ref = doc(db, "courses", id);
  await deleteDoc(ref as any);
}

export async function getCourses(limit = 200) {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc") as any, _limit(limit) as any);
    const snap = await getDocs(q as any);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.warn("Ordered courses query failed, falling back to un-ordered read:", err);
    const snap = await getDocs(collection(db, "courses"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
}

export function subscribeCourses(onChange: (items: (CourseDoc & { id: string })[]) => void, onError?: (err: unknown) => void, limit = 200) {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc") as any, _limit(limit) as any) as any;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        onChange(items);
      },
      (err) => {
        console.warn("onSnapshot for courses failed:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("subscribeCourses query setup failed, falling back to single read:", err);
    getCourses(limit).then(onChange).catch((e) => onError && onError(e));
    return () => undefined;
  }
}
