type ProfileRow = {
  label: string;
  value: string;
};

export type UserProfileData = {
  id: string;
  fullName: string;
  email: string;
};

function SectionCard({
  title,
  rows,
}: {
  title: string;
  rows: ProfileRow[];
}) {
  return (
    <section className="rounded-2xl border border-chat-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-8">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-sm text-slate-500">{row.label}</p>
            <p className="mt-1 text-base font-medium text-slate-900">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '-', lastName: '-' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function UserProfile({ user, initials }: { user: UserProfileData; initials: string }) {
  const name = splitName(user.fullName);
  const personalInfo: ProfileRow[] = [
    { label: 'First Name', value: name.firstName },
    { label: 'Last Name', value: name.lastName },
    { label: 'Email Address', value: user.email },
  ];

  return (
    <main className="h-full overflow-y-auto bg-[#f6f7f9] p-4 text-slate-900 sm:p-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Account Settings</h1>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f3f4f6]">
        <div className="grid min-h-[calc(100dvh-10rem)] grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-white p-4 md:border-r md:border-b-0 md:p-5">
            <div className="w-full rounded-xl bg-sky-100 px-3 py-2.5 text-left text-sm font-semibold text-sky-700">
              My Profile
            </div>
          </aside>

          <section className="space-y-5 p-4 sm:p-5 md:p-6">
            <h2 className="text-2xl font-semibold">My Profile</h2>

            <section className="rounded-2xl border border-chat-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>
              </div>
            </section>

            <SectionCard title="Personal Information" rows={personalInfo} />
          </section>
        </div>
      </div>
    </main>
  );
}