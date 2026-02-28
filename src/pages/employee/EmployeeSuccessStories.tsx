import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuccessStories } from '@/hooks/useSuccessStories';
import { Trophy, MapPin, Briefcase, Quote, IndianRupee } from 'lucide-react';

const EmployeeSuccessStories = () => {
  const { stories, isLoading, getVideoPublicUrl } = useSuccessStories();

  const getDisplayVideoUrl = (story: any) => {
    if (story.video_path) return getVideoPublicUrl(story.video_path);
    return story.video_url || null;
  };

  const isYoutubeLink = (url: string) => /youtu\.?be/.test(url);
  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Success Stories
          </h1>
          <p className="text-muted-foreground">Inspiring placement success stories</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No success stories yet.</CardContent></Card>
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
                    <CardTitle className="text-lg text-foreground">{story.candidate_name}</CardTitle>
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
    </DashboardLayout>
  );
};

export default EmployeeSuccessStories;
