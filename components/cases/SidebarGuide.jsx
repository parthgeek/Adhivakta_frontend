import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function SidebarGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to add a case in Adhivakta?</CardTitle>
        <CardDescription>Follow the tabs from left to right to create a case correctly</CardDescription>
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
          <h3 className="font-medium">Steps</h3>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Start in <strong>Court Info</strong>: select State, District, Court Complex, Court, and Case Type.</li>
            <li>Then fill <strong>Case Details</strong>: case title, filing number, year, status, first hearing date, description, act & sections, and relief sought.</li>
            <li>In <strong>Party Section</strong>, add at least one filing-side party and one opposing-side party.</li>
            <li><strong>Documents</strong> can be uploaded now or later if you want to finish the case entry first.</li>
            <li>In <strong>People</strong>, complete the lawyer/client details required for your role before saving.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Important Notes</h3>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Fields marked with <span className="text-red-500">*</span> are mandatory for case creation.</li>
            <li>The first hearing date must be after the filing date and cannot be in the past.</li>
            <li>Case priority is assigned automatically from the next hearing date.</li>
            <li>The final filing number is generated from the selected Case type, filing number, and year.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Suggested Uploads</h3>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Petition, complaint, or appeal memo</li>
            <li>Supporting affidavits and annexures</li>
            <li>Evidence documents and court receipts</li>
            <li>Any previous orders relevant to the matter</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
