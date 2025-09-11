import { useState, useEffect } from "react";
import { Calendar, Download, CheckSquare, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  code: string;
  building_id: string;
  floor: number;
  faculty_id: string;
  faculties: {
    name: string;
    code: string;
  };
}

interface CleaningReport {
  id: string;
  room_id: string;
  cleaning_date: string;
  is_cleaned: boolean;
  cleaned_by: string;
  cleaned_at: string;
  observations: any;
  notes: string;
  rooms: Room;
}

interface ObservationType {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function CleaningReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cleaningReports, setCleaningReports] = useState<CleaningReport[]>([]);
  const [observationTypes, setObservationTypes] = useState<ObservationType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          faculties (name, code)
        `)
        .order("name");

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchCleaningReports = async () => {
    try {
      const { data, error } = await supabase
        .from("cleaning_reports")
        .select(`
          *,
          rooms (
            id,
            name,
            code,
            building_id,
            floor,
            faculty_id,
            faculties (name, code)
          )
        `)
        .eq("cleaning_date", selectedDate);

      if (error) throw error;
      // Convert observations from JSON to array if needed
      const processedData = (data || []).map(report => ({
        ...report,
        observations: Array.isArray(report.observations) ? report.observations : []
      }));
      setCleaningReports(processedData);
    } catch (error) {
      console.error("Error fetching cleaning reports:", error);
    }
  };

  const fetchObservationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("cleaning_observation_types")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) throw error;
      setObservationTypes(data || []);
    } catch (error) {
      console.error("Error fetching observation types:", error);
    }
  };

  const generateDailyReports = async () => {
    try {
      const existingReports = cleaningReports.map(r => r.room_id);
      const roomsToCreate = rooms.filter(room => !existingReports.includes(room.id));

      if (roomsToCreate.length > 0) {
        const newReports = roomsToCreate.map(room => ({
          room_id: room.id,
          cleaning_date: selectedDate,
          is_cleaned: false,
          observations: [],
          notes: ""
        }));

        const { error } = await supabase
          .from("cleaning_reports")
          .insert(newReports);

        if (error) throw error;

        toast({
          title: "Reportes generados",
          description: `Se generaron ${roomsToCreate.length} reportes de limpieza para el día seleccionado.`,
        });

        fetchCleaningReports();
      } else {
        toast({
          title: "Reportes existentes",
          description: "Ya existen reportes para todas las salas en esta fecha.",
        });
      }
    } catch (error) {
      console.error("Error generating reports:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los reportes.",
        variant: "destructive",
      });
    }
  };

  const updateCleaningStatus = async (reportId: string, isCompleted: boolean, cleanedBy?: string) => {
    try {
      const updateData: any = {
        is_cleaned: isCompleted,
        cleaned_at: isCompleted ? new Date().toISOString() : null,
      };

      if (cleanedBy) {
        updateData.cleaned_by = cleanedBy;
      }

      const { error } = await supabase
        .from("cleaning_reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) throw error;

      fetchCleaningReports();
    } catch (error) {
      console.error("Error updating cleaning status:", error);
    }
  };

  const updateObservations = async (reportId: string, observations: string[], notes?: string) => {
    try {
      const { error } = await supabase
        .from("cleaning_reports")
        .update({ 
          observations,
          notes: notes || ""
        })
        .eq("id", reportId);

      if (error) throw error;

      fetchCleaningReports();
    } catch (error) {
      console.error("Error updating observations:", error);
    }
  };

  const printReport = () => {
    window.print();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRooms(),
        fetchCleaningReports(),
        fetchObservationTypes()
      ]);
      setLoading(false);
    };
    
    fetchData();
  }, [selectedDate]);

  const completedRooms = cleaningReports.filter(r => r.is_cleaned).length;
  const totalRooms = cleaningReports.length;
  const roomsWithObservations = cleaningReports.filter(r => Array.isArray(r.observations) && r.observations.length > 0).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes de Limpieza</h1>
          <p className="text-muted-foreground">
            Gestión diaria de limpieza de aulas y espacios
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateDailyReports} variant="outline">
            <CheckSquare className="w-4 h-4 mr-2" />
            Generar Reportes del Día
          </Button>
          <Button onClick={printReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-primary" />
            <div className="space-y-2">
              <Label htmlFor="cleaning-date">Fecha de limpieza</Label>
              <Input
                id="cleaning-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {totalRooms}
            </div>
            <p className="text-xs text-muted-foreground">Total Salas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-secondary">
              {completedRooms}
            </div>
            <p className="text-xs text-muted-foreground">Salas Limpiadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {totalRooms - completedRooms}
            </div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {roomsWithObservations}
            </div>
            <p className="text-xs text-muted-foreground">Con Observaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Cleaning Reports List */}
      <div className="space-y-4">
        {cleaningReports.map((report) => (
          <CleaningReportCard
            key={report.id}
            report={report}
            observationTypes={observationTypes}
            onUpdateStatus={updateCleaningStatus}
            onUpdateObservations={updateObservations}
          />
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      )}

      {!loading && cleaningReports.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin reportes para esta fecha</h3>
            <p className="text-muted-foreground mb-4">
              No hay reportes de limpieza generados para el {selectedDate}
            </p>
            <Button onClick={generateDailyReports}>
              Generar Reportes del Día
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CleaningReportCardProps {
  report: CleaningReport;
  observationTypes: ObservationType[];
  onUpdateStatus: (reportId: string, isCompleted: boolean, cleanedBy?: string) => void;
  onUpdateObservations: (reportId: string, observations: string[], notes?: string) => void;
}

function CleaningReportCard({ 
  report, 
  observationTypes, 
  onUpdateStatus, 
  onUpdateObservations 
}: CleaningReportCardProps) {
  const [cleanedBy, setCleanedBy] = useState(report.cleaned_by || "");
  const [selectedObservations, setSelectedObservations] = useState<string[]>(
    Array.isArray(report.observations) ? report.observations : []
  );
  const [notes, setNotes] = useState(report.notes || "");

  const handleStatusChange = (checked: boolean) => {
    if (checked && !cleanedBy.trim()) {
      alert("Por favor ingresa el nombre de quien realizó la limpieza");
      return;
    }
    onUpdateStatus(report.id, checked, cleanedBy);
  };

  const handleObservationChange = (observationId: string, checked: boolean) => {
    const newObservations = checked
      ? [...selectedObservations, observationId]
      : selectedObservations.filter(id => id !== observationId);
    
    setSelectedObservations(newObservations);
    onUpdateObservations(report.id, newObservations, notes);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    onUpdateObservations(report.id, selectedObservations, newNotes);
  };

  return (
    <Card className={`transition-all ${report.is_cleaned ? 'bg-accent/5 border-primary/20' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {report.rooms.name} ({report.rooms.code})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={report.is_cleaned ? "default" : "secondary"}>
              {report.is_cleaned ? "Limpiada" : "Pendiente"}
            </Badge>
            {selectedObservations.length > 0 && (
              <Badge variant="destructive">
                {selectedObservations.length} observaciones
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {report.rooms.faculties?.name} - Piso {report.rooms.floor}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cleaning Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`cleaned-${report.id}`}
              checked={report.is_cleaned}
              onCheckedChange={handleStatusChange}
            />
            <Label htmlFor={`cleaned-${report.id}`}>Limpieza completada</Label>
          </div>
          {!report.is_cleaned && (
            <Input
              placeholder="Nombre del responsable"
              value={cleanedBy}
              onChange={(e) => setCleanedBy(e.target.value)}
              className="max-w-48"
            />
          )}
          {report.is_cleaned && report.cleaned_by && (
            <span className="text-sm text-muted-foreground">
              Por: {report.cleaned_by}
            </span>
          )}
        </div>

        {/* Observations */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Observaciones detectadas:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {observationTypes.map((observation) => (
              <div key={observation.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`obs-${report.id}-${observation.id}`}
                  checked={selectedObservations.includes(observation.id)}
                  onCheckedChange={(checked) => 
                    handleObservationChange(observation.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`obs-${report.id}-${observation.id}`}
                  className="text-sm cursor-pointer"
                >
                  {observation.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor={`notes-${report.id}`} className="text-sm font-medium">
            Notas adicionales:
          </Label>
          <Textarea
            id={`notes-${report.id}`}
            placeholder="Observaciones adicionales..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={2}
          />
        </div>

        {report.cleaned_at && (
          <p className="text-xs text-muted-foreground">
            Limpiada el {new Date(report.cleaned_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}