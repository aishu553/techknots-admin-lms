import React, { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseApp, getFirebaseDb } from "@/lib/firebaseClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, signOut } from "firebase/auth";
import { ref as storageRef, getStorage, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { updateUserDoc } from "@/lib/userClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const auth = getFirebaseAuth();
  const app = getFirebaseApp();
  const db = getFirebaseDb();
  const storage = getStorage(app);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setName(user.displayName || "");
    setEmail(user.email || "");
    setPhotoURL(user.photoURL || null);

    // load additional fields from Firestore
    (async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef as any);
        if (snap.exists()) {
          const data = snap.data() as any;
          setMobile(data.mobile || "");
          setLocation(data.location || "");
        }
      } catch (err) {
        console.warn("Failed to load user doc", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth, db]);

  // Upload to storage, update auth, reload and update UI + Firestore
  const handleUpload = async (file?: File) => {
    const user = auth.currentUser;
    if (!user || !file) return null;

    const path = `avatars/${user.uid}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);

    // upload
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);

    // update auth profile
    await updateProfile(user, { photoURL: url });

    // reload auth to get fresh values
    await user.reload();

    // update firestore user doc as well
    try {
      await updateUserDoc(user.uid, { photoURL: url });
    } catch (err) {
      // non-fatal
      console.warn("Failed updating user doc with photoURL", err);
    }

    // update UI state (read from auth.currentUser)
    const refreshed = auth.currentUser;
    const finalUrl = refreshed?.photoURL ?? url;
    setPhotoURL(finalUrl);

    // notify other parts of the app (AdminLayout) to refresh
    window.dispatchEvent(new CustomEvent("auth-profile-updated"));

    return finalUrl;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleUpload(file);
      setPhotoURL(url);
      toast({ title: "Profile image updated" });
    } catch (err) {
      toast({
        title: "Unable to upload image",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      // update auth profile (displayName + photo)
      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL || undefined,
      });

      // reload to ensure auth is fresh
      await user.reload();

      // update Firestore user doc
      await updateUserDoc(user.uid, { name, mobile, location, email, photoURL });

      // notify layout/other components
      window.dispatchEvent(new CustomEvent("auth-profile-updated"));

      toast({ title: "Profile updated" });
    } catch (err) {
      toast({
        title: "Unable to save profile",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      toast({
        title: "Unable to logout",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <h2 className="page-title">Profile</h2>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar className="h-20 w-20"> {/* explicit size so image shows */}
            {photoURL ? <AvatarImage src={photoURL} /> : <AvatarFallback>{name ? name[0] : "A"}</AvatarFallback>}
          </Avatar>

          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
            <div style={{ color: "var(--muted-foreground)" }}>Change profile image</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Mobile number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>

          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>

            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
