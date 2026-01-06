import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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
  handleBack,
  validationErrors = {}
}) {
  const tabOrder = ["details", "court", "party", "documents", "associatedParties"];

  // Helper function to get validation icon for each tab
  const getTabIcon = (tabKey) => {
    const tabValidation = validationErrors[tabKey];
    
    if (!tabValidation) return null;
    
    if (tabValidation.hasErrors) {
      return (
        <XCircle className="h-3 w-3 text-red-600 ml-1 inline-block" />
      );
    }
    
    return (
      <CheckCircle2 className="h-3 w-3 text-green-600 ml-1 inline-block" />
    );
  };

  // Helper function to get error badge count
  const getErrorBadge = (tabKey) => {
    const tabValidation = validationErrors[tabKey];
    
    if (!tabValidation || !tabValidation.hasErrors) return null;
    
    return (
      <Badge 
        variant="destructive" 
        className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
      >
        {tabValidation.errorCount}
      </Badge>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger 
          value="details"
          className="relative"
        >
          <span className="flex items-center">
            Case Details
            {getTabIcon('details')}
            {getErrorBadge('details')}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="court"
          className="relative"
        >
          <span className="flex items-center">
            Court Info
            {getTabIcon('court')}
            {getErrorBadge('court')}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="party"
          className="relative"
        >
          <span className="flex items-center">
            Party Section
            {getTabIcon('party')}
            {getErrorBadge('party')}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="documents"
          className="relative"
        >
          <span className="flex items-center">
            Documents
            {getTabIcon('documents')}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="associatedParties"
          className="relative"
        >
          <span className="flex items-center">
            People
            {getTabIcon('associatedParties')}
            {getErrorBadge('associatedParties')}
          </span>
        </TabsTrigger>
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
          validationErrors={validationErrors.details}
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
          validationErrors={validationErrors.court}
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