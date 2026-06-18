import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportJson: string | null;
  siteName: string;
  proofUrl: string | null;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function SiteVisitReportViewModal({ isOpen, onClose, reportJson, siteName, proofUrl, onApprove, onDeny }: Props) {
  let reportData: any = {};
  if (reportJson) {
    try {
      reportData = JSON.parse(reportJson);
    } catch (e) {
      console.error("Failed to parse report JSON", e);
    }
  }

  const renderField = (index: number, label: string, value: string | undefined) => {
    const isYes = value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'up to date';
    const isNo = value?.toLowerCase() === 'no' || value?.toLowerCase() === 'incomplete';
    
    return (
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-3">
        <h4 className="font-semibold text-sm text-slate-800 mb-2">{index}. {label}</h4>
        {value ? (
          <div className="flex items-center gap-2">
            {isYes && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {isNo && <XCircle className="w-4 h-4 text-red-500" />}
            <p className={`text-sm ${isYes ? 'text-green-600 font-medium' : isNo ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
              {value}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No answer provided</p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b bg-white z-10">
          <DialogTitle className="text-xl">Site Visit Report</DialogTitle>
          <p className="text-sm text-muted-foreground">Visit details for {siteName}</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-1">
            {renderField(1, "Site Operations Checklist", reportData.siteOperationsChecklist)}
            {renderField(2, "Attendance Register", reportData.attendanceRegister)}
            {renderField(3, "Daily Logbooks", reportData.dailyLogbooks)}
            {renderField(4, "Daily Logbooks & Checklist Authorisation by operations", reportData.checklistAuthorisation)}
            {renderField(5, "Housekeeping Machineries (Vacuum Cleaner, Scrubber, Jet Machine, etc.) Availability", reportData.housekeepingMachineries)}
            {renderField(6, "Working Condition", reportData.workingCondition)}
            {renderField(7, "Under maintenance Description", reportData.maintenanceDescription)}
            {renderField(8, "Grooming & Uniform", reportData.groomingAndUniform)}
            {renderField(9, "Safety Equipment", reportData.safetyEquipment)}
            {renderField(10, "ID Cards", reportData.idCards)}
            {renderField(11, "ESIC & Mediclaim Coverage", reportData.esicMediclaim)}
            {renderField(12, "Daily Briefing Conducted", reportData.dailyBriefing)}
            {renderField(13, "Night Round Conducted", reportData.nightRound)}
            {renderField(14, "Observations from Rounds (if any)", reportData.observations)}

            {reportData.distance !== undefined && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 mb-3">
                <h4 className="font-semibold text-sm text-slate-800 mb-3">Travel & Expenses</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Distance</p>
                    <p className="text-sm font-medium text-slate-800">{reportData.distance || 0} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Fuel Cost</p>
                    <p className="text-sm font-medium text-slate-800">₹{reportData.fuelCost || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Food Cost</p>
                    <p className="text-sm font-medium text-slate-800">₹{reportData.foodCost || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {proofUrl && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4">
                <h4 className="font-semibold text-sm text-slate-800 mb-3">Photo Proof</h4>
                <div className="rounded-lg overflow-hidden border border-slate-200 w-full sm:w-[300px]">
                  <img src={proofUrl} alt="Visit Proof" className="w-full h-auto object-cover" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            Close
          </button>
          
          {(onApprove || onDeny) && (
            <div className="flex items-center gap-3">
              {onDeny && (
                <button 
                  onClick={() => { onDeny(); onClose(); }}
                  className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Deny Form
                </button>
              )}
              {onApprove && (
                <button 
                  onClick={() => { onApprove(); onClose(); }}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Form
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
