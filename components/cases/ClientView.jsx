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

const getParticipantUserId = (participant) => {
  if (!participant) return null;
  if (participant.user && typeof participant.user === "object") {
    return participant.user._id || participant.user.id || null;
  }
  return participant.user || participant._id || participant.id || null;
};

const isCurrentClient = (client, user) => {
  const userId = user?.id || user?._id || null;
  const userEmail = normalizeEmail(user?.email);
  const clientId = getParticipantUserId(client);
  const clientEmail = normalizeEmail(client?.email);

  return (
    (userId && clientId && clientId.toString() === userId.toString()) ||
    (userEmail && clientEmail && clientEmail === userEmail)
  );
};

export default function ClientView({
  caseData,
  setCaseData,
  updateClientField,
  removeClient,
  addClient,
  user,
  validationErrors,
}) {
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
          Add your lead and associate advocates for this case. At least one lawyer is required.
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
                  <Label htmlFor={`adv-name-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.advocate.${idx}.name`))}>
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
                    className={cn("h-9 text-sm", getFieldClassName(`associatedParties.advocate.${idx}.name`))}
                    required
                  />
                  {getFieldError(`associatedParties.advocate.${idx}.name`) && (
                    <p className="text-sm text-red-700">{getFieldError(`associatedParties.advocate.${idx}.name`)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-email-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.advocate.${idx}.email`))}>
                    Email ID <span className="text-red-500">*</span>
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
                    className={cn("h-9 text-sm", getFieldClassName(`associatedParties.advocate.${idx}.email`))}
                    required
                  />
                  {getFieldError(`associatedParties.advocate.${idx}.email`) && (
                    <p className="text-sm text-red-700">{getFieldError(`associatedParties.advocate.${idx}.email`)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-contact-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.advocate.${idx}.contact`))}>
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`adv-contact-${idx}`}
                    type="tel"
                    value={advocate.contact || ""}
                    onChange={(e) => {
                      const arr = [...caseData.advocates];
                      arr[idx].contact = e.target.value;
                      setCaseData((prev) => ({ ...prev, advocates: arr }));
                    }}
                    placeholder="+91 XXXXXXXXXX"
                    className={cn("h-9 text-sm", getFieldClassName(`associatedParties.advocate.${idx}.contact`))}
                    required
                  />
                  {getFieldError(`associatedParties.advocate.${idx}.contact`) && (
                    <p className="text-sm text-red-700">{getFieldError(`associatedParties.advocate.${idx}.contact`)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`adv-company-${idx}`} className={cn("text-sm font-medium", getLabelClassName(`associatedParties.advocate.${idx}.company`))}>
                    Law Firm <span className="text-red-500">*</span>
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
                    className={cn("h-9 text-sm", getFieldClassName(`associatedParties.advocate.${idx}.company`))}
                    required
                  />
                  {getFieldError(`associatedParties.advocate.${idx}.company`) && (
                    <p className="text-sm text-red-700">{getFieldError(`associatedParties.advocate.${idx}.company`)}</p>
                  )}
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
            id="add-advocate-button"
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

      <CardHeader className="border-t">
        <CardTitle>Associated Clients</CardTitle>
        <CardDescription>
          You are auto-set as primary client. Add other clients to this case if needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(caseData.clients || []).map((client, idx) => {
            const isPrimaryClient = isCurrentClient(client, user);

            return (
              <div key={`client-${idx}`} className="space-y-3 border p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Client {idx + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClient(idx)}
                    disabled={isPrimaryClient}
                    className="disabled:opacity-60"
                  >
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
                      disabled={isPrimaryClient}
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
                      disabled={isPrimaryClient}
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
                      disabled={isPrimaryClient}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`client-address-${idx}`}>Address</Label>
                    <Textarea
                      id={`client-address-${idx}`}
                      value={client.address || ""}
                      onChange={(e) => updateClientField(idx, "address", e.target.value)}
                      placeholder="Full Address"
                      disabled={isPrimaryClient}
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`client-primary-${idx}`}
                        checked={isPrimaryClient}
                        disabled
                      />
                      <Label htmlFor={`client-primary-${idx}`} className="text-sm font-medium">
                        {isPrimaryClient ? "Primary Client (You)" : "Additional Client"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Button id="add-client-button" type="button" onClick={addClient} variant="outline" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </CardContent>
    </>
  );
}
