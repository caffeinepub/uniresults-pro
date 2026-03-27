import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, Link, MessageSquare, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { FeedbackSubmission } from "../FeedbackPage";

export default function FeedbackManagementTab() {
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [filterRole, setFilterRole] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem("feedbackSubmissions") ?? "[]",
    );
    setFeedbacks(data);
  }, []);

  const feedbackLink = `${window.location.origin}/feedback`;

  function handleCopyLink() {
    navigator.clipboard.writeText(feedbackLink).then(() => {
      setCopied(true);
      toast.success("Feedback link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterRole !== "all" && f.role !== filterRole) return false;
      if (filterRating !== "all" && String(f.rating) !== filterRating)
        return false;
      return true;
    });
  }, [feedbacks, filterRole, filterRating]);

  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Feedback Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Collect and review beta tester feedback
          </p>
        </div>
        <Button
          data-ocid="feedback_mgmt.primary_button"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy Feedback Link"}
        </Button>
      </div>

      {/* Share link card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Share this link for beta testing
            </p>
            <p className="text-xs font-mono text-muted-foreground break-all mt-0.5">
              {feedbackLink}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            data-ocid="feedback_mgmt.secondary_button"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{feedbacks.length}</p>
            <p className="text-xs text-muted-foreground">Total Responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              {avgRating}
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">
              {feedbacks.filter((f) => f.rating >= 4).length}
            </p>
            <p className="text-xs text-muted-foreground">Positive (4-5 ★)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40" data-ocid="feedback_mgmt.select">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
            <SelectItem value="Lecturer">Lecturer</SelectItem>
            <SelectItem value="HOD">HOD</SelectItem>
            <SelectItem value="Dean">Dean</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-40" data-ocid="feedback_mgmt.select">
            <SelectValue placeholder="Filter by Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent
            className="py-12 text-center text-muted-foreground"
            data-ocid="feedback_mgmt.empty_state"
          >
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>
              No feedback submitted yet. Share the link above to collect
              responses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Responses ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Features Tested</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f, i) => (
                    <TableRow
                      key={`${f.timestamp}-${i}`}
                      data-ocid={`feedback_mgmt.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{f.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= f.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                          <span className="text-xs ml-1 text-muted-foreground">
                            {f.rating}/5
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {f.features.length > 0 ? f.features.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-xs truncate" title={f.comments}>
                          {f.comments || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(f.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
