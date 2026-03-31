import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  user,
  validationErrors,
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
          validationErrors={validationErrors}
        />
      ) : (
        <ClientView
          caseData={caseData}
          setCaseData={setCaseData}
          updateClientField={updateClientField}
          removeClient={removeClient}
          addClient={addClient}
          user={user}
          validationErrors={validationErrors}
        />
      )}

      <StakeholderSection
        caseData={caseData}
        updateStakeholderField={updateStakeholderField}
        removeStakeholder={removeStakeholder}
        addStakeholder={addStakeholder}
        validationErrors={validationErrors}
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
