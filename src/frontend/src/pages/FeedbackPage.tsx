import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Star } from "lucide-react";
import { useState } from "react";

const FEATURES = [
  "Course Registration",
  "Results Entry",
  "Score Sheets",
  "Reports",
  "Student Portal",
  "Other",
];

export interface FeedbackSubmission {
  name: string;
  role: string;
  rating: number;
  features: string[];
  comments: string;
  timestamp: string;
}

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function toggleFeature(f: string) {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role || rating === 0) return;
    const submission: FeedbackSubmission = {
      name: name.trim(),
      role,
      rating,
      features,
      comments: comments.trim(),
      timestamp: new Date().toISOString(),
    };
    const existing: FeedbackSubmission[] = JSON.parse(
      localStorage.getItem("feedbackSubmissions") ?? "[]",
    );
    existing.push(submission);
    localStorage.setItem("feedbackSubmissions", JSON.stringify(existing));
    setSubmitted(true);
  }

  const appUrl = `${window.location.origin}/feedback`;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              UniResults Pro
            </h1>
            <p className="text-xs text-muted-foreground">
              Beta Feedback — Federal University of Education Kontagora
            </p>
          </div>
        </div>

        {submitted ? (
          <Card data-ocid="feedback.success_state">
            <CardContent className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Star className="w-7 h-7 text-green-600 fill-green-600" />
              </div>
              <h2 className="text-xl font-bold">
                Thank you for your feedback!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your response has been recorded. It will help us improve
                UniResults Pro.
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground mb-1">
                  Share this link with others:
                </p>
                <p className="font-mono text-xs break-all text-foreground">
                  {appUrl}
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setRole("");
                  setRating(0);
                  setFeatures([]);
                  setComments("");
                }}
              >
                Submit Another Response
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Share Your Feedback</CardTitle>
              <p className="text-sm text-muted-foreground">
                Help us improve by sharing your experience with the beta
                version.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fb-name">Your Name</Label>
                  <Input
                    id="fb-name"
                    data-ocid="feedback.input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger data-ocid="feedback.select">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Lecturer">Lecturer</SelectItem>
                      <SelectItem value="HOD">HOD</SelectItem>
                      <SelectItem value="Dean">Dean</SelectItem>
                      <SelectItem value="Admin">Admin / Registrar</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Overall Rating</Label>
                  <div className="flex gap-1" data-ocid="feedback.toggle">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {
                        ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                          rating - 1
                        ]
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Features You Tested</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map((f) => (
                      <label
                        key={f}
                        htmlFor={`fb-feature-${f}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          id={`fb-feature-${f}`}
                          checked={features.includes(f)}
                          onCheckedChange={() => toggleFeature(f)}
                          data-ocid="feedback.checkbox"
                        />
                        <span className="text-sm">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-comments">Comments</Label>
                  <Textarea
                    id="fb-comments"
                    data-ocid="feedback.textarea"
                    placeholder="What did you like? What can be improved?"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  data-ocid="feedback.submit_button"
                  disabled={!name.trim() || !role || rating === 0}
                >
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
