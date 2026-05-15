import { CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const getParticipantUserId = (participant) => {
  if (!participant) return null;
  if (participant.user && typeof participant.user === "object") {
    return participant.user._id || participant.user.id || null;
  }
  return participant.user || participant._id || participant.id || null;
};

const isCurrentLawyer = (lawyer, user) => {
  const userId = user?.id || user?._id || null;
  const userEmail = normalizeEmail(user?.email);
  const lawyerId = getParticipantUserId(lawyer);
  const lawyerEmail = normalizeEmail(lawyer?.email);

  return (
    (userId && lawyerId && lawyerId.toString() === userId.toString()) ||
    (userEmail && lawyerEmail && lawyerEmail === userEmail)
  );
};

export default function LawyerView({ caseData, setCaseData, updateClientField, removeClient, addClient, user, validationErrors }) {
  const fieldErrors = validationErrors?.fieldErrors || {};
  const getFieldError = (field) => fieldErrors[field];
  const getFieldClassName = (field) =>
    getFieldError(field) ? "border-destructive/50 bg-red-50 focus-visible:ring-red-300" : "";
  const getLabelClassName = (field) => (getFieldError(field) ? "text-red-800" : "");

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
          {(caseData.lawyers || []).map((lawyer, idx) => {
            const primaryLawyer = isCurrentLawyer(lawyer, user);

            return (
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
                    disabled={primaryLawyer}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`lawyer-name-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.lawyer.${idx}.name`))}>
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
                      className={cn("h-9 text-sm", getFieldClassName(`associatedParties.lawyer.${idx}.name`))}
                      disabled={primaryLawyer && !!normalizeValue(lawyer.name)}
                      required
                    />
                    {getFieldError(`associatedParties.lawyer.${idx}.name`) && (
                      <p className="text-sm text-red-700">{getFieldError(`associatedParties.lawyer.${idx}.name`)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`lawyer-email-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.lawyer.${idx}.email`))}>
                      Email ID <span className="text-red-500">*</span>
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
                      className={cn("h-9 text-sm", getFieldClassName(`associatedParties.lawyer.${idx}.email`))}
                      disabled={primaryLawyer && !!normalizeEmail(lawyer.email)}
                      required
                    />
                    {getFieldError(`associatedParties.lawyer.${idx}.email`) && (
                      <p className="text-sm text-red-700">{getFieldError(`associatedParties.lawyer.${idx}.email`)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`lawyer-contact-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.lawyer.${idx}.contact`))}>
                      Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`lawyer-contact-${idx}`}
                      type="tel"
                      value={lawyer.contact || ""}
                      onChange={(e) => {
                        const arr = [...caseData.lawyers];
                        arr[idx].contact = e.target.value;
                        setCaseData((prev) => ({ ...prev, lawyers: arr }));
                      }}
                      placeholder="+91 XXXXXXXXXX"
                      className={cn("h-9 text-sm", getFieldClassName(`associatedParties.lawyer.${idx}.contact`))}
                      required
                    />
                    {getFieldError(`associatedParties.lawyer.${idx}.contact`) && (
                      <p className="text-sm text-red-700">{getFieldError(`associatedParties.lawyer.${idx}.contact`)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`lawyer-company-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.lawyer.${idx}.company`))}>
                      Law Firm <span className="text-red-500">*</span>
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
                      className={cn("h-9 text-sm", getFieldClassName(`associatedParties.lawyer.${idx}.company`))}
                      required
                    />
                    {getFieldError(`associatedParties.lawyer.${idx}.company`) && (
                      <p className="text-sm text-red-700">{getFieldError(`associatedParties.lawyer.${idx}.company`)}</p>
                    )}
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
                      disabled={primaryLawyer}
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
                      disabled={primaryLawyer}
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

                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`lawyer-primary-${idx}`}
                        checked={primaryLawyer}
                        disabled
                      />
                      <Label htmlFor={`lawyer-primary-${idx}`} className="text-sm font-medium">
                        {primaryLawyer ? "Primary Advocate (You)" : "Additional Advocate"}
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The primary advocate is always the logged-in advocate creating this case.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            id="add-lawyer-button"
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

                    isPrimary: false,
                    addedBy: user?.id || user?._id,
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
                  <Label htmlFor={`client-name-${idx}`} className={getLabelClassName(`clients.${idx}.name`)}>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`client-name-${idx}`}
                    value={client.name || ""}
                    onChange={(e) => updateClientField(idx, "name", e.target.value)}
                    placeholder="Full Name"
                    className={getFieldClassName(`clients.${idx}.name`)}
                    required
                  />
                  {getFieldError(`clients.${idx}.name`) && (
                    <p className="text-sm text-red-700">{getFieldError(`clients.${idx}.name`)}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`client-email-${idx}`} className={getLabelClassName(`clients.${idx}.email`)}>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`client-email-${idx}`}
                    type="email"
                    value={client.email || ""}
                    onChange={(e) => updateClientField(idx, "email", e.target.value)}
                    placeholder="email@example.com"
                    className={getFieldClassName(`clients.${idx}.email`)}
                    required
                  />
                  {getFieldError(`clients.${idx}.email`) && (
                    <p className="text-sm text-red-700">{getFieldError(`clients.${idx}.email`)}</p>
                  )}
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
          <Button id="add-client-button" type="button" onClick={addClient} variant="outline" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </CardContent>
    </>
  );
}
