import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const events = [
  {
    id: 1,
    title: "Matemáticas I",
    room: "Aula 101",
    professor: "Prof. García",
    time: "08:00 - 10:00",
    type: "class",
    status: "confirmed",
  },
  {
    id: 2,
    title: "Física Experimental",
    room: "Lab. 3",
    professor: "Prof. Martínez",
    time: "10:30 - 12:00",
    type: "lab",
    status: "confirmed",
  },
  {
    id: 3,
    title: "Seminario Investigación",
    room: "Auditorio",
    professor: "Prof. López",
    time: "14:00 - 16:00",
    type: "seminar",
    status: "pending",
  },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const rooms = ["Aula 101", "Aula 102", "Lab. 1", "Lab. 2", "Lab. 3", "Auditorio"];

const getEventColor = (type: string, status: string) => {
  if (status === "pending") return "bg-warning/20 border-warning text-warning";
  
  switch (type) {
    case "class":
      return "bg-primary/20 border-primary text-primary";
    case "lab":
      return "bg-success/20 border-success text-success";
    case "seminar":
      return "bg-purple-500/20 border-purple-500 text-purple-700";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona horarios y reservas de salas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold">
                Semana del 4 - 10 de Septiembre, 2024
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Día
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Semana
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="text-sm font-medium text-muted-foreground p-2">
                  Hora
                </div>
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day} className="text-sm font-medium text-center p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Time Slots */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-sm text-muted-foreground p-2 font-mono">
                    {time}
                  </div>
                  {Array.from({ length: 7 }, (_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="min-h-[60px] border border-border rounded-md p-1 hover:bg-accent/50 transition-academic"
                    >
                      {/* Sample events for demonstration */}
                      {time === "08:00" && dayIndex === 0 && (
                        <div className={`p-2 rounded text-xs font-medium border ${getEventColor("class", "confirmed")}`}>
                          <div className="font-semibold">Matemáticas I</div>
                          <div>Aula 101</div>
                        </div>
                      )}
                      {time === "10:00" && dayIndex === 1 && (
                        <div className={`p-2 rounded text-xs font-medium border ${getEventColor("lab", "confirmed")}`}>
                          <div className="font-semibold">Física Exp.</div>
                          <div>Lab. 3</div>
                        </div>
                      )}
                      {time === "14:00" && dayIndex === 2 && (
                        <div className={`p-2 rounded text-xs font-medium border ${getEventColor("seminar", "pending")}`}>
                          <div className="font-semibold">Seminario</div>
                          <div>Auditorio</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border border-primary bg-primary/20"></div>
              <span className="text-sm">Clases Regulares</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border border-success bg-success/20"></div>
              <span className="text-sm">Laboratorios</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border border-purple-500 bg-purple-500/20"></div>
              <span className="text-sm">Seminarios</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border border-warning bg-warning/20"></div>
              <span className="text-sm">Pendiente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}