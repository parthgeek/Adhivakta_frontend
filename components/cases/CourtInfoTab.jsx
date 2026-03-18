import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STATES } from "@/lib/constants/caseConstants";

export default function CourtInfoTab({
  caseData,
  handleChange,
  handleSelectChange,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
  isLastTab
}) {
  const districtOptions = [
    { value: "bengaluru_urban", label: "Bengaluru Urban" },
    { value: "bengaluru_rural", label: "Bengaluru Rural" },
    { value: "mysuru", label: "Mysuru" },
    { value: "mangaluru", label: "Mangaluru" },
    { value: "belagavi", label: "Belagavi" },
    { value: "kalaburagi", label: "Kalaburagi" },
    { value: "dharwad", label: "Dharwad" },
    { value: "tumakuru", label: "Tumakuru" },
    { value: "shivamogga", label: "Shivamogga" },
    { value: "vijayapura", label: "Vijayapura" },
    { value: "davanagere", label: "Davanagere" },
    { value: "ballari", label: "Ballari" },
    { value: "udupi", label: "Udupi" },
    { value: "raichur", label: "Raichur" },
    { value: "hassan", label: "Hassan" },
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "madurai", label: "Madurai" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Court Information</CardTitle>
        <CardDescription>Enter details about the court where the case is filed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtState">State</Label>
                <Select
                  value={caseData.courtState}
                  onValueChange={(value) => handleSelectChange("courtState", value)}
                >
                  <SelectTrigger id="courtState">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={caseData.district}
                  onValueChange={(value) => handleSelectChange("district", value)}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districtOptions.map((district) => (
                      <SelectItem key={district.value} value={district.value}>
                        {district.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="court">
                  Court Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="court"
                  name="court"
                  value={caseData.court}
                  onChange={handleChange}
                  required
                />
              </div>

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