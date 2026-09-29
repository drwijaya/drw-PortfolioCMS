"use client";
/* Authenticated media and locally generated QR codes must bypass the public image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { AdminBrand } from "./AdminBrand";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { authApi } from "./api";
export function Login({ enroll = false }: { enroll?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [stage, setStage] = useState(enroll ? "enroll" : "password"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [qr, setQr] = useState(""),
    [backup, setBackup] = useState<string[]>([]),
    [useBackup, setUseBackup] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (stage === "password") {
        const r = await authApi("sign-in/email", {
          email,
          password,
          rememberMe: false,
        });
        if (r.twoFactorRedirect) setStage("totp");
        else router.push("/admin/setup");
      } else if (stage === "enroll") {
        const r = await authApi<{ totpURI: string; backupCodes: string[] }>(
          "two-factor/enable",
          { password },
        );
        setQr(await QRCode.toDataURL(r.totpURI));
        setBackup(r.backupCodes);
        setStage("verify");
      } else {
        await authApi(
          useBackup
            ? "two-factor/verify-backup-code"
            : "two-factor/verify-totp",
          useBackup
            ? { code, disableSession: false, trustDevice: false }
            : { code, trustDevice: false },
        );
        router.push("/admin");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="cms-login">
      <Link href="/works" className="cms-wordmark">
        <AdminBrand/>
      </Link>
      <span className="cms-eyebrow">Portfolio administration</span>
      <h1>
        {stage === "enroll" || stage === "verify"
          ? "Amankan akun Anda"
          : "Selamat datang kembali"}
      </h1>
      <p className="cms-muted">
        {stage === "password"
          ? "Masuk untuk mengelola website Anda."
          : "Authenticator wajib untuk mengakses admin."}
      </p>
      <form onSubmit={submit}>
        {stage === "password" && (
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {["password", "enroll"].includes(stage) && (
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={16}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {qr && (
          <>
            <img
              className="cms-qr"
              src={qr}
              alt="Scan QR dengan aplikasi authenticator"
            />
            <details open>
              <summary>Simpan recovery codes di tempat aman</summary>
              <p>
                Kode ini ditampilkan sekali dan masing-masing hanya dapat
                dipakai sekali.
              </p>
              <pre>{backup.join("\n")}</pre>
            </details>
          </>
        )}
        {["totp", "verify"].includes(stage) && (
          <>
            <label>
              {useBackup ? "Recovery code" : "Kode authenticator"}
              <input
                autoComplete="one-time-code"
                inputMode={useBackup ? "text" : "numeric"}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            {stage === "totp" && (
              <button
                type="button"
                onClick={() => {
                  setUseBackup(!useBackup);
                  setCode("");
                }}
              >
                {useBackup ? "Gunakan authenticator" : "Gunakan recovery code"}
              </button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="cms-alert">
            {error}
          </p>
        )}
        <button className="cms-primary" disabled={busy}>
          {busy
            ? "Memeriksa…"
            : stage === "enroll"
              ? "Siapkan authenticator"
              : stage === "password"
                ? "Lanjutkan"
                : "Verifikasi & masuk"}
        </button>
      </form>
      <p className="cms-login-foot">Akses terbatas untuk pemilik website.</p>
    </main>
  );
}
