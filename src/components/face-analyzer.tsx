import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImageUpload } from "./image-upload";
import { RatingDisplay } from "./rating-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, RefreshCw, Shield, Trash2, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeFace, type AnalysisResult } from "@/lib/analyze.functions";

export function FaceAnalyzer() {
  const runAnalysis = useServerFn(analyzeFace);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = Boolean(frontImage && sideImage) && !isAnalyzing;

  const analyzePhotos = async () => {
    if (!frontImage || !sideImage) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await runAnalysis({ data: { frontImage, sideImage } });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFrontImage(null);
    setSideImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="overflow-hidden border-0 bg-card/50 p-0 shadow-xl backdrop-blur-sm">
              <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Upload Your Photos</h2>
                    <p className="text-sm text-muted-foreground">
                      Front and side profile for accurate analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageUpload
                    label="Front Profile"
                    description="Face the camera directly"
                    image={frontImage}
                    onImageChange={setFrontImage}
                    icon="front"
                  />
                  <ImageUpload
                    label="Side Profile"
                    description="Turn 90° to the left or right"
                    image={sideImage}
                    onImageChange={setSideImage}
                    icon="side"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="mt-6 flex flex-col gap-4">
                  <Button
                    size="lg"
                    onClick={analyzePhotos}
                    disabled={!canAnalyze}
                    className="w-full gap-2 text-base"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyzing your features...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Analyze My Face
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Photos are deleted immediately after analysis</span>
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="overflow-hidden border-0 bg-card/50 p-0 shadow-xl backdrop-blur-sm">
              <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Your Results</h2>
                      <p className="text-sm text-muted-foreground">AI-powered facial analysis</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetAnalysis} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    New Analysis
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <RatingDisplay
                      rating={result.overallScore}
                      label="Overall Score"
                      breakdown={result.breakdown}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                        <img
                          src={frontImage!}
                          alt="Front profile"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background">
                          Front: {result.frontScore.toFixed(1)}
                        </div>
                      </div>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                        <img
                          src={sideImage!}
                          alt="Side profile"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background">
                          Side: {result.sideScore.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/50 p-4">
                      <h3 className="mb-2 font-medium text-foreground">AI Summary</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {result.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
