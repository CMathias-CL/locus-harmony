import { useState, useEffect } from "react";
import { Plus, Search, MapPin, Users, Monitor, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddRoomDialog } from "@/components/rooms/AddRoomDialog";
import { NewReservationDialog } from "@/components/calendar/NewReservationDialog";
import { supabase } from "@/integrations/supabase/client";

const mockRooms = [
  {
    id: 1,
    name: "Aula 101",
    type: "Aula",
    capacity: 30,
    location: "Edificio A - Piso 1",
    status: "available",
    features: ["Proyector", "WiFi", "Aire Acondicionado"],
    nextReservation: "10:00 - 12:00",
  },
  {
    id: 2,
    name: "Laboratorio 3",
    type: "Laboratorio",
    capacity: 20,
    location: "Edificio B - Piso 2",
    status: "occupied",
    features: ["Computadores", "Proyector", "WiFi"],
    currentClass: "Física Experimental",
  },
  {
    id: 3,
    name: "Auditorio",
    type: "Auditorio",
    capacity: 150,
    location: "Edificio Principal",
    status: "maintenance",
    features: ["Sistema de Audio", "Proyector", "WiFi", "Accesibilidad"],
    maintenanceUntil: "15:00",
  },
  {
    id: 4,
    name: "Aula 205",
    type: "Aula",
    capacity: 25,
    location: "Edificio A - Piso 2",
    status: "available",
    features: ["Pizarra Digital", "WiFi"],
    nextReservation: "14:00 - 16:00",
  },
  {
    id: 5,
    name: "Sala de Juntas",
    type: "Sala de Reuniones",
    capacity: 12,
    location: "Edificio Administrativo",
    status: "reserved",
    features: ["Mesa de Conferencia", "Proyector", "WiFi"],
    reservedBy: "Reunión Académica",
  },
  {
    id: 6,
    name: "Laboratorio 1",
    type: "Laboratorio",
    capacity: 15,
    location: "Edificio B - Piso 1",
    status: "available",
    features: ["Computadores", "Software Especializado", "WiFi"],
    nextReservation: "16:00 - 18:00",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "available":
      return (
        <Badge variant="outline" className="border-success text-success">
          Disponible
        </Badge>
      );
    case "occupied":
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          Ocupada
        </Badge>
      );
    case "blocked":
      return (
        <Badge variant="outline" className="border-warning text-warning">
          Bloqueada
        </Badge>
      );
    case "maintenance":
      return (
        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
          Mantenimiento
        </Badge>
      );
    default:
      return null;
  }
};

const getStatusDetails = (room: any) => {
  switch (room.status) {
    case "available":
      return "Sin reservas activas";
    case "occupied":
      return "Actualmente ocupada";
    case "blocked":
      return "Bloqueada temporalmente";
    case "maintenance":
      return "En mantenimiento";
    default:
      return "";
  }
};

export default function Rooms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [rooms, setRooms] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          faculties (
            id,
            name,
            code,
            campus
          )
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Keep mock data as fallback
      setRooms(mockRooms);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchRooms();
    fetchFaculties();
    
    // Listen for navigation from faculties page
    const handleNavigateToRooms = (event: CustomEvent) => {
      if (event.detail?.facultyId) {
        setFilterFaculty(event.detail.facultyId);
      }
    };
    
    window.addEventListener('navigateToRooms', handleNavigateToRooms as EventListener);
    
    return () => {
      window.removeEventListener('navigateToRooms', handleNavigateToRooms as EventListener);
    };
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.faculties?.name && room.faculties.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || room.room_type === filterType;
    const matchesFaculty = filterFaculty === "all" || room.faculty_id === filterFaculty;
    return matchesSearch && matchesType && matchesFaculty;
  });

  const roomTypes = ["all", ...Array.from(new Set(rooms.map(room => room.room_type).filter(Boolean)))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Salas</h1>
          <p className="text-muted-foreground">
            Administra espacios y consulta disponibilidad
          </p>
        </div>
        <AddRoomDialog 
          onRoomAdded={fetchRooms} 
          faculties={faculties}
          onFacultiesRefresh={fetchFaculties}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar salas por nombre o facultad..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <Button
                  key="all-faculties"
                  variant={filterFaculty === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterFaculty("all")}
                >
                  Todas las Facultades
                </Button>
                {faculties.map((faculty) => (
                  <Button
                    key={faculty.id}
                    variant={filterFaculty === faculty.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterFaculty(faculty.id)}
                  >
                    {faculty.code}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {roomTypes.map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(type)}
                  >
                    {type === "all" ? "Todos los Tipos" : type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {rooms.filter(r => r.status === "available").length}
            </div>
            <p className="text-xs text-muted-foreground">Salas Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {rooms.filter(r => r.status === "occupied").length}
            </div>
            <p className="text-xs text-muted-foreground">Salas Ocupadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {rooms.filter(r => r.status === "blocked").length}
            </div>
            <p className="text-xs text-muted-foreground">Salas Bloqueadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {rooms.filter(r => r.status === "maintenance").length}
            </div>
            <p className="text-xs text-muted-foreground">En Mantenimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="transition-academic hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{room.name}</CardTitle>
                {getStatusBadge(room.status)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                {room.faculties?.name || "Sin facultad"} - Piso {room.floor}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{room.room_type}</span>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  {room.capacity} personas
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Características:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(room.features) && room.features.map((feature: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {getStatusDetails(room)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalles
                </Button>
                {room.status === "available" && (
                  <NewReservationDialog
                    trigger={
                      <Button variant="default" size="sm" className="flex-1">
                        Reservar
                      </Button>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}