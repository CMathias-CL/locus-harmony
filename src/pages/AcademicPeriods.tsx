import { useState, useEffect } from "react";
import { Plus, Search, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddAcademicPeriodDialog } from "@/components/periods/AddAcademicPeriodDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AcademicPeriod {
  id: string;
  name: string;
  period_type: 'semester' | 'trimester' | 'quarter' | 'annual';
  start_date: string;
  end_date: string;
  enrollment_start?: string;
  enrollment_end?: string;
  max_courses_per_student?: number;
  is_active: boolean;
  is_current?: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function AcademicPeriods() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_periods")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error("Error fetching academic periods:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los períodos académicos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const filteredPeriods = periods.filter((period) => {
    const matchesSearch = 
      period.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      period.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || period.period_type === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && period.is_active) ||
      (filterStatus === "inactive" && !period.is_active) ||
      (filterStatus === "current" && period.is_current);
    return matchesSearch && matchesType && matchesStatus;
  });

  const periodTypes = ["all", "semester", "trimester", "quarter", "annual"];
  const statusFilters = ["all", "active", "inactive", "current"];

  const getPeriodTypeLabel = (type: string) => {
    const labels = {
      semester: "Semestre",
      trimester: "Trimestre", 
      quarter: "Cuatrimestre",
      annual: "Anual"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (period: AcademicPeriod) => {
    if (period.is_current) {
      return (
        <Badge variant="outline" className="border-primary text-primary">
          <Clock className="w-3 h-3 mr-1" />
          Actual
        </Badge>
      );
    }
    if (period.is_active) {
      return (
        <Badge variant="outline" className="border-success text-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  const isEnrollmentOpen = (period: AcademicPeriod) => {
    if (!period.enrollment_start || !period.enrollment_end) return false;
    const now = new Date();
    const enrollmentStart = new Date(period.enrollment_start);
    const enrollmentEnd = new Date(period.enrollment_end);
    return now >= enrollmentStart && now <= enrollmentEnd;
  };

  const toggleActivePeriod = async (periodId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("academic_periods")
        .update({ is_active: !currentStatus })
        .eq("id", periodId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Período desactivado" : "Período activado",
        description: `El período académico ha sido ${currentStatus ? 'desactivado' : 'activado'} exitosamente.`,
      });

      fetchPeriods();
    } catch (error) {
      console.error("Error updating period:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el período académico.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando períodos académicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Períodos Académicos</h1>
          <p className="text-muted-foreground">
            Configura y administra períodos académicos y calendarios
          </p>
        </div>
        <AddAcademicPeriodDialog onPeriodAdded={fetchPeriods} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {periodTypes.map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === "all" ? "Todos" : getPeriodTypeLabel(type)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === "all" ? "Todos" : 
                   status === "active" ? "Activos" :
                   status === "inactive" ? "Inactivos" : "Actual"}
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
              {periods.length}
            </div>
            <p className="text-xs text-muted-foreground">Total Períodos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {periods.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {periods.filter(p => p.is_current).length}
            </div>
            <p className="text-xs text-muted-foreground">Período Actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {periods.filter(p => isEnrollmentOpen(p)).length}
            </div>
            <p className="text-xs text-muted-foreground">Inscripciones Abiertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Periods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeriods.map((period) => (
          <Card key={period.id} className="transition-academic hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{period.name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {getPeriodTypeLabel(period.period_type)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(period)}
                  {isEnrollmentOpen(period) && (
                    <Badge variant="outline" className="border-blue-500 text-blue-700">
                      Inscripciones Abiertas
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Period Dates */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Período:</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {format(new Date(period.start_date), "dd MMM yyyy", { locale: es })} - {" "}
                  {format(new Date(period.end_date), "dd MMM yyyy", { locale: es })}
                </p>
              </div>

              {/* Enrollment Dates */}
              {period.enrollment_start && period.enrollment_end && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Inscripciones:</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    {format(new Date(period.enrollment_start), "dd MMM yyyy", { locale: es })} - {" "}
                    {format(new Date(period.enrollment_end), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
              )}

              {/* Max Courses */}
              {period.max_courses_per_student && (
                <div className="text-sm">
                  <span className="font-medium">Máx. cursos por estudiante:</span> {period.max_courses_per_student}
                </div>
              )}

              {/* Description */}
              {period.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {period.description}
                </p>
              )}

              <div className="pt-2 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button 
                    variant={period.is_active ? "destructive" : "default"} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toggleActivePeriod(period.id, period.is_active)}
                  >
                    {period.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPeriods.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay períodos académicos disponibles</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "No se encontraron períodos con los filtros aplicados."
              : "Comienza agregando tu primer período académico."
            }
          </p>
        </div>
      )}
    </div>
  );
}