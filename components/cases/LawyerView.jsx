import { CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Trash2, PlusCircle } from "lucide-react";

export default function LawyerView({ caseData, setCaseData, updateClientField, removeClient, addClient, user }) {
  return (
    <>
      <CardHeader>
        <CardTitle>Legal Team</CardTitle>
        <CardDescription>
          Add other lawyers working on this case (optional).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(caseData.lawyers || []).map((lawyer, idx) => (
            <div key={`lawyer-${idx}`} className="space-y-4 border p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Lawyer {idx + 1}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCaseData((prev) => ({
                      ...prev,
                      lawyers: prev.lawyers.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`lawyer-name-${idx}`} className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`lawyer-name-${idx}`}
                    value={lawyer.name || ""}
                    onChange={(e) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].name = e.target.value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                    placeholder="Full Name"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`lawyer-email-${idx}`} className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`lawyer-email-${idx}`}
                    type="email"
                    value={lawyer.email || ""}
                    onChange={(e) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].email = e.target.value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`lawyer-contact-${idx}`} className="text-sm font-medium">
                    Contact Number
                  </Label>
                  <Input
                    id={`lawyer-contact-${idx}`}
                    value={lawyer.contact || ""}
                    onChange={(e) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].contact = e.target.value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                    placeholder="+91 XXXXXXXXXX"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`lawyer-company-${idx}`} className="text-sm font-medium">
                    Law Firm
                  </Label>
                  <Input
                    id={`lawyer-company-${idx}`}
                    value={lawyer.company || ""}
                    onChange={(e) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].company = e.target.value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                    placeholder="Law Firm Name"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`lawyer-gst-${idx}`} className="text-sm font-medium">
                    GST Number
                  </Label>
                  <Input
                    id={`lawyer-gst-${idx}`}
                    value={lawyer.gst || ""}
                    onChange={(e) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].gst = e.target.value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`lawyer-level-${idx}`} className="text-sm font-medium">
                    Level
                  </Label>
                  <Select
                    value={lawyer.level || ""}
                    onValueChange={(value) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].level = value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                  >
                    <SelectTrigger id={`lawyer-level-${idx}`} className="h-9 text-sm">
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
                  <Label htmlFor={`lawyer-chair-${idx}`} className="text-sm font-medium">
                    Chair Position
                  </Label>
                  <Select
                    value={lawyer.chairPosition || "supporting"}
                    onValueChange={(value) => {
                      const arr = [...caseData.lawyers];
                      arr[idx].chairPosition = value;
                      setCaseData((prev) => ({ ...prev, lawyers: arr }));
                    }}
                  >
                    <SelectTrigger id={`lawyer-chair-${idx}`} className="h-9 text-sm">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_chair">First Chair</SelectItem>
                      <SelectItem value="second_chair">Second Chair</SelectItem>
                      <SelectItem value="supporting">Supporting Counsel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`lawyer-primary-${idx}`}
                      checked={lawyer.isPrimary || false}
                      onCheckedChange={(checked) => {
                        const arr = [...caseData.lawyers];
                        arr.forEach((_, i) => {
                          arr[i].isPrimary = i === idx ? checked : false;
                        });
                        setCaseData((prev) => ({ ...prev, lawyers: arr }));
                      }}
                    />
                    <Label htmlFor={`lawyer-primary-${idx}`} className="text-sm font-medium">
                      Set as Primary Lawyer
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The primary lawyer will be the main point of contact for this case.
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
                lawyers: [
                  ...(prev.lawyers || []),
                  {
                    name: "",
                    email: "",
                    contact: "",
                    company: "",
                    gst: "",
                    level: "Associate",
                    chairPosition: "supporting",
                    isPrimary: (prev.lawyers || []).length === 0,
                    addedBy: user?._id,
                  },
                ],
              }))
            }
            variant="outline"
            className="mt-2 w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Lawyer to Case
          </Button>
        </div>
      </CardContent>

      <CardHeader className="border-t">
        <CardTitle>Associated Clients</CardTitle>
        <CardDescription>
          Add clients associated with this case. At least one client is required if you are creating the case.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(caseData.clients || []).map((client, idx) => (
            <div key={idx} className="space-y-3 border p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Client {idx + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => removeClient(idx)}>
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`client-name-${idx}`}>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`client-name-${idx}`}
                    value={client.name || ""}
                    onChange={(e) => updateClientField(idx, "name", e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`client-email-${idx}`}>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`client-email-${idx}`}
                    type="email"
                    value={client.email || ""}
                    onChange={(e) => updateClientField(idx, "email", e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`client-contact-${idx}`}>Contact Number</Label>
                  <Input
                    id={`client-contact-${idx}`}
                    type="tel"
                    value={client.contact || ""}
                    onChange={(e) => updateClientField(idx, "contact", e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`client-address-${idx}`}>Address</Label>
                  <Textarea
                    id={`client-address-${idx}`}
                    value={client.address || ""}
                    onChange={(e) => updateClientField(idx, "address", e.target.value)}
                    placeholder="Full Address"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" onClick={addClient} variant="outline" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </CardContent>
    </>
  );
}