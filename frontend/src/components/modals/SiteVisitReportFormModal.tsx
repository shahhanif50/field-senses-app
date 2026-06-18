import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface SiteVisitReportData {
  siteOperationsChecklist: string;
  attendanceRegister: string;
  dailyLogbooks: string;
  checklistAuthorisation: string;
  housekeepingMachineries: string;
  workingCondition: string;
  maintenanceDescription: string;
  groomingAndUniform: string;
  safetyEquipment: string;
  idCards: string;
  esicMediclaim: string;
  dailyBriefing: string;
  nightRound: string;
  observations: string;
  distance: number;
  fuelCost: number;
  foodCost: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SiteVisitReportData, photoBase64: string | null) => void;
  siteName: string;
  initialDistance?: number;
}

export function SiteVisitReportFormModal({ isOpen, onClose, onSubmit, siteName, initialDistance }: Props) {
  const [formData, setFormData] = useState<SiteVisitReportData>({
    siteOperationsChecklist: "",
    attendanceRegister: "",
    dailyLogbooks: "",
    checklistAuthorisation: "",
    housekeepingMachineries: "",
    workingCondition: "",
    maintenanceDescription: "",
    groomingAndUniform: "",
    safetyEquipment: "",
    idCards: "",
    esicMediclaim: "",
    dailyBriefing: "",
    nightRound: "",
    observations: "",
    distance: initialDistance || 0,
    fuelCost: 0,
    foodCost: 0,
  });
  
  const [photo, setPhoto] = useState<string | null>(null);

  const handleChange = (field: keyof SiteVisitReportData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData, photo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl">Site Visit Report</DialogTitle>
          <p className="text-sm text-muted-foreground">Checkout report for {siteName}</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>1. Site Operations Checklist</Label>
              <Input value={formData.siteOperationsChecklist} onChange={(e) => handleChange("siteOperationsChecklist", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>2. Attendance Register</Label>
              <Select value={formData.attendanceRegister} onValueChange={(val) => handleChange("attendanceRegister", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Up to Date">Up to Date</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>3. Daily Logbooks</Label>
              <Input value={formData.dailyLogbooks} onChange={(e) => handleChange("dailyLogbooks", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>4. Daily Logbooks & Checklist Authorisation by operations</Label>
              <Input value={formData.checklistAuthorisation} onChange={(e) => handleChange("checklistAuthorisation", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>5. Housekeeping Machineries (Vacuum Cleaner, Scrubber, Jet Machine, etc.) Availability</Label>
              <Input value={formData.housekeepingMachineries} onChange={(e) => handleChange("housekeepingMachineries", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>6. Working Condition</Label>
              <Input value={formData.workingCondition} onChange={(e) => handleChange("workingCondition", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>7. Under maintenance Description</Label>
              <Input value={formData.maintenanceDescription} onChange={(e) => handleChange("maintenanceDescription", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>8. Grooming & Uniform</Label>
              <Input value={formData.groomingAndUniform} onChange={(e) => handleChange("groomingAndUniform", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>9. Safety Equipment</Label>
              <Input value={formData.safetyEquipment} onChange={(e) => handleChange("safetyEquipment", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>10. ID Cards</Label>
              <Input value={formData.idCards} onChange={(e) => handleChange("idCards", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>11. ESIC & Mediclaim Coverage</Label>
              <Input value={formData.esicMediclaim} onChange={(e) => handleChange("esicMediclaim", e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="space-y-2">
              <Label>12. Daily Briefing Conducted</Label>
              <Select value={formData.dailyBriefing} onValueChange={(val) => handleChange("dailyBriefing", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>13. Night Round Conducted</Label>
              <Select value={formData.nightRound} onValueChange={(val) => handleChange("nightRound", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>14. Observations from Rounds (if any)</Label>
              <Textarea value={formData.observations} onChange={(e) => handleChange("observations", e.target.value)} placeholder="Enter any observations..." className="min-h-[100px]" />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Travel & Expenses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input type="number" step="0.1" value={formData.distance} onChange={(e) => handleChange("distance", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Cost (₹)</Label>
                  <Input type="number" value={formData.fuelCost} onChange={(e) => handleChange("fuelCost", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Food Cost (₹)</Label>
                  <Input type="number" value={formData.foodCost} onChange={(e) => handleChange("foodCost", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" /> Checkout Photo Proof
              </Label>
              {!photo ? (
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    id="checkout-camera"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                  <Label 
                    htmlFor="checkout-camera" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <Camera className="w-8 h-8 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">Tap to Open Camera</span>
                  </Label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border h-48 group">
                  <img src={photo} alt="Checkout Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Label htmlFor="checkout-camera-retry" className="cursor-pointer text-white flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Retake Photo
                    </Label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      id="checkout-camera-retry"
                      className="hidden"
                      onChange={handleCameraCapture}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="gradient-btn">Submit & Checkout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
