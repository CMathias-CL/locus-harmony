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

const roomSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  room_type: z.string().min(1, "El tipo de sala es requerido"),
  capacity: z.coerce.number().min(1, "La capacidad debe ser mayor a 0"),
  floor: z.coerce.number().min(1, "El piso debe ser mayor a 0"),
  description: z.string().optional(),
  features: z.string().optional(),
  faculty_id: z.string().min(1, "La facultad es requerida"),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface AddRoomDialogProps {
  onRoomAdded?: () => void;
  faculties?: any[];
  onFacultiesRefresh?: () => void;
}

export function AddRoomDialog({ onRoomAdded, faculties: externalFaculties, onFacultiesRefresh }: AddRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      code: "",
      room_type: "",
      capacity: 1,
      floor: 1,
      description: "",
      features: "",
      faculty_id: "",
    },
  });

  useEffect(() => {
    if (externalFaculties) {
      setFaculties(externalFaculties);
    } else {
      const fetchFaculties = async () => {
        try {
          const { data, error } = await supabase
            .from("faculties")
            .select("*")
            .order("name");

          if (error) throw error;
          setFaculties(data || []);
        } catch (error) {
          console.error("Error fetching faculties:", error);
        }
      };

      fetchFaculties();
      
      // Listen for faculty creation events
      const handleFacultyCreated = () => {
        fetchFaculties();
      };
      
      window.addEventListener('facultyCreated', handleFacultyCreated);
      
      return () => {
        window.removeEventListener('facultyCreated', handleFacultyCreated);
      };
    }
  }, [externalFaculties]);

  const onSubmit = async (data: RoomFormData) => {
    setLoading(true);
    try {
      // Parse features from comma-separated string to JSON array
      const featuresArray = data.features 
        ? data.features.split(",").map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const { error } = await supabase
        .from("rooms")
        .insert({
          name: data.name,
          code: data.code,
          room_type: data.room_type,
          capacity: data.capacity,
          floor: data.floor,
          description: data.description || null,
          features: featuresArray,
          faculty_id: data.faculty_id,
        });

      if (error) throw error;

      toast({
        title: "Sala agregada",
        description: "La sala se ha creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onRoomAdded?.();
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la sala. Inténtalo de nuevo.",
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
          Agregar Sala
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Sala</DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva sala.
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
                    <Input placeholder="Ej: Aula 101"  {...field} />
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
                    <Input placeholder="Ej: A101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faculty_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facultad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una facultad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {faculty.name} ({faculty.campus})
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
              name="room_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sala</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Aula">Aula</SelectItem>
                      <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                      <SelectItem value="Auditorio">Auditorio</SelectItem>
                      <SelectItem value="Sala de Reuniones">Sala de Reuniones</SelectItem>
                      <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piso</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Características</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Proyector, WiFi, Aire Acondicionado (separado por comas)" 
                      {...field} 
                    />
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
                      placeholder="Descripción adicional de la sala"
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
                {loading ? "Agregando..." : "Agregar Sala"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}