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
  email: string;
  phone?: string;
  department?: string;
  employee_id?: string;
  specialization?: string;
  degree?: string;
  experience_years?: number;
  max_hours_per_week?: number;
  available_days?: number[];
  start_time?: string;
  end_time?: string;
  competencies?: string[];
  certifications?: string[];
  status: 'active' | 'inactive' | 'on_leave';
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
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
      professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || professor.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || professor.status === filterStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = ["all", ...Array.from(new Set(professors.map(p => p.department).filter(Boolean)))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-success text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Activo
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="border-destructive text-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Inactivo
          </Badge>
        );
      case "on_leave":
        return (
          <Badge variant="outline" className="border-warning text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Licencia
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      "Matemáticas": "bg-blue-100 text-blue-800 border-blue-200",
      "Física": "bg-green-100 text-green-800 border-green-200",
      "Química": "bg-purple-100 text-purple-800 border-purple-200",
      "Ingeniería": "bg-orange-100 text-orange-800 border-orange-200",
      "Administración": "bg-red-100 text-red-800 border-red-200",
      "Humanidades": "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return colors[department as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
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
                  placeholder="Buscar por nombre, email o ID empleado..."
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
            <div className="flex gap-2">
              {["all", "active", "inactive", "on_leave"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === "all" ? "Todos" : 
                   status === "active" ? "Activos" :
                   status === "inactive" ? "Inactivos" : "Licencia"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {professors.filter(p => p.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {professors.filter(p => p.status === "on_leave").length}
            </div>
            <p className="text-xs text-muted-foreground">En Licencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {Math.round(professors.reduce((sum, p) => sum + (p.experience_years || 0), 0) / professors.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Años Experiencia Prom.</p>
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
                    {professor.employee_id && `ID: ${professor.employee_id}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(professor.status)}
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="truncate">{professor.email}</span>
                </div>
                {professor.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{professor.phone}</span>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              <div className="space-y-2">
                {professor.degree && (
                  <div className="flex items-center text-sm">
                    <GraduationCap className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{professor.degree}</span>
                  </div>
                )}
                {professor.specialization && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Especialización:</span> {professor.specialization}
                  </p>
                )}
                {professor.experience_years && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Experiencia:</span> {professor.experience_years} años
                  </p>
                )}
              </div>

              {/* Availability */}
              {professor.available_days && professor.available_days.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Disponibilidad:</p>
                  <div className="flex flex-wrap gap-1">
                    {professor.available_days.map((day) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {daysOfWeek[day]}
                      </Badge>
                    ))}
                  </div>
                  {professor.start_time && professor.end_time && (
                    <p className="text-xs text-muted-foreground">
                      {professor.start_time} - {professor.end_time}
                      {professor.max_hours_per_week && ` (${professor.max_hours_per_week}h/sem)`}
                    </p>
                  )}
                </div>
              )}

              {/* Competencies */}
              {professor.competencies && professor.competencies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Competencias:</p>
                  <div className="flex flex-wrap gap-1">
                    {professor.competencies.slice(0, 3).map((competency, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {competency}
                      </Badge>
                    ))}
                    {professor.competencies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{professor.competencies.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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