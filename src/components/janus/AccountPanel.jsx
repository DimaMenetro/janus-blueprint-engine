import { ArrowLeftRight, LogOut, LogIn, ShieldCheck, Eye } from "lucide-react";
import { glassBtn, glassSurface } from "@/components/ui/LiquidGlass";

const action = (t, primary) => ({
  ...(primary ? glassBtn(t) : { ...glassSurface(t), borderRadius: 999, color: t.text, fontWeight: 500 }),
  minHeight: 44, width: "100%", padding: "0 14px", fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
});

// Who is signed in, their role, and the sign-out / switch actions. Presentation only.
export default function AccountPanel({ account, t, isDark, onSwitch, onSignOut, onSignIn }) {
  const Role = account.operator ? ShieldCheck : Eye;
  const tone = account.operator ? (isDark ? "#6ee7b7" : "#047857") : t.subtitle;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: t.label }}>Account</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.title, marginTop: 4, overflowWrap: "anywhere" }}>{account.identity}</div>
        {account.name && account.name !== account.identity && <div style={{ fontSize: 12, color: t.subtitle }}>{account.name}</div>}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12, fontWeight: 600, color: tone }}>
          <Role style={{ width: 13, height: 13 }} />{account.roleLabel}
        </div>
      </div>
      {!account.operator && (
        <p style={{ margin: 0, fontSize: 12, color: t.subtitle }}>
          Running, re-running and evaluating need the admin account.
        </p>
      )}
      {account.signedIn ? (
        <>
          <button onClick={onSwitch} style={action(t, true)}><ArrowLeftRight style={{ width: 14, height: 14 }} />Switch account</button>
          <button onClick={onSignOut} style={action(t, false)}><LogOut style={{ width: 14, height: 14 }} />Sign out</button>
        </>
      ) : (
        <button onClick={onSignIn} style={action(t, true)}><LogIn style={{ width: 14, height: 14 }} />Sign in</button>
      )}
    </div>
  );
}