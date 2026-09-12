import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  label: string;
  breakdown?: {
    category: string;
    score: number;
    description: string;
  }[];
}

export function RatingDisplay({ rating, label, breakdown }: RatingDisplayProps) {
  const getRatingColor = (score: number) => {
    if (score >= 8) return "text-accent";
    if (score >= 6) return "text-primary";
    if (score >= 4) return "text-chart-4";
    return "text-muted-foreground";
  };

  const getRatingLabel = (score: number) => {
    if (score >= 9) return "Exceptional";
    if (score >= 8) return "Excellent";
    if (score >= 7) return "Very Good";
    if (score >= 6) return "Above Average";
    if (score >= 5) return "Average";
    if (score >= 4) return "Below Average";
    return "Needs Improvement";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn("mt-2 text-7xl font-bold tabular-nums", getRatingColor(rating))}
        >
          {rating.toFixed(1)}
        </motion.div>
        <p className="mt-1 text-lg font-medium text-foreground">{getRatingLabel(rating)}</p>
        <p className="text-sm text-muted-foreground">out of 10</p>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Score Breakdown</p>
          {breakdown.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg bg-muted/50 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.category}</span>
                <span className={cn("text-sm font-bold", getRatingColor(item.score))}>
                  {item.score.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score * 10}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
