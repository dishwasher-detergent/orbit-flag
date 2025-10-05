export default async function FlagDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string; flagId: string }>;
}) {
  const { teamId, flagId } = await params;

  return (
    <div className="p-4">
      Flag details for {flagId} in team {teamId}
    </div>
  );
}
