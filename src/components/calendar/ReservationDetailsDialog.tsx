import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, User, Book, AlertCircle, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  event_type: string;
  status: string;
  description?: string;
  notes?: string;
  attendee_count?: number;
  equipment_needed?: any[];
  recurring_template_id?: string;
  room: {
    name: string;
    code: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
  };
  created_by: {
    full_name: string;
  } | null;
}

interface ReservationDetailsDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReservationUpdated?: () => void;
}

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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "Pendiente";
    case "confirmed": return "Confirmado";
    case "cancelled": return "Cancelado";
    case "completed": return "Completado";
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "warning";
    case "confirmed": return "success";
    case "cancelled": return "destructive";
    case "completed": return "secondary";
    default: return "secondary";
  }
};

export function ReservationDetailsDialog({ 
  reservation, 
  open, 
  onOpenChange, 
  onReservationUpdated 
}: ReservationDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelType, setCancelType] = useState<"single" | "all" | null>(null);
  const { toast } = useToast();

  if (!reservation) return null;

  const isRecurring = !!reservation.recurring_template_id;
  const canCancel = reservation.status !== "cancelled" && reservation.status !== "completed";

  const handleCancelReservation = async (type: "single" | "all") => {
    setIsLoading(true);
    try {
      if (type === "single") {
        // Cancelar solo esta reserva
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservation.id);

        if (error) throw error;

        toast({
          title: "Reserva cancelada",
          description: "La reserva ha sido cancelada exitosamente.",
        });
      } else {
        // Cancelar todas las reservas de la serie recurrente
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('recurring_template_id', reservation.recurring_template_id);

        if (error) throw error;

        toast({
          title: "Serie de reservas cancelada",
          description: "Todas las reservas de la serie recurrente han sido canceladas.",
        });
      }

      onReservationUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCancelType(null);
    }
  };

  const CancelButton = () => {
    if (!canCancel) return null;

    if (isRecurring) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Cancelar Reserva
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Reserva Recurrente</AlertDialogTitle>
              <AlertDialogDescription>
                Esta reserva es parte de una serie recurrente. ¿Qué deseas cancelar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleCancelReservation("single")}
                disabled={isLoading}
              >
                Solo esta reserva
              </Button>
              <AlertDialogAction
                onClick={() => handleCancelReservation("all")}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Toda la serie
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Cancelar Reserva
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCancelReservation("single")}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold pr-6">
              {reservation.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(reservation.status) as any}>
                {getStatusLabel(reservation.status)}
              </Badge>
              {isRecurring && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  Recurrente
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Fecha y hora</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(reservation.start_datetime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Horario</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(reservation.start_datetime), "HH:mm")} - {format(new Date(reservation.end_datetime), "HH:mm")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Ubicación</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.room.name} ({reservation.room.code})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Creado por</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.created_by?.full_name || 'Usuario no disponible'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalles del evento */}
          <div className="space-y-4">
            <h3 className="font-semibold">Detalles del evento</h3>
            
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium">Tipo de evento</p>
                <p className="text-sm text-muted-foreground">
                  {getEventTypeLabel(reservation.event_type)}
                </p>
              </div>

              {reservation.course && (
                <div className="flex items-center gap-3">
                  <Book className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Curso</p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.course.name} ({reservation.course.code})
                    </p>
                  </div>
                </div>
              )}

              {reservation.attendee_count !== undefined && reservation.attendee_count > 0 && (
                <div>
                  <p className="text-sm font-medium">Asistentes esperados</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.attendee_count} personas
                  </p>
                </div>
              )}

              {reservation.description && (
                <div>
                  <p className="text-sm font-medium">Descripción</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.description}
                  </p>
                </div>
              )}

              {reservation.equipment_needed && reservation.equipment_needed.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Equipamiento necesario</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reservation.equipment_needed.map((equipment, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {reservation.notes && (
                <div>
                  <p className="text-sm font-medium">Notas adicionales</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <Separator />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                {isRecurring ? "Esta es una reserva recurrente" : "Reserva individual"}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <CancelButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}