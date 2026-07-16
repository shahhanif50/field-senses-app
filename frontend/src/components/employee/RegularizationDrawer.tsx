import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, CalendarIcon, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerDialog } from '@/components/ui/time-picker-dialog';
import { toast } from 'sonner';
import { useMasterData } from '@/contexts/MasterDataContext';
import { RegularizationRequest } from '@/data/sharedTypes';

interface RegularizationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegularizationDrawer({ open, onOpenChange }: RegularizationDrawerProps) {
  const [view, setView] = useState<'list' | 'add'>('list');
  
  const [regDate, setRegDate] = useState('');
  const [reqType, setReqType] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'checkIn' | 'checkOut'>('checkIn');

  const { regularizationRequests, setRegularizationRequests } = useMasterData();

  const handleAddRegularization = () => {
    setView('add');
  };

  const handleSubmit = () => {
    if (!regDate || !reqType || !reason) {
      toast.error("Please fill in all basic fields.");
      return;
    }
    if ((reqType === 'check-in' || reqType === 'both') && !checkInTime) {
      toast.error("Please provide Check In time.");
      return;
    }
    if ((reqType === 'check-out' || reqType === 'both') && !checkOutTime) {
      toast.error("Please provide Check Out time.");
      return;
    }

    // Format requested time string
    let requestedTimeStr = '';
    if (reqType === 'check-in') requestedTimeStr = checkInTime;
    else if (reqType === 'check-out') requestedTimeStr = checkOutTime;
    else requestedTimeStr = `${checkInTime} - ${checkOutTime}`;

    const employeeId = sessionStorage.getItem("employeeId") || "EMP-UNKNOWN";
    const employeeName = sessionStorage.getItem("userName") || "Unknown User";

    // Add to context
    const newRequest: RegularizationRequest = {
      id: Math.random().toString(36).substr(2, 9),
      employeeName: employeeName, 
      employeeId: employeeId,
      date: regDate || new Date().toISOString().split('T')[0],
      type: reqType === 'check-in' ? 'Check In' : reqType === 'check-out' ? 'Check Out' : 'Both',
      requestedTime: requestedTimeStr,
      reason,
      status: 'Pending',
      timestamp: new Date().toISOString(),
    };

    setRegularizationRequests(prev => [newRequest, ...prev]);

    toast.success('Regularization request submitted successfully');
    
    // Reset form
    setRegDate('');
    setReqType('');
    setCheckInTime('');
    setCheckOutTime('');
    setReason('');
    setView('list');
  };

