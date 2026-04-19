import { grantBrandAccessAction, revokeBrandAccessAction } from "@/app/actions/access-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { getAccessGrants, getBrands, getManageableUsers } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

type AccessPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const [grants, brands, users] = await Promise.all([
    getAccessGrants(user),
    getBrands(),
    getManageableUsers(user),
  ]);

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Access"
        title="Manage access"
        description="Choose who can see each brand."
      />

      {params.error ? <p className="form-error">{params.error}</p> : null}
      {params.message ? <p className="form-message">{params.message}</p> : null}

      <section className="two-column">
        <div className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Add</p>
              <h2>Give access</h2>
            </div>
          </div>

          {user.role === "super_admin" ? (
            <form action={grantBrandAccessAction} className="form-grid">
              <label className="field field-wide">
                <span>Choose team member</span>
                <select defaultValue="" name="userId" required>
                  <option disabled value="">
                    Select user
                  </option>
                  {users.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.fullName} · {profile.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Choose brand</span>
                <select defaultValue="" name="brandId" required>
                  <option disabled value="">
                    Select brand
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field-actions field-wide">
                <button className="button button-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="empty-state">You do not have permission to manage access.</p>
          )}
        </div>

        <div className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Current</p>
              <h2>Who has access</h2>
            </div>
          </div>

          <div className="summary-list">
            {grants.length ? (
              grants.map((grant) => (
                <article className="summary-row" key={grant.id}>
                  <div className="grant-copy">
                    <strong>{grant.userName}</strong>
                    <span>
                      {grant.userEmail} · {grant.brandName}
                    </span>
                    <span>
                      Granted {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(grant.grantedAt))}
                      {grant.grantedByName ? ` · by ${grant.grantedByName}` : ""}
                    </span>
                  </div>
                  {user.role === "super_admin" ? (
                    <form action={revokeBrandAccessAction}>
                      <input name="grantId" type="hidden" value={grant.id} />
                      <button className="button button-secondary" type="submit">
                        Revoke
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="empty-state">No extra access has been added.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
