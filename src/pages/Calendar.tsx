import { CalendarView } from "@/components/calendar/CalendarView";
import { Toaster } from "@/components/ui/toaster";

export default function Calendar() {
  return (
    <div className="p-6">
      <CalendarView />
      <Toaster />
    </div>
  );
}