"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";

const EMPTY_TRANSFER = {
  hearing: "",
  transferDate: null,
  registrationNumber: "",
  fromCourt: "",
  fromCourtHall: "",
  fromJudge: "",
  toCourt: "",
  toCourtHall: "",
  toJudge: "",
  remarks: "",
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function TransferHistoryTab({
  caseId,
  caseData,
  setCaseData,
  handleChange,
  isSubmitting,
  handleSubmit,
  router,
  handleNext,
  handleBack,
}) {
  const isCreateMode = !caseId;
  const [transfers, setTransfers] = useState(caseData?.transferHistory || []);
  const [hearings, setHearings] = useState([]);
  const [loadingHearings, setLoadingHearings] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_TRANSFER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTransfers(caseData?.transferHistory || []);
  }, [caseData?.transferHistory]);

  useEffect(() => {
    if (isCreateMode) return;
    const load = async () => {
      setLoadingHearings(true);
      try {
        const events = await api.events.getByCaseId(caseId);
        setHearings(
          (events || []).filter((e) => e.type === "hearing").sort(
            (a, b) => new Date(b.start) - new Date(a.start)
          )
        );
      } catch (err) {
        // silent
      } finally {
        setLoadingHearings(false);
      }
    };
    load();
  }, [caseId, isCreateMode]);

  const sortedTransfers = useMemo(
    () =>
      [...transfers].sort(
        (a, b) => new Date(b.transferDate) - new Date(a.transferDate)
      ),
    [transfers]
  );

  const openAdd = (prefill = {}) => {
    setEditingId(null);
    setEditingIndex(null);
    setForm({
      ...EMPTY_TRANSFER,
      fromCourt: caseData?.court || "",
      fromCourtHall: caseData?.courtHall || "",
      registrationNumber: caseData?.caseNumber || "",
      transferDate: new Date(),
      ...prefill,
    });
    setDialogOpen(true);
  };

  const openEdit = (entry, idx = null) => {
    setEditingId(entry._id || null);
    setEditingIndex(idx);
    setForm({
      hearing: entry.hearing?._id || entry.hearing || "",
      transferDate: entry.transferDate ? new Date(entry.transferDate) : null,
      registrationNumber: entry.registrationNumber || "",
      fromCourt: entry.fromCourt || "",
      fromCourtHall: entry.fromCourtHall || "",
      fromJudge: entry.fromJudge || "",
      toCourt: entry.toCourt || "",
      toCourtHall: entry.toCourtHall || "",
      toJudge: entry.toJudge || "",
      remarks: entry.remarks || "",
    });
    setDialogOpen(true);
  };

  const applyServerResponse = (data) => {
    if (!data) return;
    setTransfers(data.transferHistory || []);
    setCaseData?.((prev) => ({
      ...prev,
      transferHistory: data.transferHistory || [],
      court: data.court ?? prev.court,
      courtHall: data.courtHall ?? prev.courtHall,
    }));
  };

  const submitForm = async () => {
    if (!form.transferDate) {
      toast({
        title: "Missing field",
        description: "Transfer date is required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        hearing: form.hearing || null,
        transferDate: new Date(form.transferDate).toISOString(),
      };

      if (isCreateMode) {
        // Local-only edit; persisted when parent submits case create.
        const next = [...transfers];
        if (editingIndex !== null && editingIndex !== undefined) {
          next[editingIndex] = { ...next[editingIndex], ...payload };
        } else {
          next.push(payload);
        }
        setTransfers(next);
        const latest = [...next].sort(
          (a, b) => new Date(b.transferDate) - new Date(a.transferDate)
        )[0];
        setCaseData?.((prev) => ({
          ...prev,
          transferHistory: next,
          court: latest?.toCourt || prev.court,
          courtHall: latest?.toCourtHall || prev.courtHall,
        }));
        toast({ title: editingIndex !== null ? "Transfer updated" : "Transfer added" });
      } else if (editingId) {
        const data = await api.cases.transfers.update(caseId, editingId, payload);
        applyServerResponse(data);
        toast({ title: "Transfer updated" });
      } else {
        const data = await api.cases.transfers.add(caseId, payload);
        applyServerResponse(data);
        toast({ title: "Transfer added" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to save transfer.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry, idx) => {
    if (!confirm("Delete this transfer entry?")) return;
    try {
      if (isCreateMode) {
        const next = transfers.filter((_, i) => i !== idx);
        setTransfers(next);
        const latest = [...next].sort(
          (a, b) => new Date(b.transferDate) - new Date(a.transferDate)
        )[0];
        setCaseData?.((prev) => ({
          ...prev,
          transferHistory: next,
          court: latest?.toCourt || prev.court,
          courtHall: latest?.toCourtHall || prev.courtHall,
        }));
        toast({ title: "Transfer deleted" });
        return;
      }
      const data = await api.cases.transfers.delete(caseId, entry._id);
      applyServerResponse(data);
      toast({ title: "Transfer deleted" });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete.",
        variant: "destructive",
      });
    }
  };

  const transferForHearing = (hearingId) =>
    transfers.find(
      (t) => (t.hearing?._id || t.hearing) === hearingId
    );

  return (
    <div className="space-y-6">
      {/* FIR & Police Station Block */}
      <Card>
        <CardHeader>
          <CardTitle>FIR & Police Station</CardTitle>
          <CardDescription>
            Optional. Add or update FIR information for this case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="policeStation">Police Station</Label>
              <Input
                id="policeStation"
                name="policeStation"
                value={caseData?.policeStation || ""}
                onChange={handleChange}
                placeholder="Enter police station"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firNumber">FIR Number</Label>
              <Input
                id="firNumber"
                name="firNumber"
                value={caseData?.firNumber || ""}
                onChange={handleChange}
                placeholder="Enter FIR number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firYear">FIR Year</Label>
              <Input
                id="firYear"
                name="firYear"
                value={caseData?.firYear || ""}
                onChange={handleChange}
                placeholder="e.g. 2024"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
          </div>
        </CardContent>
        {!isCreateMode && (
          <CardFooter className="flex justify-end">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit?.(e, "details")}
            >
              {isSubmitting ? "Saving..." : "Save FIR Details"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Transfer History Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle>Case Transfer History</CardTitle>
            <CardDescription>
              Track every transfer between courts/judges. Latest entry updates
              the case's current court automatically.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => openAdd()}
            className="shrink-0 self-start"
          >
            + Add Transfer
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No transfer entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Reg. No</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">From Court / Hall / Judge</th>
                    <th className="p-2">To Court / Hall / Judge</th>
                    <th className="p-2">Linked Hearing</th>
                    <th className="p-2">Remarks</th>
                    <th className="p-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransfers.map((t) => {
                    const origIdx = transfers.indexOf(t);
                    const hearing =
                      typeof t.hearing === "object" && t.hearing
                        ? t.hearing
                        : hearings.find(
                            (h) => h._id === (t.hearing?._id || t.hearing)
                          );
                    return (
                      <tr key={t._id || `tx-${origIdx}`} className="border-b align-top">
                        <td className="p-2">{t.registrationNumber || "—"}</td>
                        <td className="p-2">{formatDate(t.transferDate)}</td>
                        <td className="p-2">
                          <div>{t.fromCourt || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            Hall {t.fromCourtHall || "—"} ·{" "}
                            {t.fromJudge || "—"}
                          </div>
                        </td>
                        <td className="p-2">
                          <div>{t.toCourt || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            Hall {t.toCourtHall || "—"} · {t.toJudge || "—"}
                          </div>
                        </td>
                        <td className="p-2">
                          {hearing ? (
                            <span className="text-xs">
                              {hearing.title || "Hearing"}
                              <br />
                              <span className="text-muted-foreground">
                                {formatDate(hearing.start)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 max-w-xs">
                          {t.remarks ? (
                            <span className="text-xs">{t.remarks}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2 space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(t, origIdx)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t, origIdx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hearings list with per-row transfer button (edit mode only) */}
      {!isCreateMode && (
      <Card>
        <CardHeader>
          <CardTitle>Hearings</CardTitle>
          <CardDescription>
            Add or update transfer details after each hearing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHearings ? (
            <p className="text-sm text-muted-foreground">Loading hearings...</p>
          ) : hearings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No hearings recorded for this case yet.
            </p>
          ) : (
            <div className="space-y-2">
              {hearings.map((h) => {
                const linked = transferForHearing(h._id);
                return (
                  <div
                    key={h._id}
                    className="flex items-center justify-between border rounded-md p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {h.title || "Hearing"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(h.start)} · {h.status || "scheduled"}
                      </div>
                      {linked && (
                        <Badge variant="secondary" className="mt-1">
                          Transfer linked
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant={linked ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        linked
                          ? openEdit(linked)
                          : openAdd({ hearing: h._id })
                      }
                    >
                      {linked ? "Edit Transfer" : "Add Transfer"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {handleBack && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {handleNext && (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
      )}

      {/* Create-mode footer nav */}
      {isCreateMode && (handleBack || handleNext) && (
        <div className="flex justify-between">
          {handleBack ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : <span />}
          {handleNext && (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Transfer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Transfer" : "Add Transfer"}
            </DialogTitle>
            <DialogDescription>
              Capture court/judge change. Saving updates the case's current
              court if this is the latest entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      registrationNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g. CRL/123/2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Transfer Date *</Label>
                <DatePicker
                  selected={form.transferDate}
                  onSelect={(d) =>
                    setForm((f) => ({ ...f, transferDate: d }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linked Hearing</Label>
              <Select
                value={form.hearing || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, hearing: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional — link to a hearing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {hearings.map((h) => (
                    <SelectItem key={h._id} value={h._id}>
                      {(h.title || "Hearing") + " · " + formatDate(h.start)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-medium text-sm">From</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Court</Label>
                  <Input
                    value={form.fromCourt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fromCourt: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Court Hall</Label>
                  <Input
                    value={form.fromCourtHall}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fromCourtHall: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Judge</Label>
                  <Input
                    value={form.fromJudge}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fromJudge: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-medium text-sm">To</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Court</Label>
                  <Input
                    value={form.toCourt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, toCourt: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Court Hall</Label>
                  <Input
                    value={form.toCourtHall}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        toCourtHall: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Judge</Label>
                  <Input
                    value={form.toJudge}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, toJudge: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remarks: e.target.value }))
                }
                rows={3}
                placeholder="Reason for transfer or other notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
