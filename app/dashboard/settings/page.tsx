import { redirect } from "next/navigation";
import { getCurrentUserWithAccounts } from "@/modules/settings/actions";
import ProfileForm from "@/modules/settings/components/profile-form";
import EditorPreferencesForm from "@/modules/settings/components/editor-preferences-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const SettingsPage = async () => {
  const user = await getCurrentUserWithAccounts();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Settings</h1>
      <p>Manage your account and preferences.</p>

      {/* Profile section */}
      <div style={{ marginTop: "30px" }}>
        <ProfileForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }}
        />
      </div>

      {/* Theme section */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px solid gray",
          borderRadius: "8px",
        }}
      >
        <h2>Appearance</h2>
        <p>Switch between light and dark mode.</p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Editor Preferences section */}
      <div style={{ marginTop: "30px" }}>
        <EditorPreferencesForm />
      </div>
    </div>
  );
};

export default SettingsPage;
