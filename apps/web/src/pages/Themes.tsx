import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Eye } from "lucide-react";
import { useThemes } from "@/hooks/use-themes-api";
import { CreateThemeDialog } from "@/components/CreateThemeDialog";
import { SidePanel } from "@/components/SidePanel";
import ReactMarkdown from "react-markdown";

export default function Themes() {
  const { userRole } = useAuth();
  const { data, isLoading } = useThemes();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const isAdmin = userRole === "admin";

  const handleViewTheme = (theme: any) => {
    setSelectedTheme({
      id: theme.id,
      name: theme.name,
      description: theme.description || "No description available.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  const themes = data?.themes || [];
  const totalThemes = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Themes</h1>
          <p className="text-gray-500">
            Browse and manage investment themes
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Themes
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalThemes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Themes List */}
      <Card>
        <CardHeader>
          <CardTitle>Themes</CardTitle>
          <CardDescription>View all available themes</CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No themes available yet.
              {isAdmin && " Click 'Create Theme' to add one."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme) => (
                <Card
                  key={theme.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {theme.description.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created by{" "}
                        {theme.creator?.fullName || "Unknown"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTheme(theme)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Panel for Theme Details */}
      <SidePanel
        open={!!selectedTheme}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme ? `Theme: ${selectedTheme.name}` : ""}
      >
        {selectedTheme && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{selectedTheme.description}</ReactMarkdown>
          </div>
        )}
      </SidePanel>

      {/* Create Dialog */}
      <CreateThemeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
