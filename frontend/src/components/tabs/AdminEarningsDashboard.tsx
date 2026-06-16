import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { IndianRupee, TrendingUp, Users } from 'lucide-react';

export function AdminEarningsDashboard() {
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetch(`/api/ops/tracking-entries/`).then(res => res.json()),
        fetch(`/api/ops/wallets/`).then(res => res.json()),
        fetch(`/api/employees/`).then(res => res.json())
      ]).then(([tracking, wallets, emps]) => {
        setTrackingData(tracking);
        setWalletData(wallets);
        setEmployees(emps);
      }).catch(console.error);
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Process data for the chart: Aggregate daily earnings
  const dailyEarnings = trackingData.reduce((acc: any, entry: any) => {
    if (entry.status === 'offline') { // Only count completed trips
      const date = entry.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += entry.reimbursementAmount;
    }
    return acc;
  }, {});

  // Sort dates and format for Recharts
  const chartData = Object.keys(dailyEarnings).sort().map(date => ({
    date,
    Earnings: dailyEarnings[date]
  }));

  // Process employee wallets for the table
  const tableData = employees.map(emp => {
    const wallet = walletData.find(w => w.employeeId === emp.employeeId);
    return {
      name: emp.fullName,
      employeeId: emp.employeeId,
      department: emp.department,
      balance: wallet?.balance || 0,
      totalEarned: wallet?.totalEarned || 0,
      totalWithdrawn: wallet?.totalWithdrawn || 0,
    };
  });

  const totalCompanyEarnings = tableData.reduce((sum, emp) => sum + emp.totalEarned, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Company Earnings Paid</p>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₹{totalCompanyEarnings.toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Active Wallets</p>
                <h3 className="text-3xl font-bold">{walletData.length}</h3>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Trips Completed</p>
                <h3 className="text-3xl font-bold">{trackingData.filter(t => t.status === 'offline').length}</h3>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Daily Company Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="Earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No earnings data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Employee Wallet Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Total Withdrawn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No employee wallets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((emp, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {emp.name}
                        <div className="text-xs text-muted-foreground">{emp.employeeId}</div>
                      </TableCell>
                      <TableCell>{emp.department || '-'}</TableCell>
                      <TableCell className="font-bold text-green-600 dark:text-green-400">₹{emp.balance.toFixed(2)}</TableCell>
                      <TableCell>₹{emp.totalEarned.toFixed(2)}</TableCell>
                      <TableCell>₹{emp.totalWithdrawn.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
