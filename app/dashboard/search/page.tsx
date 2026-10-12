import Link from "next/link";
import { Search, Users, Tag, HeartPulse } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getAnimals, getFarmers, getHealthRecords } from "@/lib/queries";
import { formatDate, readParams, speciesLabel, type SearchParams } from "@/lib/utils";
import { Card, EmptyState, Page, PageHeader, RiskBadge, StatusBadge } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const { q = "" } = await readParams(searchParams);
  const term = q.trim();
  const [farmers, animals, records] = term ? await Promise.all([
    getFarmers(user, { q: term }),
    allowed(user.role, can.viewLivestock) ? getAnimals(user, { q: term }) : Promise.resolve([]),
    allowed(user.role, can.viewHealth) ? getHealthRecords(user, { q: term }, 10) : Promise.resolve([]),
  ]) : [[], [], []];
  const total = farmers.length + animals.length + records.length;

  return (
    <Page>
      <PageHeader title={term ? `Results for “${term}”` : "Search"} icon={Search} description={term ? `${total} matches` : "Use the search bar above."} />
      {term && total === 0 && <EmptyState icon={Search} title="Nothing found">Try a farmer name, farmer code (MV-F-0001), ear tag (MV-BOR-00012), RFID or diagnosis.</EmptyState>}
      <div className="grid gap-4 lg:grid-cols-2">
        {farmers.length > 0 && (
          <Card title={<span className="flex items-center gap-2"><Users className="h-4 w-4 text-subtle" />Farmers ({farmers.length})</span>} bodyClassName="divide-y divide-border">
            {farmers.slice(0, 20).map((f) => (
              <Link key={f.id} href={`/dashboard/farmers/${f.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card-hover">
                <div><div className="text-sm font-medium">{f.full_name}</div><div className="text-xs text-muted">{f.code} · {f.kebele}, {f.region_name}</div></div>
                <RiskBadge score={f.risk_score} />
              </Link>
            ))}
          </Card>
        )}
        {animals.length > 0 && (
          <Card title={<span className="flex items-center gap-2"><Tag className="h-4 w-4 text-subtle" />Animals ({animals.length})</span>} bodyClassName="divide-y divide-border">
            {animals.slice(0, 20).map((a) => (
              <Link key={a.id} href={`/dashboard/livestock/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-card-hover">
                <div><div className="font-mono text-sm font-medium">{a.tag_number}</div><div className="text-xs text-muted">{speciesLabel(a.species)} · {a.breed} · {a.farmer_name}</div></div>
                <StatusBadge status={a.health_status} />
              </Link>
            ))}
          </Card>
        )}
        {records.length > 0 && (
          <Card title={<span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-subtle" />Health records</span>} bodyClassName="divide-y divide-border">
            {records.map((h) => (
              <Link key={h.id} href={`/dashboard/livestock/${h.animal_id}`} className="block px-4 py-2.5 hover:bg-card-hover">
                <div className="text-sm font-medium">{h.diagnosis}</div>
                <div className="text-xs text-muted">{h.tag_number} · {h.farmer_name} · {formatDate(h.record_date)}</div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </Page>
  );
}
