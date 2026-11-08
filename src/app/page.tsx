"use client";

import {
  CopilotSidebar,
  useComponent,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";
import z from "zod";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface propType {
  city: string;
}

interface AppointmentProps {
  args?: {
    slots?: string[];
  };
  status?: string;
  respond?: (response: string) => void;
}

export const Appointment: React.FC<AppointmentProps> = ({
  args,
  status,
  respond,
}) => {
  const [selected, setSelected] = useState("");
  const slots = args?.slots ?? [];

  // console.log({ slots });

  return (
    <div className="w-full max-w-[320px] rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 p-4 shadow-md">
      <div className="flex flex-col gap-3">
        <h1 className="font-semibold text-sm tracking-tight">
          Select Available Time Slot:
        </h1>
        {/* {slots.map((s, i) => (
            <p key={i}>{s}</p>
          ))} */}

        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">--Select--</option>
          {slots.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => respond?.(`Appointment booked at ${selected}`)}
            disabled={!selected || status == "completed"}
            className="w-full py-2 px-3 rounded-xl bg-green-600 text-white font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            disabled={status == "completed"}
            onClick={() => respond?.("Appointment cancelled by user")}
            className="w-full py-2 px-3 rounded-xl bg-red-600 text-white font-medium text-xs hover:bg-red-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const WeatherCard = ({ city }: propType) => {
    return (
      <div className="max-w-[300px] max-h-[400px] rounded-2xl bg-slate-300/50 p-4 text-black">
        The weather in {city} is 18 Degree Celsius
      </div>
    );
  };
  useComponent({
    name: "view_weather_card",
    description: "Display a weather card",
    parameters: z.object({
      city: z
        .string()
        .describe("the name of the city the weather information is for"),
    }),
    render: WeatherCard,
  });

  useHumanInTheLoop({
    agentId: "default",
    name: "book_appointment",
    description:
      "Ask the user to pick a available time slot for appointment. The picker UI presents available slots; the user's choice is returned to the agent.",
    parameters: z.object({
      slots: z
        .array(z.string())
        .describe("available time slots for appointment"),
    }),
    render: ({ args, status, respond }) => (
      <Appointment args={args} status={status} respond={respond} />
    ),
  });

  return (
    <main>
      <CopilotSidebar />
    </main>
  );
}
