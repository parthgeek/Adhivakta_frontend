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

const EMPTY_PROCESS = {
  processId: "",
  processTitle: "",
  processDate: null,
};

const EMPTY_IA_STATUS = {
  iaNumber: "",
  partyName: "",
  dateOfFiling: null,
  nextDatePurpose: "",
  status: "",
};

const EMPTY_INTERIM_ORDER = {
  orderNumber: "",
  orderDate: null,
  orderDetails: "Copy of order",
  documentId: "",
  documentName: "",
};

const EMPTY_FINAL_ORDER = {
  orderNumber: "",
  orderDate: null,
  orderDetails: "Final judgment copy",
  documentId: "",
  documentName: "",
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
  selectedFiles = [],
  handleChange,
  isSubmitting,
  handleSubmit,
  handleNext,
  handleBack,
}) {
  const isCreateMode = !caseId;
  const [transfers, setTransfers] = useState(caseData?.transferHistory || []);
  const [hearings, setHearings] = useState([]);
  const [documents, setDocuments] = useState([]);
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
        const [events, caseDocuments] = await Promise.all([
          api.events.getByCaseId(caseId),
          api.documents.getByCaseId(caseId),
        ]);
        setHearings(
          (events || []).filter((e) => e.type === "hearing").sort(
            (a, b) => new Date(b.start) - new Date(a.start)
          )
        );
        setDocuments(Array.isArray(caseDocuments) ? caseDocuments : []);
      } catch {
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

  const updateCaseCollection = (key, updater) => {
    setCaseData?.((prev) => {
      const current = Array.isArray(prev?.[key]) ? prev[key] : [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        [key]: next,
      };
    });
  };

  const addCaseCollectionItem = (key, emptyItem) => {
    updateCaseCollection(key, (current) => [...current, { ...emptyItem }]);
  };

  const updateCaseCollectionItem = (key, index, field, value) => {
    updateCaseCollection(key, (current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeCaseCollectionItem = (key, index) => {
    updateCaseCollection(key, (current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

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
        toast({
          title:
            editingIndex !== null ? "Transfer updated" : "Transfer added",
        });
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
    transfers.find((t) => (t.hearing?._id || t.hearing) === hearingId);

  const processItems = caseData?.processes || [];
  const iaStatusItems = caseData?.iaStatuses || [];
  const interimOrderItems = caseData?.interimOrders || [];
  const finalOrderItems = caseData?.finalOrders || [];
  const availableOrderDocuments = useMemo(() => {
    if (isCreateMode) {
      return selectedFiles.map((file) => ({
        value: file.name,
        label: file.name,
        isExistingDocument: false,
      }));
    }

    return documents.map((document) => ({
      value: document._id || document.id,
      label: document.originalName || document.name || "Document",
      isExistingDocument: true,
      raw: document,
    }));
  }, [documents, isCreateMode, selectedFiles]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FIR & Police Station</CardTitle>
          <CardDescription>
            Optional. Add FIR details and any additional case references.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle>Processes</CardTitle>
            <CardDescription>
              Optional. Capture process ID, title, and process date for this
              case.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start"
            onClick={() => addCaseCollectionItem("processes", EMPTY_PROCESS)}
          >
            + Add Process
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {processItems.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No process entries added yet.
            </p>
          ) : (
            processItems.map((processItem, index) => (
              <div
                key={`process-${index}`}
                className="space-y-4 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium">Process {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeCaseCollectionItem("processes", index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Process ID</Label>
                    <Input
                      value={processItem.processId || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "processes",
                          index,
                          "processId",
                          e.target.value
                        )
                      }
                      placeholder="Enter process ID"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Process Title</Label>
                    <Input
                      value={processItem.processTitle || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "processes",
                          index,
                          "processTitle",
                          e.target.value
                        )
                      }
                      placeholder="Enter process title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Process Date</Label>
                    <DatePicker
                      selected={
                        processItem.processDate
                          ? new Date(processItem.processDate)
                          : null
                      }
                      onSelect={(value) =>
                        updateCaseCollectionItem(
                          "processes",
                          index,
                          "processDate",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {["closed", "disposed"].includes(caseData?.status) && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle>Final order / judgment</CardTitle>
              <CardDescription>
                Add the final order or judgment details for closed cases and link the judgment document.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 self-start"
              onClick={() => addCaseCollectionItem("finalOrders", EMPTY_FINAL_ORDER)}
            >
              + Add Final Order
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {finalOrderItems.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                No final order or judgment added yet.
              </p>
            ) : (
              finalOrderItems.map((orderItem, index) => (
                <div
                  key={`final-order-${index}`}
                  className="space-y-4 rounded-md border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-medium">Final Order {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeCaseCollectionItem("finalOrders", index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Order Number</Label>
                      <Input
                        value={orderItem.orderNumber || ""}
                        onChange={(e) =>
                          updateCaseCollectionItem(
                            "finalOrders",
                            index,
                            "orderNumber",
                            e.target.value
                          )
                        }
                        placeholder="Enter judgment number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Date</Label>
                      <DatePicker
                        selected={orderItem.orderDate ? new Date(orderItem.orderDate) : null}
                        onSelect={(value) =>
                          updateCaseCollectionItem(
                            "finalOrders",
                            index,
                            "orderDate",
                            value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Details Label</Label>
                      <Input
                        value={orderItem.orderDetails || ""}
                        onChange={(e) =>
                          updateCaseCollectionItem(
                            "finalOrders",
                            index,
                            "orderDetails",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Final judgment copy"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Linked Judgment Document</Label>
                      <Select
                        value={
                          isCreateMode
                            ? orderItem.documentName || "none"
                            : orderItem.documentId || orderItem.documentName || "none"
                        }
                        onValueChange={(value) => {
                          if (value === "none") {
                            updateCaseCollection("finalOrders", (current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      documentId: "",
                                      documentName: "",
                                    }
                                  : item
                              )
                            );
                            return;
                          }

                          const selectedDocument = availableOrderDocuments.find(
                            (document) => document.value === value
                          );

                          updateCaseCollection("finalOrders", (current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    documentId: selectedDocument?.isExistingDocument ? value : "",
                                    documentName: selectedDocument?.label || value,
                                  }
                                : item
                            )
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isCreateMode
                                ? "Select a file from the Documents tab"
                                : "Select an uploaded judgment document"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {availableOrderDocuments.map((document) => (
                            <SelectItem key={document.value} value={document.value}>
                              {document.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {isCreateMode
                          ? "Upload the judgment file in the Documents tab first, then link it here by filename."
                          : "This link is used on the case details page when the user clicks Final Order Details."}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          {!isCreateMode && (
            <CardFooter className="flex justify-end">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit?.(e, "transfer")}
              >
                {isSubmitting ? "Saving..." : "Save Final Order / Judgment"}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle>Interim orders</CardTitle>
            <CardDescription>
              Track interim orders and link them to uploaded order documents.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start"
            onClick={() => addCaseCollectionItem("interimOrders", EMPTY_INTERIM_ORDER)}
          >
            + Add Interim Order
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {interimOrderItems.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No interim orders added yet.
            </p>
          ) : (
            interimOrderItems.map((orderItem, index) => (
              <div
                key={`interim-order-${index}`}
                className="space-y-4 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium">Interim Order {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeCaseCollectionItem("interimOrders", index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Order Number</Label>
                    <Input
                      value={orderItem.orderNumber || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "interimOrders",
                          index,
                          "orderNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter order number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <DatePicker
                      selected={orderItem.orderDate ? new Date(orderItem.orderDate) : null}
                      onSelect={(value) =>
                        updateCaseCollectionItem(
                          "interimOrders",
                          index,
                          "orderDate",
                          value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order Details Label</Label>
                    <Input
                      value={orderItem.orderDetails || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "interimOrders",
                          index,
                          "orderDetails",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Copy of order"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Linked Order Document</Label>
                    <Select
                      value={
                        isCreateMode
                          ? orderItem.documentName || "none"
                          : orderItem.documentId || orderItem.documentName || "none"
                      }
                      onValueChange={(value) => {
                        if (value === "none") {
                          updateCaseCollection("interimOrders", (current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    documentId: "",
                                    documentName: "",
                                  }
                                : item
                            )
                          );
                          return;
                        }

                        const selectedDocument = availableOrderDocuments.find(
                          (document) => document.value === value
                        );

                        updateCaseCollection("interimOrders", (current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  documentId: selectedDocument?.isExistingDocument ? value : "",
                                  documentName: selectedDocument?.label || value,
                                }
                              : item
                          )
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isCreateMode
                              ? "Select a file from the Documents tab"
                              : "Select an uploaded order document"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {availableOrderDocuments.map((document) => (
                          <SelectItem key={document.value} value={document.value}>
                            {document.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {isCreateMode
                        ? "Upload the order file in the Documents tab first, then link it here by filename."
                        : "This link is used on the case details page when the user clicks Order Details."}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle>Case Transfer History</CardTitle>
            <CardDescription>
              Track every transfer between courts and judges. The latest entry
              updates the case&apos;s current court automatically.
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
            <p className="text-sm italic text-muted-foreground">
              No transfer entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Reg. No</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">From Court / Hall / Judge</th>
                    <th className="p-2">To Court / Hall / Judge</th>
                    <th className="p-2">Linked Hearing</th>
                    <th className="p-2">Remarks</th>
                    <th className="w-32 p-2">Actions</th>
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
                      <tr
                        key={t._id || `tx-${origIdx}`}
                        className="border-b align-top"
                      >
                        <td className="p-2">{t.registrationNumber || "—"}</td>
                        <td className="p-2">{formatDate(t.transferDate)}</td>
                        <td className="p-2">
                          <div>{t.fromCourt || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            Hall {t.fromCourtHall || "—"} · {t.fromJudge || "—"}
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
                        <td className="max-w-xs p-2">
                          {t.remarks ? (
                            <span className="text-xs">{t.remarks}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="space-x-1 p-2">
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
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(t, origIdx)}
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle>IA Status</CardTitle>
            <CardDescription>
              Optional. Track IA number, party name, filing date, next date or
              purpose, and status.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start"
            onClick={() => addCaseCollectionItem("iaStatuses", EMPTY_IA_STATUS)}
          >
            + Add IA Status
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {iaStatusItems.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No IA status entries added yet.
            </p>
          ) : (
            iaStatusItems.map((iaItem, index) => (
              <div
                key={`ia-status-${index}`}
                className="space-y-4 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium">IA Status {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() =>
                      removeCaseCollectionItem("iaStatuses", index)
                    }
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>IA Number</Label>
                    <Input
                      value={iaItem.iaNumber || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "iaStatuses",
                          index,
                          "iaNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter IA number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Party Name</Label>
                    <Input
                      value={iaItem.partyName || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "iaStatuses",
                          index,
                          "partyName",
                          e.target.value
                        )
                      }
                      placeholder="Enter party name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Filing</Label>
                    <DatePicker
                      selected={
                        iaItem.dateOfFiling ? new Date(iaItem.dateOfFiling) : null
                      }
                      onSelect={(value) =>
                        updateCaseCollectionItem(
                          "iaStatuses",
                          index,
                          "dateOfFiling",
                          value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IA Status</Label>
                    <Input
                      value={iaItem.status || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "iaStatuses",
                          index,
                          "status",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Pending"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Next Date / Purpose</Label>
                    <Input
                      value={iaItem.nextDatePurpose || ""}
                      onChange={(e) =>
                        updateCaseCollectionItem(
                          "iaStatuses",
                          index,
                          "nextDatePurpose",
                          e.target.value
                        )
                      }
                      placeholder="Enter next date or purpose"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!isCreateMode && (
        <CardFooter className="justify-end border rounded-lg bg-white px-6 py-4">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit?.(e, "all")}
          >
            {isSubmitting ? "Saving..." : "Save All"}
          </Button>
        </CardFooter>
      )}

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
              <p className="text-sm italic text-muted-foreground">
                No hearings recorded for this case yet.
              </p>
            ) : (
              <div className="space-y-2">
                {hearings.map((h) => {
                  const linked = transferForHearing(h._id);
                  return (
                    <div
                      key={h._id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">
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
                          linked ? openEdit(linked) : openAdd({ hearing: h._id })
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
            {handleBack ? (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {handleNext && (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {isCreateMode && (handleBack || handleNext) && (
        <div className="flex justify-between">
          {handleBack ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {handleNext && (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Transfer" : "Add Transfer"}
            </DialogTitle>
            <DialogDescription>
              Capture court or judge changes. Saving updates the case&apos;s
              current court if this is the latest entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
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
                  onSelect={(value) =>
                    setForm((current) => ({
                      ...current,
                      transferDate: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linked Hearing</Label>
              <Select
                value={form.hearing || "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    hearing: value === "none" ? "" : value,
                  }))
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

            <div className="space-y-3 rounded-md border p-3">
              <h4 className="text-sm font-medium">From</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Court</Label>
                  <Input
                    value={form.fromCourt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        fromCourt: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Court Hall</Label>
                  <Input
                    value={form.fromCourtHall}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
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
                      setForm((current) => ({
                        ...current,
                        fromJudge: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <h4 className="text-sm font-medium">To</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Court</Label>
                  <Input
                    value={form.toCourt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        toCourt: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Court Hall</Label>
                  <Input
                    value={form.toCourtHall}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
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
                      setForm((current) => ({
                        ...current,
                        toJudge: e.target.value,
                      }))
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
                  setForm((current) => ({
                    ...current,
                    remarks: e.target.value,
                  }))
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
