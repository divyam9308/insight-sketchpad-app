import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "super_admin" | "admin" | "user";

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
}

export const SAMPLE_USERS: CurrentUser[] = [
  { id: "u1", name: "Divyam Aggarwal", role: "user" },
  { id: "u2", name: "Seema", role: "user" },
  { id: "u3", name: "Rajneesh", role: "admin" },
  { id: "u4", name: "Divya Adhikari", role: "user" },
];

const ROLE_KEY = "fyndbridge.role";
const ME_KEY = "fyndbridge.me";

interface RoleCtx {
  role: Role;
  me: CurrentUser;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("super_admin");

  useEffect(() => {
    const stored = localStorage.getItem(ROLE_KEY) as Role | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    localStorage.setItem(ROLE_KEY, r);
  };

  const me: CurrentUser =
    role === "super_admin"
      ? { id: "me", name: "You (Super Admin)", role: "super_admin" }
      : role === "admin"
        ? { id: "u3", name: "Rajneesh", role: "admin" }
        : { id: "u1", name: "Divyam Aggarwal", role: "user" };

  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify(me));
  }, [me.id]);

  return <Ctx.Provider value={{ role, me, setRole }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRole must be inside RoleProvider");
  return c;
}
