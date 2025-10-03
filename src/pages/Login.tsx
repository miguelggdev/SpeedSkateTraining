import { Button } from "@/components/ui/button";

const Login = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary-foreground">
            Skater's Log
          </h1>
          <p className="mt-2 text-muted-foreground">
            Registro de entrenamiento para atletas de alto rendimiento.
          </p>
        </div>
        <Button className="w-full" size="lg">
          {/* We will add Google Icon and functionality later */}
          Iniciar Sesión con Google
        </Button>
      </div>
    </div>
  );
};

export default Login;