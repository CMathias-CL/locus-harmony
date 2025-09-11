import { useState, useEffect } from "react";
import { Search, School, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddFacultyDialog } from "@/components/faculties/AddFacultyDialog";
import { supabase } from "@/integrations/supabase/client";

export default function Faculties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from("faculties")
        .select(`
          *,
          rooms (count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaculties(data || []);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const filteredFaculties = faculties.filter((faculty) => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.campus.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Facultades</h1>
          <p className="text-muted-foreground">
            Administra facultades y campus universitarios
          </p>
        </div>
        <AddFacultyDialog onFacultyAdded={fetchFaculties} />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facultades por nombre, código o campus..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {faculties.length}
            </div>
            <p className="text-xs text-muted-foreground">Total Facultades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-secondary">
              {new Set(faculties.map(f => f.campus)).size}
            </div>
            <p className="text-xs text-muted-foreground">Campus Diferentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-accent">
              {faculties.reduce((total, faculty) => total + (faculty.rooms?.[0]?.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Salas</p>
          </CardContent>
        </Card>
      </div>

      {/* Faculties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculties.map((faculty) => (
          <Card key={faculty.id} className="transition-academic hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <School className="w-5 h-5 mr-2 text-primary" />
                  {faculty.name}
                </CardTitle>
                <Badge variant="outline" className="text-primary border-primary">
                  {faculty.code}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                {faculty.campus}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {faculty.description && (
                <p className="text-sm text-muted-foreground">
                  {faculty.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium">Salas asignadas:</span>
                <Badge variant="secondary">
                  {faculty.rooms?.[0]?.count || 0} salas
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalles
                </Button>
                <Button variant="default" size="sm" className="flex-1">
                  Gestionar Permisos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}