  const handleBack = () => {
    if (view === 'add') {
      setView('list');
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] sm:h-full sm:max-w-md w-full p-0 flex flex-col bg-[#f8f9fc] border-none shadow-none z-50">
        {/* Header */}
        <SheetHeader className="p-4 pt-5 pb-4 bg-primary text-primary-foreground flex flex-row items-center gap-3 text-left shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-white/20 rounded-full -ml-2 shrink-0 h-8 w-8" 
            onClick={handleBack}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <SheetTitle className="text-primary-foreground m-0 text-[17px] font-normal tracking-wide">
            {view === 'add' ? 'Add Regularization' : 'Regularization'}
          </SheetTitle>
        </SheetHeader>
        
        {view === 'list' ? (
          <>
            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-5">
          
              {regularizationRequests.length > 0 ? (
                regularizationRequests.map((request) => {
                  const isPending = request.status === 'Pending';
                  const isApproved = request.status === 'Approved';
                  const isDenied = request.status === 'Denied';
                  
                  let inTime = '--:-- --';
                  let outTime = '--:-- --';
                  
                  if (request.type === 'Check In') {
                    inTime = request.requestedTime;
                  } else if (request.type === 'Check Out') {
                    outTime = request.requestedTime;
                  } else if (request.type === 'Both') {
                    const times = request.requestedTime.split(' - ');
                    inTime = times[0] || '--:-- --';
                    outTime = times[1] || '--:-- --';
                  }

                  return (
                    <div key={request.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden py-4">
                      <div className="flex justify-between items-center mb-4 pl-4 pr-4">
                        <div className="flex items-center">
                          <div className={`absolute left-0 w-1.5 h-6 rounded-r-md ${isPending ? 'bg-amber-400' : isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          <span className="font-bold text-slate-900 text-[16px] tracking-tight ml-2">{request.date}</span>
                        </div>
                        <Badge className={`border-0 shadow-none font-medium px-3 py-0.5 rounded-md text-[11px] text-white ${isPending ? 'bg-amber-400 hover:bg-amber-500' : isApproved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 px-6">
                        <div>
                          <div className="text-[13px] font-bold text-slate-900 mb-1">Check In</div>
                          <div className="flex items-center text-[13px] text-slate-600 font-medium gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                            {inTime}
                          </div>
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900 mb-1">Check Out</div>
                          <div className="flex items-center text-[13px] text-slate-600 font-medium gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                            {outTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mb-3 text-slate-200" />
                  <p className="text-[15px] font-medium text-slate-500">No regularization requests</p>
                  <p className="text-[13px] mt-1 text-slate-400 text-center px-6">Any requests you submit will appear here.</p>
                </div>
              )}

            </div>

            {/* Sticky Bottom Button */}
            <div className="p-4 bg-white shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <Button 
                onClick={handleAddRegularization}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-[14px] py-6 text-[15px] font-medium shadow-none active:scale-[0.98] transition-transform"
              >
                Add Regularization
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col p-4 pt-6 bg-slate-50">
            <div className="space-y-4 flex-1">
              
              {/* Date Selection */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CalendarIcon className="w-5 h-5 text-primary/70" />
                </div>
                <Input 
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="pl-10 h-14 bg-white border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium"
                />
              </div>

              {/* Request Type Selection */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <Clock className="w-5 h-5 text-primary/70" />
                </div>
                <Select value={reqType} onValueChange={setReqType}>
                  <SelectTrigger className="pl-10 h-14 bg-white border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium">
                    <SelectValue placeholder="Select Request Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    <SelectItem value="check-in" className="py-3">Check In</SelectItem>
                    <SelectItem value="check-out" className="py-3">Check Out</SelectItem>
                    <SelectItem value="both" className="py-3">Check In & Check Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Time Inputs */}
              {(reqType === 'check-in' || reqType === 'both') && (
                <div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    setActiveTimeField('checkIn');
                    setPickerOpen(true);
                  }}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="w-5 h-5 text-primary/70" />
                  </div>
                  <Input 
                    type="text"
                    readOnly
                    value={checkInTime || '--:--'}
                    className="pl-10 pr-24 h-14 bg-white border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium cursor-pointer caret-transparent"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Check In
                  </div>
                </div>
              )}

              {(reqType === 'check-out' || reqType === 'both') && (
                <div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    setActiveTimeField('checkOut');
                    setPickerOpen(true);
                  }}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="w-5 h-5 text-primary/70" />
                  </div>
                  <Input 
                    type="text"
                    readOnly
                    value={checkOutTime || '--:--'}
                    className="pl-10 pr-24 h-14 bg-white border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium cursor-pointer caret-transparent"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Check Out
                  </div>
                </div>
              )}

              {/* Reason Textarea */}
              <div className="relative">
                <div className="absolute left-3 top-4 pointer-events-none">
                  <FileText className="w-5 h-5 text-primary/70" />
                </div>
                <Textarea 
                  placeholder="Enter Reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="pl-10 min-h-[120px] pt-4 bg-white border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium resize-none"
                />
              </div>
              
            </div>

            {/* Submit Button */}
            <div className="pb-8 sm:pb-4 mt-6">
              <Button 
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-[14px] py-6 text-[15px] font-medium shadow-none active:scale-[0.98] transition-transform"
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
      
      {/* Custom Material-style Analog Time Picker */}
      <TimePickerDialog 
        open={pickerOpen} 
        onOpenChange={setPickerOpen}
        value={activeTimeField === 'checkIn' ? checkInTime : checkOutTime}
        onChange={(val) => {
          if (activeTimeField === 'checkIn') setCheckInTime(val);
          else setCheckOutTime(val);
        }}
      />
    </Sheet>
  );
}
