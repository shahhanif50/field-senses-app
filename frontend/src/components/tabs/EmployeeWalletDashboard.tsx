import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Banknote, Wallet, ArrowDownCircle, History } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WalletData {
  id: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  requestDate: string;
}

export function EmployeeWalletDashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();

  const employeeId = sessionStorage.getItem('employeeId') || 'EMP-UNKNOWN';

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/?employeeId=${employeeId}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setWallet(data[0]);
      } else if (employeeId && employeeId !== 'EMP-UNKNOWN') {
        // Create wallet if it doesn't exist
        const createRes = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: employeeId,
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0
          })
        });
        const newWallet = await createRes.json();
        setWallet(newWallet);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/withdrawals/?employeeId=${employeeId}`);
      const data = await res.json();
      setWithdrawals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchWithdrawals();
  }, [employeeId]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }
    if (!wallet || amount > wallet.balance) {
      toast({ title: "Insufficient funds", description: "You cannot withdraw more than your current balance.", variant: "destructive" });
      return;
    }

    setIsWithdrawing(true);
    try {
      // 1. Create Withdrawal Request
      await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/withdrawals/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId,
          amount: amount,
          status: 'pending' // As requested, defaulting to pending
        })
      });

      // 2. Update Wallet Balance
      await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/${wallet.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: wallet.balance - amount,
          totalWithdrawn: wallet.totalWithdrawn + amount
        })
      });

      toast({ title: "Withdrawal Requested", description: `₹${amount} has been requested successfully.` });
      setWithdrawAmount('');
      fetchWallet();
      fetchWithdrawals();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to process withdrawal.", variant: "destructive" });
    }
    setIsWithdrawing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> My Earnings & Wallet
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card shadow-lg border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-500" /> Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{wallet?.balance?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{wallet?.totalEarned?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{wallet?.totalWithdrawn?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowDownCircle className="w-5 h-5" /> Withdraw Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Amount (₹)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg bg-background"
              />
            </div>
            <Button 
              className="gradient-btn px-8" 
              onClick={handleWithdraw}
              disabled={isWithdrawing || !wallet || wallet.balance <= 0}
            >
              {isWithdrawing ? "Processing..." : "Request Withdrawal"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map(w => (
                <div key={w.id} className="flex justify-between items-center p-3 border rounded-lg bg-background/50">
                  <div>
                    <p className="font-bold">₹{w.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(w.requestDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      w.status === 'approved' ? 'bg-green-100 text-green-800' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {w.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No withdrawal history found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
