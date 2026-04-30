
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CaseDetailsTab({
  caseData,
  handleChange,
  handleSelectChange,
  handleDateChange,
  handleCheckboxChange,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
  isLastTab,
  validationErrors,
}) {
  const currentYear = new Date().getFullYear();
  const caseYearOptions = Array.from({ length: 21 }, (_, index) =>
    String(currentYear - index)
  );
  const fieldErrors = validationErrors?.fieldErrors || {};
  const getFieldError = (field) => fieldErrors[field];
  const getInputClassName = (field) =>
    getFieldError(field) ? "border-destructive/50 bg-red-50 focus-visible:ring-red-300" : "";
  const getLabelClassName = (field) => (getFieldError(field) ? "text-red-800" : "");
  const selectedCaseType = [
    caseData.caseCode,
    typeof caseData.eCourt?.caseTypeName === "string"
      ? caseData.eCourt.caseTypeName.toUpperCase()
      : "",
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Information</CardTitle>
        <CardDescription>
          Enter the basic details about the case.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="case-form" onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className={getLabelClassName("title")}>
              Case Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={caseData.title}
              onChange={handleChange}
              className={getInputClassName("title")}
              required
            />
            {getFieldError("title") && (
              <p className="text-sm text-red-700">{getFieldError("title")}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_140px]">
              <div className="space-y-2">
                <Label htmlFor="selectedCaseType" className={getLabelClassName("selectedCaseType")}>
                  Case Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="selectedCaseType"
                  value={selectedCaseType}
                  readOnly
                  placeholder=""
                  className={cn(
                    "bg-muted text-muted-foreground cursor-default",
                    getInputClassName("selectedCaseType")
                  )}
                />
                {getFieldError("selectedCaseType") && (
                  <p className="text-sm text-red-700">{getFieldError("selectedCaseType")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseNumberMiddle" className={getLabelClassName("caseNumberMiddle")}>
                  Filing Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="caseNumberMiddle"
                  name="caseNumberMiddle"
                  value={caseData.caseNumberMiddle || ""}
                  onChange={handleChange}
                  placeholder="Filing Number"
                  className={getInputClassName("caseNumberMiddle")}
                  required
                />
                {getFieldError("caseNumberMiddle") && (
                  <p className="text-sm text-red-700">{getFieldError("caseNumberMiddle")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseYear" className={getLabelClassName("caseYear")}>
                  Year <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={caseData.caseYear || caseYearOptions[0]}
                  onValueChange={(value) => handleSelectChange("caseYear", value)}
                >
                  <SelectTrigger id="caseYear" className={getInputClassName("caseYear")}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("caseYear") && (
                  <p className="text-sm text-red-700">{getFieldError("caseYear")}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedCaseType
                ? `Final format: ${caseData.caseCode || "TYPE"}/CASE_NUMBER/${caseData.caseYear || "YEAR"}`
                : ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnrNumber" className={getLabelClassName("cnrNumber")}>
              CNR Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cnrNumber"
              name="cnrNumber"
              value={caseData.cnrNumber || ""}
              onChange={handleChange}
              placeholder="MHAU019999992015"
              className={getInputClassName("cnrNumber")}
              maxLength={16}
              required
            />
            {/* <p className="text-xs text-muted-foreground">
              Example: MHAU019999992015
            </p> */}
            {getFieldError("cnrNumber") && (
              <p className="text-sm text-red-700">{getFieldError("cnrNumber")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className={getLabelClassName("status")}>
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={caseData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
              required
            >
              <SelectTrigger id="status" className={getInputClassName("status")}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError("status") && (
              <p className="text-sm text-red-700">{getFieldError("status")}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filingDate" className={getLabelClassName("filingDate")}>Filing Date</Label>
              <DatePicker
                id="filingDate"
                selected={caseData.filingDate}
                onSelect={(date) => handleDateChange("filingDate", date)}
                className={getInputClassName("filingDate")}
              />
              {getFieldError("filingDate") && (
                <p className="text-sm text-red-700">{getFieldError("filingDate")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextHearingDate" className={getLabelClassName("nextHearingDate")}>
                First Hearing Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                id="nextHearingDate"
                selected={caseData.nextHearingDate}
                onSelect={(date) => handleDateChange("nextHearingDate", date)}
                className={getInputClassName("nextHearingDate")}
              />
              {getFieldError("nextHearingDate") && (
                <p className="text-sm text-red-700">{getFieldError("nextHearingDate")}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Priority is assigned automatically based on how soon the upcoming
            hearing is scheduled.
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseStage">Case Stage</Label>
              <Select
                value={caseData.caseStage}
                onValueChange={(value) => handleSelectChange("caseStage", value)}
              >
                <SelectTrigger id="caseStage" className={getInputClassName("caseStage")}>
                  <SelectValue placeholder="Select case stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filing">Filing</SelectItem>
                  <SelectItem value="pre_trial">Pre-Trial</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="arguments">Arguments</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="appeal">Appeal</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isUrgent"
              checked={caseData.isUrgent}
              onCheckedChange={(checked) => handleCheckboxChange("isUrgent", checked)}
            />
            <Label htmlFor="isUrgent">Mark as urgent case</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={getLabelClassName("description")}>
              Case Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={caseData.description}
              onChange={handleChange}
              rows={4}
              required
              placeholder="Enter a clear summary of the case"
              className={getInputClassName("description")}
            />
            {getFieldError("description") && (
              <p className="text-sm text-red-700">{getFieldError("description")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actSections" className={getLabelClassName("actSections")}>
              Act & Sections <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="actSections"
              name="actSections"
              value={caseData.actSections}
              onChange={handleChange}
              rows={2}
              placeholder="e.g., IPC Section 302, CrPC Section 161"
              className={getInputClassName("actSections")}
              required
            />
            {getFieldError("actSections") && (
              <p className="text-sm text-destructive">{getFieldError("actSections")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reliefSought" className={getLabelClassName("reliefSought")}>
              Relief Sought <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reliefSought"
              name="reliefSought"
              value={caseData.reliefSought}
              onChange={handleChange}
              rows={2}
              placeholder="Describe the relief sought in this case"
              className={getInputClassName("reliefSought")}
              required
            />
            {getFieldError("reliefSought") && (
              <p className="text-sm text-destructive">{getFieldError("reliefSought")}</p>
            )}
          </div>
        </form>
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
