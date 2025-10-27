import { useParams, useNavigate } from "react-router-dom";
import { useBucket } from "@/hooks/use-buckets-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function BucketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bucket, isLoading } = useBucket(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  if (!bucket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Bucket not found</h2>
        <Button onClick={() => navigate("/dashboard/buckets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Buckets
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
          onClick={() => navigate("/dashboard/buckets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{bucket.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Created by {bucket.creator?.fullName || "Unknown"}</span>
                <span>•</span>
                <span>{new Date(bucket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {bucket.riskMeasure}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <article
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: bucket.description }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
