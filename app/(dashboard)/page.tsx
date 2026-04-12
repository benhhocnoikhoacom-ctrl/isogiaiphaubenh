import { Users, Calendar, Activity, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      name: "Total Patients",
      value: "1,234",
      icon: Users,
      change: "+12.5%",
      trend: "up"
    },
    {
      name: "Appointments Today",
      value: "24",
      icon: Calendar,
      change: "+2.4%",
      trend: "up"
    },
    {
      name: "Active Treatments",
      value: "156",
      icon: Activity,
      change: "-1.5%",
      trend: "down"
    },
    {
      name: "Revenue",
      value: "$45,231",
      icon: TrendingUp,
      change: "+15.2%",
      trend: "up"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here is an overview of your clinc's performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.name}
              </h3>
              <stat.icon className="h-4 w-4 text-primary text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stat.value}</div>
              <span className={`text-xs font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm col-span-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[400px]">
          <p className="text-zinc-500 font-medium">Analytics Chart Placeholder</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm col-span-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[400px]">
          <p className="text-zinc-500 font-medium">Recent Activity Placeholder</p>
        </div>
      </div>
    </div>
  );
}
