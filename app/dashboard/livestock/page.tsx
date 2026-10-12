import Link from "next/link";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getAnimals, getFarmerOptions, getFilterOptions } from "@/lib/queries";
import { deleteAnimal, saveAnimal } from "@/lib/actions";
import { ageFrom, formatDate, readParams, speciesLabel, toOptions, type SearchParams } from "@/lib/utils";
import { ActionButton, FilterBar, FormDialog } from "@/components/client";
import { AnimalFields } from "@/components/forms";
import { EmptyState, Page, PageHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";

export default async function LivestockPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(can.viewLivestock);
  const p = await readParams(searchParams);
  const editable = allowed(user.role, can.editLivestock);
  const [animals, farmers, opts] = await Promise.all([
    getAnimals(user, p), editable ? getFarmerOptions(user) : Promise.resolve([]), getFilterOptions(user, p),
  ]);
  const count = (s: string) => animals.filter((a) => a.health_status === s).length;
  const owner = p.farmer ? opts.farmers.find((f) => f.value === p.farmer) : null;

  return (
    <Page>
      <PageHeader title="Livestock" icon={Tag}
        description={owner ? <>Animals owned by <Link className="font-medium text-primary hover:underline" href={`/dashboard/farmers/${owner.value}`}>{owner.label}</Link></> : "RFID / ear-tagged animals and their current health status"}
        actions={editable && (
          <FormDialog action={saveAnimal} title="Register animal" submitLabel="Register" trigger={<><Plus className="h-4 w-4" /> Register animal</>}>
            <AnimalFields farmers={farmers} farmerId={p.farmer} />
          </FormDialog>
        )} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Animals listed" value={animals.length} />
        <StatCard label="Healthy" value={count("healthy") + count("recovered")} />
        <StatCard label="Sick" value={count("sick")} hint={<a href="?status=sick" className="text-primary hover:underline">Show sick animals</a>} />
        <StatCard label="Lost (dead / missing)" value={count("deceased") + count("missing")} />
      </div>

      <FilterBar placeholder="Search ear tag, RFID, breed, owner or location…" filters={[
        ...(user.role === "extension_worker" ? [] : [{ name: "region", label: "All regions", options: opts.regions, resets: ["woreda", "farmer"] }]),
        { name: "farmer", label: "All farmers", options: opts.farmers },
        { name: "species", label: "All species", options: toOptions(["cattle", "goat", "sheep", "camel", "donkey"], speciesLabel), resets: ["breed"] },
        { name: "status", label: "Any health status", options: toOptions(["healthy", "sick", "recovered", "missing", "deceased"]) },
        { name: "woreda", label: "All woredas", options: opts.woredas, resets: ["farmer"], more: true },
        { name: "breed", label: "All breeds", options: opts.breeds, more: true },
        { name: "sex", label: "Any sex", options: toOptions(["female", "male"]), more: true },
        { name: "age", label: "Any age", more: true, options: [{ value: "young", label: "Under 2 years" }, { value: "adult", label: "2–8 years" }, { value: "old", label: "Over 8 years" }] },
        { name: "vaccinated", label: "Any vaccination", more: true, options: [{ value: "yes", label: "Vaccinated (last 12 months)" }, { value: "no", label: "Not vaccinated in 12 months" }] },
      ]} />

      <TableShell footer={`${animals.length} animal${animals.length === 1 ? "" : "s"}`}>
        <thead className="border-b border-border bg-surface/60">
          <tr>
            <th className="th">Ear tag / RFID</th><th className="th">Animal</th><th className="th">Owner</th>
            <th className="th">Age · weight</th><th className="th">Status</th><th className="th">Last seen</th>
            {editable && <th className="th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {animals.map((a) => (
            <tr key={a.id} className="hover:bg-card-hover">
              <td className="td">
                <Link href={`/dashboard/livestock/${a.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{a.tag_number}</Link>
                <div className="font-mono text-[11px] text-subtle">{a.rfid}</div>
              </td>
              <td className="td">
                <div className="font-medium">{speciesLabel(a.species)}</div>
                <div className="text-xs text-muted">{a.breed} · {a.sex} · {a.color}</div>
              </td>
              <td className="td">
                <Link href={`/dashboard/farmers/${a.farmer_id}`} className="hover:text-primary">{a.farmer_name}</Link>
                <div className="text-xs text-muted">{a.region_name}</div>
              </td>
              <td className="td whitespace-nowrap text-xs text-muted">{ageFrom(a.birth_date)} · {a.weight_kg} kg</td>
              <td className="td"><StatusBadge status={a.health_status} /></td>
              <td className="td whitespace-nowrap">
                <div className="text-xs">{formatDate(a.last_seen)}</div>
                <div className="max-w-44 truncate text-[11px] text-muted" title={a.location}>{a.location}</div>
              </td>
              {editable && (
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <FormDialog action={saveAnimal} title={`Edit ${a.tag_number}`} triggerClassName="icon-btn" triggerTitle="Edit" trigger={<Pencil className="h-4 w-4" />}>
                      <AnimalFields animal={a} farmers={farmers} />
                    </FormDialog>
                    <ActionButton action={deleteAnimal.bind(null, a.id)} className="icon-btn hover:text-danger" title="Delete" danger confirmLabel="Delete"
                      confirm={{ title: "Remove animal?", message: <>Delete <b>{a.tag_number}</b> and its {a.record_count} health records? To record a death, set the status to “deceased” instead.</> }}>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </TableShell>
      {animals.length === 0 && <EmptyState icon={Tag} title="No animals match these filters" />}
    </Page>
  );
}
