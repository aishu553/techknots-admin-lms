import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  runTransaction,
  query,
  orderBy,
  updateDoc,
  serverTimestamp as _serverTimestamp,
  addDoc,
  limit as _limit,
  onSnapshot,
  type Query,
} from "firebase/firestore";
import { getFirebaseDb, serverTimestamp } from "./firebaseClient";

type MentorCodeDoc = {
  code: string;
  status: "unused" | "used";
  createdAt: any;
  assignedTo?: { uid: string; email?: string; name?: string };
  usedAt?: any;
};

type MentorRequestDoc = {
  email: string;
  userId: string;
  code: string;
  requestedAt: any;
  status: "pending" | "approved" | "rejected";
  name?: string;
};

export async function saveMentorCode(code: string): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, "mentorCodes", code);
  await setDoc(ref, {
    code,
    status: "unused",
    createdAt: serverTimestamp(),
  });
}

export async function listMentorCodes(limit = 25): Promise<MentorCodeDoc[]> {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "mentorCodes"), orderBy("createdAt", "desc") as any, _limit(limit) as any);
    const snap = await getDocs(q as any);
    return snap.docs.map(d => ({ ...(d.data() as any) } as MentorCodeDoc));
  } catch (err) {
    // If ordering by createdAt fails (missing index or missing field), fall back to a simple collection read
    console.warn("Ordered mentorCodes query failed, falling back to un-ordered read:", err);
    const snap = await getDocs(collection(db, "mentorCodes"));
    const items = snap.docs.map(d => ({ ...(d.data() as any) } as MentorCodeDoc));
    // attach warning metadata so callers can surface guidance to users
    (items as any).__queryFallbackWarning = String(err);
    return items;
  }
}

export async function verifyAndCreateMentorRequest(
  code: string,
  user: { uid: string; email?: string; name?: string }
): Promise<{ success: boolean; message?: string; requestId?: string }> {
  const db = getFirebaseDb();
  const codeRef = doc(db, "mentorCodes", code);

  try {
    const result = await runTransaction(db, async (tx) => {
      // Read the code doc first
      const codeSnap = await tx.get(codeRef as any);
      if (!codeSnap.exists()) {
        throw new Error("invalid_code");
      }
      const data = codeSnap.data() as MentorCodeDoc;
      if (data.status !== "unused") {
        throw new Error("code_already_used");
      }

      // Prepare a new mentorRequests doc ref with an auto-id, then perform all writes using the transaction
      const reqRef = doc(collection(db, "mentorRequests"));

      // Perform writes after all reads
      tx.update(codeRef as any, {
        status: "used",
        assignedTo: { uid: user.uid, email: user.email || null, name: user.name || null },
        usedAt: serverTimestamp(),
      });

      tx.set(reqRef as any, {
        email: user.email || "",
        userId: user.uid,
        code,
        requestedAt: serverTimestamp(),
        status: "pending",
        name: user.name || "",
      } as MentorRequestDoc);

      return { requestId: reqRef.id };
    });

    return { success: true, requestId: (result as any).requestId };
  } catch (err: any) {
    if (err?.message === "invalid_code") return { success: false, message: "Invalid mentor code" };
    if (err?.message === "code_already_used") return { success: false, message: "This code has already been used" };
    return { success: false, message: err?.message || "Unknown error" };
  }
}

export async function getMentorRequests(limit = 50): Promise<(MentorRequestDoc & { id: string })[]> {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "mentorRequests"), orderBy("requestedAt", "desc") as any, _limit(limit) as any);
    const snap = await getDocs(q as any);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.warn("Ordered mentorRequests query failed, falling back to un-ordered read:", err);
    const snap = await getDocs(collection(db, "mentorRequests"));
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    (items as any).__queryFallbackWarning = String(err);
    return items;
  }
}

export function subscribeMentorRequests(
  onChange: (items: (MentorRequestDoc & { id: string })[]) => void,
  onError?: (err: unknown) => void,
  limit = 50
): () => void {
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, "mentorRequests"), orderBy("requestedAt", "desc") as any, _limit(limit) as any) as Query;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        onChange(items);
      },
      (err) => {
        console.warn("onSnapshot for mentorRequests failed:", err);
        if (onError) onError(err);
      }
    );
    return unsub;
  } catch (err) {
    // fall back to polling a single read and notify caller via onError
    console.warn("subscribeMentorRequests query setup failed, falling back to single read:", err);
    getMentorRequests(limit).then(onChange).catch((e) => onError && onError(e));
    return () => undefined;
  }
}

export async function updateMentorRequestStatus(id: string, status: "approved" | "rejected") {
  const db = getFirebaseDb();
  const ref = doc(db, "mentorRequests", id);

  // Use a transaction to keep mentorRequests and mentorCodes in sync when approving
  await runTransaction(db, async (tx) => {
    // Read required documents first
    const reqSnap = await tx.get(ref as any);
    if (!reqSnap.exists()) {
      throw new Error("request-not-found");
    }
    const reqData = reqSnap.data() as MentorRequestDoc;

    let codeRef: any = null;
    let codeSnap: any = null;
    const assignedTo = { uid: reqData.userId, email: reqData.email || null, name: reqData.name || null };

    if (status === "approved") {
      codeRef = doc(db, "mentorCodes", reqData.code);
      codeSnap = await tx.get(codeRef as any);
    }

    // Now perform writes
    tx.update(ref as any, { status });

    if (status === "approved") {
      if (codeSnap && codeSnap.exists()) {
        tx.update(codeRef as any, {
          status: "used",
          assignedTo,
          usedAt: serverTimestamp(),
        });
      } else {
        tx.set(codeRef as any, {
          code: reqData.code,
          status: "used",
          assignedTo,
          createdAt: serverTimestamp(),
          usedAt: serverTimestamp(),
        });
      }
    }
  });
}
