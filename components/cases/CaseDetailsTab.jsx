
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { caseTypes } from "@/lib/caseTypes";

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
  isLastTab
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Information</CardTitle>
        <CardDescription>Enter the basic details about the case</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="case-form" onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Case Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={caseData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseNumber">
                Case Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="caseNumber"
                name="caseNumber"
                value={caseData.caseNumber}
                onChange={handleChange}
                placeholder="e.g., AB1234"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use letters and numbers only for the case number.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">
                Case Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={caseData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(caseTypes).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="selectedEcourtCaseType">
                eCourts Case Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="selectedEcourtCaseType"
                value={caseData.eCourt?.caseTypeName || ""}
                readOnly
                placeholder="Select state, district, complex, court and case type first"
                className="bg-muted text-muted-foreground cursor-default"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="caseCode">eCourts Case Code</Label>
              <Input
                id="caseCode"
                name="caseCode"
                value={caseData.eCourt?.caseTypeCode || ""}
                readOnly
                placeholder="Auto-filled from eCourts case type"
                className="bg-muted text-muted-foreground cursor-default"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={caseData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filingDate">Filing Date</Label>
              <DatePicker
                id="filingDate"
                selected={caseData.filingDate}
                onSelect={(date) => handleDateChange("filingDate", date)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextHearingDate">
                First Hearing Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                id="nextHearingDate"
                selected={caseData.nextHearingDate}
                onSelect={(date) => handleDateChange("nextHearingDate", date)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={caseData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseStage">Case Stage</Label>
              <Select
                value={caseData.caseStage}
                onValueChange={(value) => handleSelectChange("caseStage", value)}
              >
                <SelectTrigger id="caseStage">
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
            <Label htmlFor="description">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actSections">Act & Sections</Label>
            <Textarea
              id="actSections"
              name="actSections"
              value={caseData.actSections}
              onChange={handleChange}
              rows={2}
              placeholder="e.g., IPC Section 302, CrPC Section 161"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reliefSought">Relief Sought</Label>
            <Textarea
              id="reliefSought"
              name="reliefSought"
              value={caseData.reliefSought}
              onChange={handleChange}
              rows={2}
              placeholder="Describe the relief sought in this case"
            />
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
