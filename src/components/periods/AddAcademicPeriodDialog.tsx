import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const academicPeriodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  period_type: z.enum(["semester", "trimester", "quarter", "annual"], {
    required_error: "Selecciona un tipo de período"
  }),
  start_date: z.date({
    required_error: "La fecha de inicio es requerida"
  }),
  end_date: z.date({
    required_error: "La fecha de fin es requerida"
  }),
  enrollment_start: z.date().optional(),
  enrollment_end: z.date().optional(),
  max_courses_per_student: z.coerce.number().min(1, "Debe ser mayor a 0").max(15, "Máximo 15 cursos").optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
  is_current: z.boolean(),
}).refine(
  (data) => data.end_date > data.start_date,
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end_date"]
  }
).refine(
  (data) => {
    if (data.enrollment_start && data.enrollment_end) {
      return data.enrollment_end > data.enrollment_start;
    }
    return true;
  },
  {
    message: "La fecha de fin de inscripciones debe ser posterior al inicio",
    path: ["enrollment_end"]
  }
);

type AcademicPeriodFormData = z.infer<typeof academicPeriodSchema>;

interface AddAcademicPeriodDialogProps {
  onPeriodAdded?: () => void;
}

export function AddAcademicPeriodDialog({ onPeriodAdded }: AddAcademicPeriodDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AcademicPeriodFormData>({
    resolver: zodResolver(academicPeriodSchema),
    defaultValues: {
      name: "",
      period_type: "semester",
      max_courses_per_student: 6,
      description: "",
      is_active: true,
      is_current: false,
    },
  });

  const periodTypes = [
    { value: "semester", label: "Semestre" },
    { value: "trimester", label: "Trimestre" },
    { value: "quarter", label: "Cuatrimestre" },
    { value: "annual", label: "Anual" }
  ];

  const onSubmit = async (data: AcademicPeriodFormData) => {
    setLoading(true);
    try {
      // If this period is set as current, unset any existing current period
      if (data.is_current) {
        await supabase
          .from("academic_periods")
          .update({ is_current: false })
          .eq("is_current", true);
      }

      const { error } = await supabase
        .from("academic_periods")
        .insert({
          name: data.name,
          period_type: data.period_type,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date.toISOString().split('T')[0],
          enrollment_start: data.enrollment_start ? data.enrollment_start.toISOString().split('T')[0] : null,
          enrollment_end: data.enrollment_end ? data.enrollment_end.toISOString().split('T')[0] : null,
          max_courses_per_student: data.max_courses_per_student || null,
          description: data.description || null,
          is_active: data.is_active,
          is_current: data.is_current,
        });

      if (error) throw error;

      toast({
        title: "Período académico agregado",
        description: "El período académico se ha creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onPeriodAdded?.();
    } catch (error) {
      console.error("Error adding academic period:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el período académico. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Período
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Período Académico</DialogTitle>
          <DialogDescription>
            Configura las fechas y parámetros del nuevo período académico.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Período</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Semestre 2024-1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Período</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción del período académico, notas especiales, etc."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Period Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fechas del Período</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Fin</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("start_date");
                              return date < new Date() || (startDate && date <= startDate);
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enrollment Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fechas de Inscripciones (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enrollment_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Inicio de Inscripciones</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enrollment_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fin de Inscripciones</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const enrollmentStart = form.getValues("enrollment_start");
                              return date < new Date() || (enrollmentStart && date <= enrollmentStart);
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración</h3>
              
              <FormField
                control={form.control}
                name="max_courses_per_student"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo Cursos por Estudiante (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="15" 
                        placeholder="6"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Período Activo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Los períodos activos aparecen disponibles para asignación de cursos
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_current"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Período Actual</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Solo un período puede estar marcado como actual (se desactivará el anterior)
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Período"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}