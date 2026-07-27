import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect, useRef } from "react"
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight, FileText, Activity } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useCheckManuscript } from "@workspace/api-client-react"
import type { ManuscriptCheckResult, ManuscriptCheckInputSubmissionType } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Schema for the form
const formSchema = z.object({
  text: z.string().min(50, {
    message: "Manuscript text must be at least 50 characters long to provide meaningful analysis.",
  }),
  submissionType: z.enum(["structured-abstract", "correspondence", "full-manuscript"] as const),
  journalRequirements: z.string().optional(),
})

export default function Home() {
  const [result, setResult] = useState<ManuscriptCheckResult | null>(null)
  
  // The API Hook
  const checkMutation = useCheckManuscript()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      submissionType: "full-manuscript",
      journalRequirements: "",
    },
  })

  // Live word count for text area
  const textValue = form.watch("text")
  const wordCount = textValue ? textValue.trim().split(/\s+/).filter(w => w.length > 0).length : 0

  function onSubmit(values: z.infer<typeof formSchema>) {
    checkMutation.mutate(
      {
        data: {
          text: values.text,
          submissionType: values.submissionType,
          journalRequirements: values.journalRequirements || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data)
          // Scroll slightly to reveal results but keep form context visible
          window.scrollTo({ top: 100, behavior: 'smooth' })
        },
      }
    )
  }

  const handleReset = () => {
    setResult(null)
    form.reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg">
              M
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold leading-none text-foreground">ManuscriptReady</h1>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide font-medium">SUBMISSION READINESS CHECKER</p>
            </div>
          </div>
          {/* Status indication when checking */}
          {checkMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <Activity className="w-4 h-4 animate-pulse text-primary" />
              <span>Analyzing</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-5xl">
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          
          {/* Introductory Section */}
          <section className="max-w-3xl">
            <h2 className="text-3xl font-serif font-bold tracking-tight mb-4 text-foreground">
              Evaluate your readiness.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Before submitting to the editorial desk, verify your text against standard academic guidelines and specific journal criteria. We review for structural integrity, clarity, and missing elements.
            </p>
          </section>

          {/* Form Section */}
          <section>
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-end mb-2">
                            <FormLabel className="text-base font-semibold">Manuscript or Abstract Text</FormLabel>
                            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {wordCount} words
                            </span>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Paste your manuscript or abstract text here..."
                              className="min-h-[300px] resize-y font-serif text-base leading-relaxed bg-background"
                              data-testid="input-manuscript-text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="submissionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Submission Type</FormLabel>
                            <FormDescription>
                              Select the format of the text provided above.
                            </FormDescription>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-submission-type" className="bg-background">
                                  <SelectValue placeholder="Select a submission type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="full-manuscript">Full Original Research Manuscript</SelectItem>
                                <SelectItem value="structured-abstract">Structured Abstract (Original Research)</SelectItem>
                                <SelectItem value="correspondence">Correspondence / Letter to the Editor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="journalRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Journal Requirements (Optional)</FormLabel>
                            <FormDescription>
                              Specific guidelines or author instructions.
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                placeholder="E.g. Max 250 words, structured as Background, Methods, Results, Conclusion."
                                className="min-h-[80px] resize-y text-sm bg-background"
                                data-testid="input-journal-requirements"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {checkMutation.error && (
                      <Alert variant="destructive" className="mt-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>
                          {checkMutation.error.data?.error || checkMutation.error.message || "An error occurred while evaluating your manuscript. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end pt-4 border-t border-border mt-8">
                      <Button 
                        type="submit" 
                        size="xl"
                        className="w-full md:w-auto font-semibold text-base px-8 h-12 shadow-sm active-elevate"
                        disabled={checkMutation.isPending || wordCount < 10}
                        data-testid="button-analyze"
                      >
                        {checkMutation.isPending ? (
                          <>
                            <Activity className="mr-2 h-5 w-5 animate-spin" />
                            Evaluating Submission...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-5 w-5" />
                            Analyze Readiness
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </section>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="scroll-mt-24"
                id="results-section"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-serif font-bold text-foreground">Readiness Report</h3>
                  <Button variant="outline" onClick={handleReset} data-testid="button-reset">
                    Check Another
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Overall Status Card */}
                  <Card className="border-border shadow-sm overflow-hidden bg-card">
                    <div className={cn(
                      "h-2 w-full",
                      result.overallStatus === "READY" ? "bg-emerald-500" :
                      result.overallStatus === "NEEDS_REVISION" ? "bg-amber-500" :
                      "bg-destructive"
                    )} />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-muted-foreground uppercase tracking-wider font-sans font-semibold mb-1">
                            Overall Decision
                          </CardTitle>
                          <div className="text-3xl font-serif font-bold mt-2 text-foreground flex items-center gap-3">
                            {result.overallStatus === "READY" && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                            {result.overallStatus === "NEEDS_REVISION" && <AlertTriangle className="w-8 h-8 text-amber-600" />}
                            {result.overallStatus === "NOT_READY" && <XCircle className="w-8 h-8 text-destructive" />}
                            
                            {result.overallStatus === "READY" ? "Ready for Submission" :
                             result.overallStatus === "NEEDS_REVISION" ? "Needs Revision" :
                             "Not Ready"}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs uppercase px-3 py-1 bg-secondary/50 font-medium text-muted-foreground">
                          {result.submissionType.replace('-', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg leading-relaxed text-foreground font-serif">
                        {result.summary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Individual Checks List */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 pl-1">
                      Detailed Findings ({result.checks.length})
                    </h4>
                    
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-4"
                    >
                      {result.checks.map((check, idx) => (
                        <motion.div key={idx} variants={itemVariants}>
                          <Card className={cn(
                            "overflow-hidden border-l-4 transition-all shadow-sm hover:shadow-md",
                            check.status === "PASS" ? "border-l-emerald-500" :
                            check.status === "WARNING" ? "border-l-amber-500" :
                            "border-l-destructive"
                          )}>
                            <div className={cn(
                              "px-6 py-5 flex items-start gap-4",
                              check.status === "PASS" ? "bg-emerald-50/30 dark:bg-emerald-950/20" :
                              check.status === "WARNING" ? "bg-amber-50/30 dark:bg-amber-950/20" :
                              "bg-red-50/30 dark:bg-red-950/20"
                            )}>
                              <div className="mt-1 flex-shrink-0">
                                {check.status === "PASS" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                {check.status === "WARNING" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                                {check.status === "FAIL" && <XCircle className="w-5 h-5 text-destructive" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h5 className="font-semibold text-base text-foreground leading-none">
                                    {check.name}
                                  </h5>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider",
                                      check.status === "PASS" ? "text-emerald-700 border-emerald-200 bg-emerald-100/50" :
                                      check.status === "WARNING" ? "text-amber-700 border-amber-200 bg-amber-100/50" :
                                      "text-red-700 border-red-200 bg-red-100/50"
                                    )}
                                  >
                                    {check.status}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                  {check.explanation}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty state / filler when no results */}
          {!result && !checkMutation.isPending && (
            <div className="h-40 flex items-center justify-center opacity-60">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                  <Activity className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Results will appear here</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-8 bg-card">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ManuscriptReady. Designed for academic precision.</p>
        </div>
      </footer>
    </div>
  )
}
