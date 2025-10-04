import { CreateTeam } from "@/components/team/create-team";
import { listTeams } from "@/lib/team";

export default async function AppPage() {
  const { data: teams } = await listTeams();

  return teams && teams?.length > 0 ? (
    <>
      <header className="flex flex-row justify-between items-center pb-4 w-full">
        <h2 className="font-bold">Products</h2>
      </header>
    </>
  ) : (
    <section className="grid place-items-center gap-4">
      <p className="text-lg font-semibold text-center">
        Looks like you&apos;re apart of no teams yet, <br />
        join one or create one to get started!
      </p>
      <CreateTeam />
    </section>
  );
}
