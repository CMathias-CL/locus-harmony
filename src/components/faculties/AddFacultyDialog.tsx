import { useState } from "react";
import { Plus, Palette } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const facultySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  campus: z.string().min(1, "El campus es requerido"),
  description: z.string().optional(),
  color: z.string().min(1, "El color es requerido"),
});

type FacultyFormData = z.infer<typeof facultySchema>;

interface AddFacultyDialogProps {
  onFacultyAdded?: () => void;
}

export function AddFacultyDialog({ onFacultyAdded }: AddFacultyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: "",
      code: "",
      campus: "",
      description: "",
      color: "#3B82F6",
    },
  });

  const onSubmit = async (data: FacultyFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("faculties")
        .insert({
          name: data.name,
          code: data.code,
          campus: data.campus,
          description: data.description || null,
          color: data.color,
        });

      if (error) throw error;

      toast({
        title: "Facultad agregada",
        description: "La facultad se ha creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onFacultyAdded?.();
      
      // Trigger a global refresh event for faculties
      window.dispatchEvent(new CustomEvent('facultyCreated'));
    } catch (error) {
      console.error("Error adding faculty:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la facultad. Inténtalo de nuevo.",
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
          Agregar Facultad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Facultad</DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva facultad.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Facultad de Ingeniería" {...field} />
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
                    <Input placeholder="Ej: ING" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="campus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campus</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Campus Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la facultad"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                        style={{ backgroundColor: field.value }}
                        onClick={() => document.getElementById('color-picker')?.click()}
                      />
                      <input
                        id="color-picker"
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="opacity-0 w-0 h-0"
                      />
                      <Input
                        {...field}
                        placeholder="#3B82F6"
                        className="font-mono text-sm"
                      />
                      <Palette className="w-4 h-4 text-muted-foreground" />
                    </div>
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
                {loading ? "Agregando..." : "Agregar Facultad"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}