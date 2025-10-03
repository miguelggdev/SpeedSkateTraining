import { NavLink } from "react-router-dom";
import { BarChart, LayoutDashboard, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { to: "/profile", icon: <User className="h-5 w-5" />, label: "Perfil" },
    { to: "/reports", icon: <BarChart className="h-5 w-5" />, label: "Reportes" },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-foreground text-center">Skater's Log</h1>
      </div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-3 p-2">
            <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                <AvatarFallback>SK</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold text-sm">Skater Name</p>
                <p className="text-xs text-muted-foreground">skater@example.com</p>
            </div>
        </div>
         <Button variant="ghost" className="w-full justify-start mt-2">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;