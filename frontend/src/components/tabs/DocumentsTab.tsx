import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Download, Trash2, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassModal } from '@/components/ui/GlassModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Label } from '@/components/ui/label';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

interface Document {
  id: string;
  title: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadDate: string;
  fileType: string;
  status: string;
}

export function DocumentsTab() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const userRole = sessionStorage.getItem("userRole") || "employee";
  const userId = sessionStorage.getItem("userId") || "";
  const employeeId = sessionStorage.getItem("employeeId") || "";
  const isAdmin = userRole.toLowerCase() === "admin";

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API}/api/documents/`, {
        headers: {
          'X-User-Id': userId,
          'X-User-Role': userRole.toUpperCase()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle || !uploadFile) return;

    // Convert file to base64 for now
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const fileType = uploadFile.name.split('.').pop() || 'unknown';

      try {
        const response = await fetch(`${API}/api/documents/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-User-Role': userRole.toUpperCase()
          },
          body: JSON.stringify({
            title: uploadTitle,
            fileUrl: base64String,
            uploadedBy: userId,
            fileType: fileType,
            status: 'Valid'
          }),
        });
        
        if (response.ok) {
          setIsUploadModalOpen(false);
          setUploadTitle('');
          setUploadFile(null);
          fetchDocuments();
        }
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        const response = await fetch(`${API}/api/documents/${id}/`, {
          method: 'DELETE',
          headers: {
            'X-User-Id': userId,
            'X-User-Role': userRole.toUpperCase()
          }
        });
        if (response.ok) {
          fetchDocuments();
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documents & Logs</h2>
          <p className="text-muted-foreground">Manage project documents, visit photos, task proofs, and activity logs.</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="bg-card/50 border border-border/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocuments.map((doc, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={doc.id}
            className="group bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDelete(doc.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
            
            <h3 className="font-semibold text-lg mb-1 truncate pr-8">{doc.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{doc.fileType.toUpperCase()} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
            
            {isAdmin && <p className="text-xs text-muted-foreground mb-4 truncate">Uploaded By: {doc.uploadedByName}</p>}
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
              <StatusBadge status="active" label={doc.status} />
              <a href={doc.fileUrl} download={doc.title} className="p-2 hover:bg-primary/10 text-primary rounded-full transition-colors cursor-pointer">
                <Download className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ))}
        {filteredDocuments.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-muted-foreground">Upload your first document to get started.</p>
          </div>
        )}
      </div>

      <GlassModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document Title</Label>
            <Input 
              placeholder="e.g. Visit Proof - Store X" 
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Select File</Label>
            <Input 
              type="file" 
              onChange={handleFileChange}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
