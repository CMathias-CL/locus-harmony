import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Building, 
  BookOpen, 
  UserCheck, 
  GraduationCap, 
  School, 
  ClipboardList, 
  Users,
  Shield,
  Eye,
  Plus,
  Edit,
  Trash
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  position?: string;
}

interface UserPermission {
  id: string;
  user_id: string;
  module: string;
  action: string;
  granted: boolean;
}

interface UserPermissionsDialogProps {
  user: User;
  onPermissionsUpdated: () => void;
  trigger: React.ReactNode;
}

const modules = [
  {
    key: 'reservations',
    name: 'Calendario/Reservas',
    icon: Calendar,
    description: 'Gestión de reservas de salas y calendario'
  },
  {
    key: 'rooms',
    name: 'Salas',
    icon: Building,
    description: 'Administración de salas y espacios'
  },
  {
    key: 'courses',
    name: 'Cursos',
    icon: BookOpen,
    description: 'Gestión de cursos académicos'
  },
  {
    key: 'professors',
    name: 'Profesores',
    icon: UserCheck,
    description: 'Administración de profesores'
  },
  {
    key: 'academic_periods',
    name: 'Períodos Académicos',
    icon: GraduationCap,
    description: 'Gestión de períodos académicos'
  },
  {
    key: 'faculties',
    name: 'Facultades',
    icon: School,
    description: 'Administración de facultades'
  },
  {
    key: 'cleaning_reports',
    name: 'Reportes de Limpieza',
    icon: ClipboardList,
    description: 'Gestión de reportes de limpieza'
  },
  {
    key: 'users',
    name: 'Usuarios',
    icon: Users,
    description: 'Administración de usuarios y permisos'
  }
];

const actions = [
  { key: 'view', name: 'Ver', icon: Eye, description: 'Visualizar información' },
  { key: 'create', name: 'Crear', icon: Plus, description: 'Crear nuevos elementos' },
  { key: 'edit', name: 'Editar', icon: Edit, description: 'Modificar elementos existentes' },
  { key: 'delete', name: 'Eliminar', icon: Trash, description: 'Eliminar elementos' },
  { key: 'manage_all', name: 'Gestión Total', icon: Shield, description: 'Acceso completo al módulo' }
];

export function UserPermissionsDialog({ user, onPermissionsUpdated, trigger }: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const { toast } = useToast();

  const fetchUserPermissions = async () => {
    if (!open) return;
    
    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [open]);

  const hasPermission = (module: string, action: string): boolean => {
    const permission = permissions.find(p => p.module === module && p.action === action);
    return permission?.granted || false;
  };

  const updatePermission = async (module: string, action: string, granted: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("user_permissions")
        .upsert({
          user_id: user.id,
          module: module as any,
          action: action as any,
          granted,
          granted_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Update local state
      setPermissions(prev => {
        const existing = prev.find(p => p.module === module && p.action === action);
        if (existing) {
          return prev.map(p => 
            p.module === module && p.action === action 
              ? { ...p, granted } 
              : p
          );
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            user_id: user.id,
            module,
            action,
            granted
          }];
        }
      });

      toast({
        title: "Permisos actualizados",
        description: `${granted ? 'Otorgado' : 'Revocado'} permiso ${actions.find(a => a.key === action)?.name} en ${modules.find(m => m.key === module)?.name}`,
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el permiso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "coordinator": return "default";
      case "professor": return "secondary";
      case "student": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "coordinator": return "Coordinador";
      case "professor": return "Profesor";
      case "student": return "Estudiante";
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos de Usuario
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 mt-2">
              <span><strong>{user.full_name}</strong> ({user.email})</span>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Configure los permisos específicos por módulo para este usuario. 
              Los administradores tienen acceso completo por defecto.
            </p>
          </DialogDescription>
        </DialogHeader>

        {user.role === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Los administradores tienen acceso completo a todos los módulos por defecto.
              Los permisos configurados aquí no aplicarán para usuarios con rol de administrador.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {modules.map((module) => {
            const ModuleIcon = module.icon;
            return (
              <Card key={module.key} className={user.role === 'admin' ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ModuleIcon className="h-5 w-5" />
                    {module.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {actions.map((action) => {
                      const ActionIcon = action.icon;
                      const isManageAll = action.key === 'manage_all';
                      const hasManageAll = hasPermission(module.key, 'manage_all');
                      const currentPermission = hasPermission(module.key, action.key);
                      
                      return (
                        <div key={action.key} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${module.key}-${action.key}`}
                              checked={currentPermission}
                              disabled={loading || user.role === 'admin' || (!isManageAll && hasManageAll)}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, action.key, checked)
                              }
                            />
                            <Label 
                              htmlFor={`${module.key}-${action.key}`}
                              className={`text-sm font-medium flex items-center gap-1 ${
                                (!isManageAll && hasManageAll) ? 'text-muted-foreground' : ''
                              }`}
                            >
                              <ActionIcon className="h-3 w-3" />
                              {action.name}
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {hasPermission(module.key, 'manage_all') && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      Este usuario tiene gestión total del módulo, por lo que tiene todos los permisos automáticamente.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}