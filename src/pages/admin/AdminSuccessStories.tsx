import { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSuccessStories, SuccessStory } from '@/hooks/useSuccessStories';
import { Plus, Edit2, Trash2, Trophy, MapPin, Briefcase, Quote, IndianRupee, Video, Link, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { candidate_name: '', package: '', location: '', domain: '', motivation_words: '', video_url: '' as string, video_path: '' as string };

type VideoMode = 'none' | 'link' | 'upload';

const AdminSuccessStories = () => {
  const { stories, isLoading, addStory, updateStory, deleteStory, uploadVideo, deleteVideoFile, getVideoPublicUrl } = useSuccessStories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<VideoMode>('none');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditingStory(null);
    setForm(emptyForm);
    setVideoMode('none');
    setVideoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setForm({
      candidate_name: story.candidate_name,
      package: story.package,
      location: story.location,
      domain: story.domain,
      motivation_words: story.motivation_words,
      video_url: story.video_url || '',
      video_path: story.video_path || '',
    });
    if (story.video_path) setVideoMode('upload');
    else if (story.video_url) setVideoMode('link');
    else setVideoMode('none');
    setVideoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.candidate_name || !form.package || !form.location || !form.domain || !form.motivation_words) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    let finalVideoUrl = '';
    let finalVideoPath = '';

    try {
      if (videoMode === 'link') {
        finalVideoUrl = form.video_url;
        // If previously had an uploaded video, delete it
        if (editingStory?.video_path) await deleteVideoFile(editingStory.video_path);
      } else if (videoMode === 'upload') {
        if (videoFile) {
          if (videoFile.size > 50 * 1024 * 1024) { toast.error('Video must be under 50MB'); setUploading(false); return; }
          // Delete old video if replacing
          if (editingStory?.video_path) await deleteVideoFile(editingStory.video_path);
          const path = await uploadVideo(videoFile);
          if (!path) { setUploading(false); return; }
          finalVideoPath = path;
        } else {
          finalVideoPath = form.video_path; // keep existing
        }
      } else {
        // none - remove video
        if (editingStory?.video_path) await deleteVideoFile(editingStory.video_path);
      }

      const payload = {
        candidate_name: form.candidate_name,
        package: form.package,
        location: form.location,
        domain: form.domain,
        motivation_words: form.motivation_words,
        video_url: finalVideoUrl || null,
        video_path: finalVideoPath || null,
      };

      if (editingStory) {
        await updateStory(editingStory.id, payload);
      } else {
        await addStory(payload as any);
      }
      setDialogOpen(false);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStory(id);
    setDeleteConfirm(null);
  };

  const getDisplayVideoUrl = (story: SuccessStory) => {
    if (story.video_path) return getVideoPublicUrl(story.video_path);
    return story.video_url || null;
  };

  const isYoutubeLink = (url: string) => /youtu\.?be/.test(url);
  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Success Stories
            </h1>
            <p className="text-muted-foreground">Manage placement success stories</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Story
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No success stories yet. Add one!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => {
              const videoSrc = getDisplayVideoUrl(story);
              return (
                <Card key={story.id} className="relative overflow-hidden border-border/50 hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                  {videoSrc && (
                    <div className="w-full aspect-video bg-muted">
                      {isYoutubeLink(videoSrc) ? (
                        <iframe src={getYoutubeEmbedUrl(videoSrc)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                      ) : (
                        <video src={videoSrc} controls className="w-full h-full object-cover" preload="metadata" />
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-foreground">{story.candidate_name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(story)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(story.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <IndianRupee className="h-3 w-3" /> {story.package}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <MapPin className="h-3 w-3" /> {story.location}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        <Briefcase className="h-3 w-3" /> {story.domain}
                      </span>
                    </div>
                    <div className="relative pl-4 border-l-2 border-amber-400">
                      <Quote className="absolute -left-2.5 -top-1 h-5 w-5 text-amber-400 bg-card" />
                      <p className="text-sm text-muted-foreground italic leading-relaxed">{story.motivation_words}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStory ? 'Edit' : 'Add'} Success Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Candidate Name</label>
              <Input value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} placeholder="e.g. Rahul Kumar" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Package (CTC)</label>
              <Input value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="e.g. 6 LPA" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Domain</label>
              <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. IT / Non-IT / Banking" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Motivation Words</label>
              <Textarea value={form.motivation_words} onChange={(e) => setForm({ ...form, motivation_words: e.target.value })} placeholder="Inspiring words from the candidate..." rows={3} />
            </div>

            {/* Video Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Video className="h-4 w-4" /> Video (Optional)
              </label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={videoMode === 'none' ? 'default' : 'outline'} onClick={() => { setVideoMode('none'); setVideoFile(null); }}>
                  <X className="h-3 w-3 mr-1" /> None
                </Button>
                <Button type="button" size="sm" variant={videoMode === 'link' ? 'default' : 'outline'} onClick={() => { setVideoMode('link'); setVideoFile(null); }}>
                  <Link className="h-3 w-3 mr-1" /> Link
                </Button>
                <Button type="button" size="sm" variant={videoMode === 'upload' ? 'default' : 'outline'} onClick={() => { setVideoMode('upload'); }}>
                  <Upload className="h-3 w-3 mr-1" /> Upload
                </Button>
              </div>

              {videoMode === 'link' && (
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="YouTube or video URL..."
                />
              )}
              {videoMode === 'upload' && (
                <div className="space-y-2">
                  {form.video_path && !videoFile && (
                    <p className="text-xs text-muted-foreground">Existing video attached. Upload new to replace.</p>
                  )}
                  <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="w-full">
                    <Upload className="h-4 w-4 mr-2" /> {videoFile ? videoFile.name : 'Choose video (max 50MB)'}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={uploading}>{uploading ? 'Uploading...' : editingStory ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Success Story?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSuccessStories;
