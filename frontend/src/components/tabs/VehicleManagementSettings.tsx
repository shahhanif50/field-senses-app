import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Car, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/DataTable";
import { GlassModal } from "@/components/ui/GlassModal";
import { toast } from "@/hooks/use-toast";

interface VehicleConfig {
  id: string;
  name: string;
  type: string;
  ratePerKm: number;
}

export const VehicleManagementSettings = () => {
  const [vehicles, setVehicles] = useState<VehicleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<VehicleConfig>>({
    name: "",
    type: "2W",
    ratePerKm: 0.0,
  });

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ops/vehicles/');
      if (res.ok) {
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch vehicles.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", type: "2W", ratePerKm: 0.0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: VehicleConfig) => {
    setEditingId(vehicle.id);
    setFormData({ name: vehicle.name, type: vehicle.type, ratePerKm: vehicle.ratePerKm });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    
    try {
      const res = await fetch(`/api/ops/vehicles/${id}/`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Vehicle deleted successfully." });
        fetchVehicles();
      } else {
        toast({ title: "Error", description: "Failed to delete vehicle.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const url = editingId ? `/api/ops/vehicles/${editingId}/` : `/api/ops/vehicles/`;
      const method = editingId ? "PUT" : "POST";
      
      const payload = {
        name: formData.name,
        type: formData.type,
        ratePerKm: Number(formData.ratePerKm) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Vehicle ${editingId ? "updated" : "added"} successfully.` });
        setIsModalOpen(false);
        fetchVehicles();
      } else {
        toast({ title: "Error", description: "Failed to save vehicle.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<VehicleConfig>[] = [
    { 
      header: "Vehicle Name", 
      key: "name",
      render: (val) => <div className="font-medium text-slate-800">{val as string}</div>
    },
    { 
      header: "Type", 
      key: "type",
      render: (val) => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
          {val as string}
        </span>
      )
    },
    { 
      header: "Rate per KM", 
      key: "ratePerKm",
      render: (val) => <div className="font-semibold text-emerald-600">₹{Number(val).toFixed(2)}</div>
    },
    {
      header: "Actions",
      key: "id",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(row)}>
            <Edit className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Car className="w-6 h-6 text-indigo-600" />
            Vehicle Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Configure company vehicles and standard reimbursement rates per KM.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search vehicles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchVehicles} disabled={isLoading} className="bg-white">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleOpenAddModal} className="gradient-btn shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border overflow-hidden"
      >
        <DataTable 
          data={filteredVehicles} 
          columns={columns} 
        />
      </motion.div>

      <GlassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Vehicle" : "Add New Vehicle"}
      >
        <div className="space-y-5 p-1">
          <div className="space-y-2">
            <Label>Vehicle Name <span className="text-red-500">*</span></Label>
            <Input 
              placeholder="e.g. Company Bike, Personal Car" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Type <span className="text-red-500">*</span></Label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2W">2 Wheeler (2W)</SelectItem>
                  <SelectItem value="4W">4 Wheeler (4W)</SelectItem>
                  <SelectItem value="Public Transport">Public Transport</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Rate per KM (₹) <span className="text-red-500">*</span></Label>
              <Input 
                type="number"
                step="0.1"
                placeholder="0.0" 
                value={formData.ratePerKm} 
                onChange={e => setFormData({ ...formData, ratePerKm: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="gradient-btn">
              {editingId ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
