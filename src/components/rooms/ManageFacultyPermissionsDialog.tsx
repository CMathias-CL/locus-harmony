import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const permissionsSchema = z.object({
  can_manage_all_faculties: z.boolean(),
  faculty_permissions: z.array(z.string()),
});

type PermissionsFormData = z.infer<typeof permissionsSchema>;

interface ManageFacultyPermissionsDialogProps {
  userId?: string;
  currentPermissions?: {
    can_manage_all_faculties: boolean;
    faculty_permissions: string[];
  };
  onPermissionsUpdated?: () => void;
}

export function ManageFacultyPermissionsDialog({ 
  userId, 
  currentPermissions, 
  onPermissionsUpdated 
}: ManageFacultyPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<PermissionsFormData>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      can_manage_all_faculties: currentPermissions?.can_manage_all_faculties || false,
      faculty_permissions: currentPermissions?.faculty_permissions || [],
    },
  });

  useEffect(() => {
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

    if (open) {
      fetchFaculties();
    }
  }, [open]);

  const onSubmit = async (data: PermissionsFormData) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          can_manage_all_faculties: data.can_manage_all_faculties,
          faculty_permissions: data.faculty_permissions,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Permisos actualizados",
        description: "Los permisos de facultad se han actualizado exitosamente.",
      });

      setOpen(false);
      onPermissionsUpdated?.();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los permisos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Gestionar Permisos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Permisos de Facultad</DialogTitle>
          <DialogDescription>
            Configura qué facultades puede administrar este usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="can_manage_all_faculties"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Administrar todas las facultades
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Permite administrar todas las facultades y salas
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!form.watch("can_manage_all_faculties") && (
              <FormField
                control={form.control}
                name="faculty_permissions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Facultades específicas</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Selecciona las facultades que puede administrar
                      </p>
                    </div>
                    {faculties.map((faculty) => (
                      <FormField
                        key={faculty.id}
                        control={form.control}
                        name="faculty_permissions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={faculty.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(faculty.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, faculty.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== faculty.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {faculty.name} ({faculty.campus})
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {loading ? "Guardando..." : "Guardar Permisos"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}