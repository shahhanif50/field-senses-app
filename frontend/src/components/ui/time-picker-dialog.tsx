import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface TimePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string; // HH:MM 24hr string
  onChange: (value: string) => void;
}

export function TimePickerDialog({ open, onOpenChange, value, onChange }: TimePickerDialogProps) {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  
  // Track dragging state
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) {
      if (value) {
        const [h, m] = value.split(':').map(Number);
        setPeriod(h >= 12 ? 'PM' : 'AM');
        setHour(h % 12 || 12);
        setMinute(m || 0);
      } else {
        const d = new Date();
        const h = d.getHours();
        setPeriod(h >= 12 ? 'PM' : 'AM');
        setHour(h % 12 || 12);
        setMinute(d.getMinutes());
      }
      setMode('hours');
    }
  }, [open, value]);

  const handleInteraction = (e: React.MouseEvent | React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 128; // 128 is center of 256px circle
    const y = e.clientY - rect.top - 128;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    if (mode === 'hours') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      setHour(h);
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      setMinute(m);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleInteraction(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      handleInteraction(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (mode === 'hours') {
        // Auto-switch to minutes after picking hour
        setTimeout(() => setMode('minutes'), 300);
      }
    }
  };

  const handleOk = () => {
    let finalHour = hour;
    if (period === 'PM' && hour < 12) finalHour += 12;
    if (period === 'AM' && hour === 12) finalHour = 0;
    
    const formatted = `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(formatted);
    onOpenChange(false);
  };

  // Render the numbers for the clock face
  const renderDialNumbers = () => {
    const items = [];
    const total = mode === 'hours' ? 12 : 12; 
    
    for (let i = 1; i <= total; i++) {
      const val = mode === 'hours' ? i : (i === 12 ? 0 : i * 5);
      const displayVal = mode === 'minutes' ? val.toString().padStart(2, '0') : val;
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const r = 105;
      const left = 128 + r * Math.cos(angle);
      const top = 128 + r * Math.sin(angle);
      
      const isSelected = mode === 'hours' ? hour === val : (minute % 5 === 0 && minute === val);

      items.push(
        <div 
          key={i}
          className={`absolute flex items-center justify-center w-9 h-9 -ml-[18px] -mt-[18px] rounded-full text-[15px] pointer-events-none transition-colors ${isSelected ? 'bg-primary text-white font-semibold' : 'text-slate-800'}`}
          style={{ left: `${left}px`, top: `${top}px` }}
        >
          {displayVal}
        </div>
      );
    }
    return items;
  };

  // Render the connecting line
  const renderHand = () => {
    const val = mode === 'hours' ? hour : minute / 5;
    const angle = (val * 30 - 90);
    
    return (
      <div 
        className="absolute top-1/2 left-1/2 w-0.5 bg-primary origin-bottom pointer-events-none transition-transform"
        style={{ 
          height: '105px', 
          marginTop: '-105px',
          marginLeft: '-1px',
          transform: `rotate(${angle}deg)` 
        }}
      >
        {/* The dot at the end of the hand if minute is not a multiple of 5 */}
        {mode === 'minutes' && minute % 5 !== 0 && (
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full" />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none w-auto max-w-none flex justify-center items-center [&>button]:hidden z-[100]">
        <div className="bg-[#f4edf2] rounded-[32px] p-6 w-[320px] shadow-2xl flex flex-col items-center">
          
          <div className="w-full text-left text-sm font-medium text-slate-700 mb-6 px-1">Select time</div>
          
          {/* Digital Display Area */}
          <div className="flex items-center gap-2 mb-8 h-24">
            <div 
              className={`w-[84px] h-[84px] rounded-2xl flex items-center justify-center text-[44px] cursor-pointer transition-colors ${mode === 'hours' ? 'bg-primary/20 text-primary font-bold' : 'bg-slate-200/60 text-slate-700 font-normal hover:bg-slate-200'}`}
              onClick={() => setMode('hours')}
            >
              {hour}
            </div>
            <div className="text-[44px] text-slate-700 font-light pb-2 leading-none">:</div>
            <div 
              className={`w-[84px] h-[84px] rounded-2xl flex items-center justify-center text-[44px] cursor-pointer transition-colors ${mode === 'minutes' ? 'bg-primary/20 text-primary font-bold' : 'bg-slate-200/60 text-slate-700 font-normal hover:bg-slate-200'}`}
              onClick={() => setMode('minutes')}
            >
              {minute.toString().padStart(2, '0')}
            </div>
            
            {/* AM/PM toggle */}
            <div className="flex flex-col ml-2 border border-slate-300 rounded-xl overflow-hidden h-[84px] w-[50px]">
              <div 
                className={`flex-1 flex items-center justify-center text-[13px] font-bold cursor-pointer transition-colors ${period === 'AM' ? 'bg-primary/20 text-primary' : 'bg-transparent text-slate-600 hover:bg-slate-200/50'}`}
                onClick={() => setPeriod('AM')}
              >
                AM
              </div>
              <div className="h-px bg-slate-300 w-full"></div>
              <div 
                className={`flex-1 flex items-center justify-center text-[13px] font-bold cursor-pointer transition-colors ${period === 'PM' ? 'bg-primary/20 text-primary' : 'bg-transparent text-slate-600 hover:bg-slate-200/50'}`}
                onClick={() => setPeriod('PM')}
              >
                PM
              </div>
            </div>
          </div>
          
          {/* Analog Dial Area */}
          <div 
            className="relative w-[256px] h-[256px] rounded-full bg-slate-200/60 mb-6 touch-none cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {renderDialNumbers()}
            
            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-primary rounded-full pointer-events-none"></div>
            
            {/* Clock Hand */}
            {renderHand()}
          </div>
          
          {/* Bottom Actions */}
          <div className="w-full flex justify-between items-center px-1">
            <div className="cursor-pointer p-2.5 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary font-semibold text-[15px] px-4" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary font-semibold text-[15px] px-4" onClick={handleOk}>
                OK
              </Button>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
