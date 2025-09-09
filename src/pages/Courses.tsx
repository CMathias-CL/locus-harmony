import { useState, useEffect } from "react";
import { Plus, Search, BookOpen, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  department: string;
  description?: string;
  max_students: number;
  professor_id?: string;
  academic_period_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  academic_periods?: {
    name: string;
    period_type: string;
  };
}

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:professor_id (full_name, email),
          academic_periods (name, period_type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || course.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ["all", ...Array.from(new Set(courses.map(course => course.department).filter(Boolean)))];

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
          <p className="mt-4 text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h1>
          <p className="text-muted-foreground">
            Administra cursos académicos y asigna profesores
          </p>
        </div>
        <AddCourseDialog onCourseAdded={fetchCourses} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código o departamento..."
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
                  {dept === "all" ? "Todos" : dept}
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
              {courses.length}
            </div>
            <p className="text-xs text-muted-foreground">Total Cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {courses.filter(c => c.professor_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Con Profesor Asignado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {courses.filter(c => !c.professor_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Sin Profesor</p>
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

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="transition-academic hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {course.code}
                  </p>
                </div>
                <Badge variant="outline" className={getDepartmentColor(course.department)}>
                  {course.department}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.credits} créditos
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  Máx. {course.max_students}
                </div>
              </div>

              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <GraduationCap className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Profesor:</span>
                  <span className="ml-1 font-medium">
                    {course.profiles?.full_name || "Sin asignar"}
                  </span>
                </div>
                
                {course.academic_periods && (
                  <div className="text-sm text-muted-foreground">
                    Período: {course.academic_periods.name}
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

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay cursos disponibles</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm || filterDepartment !== "all" 
              ? "No se encontraron cursos con los filtros aplicados."
              : "Comienza agregando tu primer curso."
            }
          </p>
        </div>
      )}
    </div>
  );
}