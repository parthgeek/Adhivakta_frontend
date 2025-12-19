import { CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Trash2, PlusCircle } from "lucide-react";

export default function ClientView({ caseData, setCaseData }) {
  return (
    <>
      <CardHeader>
        <CardTitle>Legal Team</CardTitle>
        <CardDescription>
          Add your lead and associate advocates for this case (optional)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(caseData.advocates || []).map((advocate, idx) => (
            <div key={`advocate-${idx}`} className="space-y-4 border p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Advocate {idx + 1}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCaseData((prev) => ({
                      ...prev,
                      advocates: prev.advocates.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`adv-name-${idx}`} className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`adv-name-${idx}`}
                    value={advocate.name || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].name = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="Full Name"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-email-${idx}`} className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`adv-email-${idx}`}
                    type="email"
                    value={advocate.email || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].email = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-contact-${idx}`} className="text-sm font-medium">
                    Contact Number
                  </Label>
                  <Input
                    id={`adv-contact-${idx}`}
                    value={advocate.contact || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].contact = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="+91 XXXXXXXXXX"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-company-${idx}`} className="text-sm font-medium">
                    Law Firm
                  </Label>
                  <Input
                    id={`adv-company-${idx}`}
                    value={advocate.company || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].company = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="Law Firm Name"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-gst-${idx}`} className="text-sm font-medium">
                    GST Number
                  </Label>
                  <Input
                    id={`adv-gst-${idx}`}
                    value={advocate.gst || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].gst = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-level-${idx}`} className="text-sm font-medium">
                    Level
                  </Label>
                  <Select
                    value={advocate.level || ""}
                    onValueChange={(value) => {
                      const arr = [...caseData.advocates];
                      arr[idx].level = value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                  >
                    <SelectTrigger id={`adv-level-${idx}`} className="h-9 text-sm">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Associate">Associate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-chair-${idx}`} className="text-sm font-medium">
                    Chair Position
                  </Label>
                  <Select
                    value={advocate.chairPosition || "supporting"}
                    onValueChange={(value) => {
                      const arr = [...caseData.advocates];
                      arr[idx].chairPosition = value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                  >
                    <SelectTrigger id={`adv-chair-${idx}`} className="h-9 text-sm">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_chair">First Chair</SelectItem>
                      <SelectItem value="second_chair">Second Chair</SelectItem>
                      <SelectItem value="supporting">Supporting Counsel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-poc-${idx}`} className="text-sm font-medium">
                    Point of Contact
                  </Label>
                  <Input
                    id={`adv-poc-${idx}`}
                    value={advocate.poc || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].poc = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="Point of Contact"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`adv-isLead-${idx}`}
                      checked={!!advocate.isLead}
                      onCheckedChange={(checked) => {
                        const arr = [...caseData.advocates];
                        arr.forEach((_, i) => {
                          arr[i].isLead = i === idx ? checked : false;
                        });
                        setCaseData((prev) => ({ ...prev, advocates: arr }));
                      }}
                    />
                    <Label htmlFor={`adv-isLead-${idx}`} className="text-sm font-medium">
                      Set as Lead Advocate
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The lead advocate will be the main point of contact for this case.
                  </p>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            onClick={() =>
              setCaseData((prev) => ({
                ...prev,
                advocates: [
                  ...(prev.advocates || []),
                  {
                    name: "",
                    email: "",
                    contact: "",
                    company: "",
                    gst: "",
                    poc: "",
                    level: "Senior",
                    chairPosition: "first_chair",
                    isLead: (prev.advocates || []).length === 0,
                  },
                ],
              }))
            }
            variant="outline"
            className="mt-2 w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Advocate to Case
          </Button>
        </div>
      </CardContent>
    </>
  );
}