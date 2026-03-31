import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaseDetailsTab from "./CaseDetailsTab";
import CourtInfoTab from "./CourtInfoTab";
import PartySectionTab from "./PartySectionTab";
import DocumentsTab from "./DocumentsTab";
import AssociatedPartiesTab from "./AssociatedPartiesTab";

export default function CaseTabs({
  caseData,
  setCaseData,
  courtDirectoryOptions,
  courtDirectoryLoading,
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
  handleBack,
  validationErrors = {}
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="court" className="relative">
          <span className="flex items-center">Court Info</span>
        </TabsTrigger>

        <TabsTrigger value="details" className="relative">
          <span className="flex items-center">Case Details</span>
        </TabsTrigger>
        
        <TabsTrigger value="party" className="relative">
          <span className="flex items-center">Party Section</span>
        </TabsTrigger>
        
        <TabsTrigger value="documents" className="relative">
          <span className="flex items-center">Documents</span>
        </TabsTrigger>
        
        <TabsTrigger value="associatedParties" className="relative">
          <span className="flex items-center">People</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="court">
        <CourtInfoTab
          caseData={caseData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          courtDirectoryOptions={courtDirectoryOptions}
          courtDirectoryLoading={courtDirectoryLoading}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          router={router}
          handleNext={handleNext}
          handleBack={handleBack}
          isLastTab={false}
          validationErrors={validationErrors.court}
        />
      </TabsContent>

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
          validationErrors={validationErrors.details}
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
          validationErrors={validationErrors.party}
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
          validationErrors={validationErrors.documents}
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
          validationErrors={validationErrors.associatedParties}
        />
      </TabsContent>
    </Tabs>
  );
}
