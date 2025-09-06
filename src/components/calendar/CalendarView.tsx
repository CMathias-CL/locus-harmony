import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { NewReservationDialog } from "./NewReservationDialog";

interface Reservation {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  event_type: string;
  status: string;
  room: {
    name: string;
    code: string;
  };
  course?: {
    name: string;
    code: string;
  };
  created_by: {
    full_name: string;
  };
}

interface Room {
  id: string;
  name: string;
  code: string;
  capacity: number;
  room_type: string;
  building?: {
    name: string;
  };
}

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const getEventColor = (type: string, status: string) => {
  if (status === "pending") return "bg-warning/20 border-warning text-warning-foreground";
  if (status === "cancelled") return "bg-destructive/20 border-destructive text-destructive-foreground";
  
  switch (type) {
    case "class":
      return "bg-primary/20 border-primary text-primary-foreground";
    case "lab":
      return "bg-success/20 border-success text-success-foreground";
    case "seminar":
      return "bg-purple-500/20 border-purple-500 text-purple-700";
    case "exam":
      return "bg-orange-500/20 border-orange-500 text-orange-700";
    case "meeting":
      return "bg-blue-500/20 border-blue-500 text-blue-700";
    case "event":
      return "bg-indigo-500/20 border-indigo-500 text-indigo-700";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "Pendiente";
    case "confirmed": return "Confirmado";
    case "cancelled": return "Cancelado";
    case "completed": return "Completado";
    default: return status;
  }
};

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case "class": return "Clase";
    case "lab": return "Laboratorio";
    case "seminar": return "Seminario";
    case "exam": return "Examen";
    case "meeting": return "Reunión";
    case "event": return "Evento";
    default: return type;
  }
};

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [currentDate, selectedRoom, viewMode]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id, name, code, capacity, room_type,
          buildings (name)
        `)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const startDate = viewMode === "week" 
        ? startOfWeek(currentDate, { weekStartsOn: 1 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      const endDate = viewMode === "week"
        ? endOfWeek(currentDate, { weekStartsOn: 1 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

      let query = supabase
        .from('reservations')
        .select(`
          id, title, start_datetime, end_datetime, event_type, status,
          room:rooms (name, code),
          course:courses (name, code),
          created_by:profiles (full_name)
        `)
        .gte('start_datetime', startDate.toISOString())
        .lte('start_datetime', endDate.toISOString())
        .order('start_datetime');

      if (selectedRoom !== "all") {
        query = query.eq('room_id', selectedRoom);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getReservationsForTimeSlot = (date: Date, timeSlot: string) => {
    const slotStart = new Date(date);
    const [hour] = timeSlot.split(':');
    slotStart.setHours(parseInt(hour), 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 1);

    return reservations.filter(reservation => {
      const resStart = new Date(reservation.start_datetime);
      const resEnd = new Date(reservation.end_datetime);
      
      return (
        (resStart >= slotStart && resStart < slotEnd) ||
        (resEnd > slotStart && resEnd <= slotEnd) ||
        (resStart <= slotStart && resEnd >= slotEnd)
      );
    });
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-sm font-medium text-muted-foreground p-2">
              Hora
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="text-sm font-medium text-center p-2">
                <div>{format(day, "EEE", { locale: es })}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
            ))}
          </div>
          
          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm text-muted-foreground p-2 font-mono border-r">
                {time}
              </div>
              {weekDays.map((day) => {
                const dayReservations = getReservationsForTimeSlot(day, time);
                
                return (
                  <div
                    key={`${day.toISOString()}-${time}`}
                    className="min-h-[80px] border border-border rounded-md p-1 hover:bg-accent/50 transition-academic relative"
                  >
                    {dayReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className={`p-2 rounded text-xs font-medium border mb-1 ${getEventColor(reservation.event_type, reservation.status)}`}
                      >
                        <div className="font-semibold truncate">{reservation.title}</div>
                        <div className="truncate">{reservation.room?.name}</div>
                        {reservation.course && (
                          <div className="text-xs opacity-75 truncate">{reservation.course.code}</div>
                        )}
                        <Badge variant="outline" className="text-xs mt-1">
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const dayReservations = getReservationsForTimeSlot(currentDate, time);
            
            return (
              <div key={time} className="flex gap-4">
                <div className="w-20 text-sm text-muted-foreground font-mono py-4">
                  {time}
                </div>
                <div className="flex-1 min-h-[80px] border border-border rounded-md p-2 hover:bg-accent/50 transition-academic">
                  {dayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-3 rounded text-sm font-medium border mb-2 ${getEventColor(reservation.event_type, reservation.status)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{reservation.title}</div>
                          <div className="text-sm mt-1">
                            {reservation.room?.name} ({reservation.room?.code})
                          </div>
                          {reservation.course && (
                            <div className="text-sm mt-1">{reservation.course.name}</div>
                          )}
                          <div className="text-xs mt-1 opacity-75">
                            {format(new Date(reservation.start_datetime), "HH:mm")} - {format(new Date(reservation.end_datetime), "HH:mm")}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs">
                            {getEventTypeLabel(reservation.event_type)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getStatusLabel(reservation.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona horarios y reservas de salas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por sala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las salas</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewReservationDialog
            trigger={
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reserva
              </Button>
            }
          />
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => viewMode === "week" ? navigateWeek("prev") : navigateDay("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => viewMode === "week" ? navigateWeek("next") : navigateDay("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold">
                {viewMode === "week" 
                  ? `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d 'de' MMMM", { locale: es })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d 'de' MMMM, yyyy", { locale: es })}`
                  : format(currentDate, "d 'de' MMMM, yyyy", { locale: es })
                }
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
          {loading ? (
            <div className="text-center py-8">Cargando calendario...</div>
          ) : (
            viewMode === "week" ? renderWeekView() : renderDayView()
          )}
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
              <div className="w-4 h-4 rounded border border-orange-500 bg-orange-500/20"></div>
              <span className="text-sm">Exámenes</span>
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