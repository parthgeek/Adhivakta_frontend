import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Scale, Gavel, CheckCircle2 } from "lucide-react";
import CaseTypeSearchSelect from "@/components/cases/CaseTypeSearchSelect";
import { cn } from "@/lib/utils";

const COURT_TYPE_OPTIONS = [
  {
    source: "ecourts",
    label: "District Court",
    description: "District & subordinate courts across India",
    icon: Building2,
  },
  {
    source: "highcourts",
    label: "High Court",
    description: "State High Courts and their benches",
    icon: Scale,
  },
  {
    source: "supremecourt",
    label: "Supreme Court",
    description: "Supreme Court of India, New Delhi",
    icon: Gavel,
  },
];

const HIGH_COURT_STATE_LABELS = {
  "1": "Maharashtra",
  "8": "Bihar",
  "10": "Tamil Nadu",
  "16": "West Bengal",
  "22": "Punjab and Haryana",
  "23": "Madhya Pradesh",
};

const getHighCourtStateLabel = (state = {}) =>
  HIGH_COURT_STATE_LABELS[String(state.code || "")] || state.name;

export default function CourtInfoTab({
  caseData,
  handleChange,
  handleSelectChange,
  handleCaseTypeInputChange,
  courtDirectoryOptions,
  courtDirectoryLoading,
  courtSource = "ecourts",
  handleCourtTypeChange,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
  isLastTab,
  validationErrors = {},
}) {
  const { states = [], districts = [], complexes = [], courts = [], caseTypes = [] } =
    courtDirectoryOptions || {};
  const selectedEcourt = caseData.eCourt || {};
  const fieldErrors = validationErrors?.fieldErrors || {};
  const getFieldError = (field) => fieldErrors[field];
  const getFieldClassName = (field) =>
    getFieldError(field) ? "border-destructive/50 bg-red-50 focus-visible:ring-red-300" : "";
  const getLabelClassName = (field) =>
    getFieldError(field) ? "text-red-800" : "";

  const isHighCourt = courtSource === "highcourts";
  const isSupremeCourt = courtSource === "supremecourt";
  const caseTypeInputPlaceholder =
    !selectedEcourt.courtCode && !isSupremeCourt
      ? isHighCourt
        ? "Select bench first"
        : "Select court first"
      : courtDirectoryLoading?.caseTypes
        ? "Loading case types..."
        : "Search or type case type";
  const isCaseTypeInputDisabled =
    ((!selectedEcourt.courtCode && !isSupremeCourt) || courtDirectoryLoading?.caseTypes);
  const selectedCaseTypeName = selectedEcourt.caseTypeName || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Court Information</CardTitle>
        <CardDescription>
          Select the court type and fill in the required details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">

          {/* Step 1: Court Type Selector */}
          <div className="space-y-2">
            <Label>
              Which court is this case filed in? <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {COURT_TYPE_OPTIONS.map(({ source, label, description, icon: Icon }) => {
                const isSelected = courtSource === source;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => handleCourtTypeChange(source)}
                    className={`flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all hover:border-primary hover:bg-accent ${
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-muted bg-background"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <span className={`font-medium ${isSelected ? "text-primary" : ""}`}>
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Court-specific selection */}

          {/* DISTRICT COURT — full 5-step cascade */}
          {courtSource === "ecourts" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courtState">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.stateCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtState", value)}
                    disabled={courtDirectoryLoading?.states}
                  >
                    <SelectTrigger id="courtState">
                      <SelectValue
                        placeholder={courtDirectoryLoading?.states ? "Loading states..." : "Select state"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">
                    District <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.districtCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtDistrict", value)}
                    disabled={!selectedEcourt.stateCode || courtDirectoryLoading?.districts}
                  >
                    <SelectTrigger id="district">
                      <SelectValue
                        placeholder={
                          !selectedEcourt.stateCode
                            ? "Select state first"
                            : courtDirectoryLoading?.districts
                              ? "Loading districts..."
                              : "Select district"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.code} value={district.code}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courtComplex">
                    Court Complex <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.complexCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtComplex", value)}
                    disabled={!selectedEcourt.districtCode || courtDirectoryLoading?.complexes}
                  >
                    <SelectTrigger id="courtComplex">
                      <SelectValue
                        placeholder={
                          !selectedEcourt.districtCode
                            ? "Select district first"
                            : courtDirectoryLoading?.complexes
                              ? "Loading court complexes..."
                              : "Select court complex"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {complexes.map((complex) => (
                        <SelectItem key={complex.code} value={complex.code}>
                          {complex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courtSelection">
                    Court / Establishment <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.courtCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtCourt", value)}
                    disabled={!selectedEcourt.complexCode || courtDirectoryLoading?.courts}
                  >
                    <SelectTrigger id="courtSelection">
                      <SelectValue
                        placeholder={
                          !selectedEcourt.complexCode
                            ? "Select court complex first"
                            : courtDirectoryLoading?.courts
                              ? "Loading courts..."
                              : "Select court"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((court) => (
                        <SelectItem key={court.code} value={court.code}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecourtCaseType">
                  Case Type <span className="text-red-500">*</span>
                </Label>
                <CaseTypeSearchSelect
                  id="ecourtCaseType"
                  value={selectedCaseTypeName}
                  options={caseTypes.map((caseType) => ({
                    name: caseType.name,
                    code: caseType.code,
                  }))}
                  onValueChange={handleCaseTypeInputChange}
                  placeholder={caseTypeInputPlaceholder}
                  disabled={isCaseTypeInputDisabled}
                  className={getFieldClassName("selectedCaseType")}
                />
                {getFieldError("district") && (
                  <p className="text-sm text-red-700">{getFieldError("district")}</p>
                )}
              </div>
            </div>
          )}

          {/* HIGH COURT — State → High Court → Bench → Case Type */}
          {isHighCourt && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hcState">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.stateCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtState", value)}
                    disabled={courtDirectoryLoading?.states}
                  >
                    <SelectTrigger id="hcState">
                      <SelectValue
                        placeholder={courtDirectoryLoading?.states ? "Loading states..." : "Select state"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {getHighCourtStateLabel(state)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hcCourt">
                    High Court <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.districtCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtDistrict", value)}
                    disabled={!selectedEcourt.stateCode || courtDirectoryLoading?.districts}
                  >
                    <SelectTrigger id="hcCourt">
                      <SelectValue
                        placeholder={
                          !selectedEcourt.stateCode
                            ? "Select state first"
                            : courtDirectoryLoading?.districts
                              ? "Loading High Courts..."
                              : "Select High Court"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((hc) => (
                        <SelectItem key={hc.code} value={hc.code}>
                          {hc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hcBench">
                    Bench <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedEcourt.complexCode || ""}
                    onValueChange={(value) => handleSelectChange("ecourtComplex", value)}
                    disabled={!selectedEcourt.districtCode || courtDirectoryLoading?.complexes}
                  >
                    <SelectTrigger id="hcBench">
                      <SelectValue
                        placeholder={
                          !selectedEcourt.districtCode
                            ? "Select High Court first"
                            : courtDirectoryLoading?.complexes
                              ? "Loading benches..."
                              : "Select bench"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {complexes.map((bench) => (
                        <SelectItem key={bench.code} value={bench.code}>
                          {bench.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show court dropdown only if multiple courts loaded for the bench */}
                {courts.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="hcCourtSel">
                      Court / Division <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedEcourt.courtCode || ""}
                      onValueChange={(value) => handleSelectChange("ecourtCourt", value)}
                      disabled={courtDirectoryLoading?.courts}
                    >
                      <SelectTrigger id="hcCourtSel">
                        <SelectValue
                          placeholder={
                            courtDirectoryLoading?.courts ? "Loading..." : "Select court"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map((court) => (
                          <SelectItem key={court.code} value={court.code}>
                            {court.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hcCaseType">
                  Case Type <span className="text-red-500">*</span>
                </Label>
                <CaseTypeSearchSelect
                  id="hcCaseType"
                  value={selectedCaseTypeName}
                  options={caseTypes.map((caseType) => ({
                    name: caseType.name,
                    code: caseType.code,
                  }))}
                  onValueChange={handleCaseTypeInputChange}
                  placeholder={caseTypeInputPlaceholder}
                  disabled={isCaseTypeInputDisabled}
                  className={getFieldClassName("selectedCaseType")}
                />
                {getFieldError("courtSelection") && (
                  <p className="text-sm text-red-700">{getFieldError("courtSelection")}</p>
                )}
              </div>
            </div>
          )}

          {/* SUPREME COURT — fixed court, just pick case type */}
          {isSupremeCourt && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Supreme Court of India</p>
                    <p className="text-xs text-muted-foreground">Principal Bench, New Delhi</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scCaseType">
                  Case Type <span className="text-red-500">*</span>
                </Label>
                <CaseTypeSearchSelect
                  id="scCaseType"
                  value={selectedCaseTypeName}
                  options={caseTypes.map((caseType) => ({
                    name: caseType.name,
                    code: caseType.code,
                  }))}
                  onValueChange={handleCaseTypeInputChange}
                  placeholder={caseTypeInputPlaceholder}
                  disabled={isCaseTypeInputDisabled}
                  className={getFieldClassName("selectedCaseType")}
                />
              </div>
            </div>
          )}

          {/* Common fields for all court types */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="courtHall">Court Hall Number</Label>
              <Input
                id="courtHall"
                name="courtHall"
                value={caseData.courtHall}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={caseData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about the court or proceedings"
              className={cn(getFieldClassName("notes"))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          {isLastTab ? (
            <Button onClick={(e) => handleSubmit(e, "all")} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Case"}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
