import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Clock, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassModal } from '@/components/ui/GlassModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMasterData } from '@/contexts/MasterDataContext';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  assignedEmployee: string;
  assignedEmployeeName?: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  project: string;
  projectName?: string;
  assignedEmployee: string;
  assignedEmployeeName?: string;
  dueDate: string;
}

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { employees } = useMasterData();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [projectForm, setProjectForm] = useState<Partial<Project>>({});
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});

  const userRole = sessionStorage.getItem("userRole") || "employee";
  const employeeId = sessionStorage.getItem("employeeId") || "";
  const isAdmin = userRole.toLowerCase() === "admin";

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      let url = 'http://127.0.0.1:8000/api/projects/';
      if (!isAdmin) url += `?employeeId=${employeeId}`;
      const response = await fetch(url);
      if (response.ok) {
        setProjects(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      let url = 'http://127.0.0.1:8000/api/tasks/';
      if (!isAdmin) url += `?employeeId=${employeeId}`;
      const response = await fetch(url);
      if (response.ok) {
        setTasks(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProject = async () => {
    const url = projectForm.id 
      ? `http://127.0.0.1:8000/api/projects/${projectForm.id}/`
      : 'http://127.0.0.1:8000/api/projects/';
    const method = projectForm.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      if (response.ok) {
        fetchProjects();
        setIsProjectModalOpen(false);
        setProjectForm({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTask = async () => {
    const url = taskForm.id 
      ? `http://127.0.0.1:8000/api/tasks/${taskForm.id}/`
      : 'http://127.0.0.1:8000/api/tasks/';
    const method = taskForm.id ? 'PUT' : 'POST';

    // If an employee updates a task status, they use PUT
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      if (response.ok) {
        fetchTasks();
        setIsTaskModalOpen(false);
        setTaskForm({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string, currentTask: Task) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentTask, status: newStatus })
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (status === 'In Progress') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (status === 'Done' || status === 'Completed') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-primary" /> Projects
            </h2>
            <p className="text-muted-foreground mt-1">Manage active initiatives and projects.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setProjectForm({}); setIsProjectModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-card/40 border border-border/50 p-6 rounded-2xl hover:shadow-lg transition-all relative group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{proj.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(proj.status)}`}>
                  {proj.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{proj.description}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-4">
                <span>Assignee: {proj.assignedEmployeeName || 'Unassigned'}</span>
                <span>Due: {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => { setProjectForm(proj); setIsProjectModalOpen(true); }}
                  className="absolute top-4 right-20 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full hover:bg-accent"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {projects.length === 0 && <p className="text-muted-foreground italic">No projects found.</p>}
        </div>
      </section>

      {/* Tasks Section */}
      <section className="pt-8 border-t border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" /> Tasks
            </h2>
            <p className="text-muted-foreground mt-1">Track and manage individual task assignments.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setTaskForm({}); setIsTaskModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between bg-card/40 border border-border/50 p-4 rounded-xl hover:bg-card/60 transition-colors gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold">{task.title}</h4>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{task.projectName}</span>
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                  <span>Assigned to: {task.assignedEmployeeName || 'Unassigned'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select
                  value={task.status}
                  onValueChange={(val) => handleUpdateTaskStatus(task.id, val, task)}
                >
                  <SelectTrigger className={`w-36 h-9 ${getStatusColor(task.status)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => { setTaskForm(task); setIsTaskModalOpen(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-muted-foreground italic">No tasks found.</p>}
        </div>
      </section>

      {/* Project Modal */}
      <GlassModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={projectForm.id ? "Edit Project" : "New Project"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={projectForm.name || ''} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={projectForm.description || ''} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={projectForm.status || 'Active'} onValueChange={(v) => setProjectForm({...projectForm, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={projectForm.assignedEmployee || ''} onValueChange={(v) => setProjectForm({...projectForm, assignedEmployee: v})}>
              <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={projectForm.startDate || ''} onChange={e => setProjectForm({...projectForm, startDate: e.target.value})} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={projectForm.endDate || ''} onChange={e => setProjectForm({...projectForm, endDate: e.target.value})} /></div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProject}>Save Project</Button>
          </div>
        </div>
      </GlassModal>

      {/* Task Modal */}
      <GlassModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={taskForm.id ? "Edit Task" : "New Task"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={taskForm.title || ''} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={taskForm.description || ''} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={taskForm.project || ''} onValueChange={(v) => setTaskForm({...taskForm, project: v})}>
              <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={taskForm.status || 'Pending'} onValueChange={(v) => setTaskForm({...taskForm, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={taskForm.assignedEmployee || ''} onValueChange={(v) => setTaskForm({...taskForm, assignedEmployee: v})}>
              <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.dueDate || ''} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>Save Task</Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
