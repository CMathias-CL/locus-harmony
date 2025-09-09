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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const academicPeriodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  period_type: z.enum(["semester", "trimester", "quarter", "module"], {
    required_error: "Selecciona un tipo de período"
  }),
  start_date: z.date({
    required_error: "La fecha de inicio es requerida"
  }),
  end_date: z.date({
    required_error: "La fecha de fin es requerida"
  }),
  is_active: z.boolean(),
}).refine(
  (data) => data.end_date > data.start_date,
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end_date"]
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
      is_active: true,
    },
  });

  const periodTypes = [
    { value: "semester", label: "Semestre" },
    { value: "trimester", label: "Trimestre" },
    { value: "quarter", label: "Cuatrimestre" },
    { value: "module", label: "Módulo" }
  ];

  const onSubmit = async (data: AcademicPeriodFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("academic_periods")
        .insert({
          name: data.name,
          period_type: data.period_type,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date.toISOString().split('T')[0],
          is_active: data.is_active,
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
        <Button variant="default">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Período
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Período Académico</DialogTitle>
          <DialogDescription>
            Configura las fechas y parámetros del nuevo período académico.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Agregando..." : "Agregar Período"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}