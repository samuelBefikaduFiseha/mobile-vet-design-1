import { Inbox, Mail, Building2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getInquiries } from "@/lib/queries";
import { setInquiryStatus } from "@/lib/actions";
import { capitalize, formatDateTime } from "@/lib/utils";
import { ActionButton } from "@/components/client";
import { Badge, EmptyState, Page, PageHeader, StatusBadge } from "@/components/ui";

export default async function InquiriesPage() {
  await requireUser(can.viewInquiries);
  const inquiries = await getInquiries();

  return (
    <Page>
      <PageHeader title="Partnership inquiries" icon={Inbox} description="Messages sent through the public contact form" />
      <div className="space-y-3">
        {inquiries.map((q) => (
          <article key={q.id} className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{q.name}</h3>
                  <StatusBadge status={q.status} />
                  <Badge>{capitalize(q.interest)}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <a href={`mailto:${q.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{q.email}</a>
                  {q.organization && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{q.organization}</span>}
                  <span>{formatDateTime(q.created_at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {q.status !== "contacted" && <ActionButton action={setInquiryStatus.bind(null, q.id, "contacted")} className="btn-secondary px-2.5 py-1 text-xs">Mark contacted</ActionButton>}
                {q.status !== "closed" && <ActionButton action={setInquiryStatus.bind(null, q.id, "closed")} className="btn-ghost px-2.5 py-1 text-xs">Close</ActionButton>}
                {q.status === "closed" && <ActionButton action={setInquiryStatus.bind(null, q.id, "new")} className="btn-ghost px-2.5 py-1 text-xs">Reopen</ActionButton>}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-foreground/85">{q.message}</p>
          </article>
        ))}
      </div>
      {inquiries.length === 0 && <EmptyState icon={Inbox} title="No inquiries yet" />}
    </Page>
  );
}
