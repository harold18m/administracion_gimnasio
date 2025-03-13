
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface GymClass {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  spots: string;
  category: string;
}

const classes: GymClass[] = [
  {
    id: "1",
    name: "Crossfit",
    instructor: "Marcos Ruiz",
    time: "8:00 AM",
    duration: "45 min",
    spots: "5/15",
    category: "intensivo",
  },
  {
    id: "2",
    name: "Yoga",
    instructor: "Lucía González",
    time: "10:00 AM",
    duration: "60 min",
    spots: "10/12",
    category: "relajación",
  },
  {
    id: "3",
    name: "Spinning",
    instructor: "Daniel Torres",
    time: "5:30 PM",
    duration: "45 min",
    spots: "2/20",
    category: "cardio",
  },
  {
    id: "4",
    name: "Pilates",
    instructor: "Carmen Vega",
    time: "7:00 PM",
    duration: "50 min",
    spots: "8/10",
    category: "flexibilidad",
  },
];

const categoryColors = {
  intensivo: "bg-red-100 text-red-800",
  relajación: "bg-blue-100 text-blue-800",
  cardio: "bg-orange-100 text-orange-800",
  flexibilidad: "bg-purple-100 text-purple-800",
};

export function UpcomingClasses() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Próximas Clases</CardTitle>
        <CardDescription>Clases programadas para hoy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.map((gymClass) => (
            <div
              key={gymClass.id}
              className="flex flex-col space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{gymClass.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {gymClass.instructor}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    categoryColors[
                      gymClass.category as keyof typeof categoryColors
                    ]
                  }
                >
                  {gymClass.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {gymClass.time} ({gymClass.duration})
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {gymClass.spots}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
