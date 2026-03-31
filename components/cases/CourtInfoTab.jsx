import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CourtInfoTab({
  caseData,
  handleChange,
  handleSelectChange,
  courtDirectoryOptions,
  courtDirectoryLoading,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
  isLastTab,
  validationErrors,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Court Information</CardTitle>
        <CardDescription>
          Follow the eCourts flow: select state, district, court complex, court, and then case type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtState" className={getLabelClassName("courtState")}>
                  State <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedEcourt.stateCode || ""}
                  onValueChange={(value) => handleSelectChange("ecourtState", value)}
                  disabled={courtDirectoryLoading?.states}
                >
                  <SelectTrigger id="courtState" className={getFieldClassName("courtState")}>
                    <SelectValue
                      placeholder={
                        courtDirectoryLoading?.states ? "Loading states..." : "Select state"
                      }
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
                {getFieldError("courtState") && (
                  <p className="text-sm text-red-700">{getFieldError("courtState")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className={getLabelClassName("district")}>
                  District <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedEcourt.districtCode || ""}
                  onValueChange={(value) => handleSelectChange("ecourtDistrict", value)}
                  disabled={!selectedEcourt.stateCode || courtDirectoryLoading?.districts}
                >
                  <SelectTrigger id="district" className={getFieldClassName("district")}>
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
                {getFieldError("district") && (
                  <p className="text-sm text-red-700">{getFieldError("district")}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtComplex" className={getLabelClassName("courtComplex")}>
                  Court Complex <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedEcourt.complexCode || ""}
                  onValueChange={(value) => handleSelectChange("ecourtComplex", value)}
                  disabled={!selectedEcourt.districtCode || courtDirectoryLoading?.complexes}
                >
                  <SelectTrigger id="courtComplex" className={getFieldClassName("courtComplex")}>
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
                {getFieldError("courtComplex") && (
                  <p className="text-sm text-red-700">{getFieldError("courtComplex")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtSelection" className={getLabelClassName("courtSelection")}>
                  Court / Establishment <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedEcourt.courtCode || ""}
                  onValueChange={(value) => handleSelectChange("ecourtCourt", value)}
                  disabled={!selectedEcourt.complexCode || courtDirectoryLoading?.courts}
                >
                  <SelectTrigger id="courtSelection" className={getFieldClassName("courtSelection")}>
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
                {getFieldError("courtSelection") && (
                  <p className="text-sm text-red-700">{getFieldError("courtSelection")}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ecourtCaseType" className={getLabelClassName("ecourtCaseType")}>
                 Case Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedEcourt.caseTypeCode || ""}
                onValueChange={(value) => handleSelectChange("ecourtCaseType", value)}
                disabled={!selectedEcourt.courtCode || courtDirectoryLoading?.caseTypes}
              >
                <SelectTrigger id="ecourtCaseType" className={getFieldClassName("ecourtCaseType")}>
                  <SelectValue
                    placeholder={
                      !selectedEcourt.courtCode
                        ? "Select court first"
                        : courtDirectoryLoading?.caseTypes
                          ? "Loading case types..."
                          : "Select case type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((caseType) => (
                    <SelectItem key={caseType.code} value={caseType.code}>
                      {caseType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError("ecourtCaseType") && (
                <p className="text-sm text-red-700">{getFieldError("ecourtCaseType")}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtHall">Court Hall Number</Label>
                <Input
                  id="courtHall"
                  name="courtHall"
                  value={caseData.courtHall}
                  onChange={handleChange}
                  className={cn(getFieldClassName("courtHall"))}
                />
              </div>
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
