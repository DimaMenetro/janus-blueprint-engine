/**
 * OPERATOR ACCESS — who is signed in, and the account switch (operator UX only).
 * Uses nothing but what AuthContext already exposes: the user it read with base44.auth.me(), logout() and
 * navigateToLogin(). No token, credential or identity is kept here, and no role is decided here: the role is
 * whatever the platform returned for the signed-in user. Containment itself stays where it is enforced
 * (browserAdapter.assertOperator and the invokeJanusStage function); this only decides what the shell shows.
 */
export const SWITCH_PARAM = "janus_switch_account";
export const isOperator = (user) => user?.role === "admin";

/** What the account control shows for the current authentication state. */
export function accountView({ user, isAuthenticated }) {
  if (!isAuthenticated || !user) return { signedIn: false, identity: "Not signed in", name: null, role: null, roleLabel: "View only", operator: false };
  const operator = isOperator(user);
  return { signedIn: true, identity: user.email || user.full_name || "Signed in", name: user.full_name || null,
    role: user.role || "user", roleLabel: operator ? "Admin" : "User · view only", operator };
}

const withMarker = (href) => { const url = new URL(href); url.searchParams.set(SWITCH_PARAM, "1"); return url.toString(); };
/** Whether this address is the return from a sign-out that was asked to continue into sign-in, and the address without the mark. */
export function readSwitchMarker(href) {
  const url = new URL(href);
  const requested = url.searchParams.has(SWITCH_PARAM);
  url.searchParams.delete(SWITCH_PARAM);
  return { requested, cleanUrl: url.toString() };
}

/**
 * SWITCH ACCOUNT, step 1: sign out through the existing logout(), which ends the session and comes back to the
 * current address. The address is marked first, so the return is recognised even if the installed app reopens in
 * a fresh context (nothing is kept in storage). The current route and its parameters are kept.
 */
export function switchAccount(auth, win = window) {
  win.history.replaceState(win.history.state, "", withMarker(win.location.href));
  auth.logout();
}

/**
 * SWITCH ACCOUNT, step 2, on every load of the shell: if this is the marked return, remove the mark and, when no
 * one is signed in, enter the normal sign-in flow with the current route as the return destination. After sign-in
 * the app loads again and AuthContext re-reads base44.auth.me(). Does nothing while authentication is being read.
 */
export function completeSwitch(auth, win = window) {
  const { requested, cleanUrl } = readSwitchMarker(win.location.href);
  if (!requested || auth.isLoadingAuth || auth.isLoadingPublicSettings) return "none";
  win.history.replaceState(win.history.state, "", cleanUrl);
  if (auth.isAuthenticated) return "signed_in";
  auth.navigateToLogin();
  return "login";
}