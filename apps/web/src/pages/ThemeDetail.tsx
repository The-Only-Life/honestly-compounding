import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-themes-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ThemeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: theme, isLoading } = useTheme(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  if (!theme) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Theme not found</h2>
        <Button onClick={() => navigate("/dashboard/themes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Themes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/themes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-3xl mb-2">{theme.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Created by {theme.creator?.fullName || "Unknown"}</span>
              <span>•</span>
              <span>{new Date(theme.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <article className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {theme.description}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
