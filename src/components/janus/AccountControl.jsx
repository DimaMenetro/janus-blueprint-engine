import { useEffect } from "react";
import { ShieldCheck, User } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard } from "@/components/ui/LiquidGlass";
import { accountView, switchAccount, completeSwitch } from "@/lib/janus/operatorAccess";
import AccountPanel from "@/components/janus/AccountPanel";

// Persistent account control of the shell: identity, role, sign out, switch account. Uses AuthContext as it is.
export default function AccountControl() {
  const auth = useAuth();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const account = accountView(auth);

  // The return from "Switch account": continue into the normal sign-in flow.
  useEffect(() => { completeSwitch(auth); }, [auth.isAuthenticated, auth.isLoadingAuth, auth.isLoadingPublicSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  const Icon = account.operator ? ShieldCheck : User;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Account: ${account.identity}, ${account.roleLabel}`}
          style={{
            width: 40, height: 40, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.45)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)"}`,
            boxShadow: `inset 0 1px 0 0 rgba(255,255,255,${isDark ? "0.06" : "0.7"})`,
          }}
        >
          <Icon style={{ width: 17, height: 17, color: account.operator ? (isDark ? "#6ee7b7" : "#047857") : (isDark ? "#94a3b8" : "#475569") }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-64 p-0 border-0 bg-transparent shadow-none">
        <div style={{ ...glassCard(t), borderRadius: 22, padding: 16, background: isDark ? "rgba(18,20,28,0.86)" : "rgba(255,255,255,0.82)" }}>
          <AccountPanel account={account} t={t} isDark={isDark}
            onSwitch={() => switchAccount(auth)} onSignOut={() => auth.logout()} onSignIn={() => auth.navigateToLogin()} />
        </div>
      </PopoverContent>
    </Popover>
  );
}