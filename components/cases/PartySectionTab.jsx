
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Trash2, Shield, Swords, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

function PartyForm({
  party,
  idx,
  partyList,
  fieldKey,
  setCaseData,
  nameError,
  showAdvocateField,
}) {
  const advocateName =
    fieldKey === "petitioners"
      ? party.advocateName || ""
      : party.opposingCounsel || "";

  const update = (field, value) => {
    const arr = [...partyList];
    arr[idx] = { ...arr[idx], [field]: value };
    setCaseData((prev) => ({ ...prev, [fieldKey]: arr }));
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-background">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {party.label || (fieldKey === "petitioners" ? "Petitioner" : "Defendant")} {idx + 1}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
          onClick={() =>
            setCaseData((prev) => ({
              ...prev,
              [fieldKey]: prev[fieldKey].filter((_, i) => i !== idx),
            }))
          }
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={nameError ? "text-red-800" : ""}>Full Name <span className="text-destructive">*</span></Label>
          <Input
            id={`${fieldKey}-name-${idx}`}
            value={party.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            className={nameError ? "border-destructive/50 bg-red-50 focus-visible:ring-red-300" : ""}
          />
          {nameError && <p className="text-sm text-red-700">{nameError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Party Type</Label>
          <Select value={party.type} onValueChange={(val) => update("type", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Individual">Individual</SelectItem>
              <SelectItem value="Corporation">Corporation</SelectItem>
              <SelectItem value="Organization">Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={party.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Contact Number</Label>
          <Input
            type="tel"
            value={party.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="+91 XXXXXXXXXX"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Address</Label>
          <Textarea
            value={party.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Full address"
            rows={2}
          />
        </div>
        {showAdvocateField && (
          <div className="space-y-1.5 md:col-span-2">
            <Label>Advocate</Label>
            <Input
              value={advocateName}
              onChange={(e) =>
                update(
                  fieldKey === "petitioners" ? "advocateName" : "opposingCounsel",
                  e.target.value
                )
              }
              placeholder="e.g. Adv. Neha Sharma"
            />
            {advocateName.trim() && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Scale className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                    Advocate
                  </p>
                  <p className="truncate text-sm font-semibold text-blue-950">
                    {advocateName}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyColumn({
  title,
  description,
  borderColor,
  labelOptions,
  labelValue,
  labelKey,
  listKey,
  caseData,
  setCaseData,
  validationErrors,
  showAdvocateField,
}) {
  const list = caseData[listKey] || [];
  const currentLabel = caseData[labelKey] || labelOptions[0].value;
  const fieldErrors = validationErrors?.fieldErrors || {};
  const listError = fieldErrors[listKey];
  const updateColumnLabel = (value) =>
    setCaseData((prev) => ({
      ...prev,
      [labelKey]: value,
      [listKey]: (prev[listKey] || []).map((party) => ({
        ...party,
        label: value,
      })),
    }));

  const addParty = () =>
    setCaseData((prev) => ({
      ...prev,
      [listKey]: [
        ...(prev[listKey] || []),
        {
          label: prev[labelKey] || labelOptions[0].value,
          type: "Individual",
          name: "",
          email: "",
          contact: "",
          address: "",
          ...(listKey === "respondents" ? { opposingCounsel: "" } : {}),
          ...(listKey === "petitioners" ? { advocateName: "" } : {}),
        },
      ],
    }));

  return (
    <div
      className={cn(
        `flex-1 border-l-4 ${borderColor} rounded-lg p-5 bg-muted/20 space-y-4`,
        listError && "border border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{description}</p>
          <h3 className="text-base font-semibold text-foreground mt-0.5">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            value={currentLabel}
            onValueChange={updateColumnLabel}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listError && (
        <p className="text-sm text-destructive">{listError}</p>
      )}

      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((party, idx) => (
            <PartyForm
              key={idx}
              party={party}
              idx={idx}
              partyList={list}
              fieldKey={listKey}
              setCaseData={setCaseData}
              nameError={fieldErrors[`${listKey}.${idx}.name`]}
              showAdvocateField={showAdvocateField}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-background",
            listError && "border-destructive/40"
          )}
        >
          <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No {currentLabel.toLowerCase()} added yet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Click below to add one</p>
        </div>
      )}

      <Button
        id={`add-${listKey === "petitioners" ? "petitioner" : "respondent"}-button`}
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={addParty}
      >
        <UserPlus className="h-4 w-4" />
        Add {currentLabel}
      </Button>
    </div>
  );
}

export default function PartySectionTab({
  caseData,
  setCaseData,
  isLawyer,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
  isLastTab,
  validationErrors,
}) {
  const clientSide = caseData.clientSide || "petitioner";
  const petitionerIsClient = clientSide === "petitioner";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Party Section</CardTitle>
        <CardDescription>
          Add all parties involved in this case — the side filing the case and the opposing side.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Which side are you representing */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Which side are you representing?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setCaseData((prev) => ({
                  ...prev,
                  clientSide: "petitioner",
                }))
              }
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all",
                petitionerIsClient
                  ? "border-blue-500 bg-blue-50"
                  : "border-muted bg-background hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Shield className={cn("h-4 w-4", petitionerIsClient ? "text-blue-600" : "text-muted-foreground")} />
                <span className={cn("text-sm font-semibold", petitionerIsClient ? "text-blue-700" : "text-foreground")}>
                  Filing Side
                </span>
                {petitionerIsClient && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">OUR CLIENT</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground ml-6">Petitioner · Appellant · Plaintiff · Complainant</p>
            </button>

            <button
              type="button"
              onClick={() =>
                setCaseData((prev) => ({
                  ...prev,
                  clientSide: "respondent",
                }))
              }
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all",
                !petitionerIsClient
                  ? "border-blue-500 bg-blue-50"
                  : "border-muted bg-background hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Swords className={cn("h-4 w-4", !petitionerIsClient ? "text-blue-600" : "text-muted-foreground")} />
                <span className={cn("text-sm font-semibold", !petitionerIsClient ? "text-blue-700" : "text-foreground")}>
                  Opposing Side
                </span>
                {!petitionerIsClient && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">OUR CLIENT</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground ml-6">Respondent · Defendant · Accused · Opponent</p>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <PartyColumn
            title={petitionerIsClient ? "Our Client's Side" : "Filing Side"}
            description={petitionerIsClient ? "Party you represent — initiating the case" : "Opposing party — initiating the case"}
            borderColor={petitionerIsClient ? "border-blue-500" : "border-red-400"}
            labelOptions={[
              { value: "Petitioner" },
              { value: "Appellant" },
              { value: "Plaintiff" },
              { value: "Complainant" },
            ]}
            labelKey="petitionerLabel"
            listKey="petitioners"
            caseData={caseData}
            setCaseData={setCaseData}
            validationErrors={validationErrors}
            showAdvocateField={!isLawyer || !petitionerIsClient}
          />

          {/* Divider */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-2">
            <div className="w-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground bg-background border rounded-full px-2 py-0.5">VS</span>
            <div className="w-px flex-1 bg-border" />
          </div>
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground bg-background border rounded-full px-2 py-0.5">VS</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <PartyColumn
            title={!petitionerIsClient ? "Our Client's Side" : "Opposing Side"}
            description={!petitionerIsClient ? "Party you represent — responding to the case" : "Opposing party — responding to the case"}
            borderColor={!petitionerIsClient ? "border-blue-500" : "border-red-400"}
            labelOptions={[
              { value: "Defendant" },
              { value: "Accused" },
              { value: "Respondent" },
              { value: "Opponent" },
            ]}
            labelKey="respondentLabel"
            listKey="respondents"
            caseData={caseData}
            setCaseData={setCaseData}
            validationErrors={validationErrors}
            showAdvocateField={!isLawyer || petitionerIsClient}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          {isLastTab ? (
            <Button onClick={(e) => handleSubmit(e, "all")} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Case"}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
