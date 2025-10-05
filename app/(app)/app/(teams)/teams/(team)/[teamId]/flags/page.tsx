import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function FlagsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="p-4">
      Flags page works!
      <Button asChild>
        <Link href={`/app/teams/${teamId}/flags/create`}>Create Flag</Link>
      </Button>
    </div>
  );
}
