"use client";

import type { AuthMode } from "@/lib/types";

export function LoginAccess({
  action,
  mode,
}: {
  action: (formData: FormData) => Promise<void>;
  mode: AuthMode;
}) {
  return (
    <div className="form-stack">
      <form action={action} className="form-stack">
        <label className="field login-field">
          <span>User ID</span>
          <input name="identifier" type="text" placeholder="Enter your user ID" autoComplete="username" required />
        </label>
        <label className="field login-field">
          <span>Password</span>
          <input name="password" type="password" placeholder="Enter password" autoComplete="current-password" required />
        </label>
        <button className="button button-primary button-full login-submit" type="submit">
          Continue
        </button>
      </form>
    </div>
  );
}
