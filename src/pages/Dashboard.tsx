import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wellness Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aquí registrarás tu estado diario.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entrenamientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aquí verás tus últimas sesiones.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;