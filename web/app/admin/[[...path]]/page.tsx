import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Login } from "@/components/admin/Login";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { requireOwner, accessGate } from "@/lib/cms/security";
import { listEntries, getEntry, CmsError } from "@/lib/cms/repository";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
export const dynamic = "force-dynamic";
export default async function AdminPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  if (
    !process.env.DATABASE_URL ||
    !process.env.BETTER_AUTH_SECRET ||
    !process.env.CMS_OWNER_EMAIL
  )
    return (
      <main className="cms-login">
        <span className="cms-eyebrow">Portfolio admin</span>
        <h1>Konfigurasi admin belum selesai</h1>
        <p>
          Siapkan database CMS, secret autentikasi, dan akun owner melalui
          prosedur deployment. Website publik tetap menggunakan konfigurasi
          sebelumnya.
        </p>
        <Link href="/works">Kembali ke website</Link>
      </main>
    );
  try {
    await accessGate(await headers());
  } catch {
    return (
      <main className="cms-login">
        <h1>Akses terbatas</h1>
        <p>
          Identitas Cloudflare Access yang valid diperlukan untuk membuka admin.
        </p>
      </main>
    );
  }
  if (path[0] === "login") return <Login />;
  let owner;
  try {
    owner = await requireOwner({ enrollment: true });
  } catch (error) {
    if (error instanceof CmsError && error.status === 401)
      redirect("/admin/login");
    throw error;
  }
  if (!owner.user.twoFactorEnabled) {
    if (path[0] !== "setup") redirect("/admin/setup");
    return <Login enroll />;
  }
  if (path[0] === "setup") redirect("/admin");
  const rows = await listEntries();
  const editor =
    path[0] === "edit" && path[1] ? await getEntry(path[1]) : undefined;
  return (
    <AdminWorkspace
      path={path}
      initialEntries={JSON.parse(JSON.stringify(rows))}
      initialEditor={editor ? JSON.parse(JSON.stringify(editor)) : undefined}
    >
      {path[0] === "analytics" && (
        <AnalyticsDashboard
          projectSlugs={rows
            .filter((r) => r.kind === "work" && r.published)
            .map((r) => r.published!.slug)}
        />
      )}
    </AdminWorkspace>
  );
}
