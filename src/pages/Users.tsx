import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPermissionsDialog } from "@/components/users/UserPermissionsDialog";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { Settings, Shield, Users as UsersIcon, UserPlus, AlertCircle } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  position?: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, department, position, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(`Error de permisos: ${error.message}`);
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("No se pudieron cargar los usuarios. Verifique los permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "coordinator":
        return "default";
      case "professor":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "coordinator":
        return "Coordinador";
      case "professor":
        return "Profesor";
      case "student":
        return "Estudiante";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: {users.length} usuarios
          </div>
          <AddUserDialog
            onUserAdded={fetchUsers}
            trigger={
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Usuario
              </Button>
            }
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Error de Acceso</p>
          </div>
          <p className="text-sm mt-1 text-destructive/80">{error}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            Esto puede deberse a políticas de seguridad. Asegúrese de tener los permisos necesarios.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuarios y Permisos del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol Base</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.department || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.position || "-"}
                  </TableCell>
                  <TableCell>
                    <UserPermissionsDialog
                      user={user}
                      onPermissionsUpdated={fetchUsers}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Permisos
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}