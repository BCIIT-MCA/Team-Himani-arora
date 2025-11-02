import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Download,
  Play,
  FileText,
  Headphones,
  Video,
  ExternalLink,
  Search,
} from "lucide-react";
import { useResources } from "@/hooks/useResources";
import { useState } from "react";
import { INDIAN_STUDENT_CRISIS_CONTACTS } from "@/lib/constants";

const ResourcesPage = () => {
  const {
    resources,
    loading,
    error,
    searchQuery,
    selectedType,
    selectedCategory,
    resourcesByType,
    searchResources,
    setTypeFilter,
    setCategoryFilter,
    trackResourceView,
  } = useResources();

  const [activeTab, setActiveTab] = useState("articles");
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // Get filtered resources by type
  const articles = resourcesByType.articles;
  const worksheets = resourcesByType.worksheets;
  const audioResources = resourcesByType.audio;
  const videoResources = resourcesByType.video;

  // Combine audio and video for media tab
  const mediaResources = [...audioResources, ...videoResources];

  const handleSearch = (term: string) => {
    setLocalSearchTerm(term);
    searchResources(term);
  };

  // External resources focused on Indian students (static resources)
  const externalResources = [
    {
      title: "KIRAN Mental Health Helpline",
      description: "Free 24/7 crisis support for students - Call 1800-599-0019",
      url: "tel:1800-599-0019",
      category: "Crisis Support",
    },
    {
      title: "iCALL - Tata Institute Crisis Helpline",
      description: "Free psychological support for students - Call 9152987821",
      url: "tel:9152987821",
      category: "Crisis Support",
    },
    {
      title: "Vandrevala Foundation Helpline",
      description:
        "Mental health support for students and families - Call 9999666555",
      url: "tel:9999666555",
      category: "Family Support",
    },
    {
      title: "NIMHANS Student Counseling",
      description: "Professional mental health resources and assessment tools",
      url: "https://nimhans.ac.in",
      category: "Assessment",
    },
    {
      title: "UGC Student Helpline",
      description: "Academic stress and career guidance for college students",
      url: "https://www.ugc.ac.in",
      category: "Academic Support",
    },
  ];

  const handleResourceClick = async (resourceId: string) => {
    await trackResourceView(resourceId);
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType?.toLowerCase()) {
      case "video":
        return Video;
      case "audio":
        return Headphones;
      default:
        return Play;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header Section */}
      <section className="pt-20 pb-12 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Student Wellness Resources
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Free evidence-based tools designed for Indian students - exam stress
            management, family pressure coping strategies, and academic support
            resources.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={localSearchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedType || "all"}
              onValueChange={(value) =>
                setTypeFilter(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="worksheet">Worksheets</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {[...Array(4)].map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <Tabs
              defaultValue="articles"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-12">
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="worksheets">Worksheets</TabsTrigger>
                <TabsTrigger value="media">Audio & Video</TabsTrigger>
                <TabsTrigger value="external">External Links</TabsTrigger>
              </TabsList>

              {/* Articles Tab */}
              <TabsContent value="articles" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold mb-4">
                    Educational Articles
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Expert-written articles covering various mental health
                    topics, coping strategies, and wellness tips.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {articles.map((article) => (
                    <Card
                      key={article.id}
                      className={`group hover:shadow-elegant transition-all duration-300 ${
                        article.featured ? "border-primary/50" : ""
                      }`}
                    >
                      {article.featured && (
                        <div className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium w-fit rounded-br-lg">
                          Featured
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">{article.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {article.estimated_duration
                              ? `${article.estimated_duration} min read`
                              : "Quick read"}
                          </span>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription>{article.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          onClick={() => handleResourceClick(article.id)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Article
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Worksheets Tab */}
              <TabsContent value="worksheets" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold mb-4">
                    Downloadable Worksheets
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Practical tools and exercises designed to support your
                    mental health journey and self-reflection.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {worksheets.map((worksheet) => (
                    <Card
                      key={worksheet.id}
                      className="group hover:shadow-elegant transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <Badge variant="outline">{worksheet.category}</Badge>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {worksheet.title}
                        </CardTitle>
                        <CardDescription>
                          {worksheet.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          onClick={() => handleResourceClick(worksheet.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {worksheet.url ? "Download PDF" : "View Resource"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold mb-4">
                    Audio & Video Resources
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Guided meditations, relaxation exercises, and educational
                    videos to support your wellness practice.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {mediaResources.map((resource) => {
                    const IconComponent = getMediaIcon(resource.type);
                    return (
                      <Card
                        key={resource.id}
                        className="group hover:shadow-elegant transition-all duration-300"
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3 mb-3">
                            <IconComponent className="w-8 h-8 text-primary" />
                            <div className="flex space-x-2">
                              <Badge variant="outline">{resource.type}</Badge>
                              {resource.estimated_duration && (
                                <Badge variant="secondary">
                                  {resource.estimated_duration} min
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {resource.title}
                          </CardTitle>
                          <CardDescription>
                            {resource.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            className="w-full"
                            onClick={() => handleResourceClick(resource.id)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play {resource.type}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* External Links Tab */}
              <TabsContent value="external" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold mb-4">
                    External Resources
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Trusted external organizations and websites providing
                    additional mental health support and information.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {externalResources.map((resource, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-elegant transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{resource.category}</Badge>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {resource.title}
                        </CardTitle>
                        <CardDescription>
                          {resource.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline">
                          Visit Website
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* Crisis Resources Banner */}
      <section className="py-12 bg-destructive/10 border-y border-destructive/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-heading font-bold text-destructive mb-4">
            Need Immediate Help?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you're experiencing a mental health crisis or having thoughts of
            self-harm, please reach out for immediate FREE support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="destructive" size="lg">
              Call KIRAN 1800-599-0019 - FREE 24/7
            </Button>
            <Button variant="outline" size="lg">
              Call iCALL 9152987821 - FREE
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;
