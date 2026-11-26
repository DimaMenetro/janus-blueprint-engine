// Operator access from inside the installed app: the account control, sign out, switch account, and what a
// non-operator is shown. The platform's sign-in itself is not re-implemented or simulated beyond its contract:
// logout() ends the session and returns to the current address; navigateToLogin() enters sign-in and returns to it.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { accountView, isOperator, switchAccount, completeSwitch, readSwitchMarker, SWITCH_PARAM } from "@/lib/janus/operatorAccess";
import { executeJanus, OPERATOR_ONLY_MESSAGE } from "@/lib/janus/browserAdapter";
import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { light } from "@/components/ui/LiquidGlass";
import { ExecutionProvider } from "@/components/janus/ExecutionContext";
import ExecutionStatePanel from "@/components/janus/ExecutionStatePanel";
import AccountPanel from "@/components/janus/AccountPanel";

const ROUTE = "https://janus.example/results?id=run-1";
const ADMIN = { id: "u-admin", email: "kinoru11@gmail.com", full_name: "DIMA", role: "admin" };
const OTHER = { id: "u-other", email: "someone@example.com", role: "user" };
const params = { queryText: "q", executionMode: "quick", outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false };

/** The installed app's window and the platform session behind it. `load()` is what AuthContext holds after a (re)load. */
function installedApp(user, href = ROUTE) {
  const session = { user };
  const calls = [];
  const win = { location: { href }, history: { state: null, replaceState(_s, _t, url) { win.location.href = String(url); } } };
  const load = (loading = false) => ({
    user: session.user, isAuthenticated: !!session.user, isLoadingAuth: loading, isLoadingPublicSettings: false,
    logout: () => { calls.push(["logout", win.location.href]); session.user = null; },
    navigateToLogin: () => { calls.push(["login", win.location.href]); },
  });
  return { session, calls, win, load };
}
const panel = (user) => renderToStaticMarkup(
  <AccountPanel account={accountView({ user, isAuthenticated: !!user })} t={light} isDark={false} onSwitch={() => {}} onSignOut={() => {}} onSignIn={() => {}} />);

beforeEach(() => h.reset());

describe("account control: identity and role", () => {
  it("an authenticated admin is shown with identity and the Admin role, and both account actions", () => {
    expect(accountView({ user: ADMIN, isAuthenticated: true })).toMatchObject({ signedIn: true, identity: "kinoru11@gmail.com", role: "admin", roleLabel: "Admin", operator: true });
    const html = panel(ADMIN);
    expect(html).toContain("kinoru11@gmail.com");
    expect(html).toContain("Admin");
    expect(html).toContain("Switch account");
    expect(html).toContain("Sign out");
    expect(html).not.toContain("need the admin account");
  });

  it("a non-admin is shown as view only and can still switch account; no one signed in gets Sign in", () => {
    expect(accountView({ user: OTHER, isAuthenticated: true })).toMatchObject({ identity: "someone@example.com", roleLabel: "User · view only", operator: false });
    expect(panel(OTHER)).toContain("Switch account");
    expect(panel(OTHER)).toContain("need the admin account");
    expect(accountView({ user: null, isAuthenticated: false })).toMatchObject({ signedIn: false, operator: false });
    expect(panel(null)).toContain("Sign in");
    expect(panel(null)).not.toContain("Switch account");
    // The role is exactly what the platform returned: nothing else makes an operator.
    expect([undefined, null, {}, { role: "user" }, { role: "Admin" }, { email: ADMIN.email }].some(isOperator)).toBe(false);
  });
});

describe("switch account from inside the installed app", () => {
  it("signs the current session out, enters sign-in, returns to the same Janus route, and the admin is an operator again", async () => {
    const app = installedApp(OTHER); // the app is holding the wrong session
    switchAccount(app.load(), app.win);
    expect(app.session.user).toBeNull(); // the existing logout() ended the session
    expect(app.calls).toEqual([["logout", `${ROUTE}&${SWITCH_PARAM}=1`]]); // and returns to this route, marked

    // The app loads again at the return address, signed out: it goes straight into the normal sign-in flow.
    expect(completeSwitch(app.load(), app.win)).toBe("login");
    expect(app.calls[1]).toEqual(["login", ROUTE]); // return destination: the Janus route, unmarked
    expect(app.win.location.href).toBe(ROUTE);

    // Sign-in completes as the admin; the app loads at the route and re-reads the user.
    app.session.user = ADMIN;
    h.session.user = { ...ADMIN };
    expect(completeSwitch(app.load(), app.win)).toBe("none");
    expect(accountView(app.load())).toMatchObject({ identity: "kinoru11@gmail.com", roleLabel: "Admin", operator: true });
    expect((await h.base44.auth.me()).role).toBe("admin");
    const result = await executeJanus(params); // operator work is available again, with no reinstall
    expect(result.status).toBe("completed");
    expect(app.calls).toHaveLength(2); // one sign-out, one sign-in, nothing else
  });

  it("does nothing while authentication is still being read, and never loops", () => {
    const app = installedApp(null, `${ROUTE}&${SWITCH_PARAM}=1`);
    expect(completeSwitch(app.load(true), app.win)).toBe("none");
    expect(app.calls).toEqual([]);
    expect(readSwitchMarker(app.win.location.href).requested).toBe(true); // still pending
    expect(completeSwitch(app.load(), app.win)).toBe("login");
    expect(completeSwitch(app.load(), app.win)).toBe("none"); // the mark is gone: a second pass starts nothing
    expect(app.calls).toEqual([["login", ROUTE]]);
  });

  it("a marked return that is already signed in only removes the mark", () => {
    const app = installedApp(ADMIN, `${ROUTE}&${SWITCH_PARAM}=1`);
    expect(completeSwitch(app.load(), app.win)).toBe("signed_in");
    expect(app.win.location.href).toBe(ROUTE);
    expect(app.calls).toEqual([]);
  });

  it("refreshing or reopening the app keeps normal authenticated behaviour: nothing is signed out or redirected", () => {
    const app = installedApp(ADMIN, "https://janus.example/");
    expect(completeSwitch(app.load(), app.win)).toBe("none");
    expect(completeSwitch(app.load(), app.win)).toBe("none");
    expect(app.calls).toEqual([]);
    expect(app.session.user).toEqual(ADMIN);
    expect(app.win.location.href).toBe("https://janus.example/");
  });
});

describe("a non-admin is view only", () => {
  const openRun = async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    const view = composeRunView(h.db.Run[0], [], []);
    return { run, state: deriveExecutionState(view) };
  };
  const render = (state, runId, isAdmin) => renderToStaticMarkup(
    <ExecutionProvider><ExecutionStatePanel state={state} runId={runId} t={light} onChanged={async () => {}} isAdmin={isAdmin} /></ExecutionProvider>);

  it("the run controls are shown to the admin and not to anyone else", async () => {
    const { run, state } = await openRun();
    expect(state).toMatchObject({ resumable: true });
    expect(render(state, run.id, true)).toContain("Resume from saved stages");
    const viewOnly = render(state, run.id, false);
    expect(viewOnly).not.toContain("Resume from saved stages");
    expect(viewOnly).not.toContain("<button");
    expect(viewOnly).toContain("View only");
  });

  it("and the engine still refuses a non-admin before anything is written (containment unchanged)", async () => {
    h.session.user = { id: "u-other", role: "user" };
    await expect(executeJanus(params)).rejects.toThrow(OPERATOR_ONLY_MESSAGE);
    expect(h.db.Run).toHaveLength(0);
    expect(h.llm.stages).toEqual([]);
  });
});