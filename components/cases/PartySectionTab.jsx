
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function PartySectionTab({
  caseData,
  setCaseData,
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
        <CardTitle>Party Section</CardTitle>
        <CardDescription>Enter details for both legal sides</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Petitioner Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Select
                value={caseData.petitionerLabel || "Petitioner"}
                onValueChange={(val) =>
                  setCaseData((prev) => ({
                    ...prev,
                    petitionerLabel: val,
                  }))
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petitioner">Petitioner</SelectItem>
                  <SelectItem value="Appellant">Appellant</SelectItem>
                  <SelectItem value="Plaintiff">Plaintiff</SelectItem>
                  <SelectItem value="Complainant">Complainant</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() =>
                  setCaseData((prev) => ({
                    ...prev,
                    petitioners: [
                      ...(prev.petitioners || []),
                      {
                        label: prev.petitionerLabel || "Petitioner",
                        type: "Individual",
                        name: "",
                        email: "",
                        contact: "",
                        address: "",
                      },
                    ],
                  }))
                }
              >
                Add {caseData.petitionerLabel || "Petitioner"}
              </Button>
            </div>
            {caseData.petitioners && caseData.petitioners.length > 0 && (
              <div className="space-y-4">
                {caseData.petitioners.map((petitioner, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {petitioner.label || "Petitioner"} {idx + 1}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCaseData((prev) => ({
                            ...prev,
                            petitioners: prev.petitioners.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={petitioner.name}
                          onChange={(e) => {
                            const arr = [...caseData.petitioners];
                            arr[idx].name = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              petitioners: arr,
                            }));
                          }}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={petitioner.type}
                          onValueChange={(val) => {
                            const arr = [...caseData.petitioners];
                            arr[idx].type = val;
                            setCaseData((prev) => ({
                              ...prev,
                              petitioners: arr,
                            }));
                          }}
                        >
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
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={petitioner.email}
                          onChange={(e) => {
                            const arr = [...caseData.petitioners];
                            arr[idx].email = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              petitioners: arr,
                            }));
                          }}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input
                          type="tel"
                          value={petitioner.contact}
                          onChange={(e) => {
                            const arr = [...caseData.petitioners];
                            arr[idx].contact = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              petitioners: arr,
                            }));
                          }}
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          value={petitioner.address}
                          onChange={(e) => {
                            const arr = [...caseData.petitioners];
                            arr[idx].address = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              petitioners: arr,
                            }));
                          }}
                          placeholder="Full address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Respondent Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Select
                value={caseData.respondentLabel || "Defendant"}
                onValueChange={(val) =>
                  setCaseData((prev) => ({
                    ...prev,
                    respondentLabel: val,
                  }))
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Defendant">Defendant</SelectItem>
                  <SelectItem value="Accused">Accused</SelectItem>
                  <SelectItem value="Respondent">Respondent</SelectItem>
                  <SelectItem value="Opponent">Opponent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() =>
                  setCaseData((prev) => ({
                    ...prev,
                    respondents: [
                      ...(prev.respondents || []),
                      {
                        label: prev.respondentLabel || "Defendant",
                        type: "Individual",
                        name: "",
                        email: "",
                        contact: "",
                        address: "",
                      },
                    ],
                  }))
                }
              >
                Add {caseData.respondentLabel || "Defendant"}
              </Button>
            </div>
            {caseData.respondents && caseData.respondents.length > 0 && (
              <div className="space-y-4">
                {caseData.respondents.map((respondent, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {respondent.label || "Defendant"} {idx + 1}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCaseData((prev) => ({
                            ...prev,
                            respondents: prev.respondents.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={respondent.name}
                          onChange={(e) => {
                            const arr = [...caseData.respondents];
                            arr[idx].name = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              respondents: arr,
                            }));
                          }}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={respondent.type}
                          onValueChange={(val) => {
                            const arr = [...caseData.respondents];
                            arr[idx].type = val;
                            setCaseData((prev) => ({
                              ...prev,
                              respondents: arr,
                            }));
                          }}
                        >
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
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={respondent.email}
                          onChange={(e) => {
                            const arr = [...caseData.respondents];
                            arr[idx].email = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              respondents: arr,
                            }));
                          }}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input
                          type="tel"
                          value={respondent.contact}
                          onChange={(e) => {
                            const arr = [...caseData.respondents];
                            arr[idx].contact = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              respondents: arr,
                            }));
                          }}
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          value={respondent.address}
                          onChange={(e) => {
                            const arr = [...caseData.respondents];
                            arr[idx].address = e.target.value;
                            setCaseData((prev) => ({
                              ...prev,
                              respondents: arr,
                            }));
                          }}
                          placeholder="Full address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
