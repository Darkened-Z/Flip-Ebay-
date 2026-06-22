"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/app/login/actions";
import { Seal } from "@/components/brand";
import { IconArrowRight } from "@tabler/icons-react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  fontSize: 14,
  borderRadius: 10,
  border: "1px solid var(--color-line)",
  background: "var(--color-surface-2)",
  outline: "none",
  color: "var(--color-ink)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-muted)",
  marginBottom: 6,
  display: "block",
};

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authenticate,
    {},
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Seal size={38} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            FLIP
          </span>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: 18,
            padding: 24,
            boxShadow:
              "0 1px 3px rgba(0,0,0,.05), 0 18px 40px -20px rgba(0,0,0,.18)",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              margin: "6px 0 18px",
            }}
          >
            {mode === "signin"
              ? "Welcome back. Enter your details to continue."
              : "Set an email and password to get started."}
          </p>

          <form action={formAction}>
            <input type="hidden" name="mode" value={mode} />

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {state.error ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-cost)",
                  background: "var(--color-cost-soft)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 14,
                }}
              >
                {state.error}
              </div>
            ) : null}

            {state.message ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-flip)",
                  background: "var(--color-go-soft)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 14,
                }}
              >
                {state.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                padding: "13px 20px",
                background: "var(--color-flip)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px -3px rgba(15,122,67,.5)",
              }}
            >
              {pending
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
              {!pending ? <IconArrowRight size={17} /> : null}
            </button>
          </form>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 13,
            color: "var(--color-muted)",
          }}
        >
          {mode === "signin" ? "New to FLIP?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--color-flip)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
