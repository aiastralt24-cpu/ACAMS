import { loginAction } from "@/app/login/actions";
import { LoginAccess } from "@/components/login-access";
import { getAuthMode } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = getAuthMode();

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <section className="login-card login-card-simple">
        <div className="login-mark" aria-hidden="true">
          A
        </div>
        <div className="login-heading">
          <p className="eyebrow">ACAMS</p>
          <h1>Welcome back</h1>
          <p className="login-copy">Sign in to continue.</p>
        </div>
        {params.error ? <p className="form-error">{params.error}</p> : null}
        <LoginAccess action={loginAction} mode={mode} />
        <p className="login-footnote">Access is managed by Astral. Contact your admin if you need an account.</p>
      </section>
    </main>
  );
}
