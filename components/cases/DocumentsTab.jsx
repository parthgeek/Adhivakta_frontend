
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function DocumentsTab({
  selectedFiles,
  uploadProgress,
  handleFileChange,
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
        <CardTitle>Case Documents</CardTitle>
        <CardDescription>Upload and manage documents related to this case</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to select files
              </p>
              <div className="mt-4">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("document-upload").click()}
                >
                  Select Files
                </Button>
              </div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected Files</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 99 && (
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        ></div>
                      </div>
                    )}
                    {uploadProgress[file.name] === 99 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-full px-2 py-0.5 animate-scan-pop-in">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
                        </span>
                        Scanning...
                      </span>
                    )}
                    {uploadProgress[file.name] === 100 && (
                      <span className="text-xs text-green-600">Uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Required Documents</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="doc1" />
                <Label htmlFor="doc1" className="text-sm">Petition/Complaint</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="doc2" />
                <Label htmlFor="doc2" className="text-sm">Affidavit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="doc3" />
                <Label htmlFor="doc3" className="text-sm">Power of Attorney</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="doc4" />
                <Label htmlFor="doc4" className="text-sm">Evidence Documents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="doc5" />
                <Label htmlFor="doc5" className="text-sm">Court Fee Receipt</Label>
              </div>
            </div>
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
