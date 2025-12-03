import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getSettings, setSettings, subscribeSettings, type AdminSettings } from "../../lib/settingsClient";

export default function Settings() {
	const [settings, setLocal] = useState<AdminSettings>({});
	const [loading, setLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const unsub = subscribeSettings(
			(s) => {
				setLocal(s || {});
				setLoading(false);
			},
			(err) => {
				toast({ title: "Failed to load settings", description: String(err), variant: "destructive" });
				setLoading(false);
			}
		);
		return () => unsub();
	}, []);

	const handleSave = async () => {
		try {
			await setSettings(settings);
			toast({ title: "Settings saved" });
		} catch (err) {
			toast({ title: "Unable to save settings", description: String(err), variant: "destructive" });
		}
	};

	return (
		<div>
			<h2 className="page-title">Settings</h2>

			<div className="card" style={{ padding: 16 }}>
				<div style={{ display: "grid", gap: 12 }}>
					<div>
						<Label>Site Title</Label>
						<Input value={settings.siteTitle || ""} onChange={(e) => setLocal((p) => ({ ...p, siteTitle: e.target.value }))} />
					</div>

					<div>
						<Label>Support Email</Label>
						<Input value={settings.supportEmail || ""} onChange={(e) => setLocal((p) => ({ ...p, supportEmail: e.target.value }))} />
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<Switch checked={!!settings.allowSelfSignup} onCheckedChange={(v) => setLocal((p) => ({ ...p, allowSelfSignup: !!v }))} />
						<Label>Allow self signups</Label>
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<Switch checked={!!settings.mentorAutoApprove} onCheckedChange={(v) => setLocal((p) => ({ ...p, mentorAutoApprove: !!v }))} />
						<Label>Auto-approve mentors</Label>
					</div>

					<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
						<Button onClick={handleSave} disabled={loading}>Save</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
