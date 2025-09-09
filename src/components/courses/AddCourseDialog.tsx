import { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const courseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  department: z.string().min(1, "El departamento es requerido"),
  credits: z.coerce.number().min(1, "Los créditos deben ser mayor a 0").max(10, "Máximo 10 créditos"),
  max_students: z.coerce.number().min(1, "La capacidad debe ser mayor a 0").max(200, "Máximo 200 estudiantes"),
  description: z.string().optional(),
  professor_id: z.string().optional(),
  academic_period_id: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface AddCourseDialogProps {
  onCourseAdded?: () => void;
}

interface Professor {
  id: string;
  full_name: string;
  email: string;
  department?: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  period_type: string;
  is_active: boolean;
}

export function AddCourseDialog({ onCourseAdded }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const { toast } = useToast();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      code: "",
      department: "",
      credits: 3,
      max_students: 30,
      description: "",
      professor_id: "",
      academic_period_id: "",
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

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [professorsRes, periodsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, department')
          .eq('role', 'professor'),
        supabase
          .from('academic_periods')
          .select('id, name, period_type, is_active')
          .eq('is_active', true)
      ]);

      if (professorsRes.data) setProfessors(professorsRes.data);
      if (periodsRes.data) setAcademicPeriods(periodsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("courses")
        .insert({
          name: data.name,
          code: data.code,
          department: data.department,
          credits: data.credits,
          max_students: data.max_students,
          description: data.description || null,
          professor_id: data.professor_id || null,
          academic_period_id: data.academic_period_id || null,
        });

      if (error) throw error;

      toast({
        title: "Curso agregado",
        description: "El curso se ha creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onCourseAdded?.();
    } catch (error) {
      console.error("Error adding course:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el curso. Inténtalo de nuevo.",
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
          Agregar Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Curso</DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo curso académico.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Curso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Matemáticas I" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MAT101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un departamento" />
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
                name="professor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesor Asignado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un profesor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {professors.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.full_name} - {professor.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créditos</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_students"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Estudiantes</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="academic_period_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período Académico</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin período</SelectItem>
                        {academicPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name} ({period.period_type})
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
                      placeholder="Descripción del curso, objetivos, metodología..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {loading ? "Agregando..." : "Agregar Curso"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}