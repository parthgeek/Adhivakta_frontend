import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function SidebarGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Filing Guide</CardTitle>
        <CardDescription>Tips for filing a new case</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-40 w-full">
          <Image
            src="/images/law-library.jpg"
            alt="Legal documents"
            fill
            className="object-cover rounded-md hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Required Information</h3>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Complete case title</li>
            <li>Court details including hall number</li>
            <li>Client (Petitioner) information</li>
            <li>Filing date</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Document Checklist</h3>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Petition/Complaint</li>
            <li>Supporting affidavits</li>
            <li>Evidence documents</li>
            <li>Court fee receipts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}