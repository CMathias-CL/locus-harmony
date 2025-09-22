import { useState, useEffect } from "react";
import { Plus, Search, GraduationCap, Clock, CheckCircle, XCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddProfessorDialog } from "@/components/professors/AddProfessorDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Professor {
  id: string;
  full_name: string;
  email?: string;  // Optional since non-admin users won't see emails
  phone?: string;
  department?: string;
  position?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Professors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfessors = async () => {
    try {
      // Check if current user is admin/coordinator to determine what data to fetch
      const { data: currentUser } = await supabase.auth.getUser();
      let isAdmin = false;
      
      if (currentUser?.user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.user.id)
          .single();
        
        isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'coordinator';
      }

      // Use different queries based on user permissions
      const { data, error } = isAdmin
        ? await supabase
            .from("profiles")
            .select("*")
            .eq("role", "professor")
            .order("created_at", { ascending: false })
        : await supabase
            .from("profiles")
            .select("id, full_name, department, position, role, created_at, updated_at")
            .eq("role", "professor")
            .order("created_at", { ascending: false });

      if (error) throw error;
      setProfessors(data || []);
    } catch (error) {
      console.error("Error fetching professors:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los profesores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const filteredProfessors = professors.filter((professor) => {
    const matchesSearch = 
      professor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || professor.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ["all", ...Array.from(new Set(professors.map(p => p.department).filter(Boolean)))];

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className="border-success text-success">
        <CheckCircle className="w-3 h-3 mr-1" />
        Activo
      </Badge>
    );
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      "Matemáticas": "bg-primary/10 text-primary border-primary/20",
      "Física": "bg-success/10 text-success border-success/20",
      "Química": "bg-accent text-accent-foreground border-accent",
      "Ingeniería": "bg-warning/10 text-warning border-warning/20",
      "Administración": "bg-destructive/10 text-destructive border-destructive/20",
      "Humanidades": "bg-secondary text-secondary-foreground border-secondary"
    };
    return colors[department as keyof typeof colors] || "bg-muted text-muted-foreground border-muted";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando profesores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Profesores</h1>
          <p className="text-muted-foreground">
            Administra profesores, competencias y disponibilidad
          </p>
        </div>
        <AddProfessorDialog onProfessorAdded={fetchProfessors} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {departments.map((dept) => (
                  <Button
                    key={dept}
                    variant={filterDepartment === dept ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterDepartment(dept)}
                  >
                    {dept === "all" ? "Todos Depts." : dept}
                  </Button>
                ))}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {professors.length}
            </div>
            <p className="text-xs text-muted-foreground">Total Profesores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {professors.filter(p => p.role === "professor").length}
            </div>
            <p className="text-xs text-muted-foreground">Profesores Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {departments.length - 1}
            </div>
            <p className="text-xs text-muted-foreground">Departamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Professors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessors.map((professor) => (
          <Card key={professor.id} className="transition-academic hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{professor.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {professor.position || professor.role}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(professor.role)}
                  {professor.department && (
                    <Badge variant="outline" className={getDepartmentColor(professor.department)}>
                      {professor.department}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                {professor.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{professor.email}</span>
                  </div>
                )}
                {professor.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{professor.phone}</span>
                  </div>
                )}
                {!professor.email && !professor.phone && (
                  <div className="text-sm text-muted-foreground">
                    Información de contacto no disponible
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Horarios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfessors.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay profesores disponibles</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm || filterDepartment !== "all" || filterStatus !== "all"
              ? "No se encontraron profesores con los filtros aplicados."
              : "Comienza agregando tu primer profesor."
            }
          </p>
        </div>
      )}
    </div>
  );
}