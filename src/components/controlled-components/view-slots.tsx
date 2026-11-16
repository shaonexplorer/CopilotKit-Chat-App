import { CalendarDays } from "lucide-react";
import { Button } from "../ui/button";
import { useAgent } from "@copilotkit/react-core/v2";
import { format, parseISO } from "date-fns";

function ViewSlots({ args, status, respond }) {
  const { agent } = useAgent();

  const parsedDate = parseISO(args.slots[0].startTime);

  const appointmentDate = format(parsedDate, "MMM dd, yyyy");

  const handleRespond = (slot) => {
    agent.setState({
      ...agent.state,
      selected_slot_id: slot.slotId,
      selected_doctor: {
        id: args.doctorId,
        doctor_name: args.doctorName,
      },
    });

    respond?.({
      status: "appointment_slot_selected",
      doctorId: args.doctorId,
      doctorName: args.doctorName,
      date: appointmentDate,
      slotId: slot.slotId,
      next_action: "get conformation from user for booking final appointment ",
    });
  };

  return (
    <section className="border-border bg-card rounded-2xl border p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="text-primary size-4" />
        <h3 className="font-bold">Available times</h3>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Dr. {args.doctorName} · {appointmentDate}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {args?.slots?.map((slot) => (
          <Button
            key={slot.startTime}
            variant="outline"
            size="sm"
            disabled={status !== "executing" || !slot.slotId}
            onClick={() => handleRespond(slot)}
          >
            {format(parseISO(slot.startTime), "hh:mm a")}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default ViewSlots;
