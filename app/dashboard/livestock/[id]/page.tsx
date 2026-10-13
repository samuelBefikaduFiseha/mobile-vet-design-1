import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Syringe, Stethoscope, Bug, ClipboardCheck, Bandage, Pill } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { allowed, can } from "@/lib/permissions";
import { getAnimal, getAnimalOptions, getFarmerOptions, getHealthRecords } from "@/lib/queries";
import { saveAnimal, saveHealthRecord } from "@/lib/actions";
import { ageFrom, capitalize, formatDate, relativeDays, speciesLabel } from "@/lib/utils";
import { FormDialog } from "@/components/client";
import { AddPhotos, AnimalFields, HealthFields } from "@/components/forms";
import { PhotoGallery } from "@/components/photos";
import { Card, Detail, Page, StatusBadge } from "@/components/ui";

const typeIcon = { vaccination: Syringe, disease: Bug, treatment: Pill, checkup: ClipboardCheck, deworming: Stethoscope, injury: Bandage };

export default async function AnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(can.viewLivestock);
  const animal = await getAnimal(user, id);
  if (!animal) notFound();
  const records = await getHealthRecords(user, { animal: id });
  const editable = allowed(user.role, can.editLivestock);
  const [farmers, animalOptions] = editable ? await Promise.all([getFarmerOptions(user), getAnimalOptions(user, animal.farmer_id)]) : [[], []];
  const vaccinations = records.filter((r) => r.type === "vaccination");

  return (
    <Page>
      <Link href="/dashboard/livestock" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Livestock
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{animal.tag_number}</h1>
            <StatusBadge status={animal.health_status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {speciesLabel(animal.species)} · {animal.breed} · owned by{" "}
            <Link href={`/dashboard/farmers/${animal.farmer_id}`} className="font-medium text-primary hover:underline">{animal.farmer_name}</Link> ({animal.region_name})
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <AddPhotos target="animal" id={id} title={`Photos of ${animal.tag_number}`} />
            <FormDialog action={saveAnimal} title="Edit animal" triggerClassName="btn-secondary" trigger={<><Pencil className="h-4 w-4" /> Edit</>}>
              <AnimalFields animal={animal} farmers={farmers} />
            </FormDialog>
            <FormDialog action={saveHealthRecord} title="New health record" trigger={<><Plus className="h-4 w-4" /> Health record</>}>
              <HealthFields animals={animalOptions} animalId={id} />
            </FormDialog>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card title="Identity">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="RFID"><span className="font-mono text-xs">{animal.rfid}</span></Detail>
              <Detail label="Sex">{capitalize(animal.sex)}</Detail>
              <Detail label="Age">{ageFrom(animal.birth_date)}</Detail>
              <Detail label="Weight">{animal.weight_kg} kg</Detail>
              <Detail label="Colour">{animal.color || "—"}</Detail>
              <Detail label="Registered">{formatDate(animal.registered_at)}</Detail>
              <Detail label="Last seen">{formatDate(animal.last_seen)} <span className="text-xs font-normal text-muted">({relativeDays(animal.last_seen)})</span></Detail>
              <Detail label="Location">{animal.location || "—"}</Detail>
            </dl>
          </Card>
          <Card title={`Photos (${animal.photo_ids.length})`}>
            <PhotoGallery ids={animal.photo_ids} canDelete={editable} empty={editable ? "No photos yet. Use “Photos” above to add some." : "No photos yet."} />
          </Card>
          <Card title="Vaccinations" description="From vaccination health records">
            {vaccinations.length === 0 ? <p className="text-sm text-muted">No vaccinations recorded.</p> : (
              <ul className="space-y-2">
                {vaccinations.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2"><Syringe className="h-3.5 w-3.5 text-primary" />{v.diagnosis.replace(/^Preventive:\s*/, "")}</span>
                    <span className="text-xs text-muted">{formatDate(v.record_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="lg:col-span-2" title={`Health history · ${records.length} records`}>
          {records.length === 0 ? <p className="py-6 text-center text-sm text-muted">No health records yet.</p> : (
            <ol className="relative space-y-5 border-l border-border pl-6">
              {records.map((h) => {
                const Icon = typeIcon[h.type];
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[37px] inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted"><Icon className="h-3 w-3" /></span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{h.diagnosis}</span>
                      <StatusBadge status={h.severity} />
                      <span className="text-xs text-muted">{capitalize(h.type)} · {formatDate(h.record_date)} · {h.recorded_by_name ?? "—"}</span>
                    </div>
                    {h.symptoms && <p className="mt-1 text-sm text-muted"><span className="font-medium text-foreground">Signs:</span> {h.symptoms}</p>}
                    {h.treatment && <p className="mt-0.5 text-sm text-muted"><span className="font-medium text-foreground">Treatment:</span> {h.treatment}</p>}
                    {h.notes && <p className="mt-0.5 text-sm text-muted">{h.notes}</p>}
                    {h.photo_ids.length > 0 && <div className="mt-2"><PhotoGallery ids={h.photo_ids} canDelete={editable} /></div>}
                    {h.follow_up_date && <p className="mt-1 text-xs font-medium text-warning">Follow-up {formatDate(h.follow_up_date)} ({relativeDays(h.follow_up_date)})</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </Page>
  );
}
