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
    recurring_frequency: "weekly" as "daily" | "weekly" | "monthly",
    recurring_days: [] as number[],
    recurring_end_type: "until" as "until" | "occurrences",
    recurring_end_date: null as Date | null,
    recurring_occurrences: 10,
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

  const frequencyOptions = [
    { value: "daily", label: "Diariamente" },
    { value: "weekly", label: "Semanalmente" },
    { value: "monthly", label: "Mensualmente" }
  ];

  const endTypeOptions = [
    { value: "until", label: "Hasta fecha específica" },
    { value: "occurrences", label: "Número de ocurrencias" }
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
    if (!formData.date || !formData.start_time || !formData.end_time || !formData.room_id || !formData.course_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos, incluyendo el curso.",
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

      // Check for conflicts - more precise overlap detection
      const { data: conflicts } = await supabase
        .from('reservations')
        .select('id, title, start_datetime, end_datetime')
        .eq('room_id', formData.room_id)
        .in('status', ['confirmed', 'pending'])
        .or(`and(start_datetime.lt.${endDateTime.toISOString()},end_datetime.gt.${startDateTime.toISOString()})`);

      if (conflicts && conflicts.length > 0) {
        const conflictInfo = conflicts[0];
        const conflictStart = new Date(conflictInfo.start_datetime).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const conflictEnd = new Date(conflictInfo.end_datetime).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        toast({
          title: "Conflicto de horario",
          description: `La sala ya está reservada de ${conflictStart} a ${conflictEnd} (${conflictInfo.title}).`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const reservationData = {
        title: formData.title,
        description: formData.description,
        room_id: formData.room_id,
        course_id: formData.course_id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        event_type: formData.event_type as "class" | "lab" | "seminar" | "exam" | "meeting" | "event",
        attendee_count: parseInt(formData.attendee_count) || 0,
        equipment_needed: formData.equipment_needed as any,
        notes: formData.notes,
        status: 'pending' as "pending" | "confirmed" | "cancelled" | "completed",
        created_by: '00000000-0000-0000-0000-000000000000' // Development user ID
      };

      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();

      if (error) throw error;

      // Send email notifications for the new reservation
      try {
        await supabase.functions.invoke('send-notification-emails', {
          body: {
            reservationId: newReservation.id,
            eventType: 'created'
          }
        });
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't fail the reservation creation if emails fail
      }

      // If recurring, create multiple reservations
      if (formData.is_recurring) {
        const reservations = generateRecurringReservations();
        
        // Generate a unique recurring template ID for all related reservations
        const recurringTemplateId = crypto.randomUUID();
        
        // Create all recurring reservations with the same template ID
        for (const reservation of reservations) {
          // Check for conflicts for each recurring reservation
          const { data: recurringConflicts } = await supabase
            .from('reservations')
            .select('id, title, start_datetime, end_datetime')
            .eq('room_id', formData.room_id)
            .in('status', ['confirmed', 'pending'])
            .or(`and(start_datetime.lt.${reservation.end_datetime},end_datetime.gt.${reservation.start_datetime})`);

          if (!recurringConflicts || recurringConflicts.length === 0) {
            const { error: recurringError } = await supabase
              .from('reservations')
              .insert({
                ...reservationData,
                start_datetime: reservation.start_datetime,
                end_datetime: reservation.end_datetime,
                recurring_template_id: recurringTemplateId
              });
            
            if (recurringError) {
              console.error('Error creating recurring reservation:', recurringError);
            }
          }
        }

        // Update the first reservation with the recurring template ID
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ recurring_template_id: recurringTemplateId })
          .eq('id', newReservation.id);

        if (updateError) {
          console.error('Error updating first reservation with template ID:', updateError);
        }

        // Also create schedule template if course is selected
        if (formData.course_id && formData.recurring_days.length > 0) {
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
        recurring_frequency: "weekly",
        recurring_days: [],
        recurring_end_type: "until",
        recurring_end_date: null,
        recurring_occurrences: 10,
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

  const generateRecurringReservations = () => {
    if (!formData.date || !formData.is_recurring) return [];
    
    const reservations = [];
    let currentDate = new Date(formData.date);
    const maxIterations = formData.recurring_end_type === "occurrences" 
      ? formData.recurring_occurrences 
      : 365; // Max 1 year if no end date
    
    for (let i = 0; i < maxIterations; i++) {
      // Check if we've passed the end date
      if (formData.recurring_end_type === "until" && formData.recurring_end_date) {
        if (currentDate > formData.recurring_end_date) break;
      }
      
      let shouldAddReservation = false;
      
      if (formData.recurring_frequency === "daily") {
        shouldAddReservation = true;
      } else if (formData.recurring_frequency === "weekly") {
        shouldAddReservation = formData.recurring_days.includes(currentDate.getDay());
      } else if (formData.recurring_frequency === "monthly") {
        // For monthly, create on the same day of the month
        shouldAddReservation = currentDate.getDate() === formData.date.getDate();
      }
      
      if (shouldAddReservation && i > 0) { // Skip first occurrence since it's already created
        const startDateTime = new Date(currentDate);
        const [startHour, startMinute] = formData.start_time.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
        
        const endDateTime = new Date(currentDate);
        const [endHour, endMinute] = formData.end_time.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
        
        reservations.push({
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString()
        });
      }
      
      // Move to next occurrence
      if (formData.recurring_frequency === "daily") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (formData.recurring_frequency === "weekly") {
        currentDate.setDate(currentDate.getDate() + 1); // Check each day
      } else if (formData.recurring_frequency === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return reservations;
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
              <Label>Curso *</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="hover:bg-accent">
                      <div className="flex flex-col">
                        <span className="font-medium">{course.name}</span>
                        <span className="text-sm text-muted-foreground">{course.code}</span>
                      </div>
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
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
              />
              <Label htmlFor="is_recurring">Evento recurrente</Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* Frequency Selection */}
                <div>
                  <Label>Frecuencia</Label>
                  <Select 
                    value={formData.recurring_frequency} 
                    onValueChange={(value: any) => setFormData({ 
                      ...formData, 
                      recurring_frequency: value,
                      recurring_days: value === "daily" ? [] : formData.recurring_days
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Days Selection for Weekly */}
                {formData.recurring_frequency === "weekly" && (
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

                {/* End Condition */}
                <div className="space-y-3">
                  <Label>Finalizar</Label>
                  <Select 
                    value={formData.recurring_end_type} 
                    onValueChange={(value: any) => setFormData({ ...formData, recurring_end_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {endTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formData.recurring_end_type === "until" && (
                    <div>
                      <Label>Fecha límite</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.recurring_end_date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.recurring_end_date ? format(formData.recurring_end_date, "PPP") : "Seleccionar fecha límite"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.recurring_end_date}
                            onSelect={(date) => setFormData({ ...formData, recurring_end_date: date })}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {formData.recurring_end_type === "occurrences" && (
                    <div>
                      <Label htmlFor="occurrences">Número de ocurrencias</Label>
                      <Input
                        id="occurrences"
                        type="number"
                        value={formData.recurring_occurrences}
                        onChange={(e) => setFormData({ ...formData, recurring_occurrences: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="365"
                        placeholder="10"
                      />
                    </div>
                  )}
                </div>

                {/* Preview */}
                {(formData.recurring_frequency === "daily" || 
                  (formData.recurring_frequency === "weekly" && formData.recurring_days.length > 0) ||
                  formData.recurring_frequency === "monthly") && (
                  <div className="text-sm text-muted-foreground bg-background p-2 rounded border">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    <strong>Vista previa:</strong> Se crearán reservas {
                      formData.recurring_frequency === "daily" ? "diariamente" :
                      formData.recurring_frequency === "weekly" ? `cada ${formData.recurring_days.map(d => weekDays.find(wd => wd.value === d)?.label).join(", ")}` :
                      "mensualmente"
                    } {
                      formData.recurring_end_type === "until" && formData.recurring_end_date 
                        ? `hasta el ${format(formData.recurring_end_date, "dd/MM/yyyy")}`
                        : `por ${formData.recurring_occurrences} ocurrencias`
                    }
                  </div>
                )}
              </div>
            )}
          </div>

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