import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, hasRole } from '@/services/authApi';
import { 
  getUsefulLinks, 
  createUsefulLink, 
  updateUsefulLink, 
  deleteUsefulLink 
} from '@/services/usefulLinksApi';
import {
  Search,
  Shield,
  Building,
  FileText,
  Globe,
  CreditCard,
  Landmark,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Filter,
  MoreVertical,
  Copy,
  Star,
  Clock,
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";

const CATEGORIES = [
  'MOHRE', 'GDRFA', 'DED', 'ICP', 'MOI', 'Invest', 
  'Insurance', 'Banking', 'Municipality', 'Other'
];

const CATEGORY_COLORS = {
  MOHRE: 'bg-blue-100 text-blue-700',
  GDRFA: 'bg-green-100 text-green-700',
  DED: 'bg-purple-100 text-purple-700',
  ICP: 'bg-amber-100 text-amber-700',
  MOI: 'bg-red-100 text-red-700',
  Invest: 'bg-indigo-100 text-indigo-700',
  Insurance: 'bg-cyan-100 text-cyan-700',
  Banking: 'bg-emerald-100 text-emerald-700',
  Municipality: 'bg-orange-100 text-orange-700',
  Other: 'bg-slate-100 text-slate-700'
};

const CATEGORY_ICONS = {
  MOHRE: <Shield className="w-4 h-4" />,
  GDRFA: <Globe className="w-4 h-4" />,
  DED: <Landmark className="w-4 h-4" />,
  ICP: <FileText className="w-4 h-4" />,
  MOI: <Shield className="w-4 h-4" />,
  Invest: <Building className="w-4 h-4" />,
  Insurance: <CreditCard className="w-4 h-4" />,
  Banking: <CreditCard className="w-4 h-4" />,
  Municipality: <Building className="w-4 h-4" />,
  Other: <ExternalLink className="w-4 h-4" />
};

export default function UsefulLinksComponent() {
  const user = getUser();
  const isAdmin = hasRole('admin');
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'MOHRE',
    icon: ''
  });

  // Queries
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['usefulLinks'],
    queryFn: getUsefulLinks
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUsefulLink,
    onSuccess: () => {
      queryClient.invalidateQueries(['usefulLinks']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUsefulLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['usefulLinks']);
      setShowEditDialog(false);
      setSelectedLink(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsefulLink,
    onSuccess: () => {
      queryClient.invalidateQueries(['usefulLinks']);
      setShowDeleteDialog(false);
      setSelectedLink(null);
    }
  });

  // Filter links
  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get categories from data
  const categories = ['all', ...new Set(links.map(link => link.category))].filter(Boolean);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category: 'MOHRE',
      icon: ''
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedLink) {
      updateMutation.mutate({ id: selectedLink.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle edit
  const handleEdit = (link) => {
    setSelectedLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      category: link.category || 'MOHRE',
      icon: link.icon || ''
    });
    setShowEditDialog(true);
  };

  // Handle delete
  const handleDelete = (link) => {
    setSelectedLink(link);
    setShowDeleteDialog(true);
  };

  // Copy URL to clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  // Format URL for display
  const formatUrl = (url) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Useful Links</h1>
          <p className="text-slate-500 mt-1">Quick access to government portals and business services</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Add New Link
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Links</p>
              <p className="text-2xl font-bold text-slate-800">{links.length}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-2xl font-bold text-slate-800">{categories.length - 1}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Showing</p>
              <p className="text-2xl font-bold text-slate-800">{filteredLinks.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search links..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(cat => cat !== 'all').map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ExternalLink className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No links found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try changing your search criteria' 
                : 'No links available yet'}
            </p>
            {isAdmin && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Link
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      {CATEGORY_ICONS[link.category] || <ExternalLink className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 line-clamp-1">{link.name}</h3>
                      <Badge className={`mt-1 ${CATEGORY_COLORS[link.category] || CATEGORY_COLORS.Other}`}>
                        {link.category}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(link)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(link.url)}>
                          <Copy className="w-4 h-4 mr-2" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(link)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                  {link.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-amber-600 hover:text-amber-700 inline-flex items-center"
                  >
                    Visit Portal
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <div className="text-xs text-slate-400 truncate max-w-[150px]">
                    {formatUrl(link.url)}
                  </div>
                </div>
                
                {link.created_at && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Added {new Date(link.created_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setSelectedLink(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            <DialogDescription>
              {selectedLink ? 'Update the link details' : 'Add a new useful link to the collection'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., MOHRE Inquiry Portal"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL *</label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://example.com"
                  type="url"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the portal"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon (Optional)</label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="Icon name or emoji"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setSelectedLink(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : selectedLink ? 'Update Link' : 'Add Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{selectedLink?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteMutation.mutate(selectedLink?.id)}
            >
              Delete Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Information Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-amber-700">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">All links are official government portals (secure HTTPS)</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Links open in new tab for your convenience</span>
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium">Always verify the URL is correct before entering sensitive information</span>
            </li>
            {isAdmin && (
              <li className="flex items-start">
                <Star className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">You have admin access to manage all links</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
