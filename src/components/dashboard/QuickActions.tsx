import { Plus, Calendar, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewReservationDialog } from "@/components/calendar/NewReservationDialog";
import { useNavigate } from "react-router-dom";

const quickActions = [
  {
    title: "Nueva Reserva",
    description: "Reservar una sala disponible",
    icon: Plus,
    variant: "gradient" as const,
  },
  {
    title: "Ver Calendario",
    description: "Consultar horarios del día",
    icon: Calendar,
    variant: "default" as const,
  },
  {
    title: "Gestionar Salas",
    description: "Administrar espacios",
    icon: Building2,
    variant: "secondary" as const,
  },
  {
    title: "Usuarios",
    description: "Gestionar profesores",
    icon: Users,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleActionClick = (actionTitle: string) => {
    switch (actionTitle) {
      case "Ver Calendario":
        navigate("/calendar");
        break;
      case "Gestionar Salas":
        navigate("/rooms");
        break;
      case "Usuarios":
        navigate("/users");
        break;
      default:
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            if (action.title === "Nueva Reserva") {
              return (
                <NewReservationDialog
                  key={action.title}
                  trigger={
                    <Button
                      variant={action.variant}
                      className="h-auto p-4 flex-col items-start text-left space-y-2 w-full"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <action.icon className="h-4 w-4" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-xs opacity-80 font-normal">
                        {action.description}
                      </span>
                    </Button>
                  }
                />
              );
            }

            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex-col items-start text-left space-y-2"
                onClick={() => handleActionClick(action.title)}
              >
                <div className="flex items-center space-x-2 w-full">
                  <action.icon className="h-4 w-4" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-xs opacity-80 font-normal">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}