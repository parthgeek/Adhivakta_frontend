import { CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function StakeholderSection({
  caseData,
  updateStakeholderField,
  removeStakeholder,
  addStakeholder
}) {
  return (
    <div className="mt-6 pt-6 border-t">
      <CardHeader>
        <CardTitle>Stakeholders</CardTitle>
        <CardDescription>
          Add other parties involved in the case (e.g., witnesses, experts, beneficiaries).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(caseData.stakeholders || []).map((stakeholder, idx) => (
            <div key={idx} className="space-y-3 border p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Stakeholder {idx + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => removeStakeholder(idx)}>
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`stakeholder-name-${idx}`}>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`stakeholder-name-${idx}`}
                    value={stakeholder.name || ""}
                    onChange={(e) => updateStakeholderField(idx, "name", e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`stakeholder-role-${idx}`}>Role/Relation in Case</Label>
                  <Input
                    id={`stakeholder-role-${idx}`}
                    value={stakeholder.roleInCase || ""}
                    onChange={(e) => updateStakeholderField(idx, "roleInCase", e.target.value)}
                    placeholder="e.g., Witness, Expert"
                  />
                </div>
                <div>
                  <Label htmlFor={`stakeholder-email-${idx}`}>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`stakeholder-email-${idx}`}
                    type="email"
                    value={stakeholder.email || ""}
                    onChange={(e) => updateStakeholderField(idx, "email", e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`stakeholder-contact-${idx}`}>Contact Number</Label>
                  <Input
                    id={`stakeholder-contact-${idx}`}
                    type="tel"
                    value={stakeholder.contact || ""}
                    onChange={(e) => updateStakeholderField(idx, "contact", e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`stakeholder-address-${idx}`}>Address</Label>
                  <Textarea
                    id={`stakeholder-address-${idx}`}
                    value={stakeholder.address || ""}
                    onChange={(e) => updateStakeholderField(idx, "address", e.target.value)}
                    placeholder="Full Address"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" onClick={addStakeholder} variant="outline" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Stakeholder
          </Button>
        </div>
      </CardContent>
    </div>
  );
}