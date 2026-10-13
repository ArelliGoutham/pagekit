import { getDb, users } from "@pagekit/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export function getUsers() {
  const db = getDb();
  return db.select().from(users).all();
}

export function getUserById(userId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .all();
  return result[0] ?? null;
}

type UserRole = "admin" | "editor" | "viewer";

export function createUser(input: {
  email: string;
  name?: string;
  role: string;
}) {
  const db = getDb();
  const role = (["admin", "editor", "viewer"].includes(input.role)
    ? input.role
    : "viewer") as UserRole;
  const user = {
    id: uuidv4(),
    email: input.email,
    name: input.name || input.email.split("@")[0] || "User",
    provider: "local" as const,
    providerId: input.email,
    role,
  };
  db.insert(users).values(user).run();
  return user;
}

export function updateUserRole(userId: string, role: string) {
  const db = getDb();
  const safeRole = (["admin", "editor", "viewer"].includes(role)
    ? role
    : "viewer") as UserRole;
  db.update(users)
    .set({ role: safeRole })
    .where(eq(users.id, userId))
    .run();
  return getUserById(userId);
}