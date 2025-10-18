import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderOpen, AlertCircleIcon, Users } from "lucide-react";

export default function DashboardStats({
  totalCases, pendingTasks, activeThirdParty, activeLabel, totalCasesDesc, pendingTasksDesc, activeThirdPartyDesc
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Cases</CardTitle>
          <CardDescription>{totalCasesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <span className="text-3xl font-bold">{totalCases}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
          <CardDescription>{pendingTasksDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <AlertCircleIcon className="h-6 w-6 text-primary" />
          </div>
          <span className="text-3xl font-bold">{pendingTasks}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{activeLabel}</CardTitle>
          <CardDescription>{activeThirdPartyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <span className="text-3xl font-bold">{activeThirdParty}</span>
        </CardContent>
      </Card>
    </div>
  );
}
