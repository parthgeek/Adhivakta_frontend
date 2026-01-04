import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Trash2, PlusCircle } from "lucide-react";
import LawyerView from "./LawyerView";
import ClientView from "./ClientView";
import StakeholderSection from "./StakeholderSection";

export default function AssociatedPartiesTab({
  caseData,
  setCaseData,
  isLawyer,
  updateClientField,
  removeClient,
  addClient,
  addStakeholder,
  updateStakeholderField,
  removeStakeholder,
  isSubmitting,
  handleSubmit,
  router,
  user
}) {
  return (
    <Card>
      {isLawyer ? (
        <LawyerView
          caseData={caseData}
          setCaseData={setCaseData}
          updateClientField={updateClientField}
          removeClient={removeClient}
          addClient={addClient}
          user={user}
        />
      ) : (
        <ClientView caseData={caseData} setCaseData={setCaseData} />
      )}

      <StakeholderSection
        caseData={caseData}
        updateStakeholderField={updateStakeholderField}
        removeStakeholder={removeStakeholder}
        addStakeholder={addStakeholder}
      />

      <CardFooter className="flex justify-between mt-6 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
          Cancel
        </Button>
        <Button type="button" onClick={(e) => handleSubmit(e, "all")} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Case"}
        </Button>
      </CardFooter>
    </Card>
  );
}