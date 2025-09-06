import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  code: string;
  capacity: number;
  room_type: string;
  features: string[];
  building?: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  period_type: string;
}

export function NewReservationDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    room_id: "",
    course_id: "",
    date: null as Date | null,
    start_time: "",
    end_time: "",
    event_type: "class" as const,
    attendee_count: "",
    equipment_needed: [] as string[],
    notes: "",
    is_recurring: false,
    recurring_days: [] as number[],
    academic_period_id: ""
  });

  const eventTypes = [
    { value: "class", label: "Clase Regular" },
    { value: "lab", label: "Laboratorio" },
    { value: "seminar", label: "Seminario" },
    { value: "exam", label: "Examen" },
    { value: "meeting", label: "Reunión" },
    { value: "event", label: "Evento" }
  ];

  const equipmentOptions = [
    "projector", "computer", "whiteboard", "microphone", 
    "sound_system", "video_conference", "laboratory_equipment"
  ];

  const weekDays = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" }
  ];

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [roomsRes, coursesRes, periodsRes] = await Promise.all([
        supabase.from('rooms').select(`
          id, name, code, capacity, room_type, features,
          buildings (name)
        `),
        supabase.from('courses').select('id, name, code'),
        supabase.from('academic_periods').select('id, name, period_type').eq('is_active', true)
      ]);

      if (roomsRes.data) setRooms(roomsRes.data as Room[]);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (periodsRes.data) setAcademicPeriods(periodsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.start_time || !formData.end_time || !formData.room_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(formData.date);
      const [startHour, startMinute] = formData.start_time.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(formData.date);
      const [endHour, endMinute] = formData.end_time.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', formData.room_id)
        .eq('status', 'confirmed')
        .or(`start_datetime.lte.${endDateTime.toISOString()},end_datetime.gte.${startDateTime.toISOString()}`);

      if (conflicts && conflicts.length > 0) {
        toast({
          title: "Conflicto de horario",
          description: "La sala ya está reservada en ese horario.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const reservationData = {
        title: formData.title,
        description: formData.description,
        room_id: formData.room_id,
        course_id: formData.course_id || null,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        event_type: formData.event_type as "class" | "lab" | "seminar" | "exam" | "meeting" | "event",
        attendee_count: parseInt(formData.attendee_count) || 0,
        equipment_needed: formData.equipment_needed as any,
        notes: formData.notes,
        status: 'pending' as "pending" | "confirmed" | "cancelled" | "completed"
      };

      const { error } = await supabase
        .from('reservations')
        .insert(reservationData);

      if (error) throw error;

      // If recurring, create schedule template
      if (formData.is_recurring && formData.course_id && formData.recurring_days.length > 0) {
        const templatePromises = formData.recurring_days.map(day => 
          supabase.from('schedule_templates').insert([{
            course_id: formData.course_id,
            room_id: formData.room_id,
            day_of_week: day,
            start_time: formData.start_time,
            end_time: formData.end_time,
            event_type: formData.event_type
          }])
        );
        await Promise.all(templatePromises);
      }

      toast({
        title: "Reserva creada",
        description: "La reserva se ha creado exitosamente.",
      });

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        room_id: "",
        course_id: "",
        date: null,
        start_time: "",
        end_time: "",
        event_type: "class",
        attendee_count: "",
        equipment_needed: [],
        notes: "",
        is_recurring: false,
        recurring_days: [],
        academic_period_id: ""
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la reserva.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Nueva Reserva</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Matemáticas I - Clase Regular"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada de la actividad..."
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="start_time">Hora Inicio *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">Hora Fin *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Room and Course Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Sala *</Label>
              <Select value={formData.room_id} onValueChange={(value) => setFormData({ ...formData, room_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex flex-col">
                        <span>{room.name} ({room.code})</span>
                        <span className="text-sm text-muted-foreground">
                          {room.building?.name} - Capacidad: {room.capacity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Curso (Opcional)</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event Type and Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={formData.event_type} onValueChange={(value: any) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="attendee_count">Número de Asistentes</Label>
              <Input
                id="attendee_count"
                type="number"
                value={formData.attendee_count}
                onChange={(e) => setFormData({ ...formData, attendee_count: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Equipment Needed */}
          <div>
            <Label>Equipamiento Necesario</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {equipmentOptions.map((equipment) => (
                <div key={equipment} className="flex items-center space-x-2">
                  <Checkbox
                    id={equipment}
                    checked={formData.equipment_needed.includes(equipment)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          equipment_needed: [...formData.equipment_needed, equipment]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          equipment_needed: formData.equipment_needed.filter(e => e !== equipment)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={equipment} className="text-sm">
                    {equipment.replace('_', ' ').charAt(0).toUpperCase() + equipment.replace('_', ' ').slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Schedule */}
          {formData.course_id && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
                />
                <Label htmlFor="is_recurring">Horario recurrente (para el semestre)</Label>
              </div>

              {formData.is_recurring && (
                <div>
                  <Label>Días de la semana</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {weekDays.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={formData.recurring_days.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                recurring_days: [...formData.recurring_days, day.value]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                recurring_days: formData.recurring_days.filter(d => d !== day.value)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales, requisitos especiales, etc."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Reserva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}