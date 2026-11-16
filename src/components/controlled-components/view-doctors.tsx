import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "../ui/button";
import { useAgent } from "@copilotkit/react-core/v2";

type Doctor = { id: string; name: string; speciality: string; fee: string };

// const getTomorrowDate = () =>
//   new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

function ViewDoctors({ args, status, respond }) {
  const { agent } = useAgent();

  const handleSelect = (doctor: Partial<Doctor>) => {
    agent.setState({
      ...agent.state,
      selected_doctor: { id: doctor.id, doctor_name: doctor.name },
      // selected_appointment_date: getTomorrowDate(), // tomorrow, ISO
    });
    respond?.({
      status: "doctor_selected",
      doctorId: doctor.id,
      doctorName: doctor.name,
      // date: getTomorrowDate(),
      next_action:
        "search and view available slots for appointment with doctorId and date. call search_available_slots_for_appointment and view_slots_for_appointment with proper props",
    });
  };
  return (
    <section className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold">Doctors to explore</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Demo directory · verify details with the clinic
          </p>
        </div>
        <Stethoscope className="text-primary size-5" />
      </div>
      <div className="flex flex-col gap-2">
        {args?.map((doctor) => (
          <article
            key={doctor.id}
            className="border-border rounded-xl border p-3"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-xs font-black">
                {doctor.name.at(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold">{doctor.name}</h4>
                <p className="text-muted-foreground text-xs">
                  {doctor.speciality}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">4.5 Years</p>
                <p className="text-primary mt-1 text-xs font-semibold">
                  {doctor.fee} · 5.7
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  disabled={status !== "executing" || !doctor.id}
                  onClick={() => handleSelect(doctor)}
                >
                  View available slots <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ViewDoctors;
