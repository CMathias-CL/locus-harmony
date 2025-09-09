import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const professorSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  department: z.string().min(1, "El departamento es requerido"),
  employee_id: z.string().optional(),
  specialization: z.string().optional(),
  degree: z.string().min(1, "El grado académico es requerido"),
  experience_years: z.coerce.number().min(0, "La experiencia debe ser mayor o igual a 0").max(50, "Máximo 50 años"),
  max_hours_per_week: z.coerce.number().min(1, "Las horas deben ser mayor a 0").max(60, "Máximo 60 horas"),
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  end_time: z.string().min(1, "La hora de fin es requerida"),
  available_days: z.array(z.number()).min(1, "Selecciona al menos un día disponible"),
  competencies: z.string().optional(),
  certifications: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

interface AddProfessorDialogProps {
  onProfessorAdded?: () => void;
}

export function AddProfessorDialog({ onProfessorAdded }: AddProfessorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      department: "",
      employee_id: "",
      specialization: "",
      degree: "",
      experience_years: 0,
      max_hours_per_week: 40,
      start_time: "08:00",
      end_time: "18:00",
      available_days: [],
      competencies: "",
      certifications: "",
      status: "active",
    },
  });

  const departments = [
    "Matemáticas",
    "Física", 
    "Química",
    "Ingeniería",
    "Administración",
    "Humanidades",
    "Ciencias Sociales",
    "Arte y Diseño",
    "Idiomas",
    "Educación Física"
  ];

  const degrees = [
    "Licenciatura",
    "Ingeniería",
    "Maestría",
    "Doctorado",
    "PhD",
    "Post-doctorado"
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

  const onSubmit = async (data: ProfessorFormData) => {
    setLoading(true);
    try {
      // Parse competencies and certifications from comma-separated strings
      const competenciesArray = data.competencies 
        ? data.competencies.split(",").map(c => c.trim()).filter(c => c.length > 0)
        : [];
      
      const certificationsArray = data.certifications 
        ? data.certifications.split(",").map(c => c.trim()).filter(c => c.length > 0)
        : [];

      const { error } = await supabase
        .from("profiles")
        .insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          department: data.department,
          role: 'professor',
          employee_id: data.employee_id || null,
          specialization: data.specialization || null,
          degree: data.degree,
          experience_years: data.experience_years,
          max_hours_per_week: data.max_hours_per_week,
          start_time: data.start_time,
          end_time: data.end_time,
          available_days: data.available_days,
          competencies: competenciesArray,
          certifications: certificationsArray,
          status: data.status,
        });

      if (error) throw error;

      toast({
        title: "Profesor agregado",
        description: "El profesor se ha creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onProfessorAdded?.();
    } catch (error) {
      console.error("Error adding professor:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el profesor. Inténtalo de nuevo.",
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
          Agregar Profesor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Profesor</DialogTitle>
          <DialogDescription>
            Completa la información personal, profesional y de disponibilidad del profesor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Dr. Juan Pérez García" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Empleado (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: EMP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="profesor@universidad.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+56 9 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Profesional</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grado Académico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona grado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {degrees.map((degree) => (
                            <SelectItem key={degree} value={degree}>
                              {degree}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Años de Experiencia</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialización (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Análisis Matemático, Física Cuántica, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Disponibilidad</h3>
              
              <FormField
                control={form.control}
                name="available_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días Disponibles</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={field.value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), day.value]);
                                } else {
                                  field.onChange(field.value?.filter(v => v !== day.value) || []);
                                }
                              }}
                            />
                            <label htmlFor={`day-${day.value}`} className="text-sm font-medium">
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_hours_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Máx./Semana</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Competencies & Certifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competencias y Certificaciones</h3>
              
              <FormField
                control={form.control}
                name="competencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competencias (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Matemáticas Avanzadas, Álgebra Linear, Cálculo Diferencial (separado por comas)"
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificaciones (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Certificación en Docencia Universitaria, Inglés Avanzado (separado por comas)"
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="on_leave">En Licencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {loading ? "Agregando..." : "Agregar Profesor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}