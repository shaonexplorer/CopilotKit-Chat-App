import { ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { useAgent } from "@copilotkit/react-core/v2";

function ConfirmAppointment({ args, status, respond }) {
  const { agent } = useAgent();
  return (
    <section className="border-primary/20 bg-primary/[0.03] rounded-2xl border p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-primary size-4" />
        <h3 className="font-bold">Review before confirming</h3>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <ReviewItem label="Doctor" value={args.doctor.name} />
        {/* <ReviewItem label="Specialty" value={review.specialty} /> */}
        <ReviewItem label="Clinic" value={"Ibn Sina Center"} />
        <ReviewItem
          label="Date & time"
          value={`${agent.state.selected_appointment_date}`}
        />
        <ReviewItem label="Visit type" value={"On Site"} />
        <ReviewItem label="Fee" value={"$120.00"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={status !== "executing"}
          onClick={() => {
            respond?.("user confirmed the appointment");
          }}
        >
          Confirm booking
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={status !== "executing"}
          onClick={() => {
            respond?.("user cancelled the appointment");
          }}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}

export default ConfirmAppointment;

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-semibold break-words">{value}</dd>
    </div>
  );
}
