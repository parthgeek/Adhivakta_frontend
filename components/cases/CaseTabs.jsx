
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaseDetailsTab from "./CaseDetailsTab";
import CourtInfoTab from "./CourtInfoTab";
import PartySectionTab from "./PartySectionTab";
import DocumentsTab from "./DocumentsTab";
import AssociatedPartiesTab from "./AssociatedPartiesTab";

export default function CaseTabs({
  caseData,
  setCaseData,
  isSubmitting,
  isLawyer,
  selectedFiles,
  uploadProgress,
  handleSubmit,
  handleChange,
  handleSelectChange,
  handleDateChange,
  handleCheckboxChange,
  handleFileChange,
  updateClientField,
  removeClient,
  addClient,
  addStakeholder,
  updateStakeholderField,
  removeStakeholder,
  router,
  user,
  activeTab,
  setActiveTab,
  handleNext,
  handleBack
}) {
  const tabOrder = ["details", "court", "party", "documents", "associatedParties"];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="details">Case Details</TabsTrigger>
        <TabsTrigger value="court">Court Information</TabsTrigger>
        <TabsTrigger value="party">Party Section</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="associatedParties">People</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <CaseDetailsTab
          caseData={caseData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          handleDateChange={handleDateChange}
          handleCheckboxChange={handleCheckboxChange}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={false}
        />
      </TabsContent>

      <TabsContent value="court">
        <CourtInfoTab
          caseData={caseData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={false}
        />
      </TabsContent>

      <TabsContent value="party">
        <PartySectionTab
          caseData={caseData}
          setCaseData={setCaseData}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={false}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab
          selectedFiles={selectedFiles}
          uploadProgress={uploadProgress}
          handleFileChange={handleFileChange}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={false}
        />
      </TabsContent>

      <TabsContent value="associatedParties">
        <AssociatedPartiesTab
          caseData={caseData}
          setCaseData={setCaseData}
          isLawyer={isLawyer}
          updateClientField={updateClientField}
          removeClient={removeClient}
          addClient={addClient}
          addStakeholder={addStakeholder}
          updateStakeholderField={updateStakeholderField}
          removeStakeholder={removeStakeholder}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          user={user}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={true}
        />
      </TabsContent>
    </Tabs>
  );
}
