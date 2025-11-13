import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Play, CheckCircle2, X, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

const CodeEditor = () => {
  const { toast } = useToast();
  const [code, setCode] = useState(`function twoSum(nums, target) {
  // Write your solution here
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`);
  const [language, setLanguage] = useState("javascript");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const languageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
  };

  const getStarterCode = (lang: string) => {
    const starters: Record<string, string> = {
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  
}`,
      python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`,
    };
    return starters[lang] || starters.javascript;
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(getStarterCode(newLang));
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    
    toast({
      title: "Running tests...",
      description: "Executing your code against test cases",
    });

    try {
      // Test cases for the current problem
      const testCases = [
        { input: "[2,7,11,15], 9", expected: "[0,1]" },
        { input: "[3,2,4], 6", expected: "[1,2]" },
        { input: "[3,3], 6", expected: "[0,1]" },
      ];

      const results = [];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        // Execute code using Piston API (free, no auth required)
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: languageMap[language],
            version: '*',
            files: [{
              name: `solution.${language === 'cpp' ? 'cpp' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}`,
              content: code
            }],
            stdin: testCase.input
          })
        });

        const result = await response.json();
        const output = result.run?.output?.trim() || '';
        const passed = output === testCase.expected;

        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: output || 'No output',
          passed,
          error: result.run?.stderr || null
        });
      }
      
      setTestResults(results);
      
      const passedCount = results.filter(r => r.passed).length;
      toast({
        title: `Tests completed!`,
        description: `${passedCount}/${results.length} test cases passed ${passedCount === results.length ? '✓' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Execution Error",
        description: "Failed to run code. Please try again.",
        variant: "destructive"
      });
      console.error('Code execution error:', error);
      setTestResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">TechKnots</span>
          </Link>
          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRunCode} className="gap-2" disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>
            <Button variant="outline">Submit</Button>
          </div>
        </div>
      </nav>

      <div className="h-[calc(100vh-73px)] flex">
        {/* Problem Description */}
        <div className="w-1/2 border-r border-border overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold">Two Sum</h1>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Easy</span>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="editorial">Editorial</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Problem</h3>
                  <p className="text-muted-foreground">
                    Given an array of integers <code className="bg-muted px-1 py-0.5 rounded">nums</code> and
                    an integer <code className="bg-muted px-1 py-0.5 rounded">target</code>, return indices
                    of the two numbers such that they add up to target.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Example 1:</h3>
                  <Card>
                    <CardContent className="p-4">
                      <pre className="text-sm">
                        <div className="mb-1"><strong>Input:</strong> nums = [2,7,11,15], target = 9</div>
                        <div className="mb-1"><strong>Output:</strong> [0,1]</div>
                        <div className="text-muted-foreground"><strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</div>
                      </pre>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Example 2:</h3>
                  <Card>
                    <CardContent className="p-4">
                      <pre className="text-sm">
                        <div className="mb-1"><strong>Input:</strong> nums = [3,2,4], target = 6</div>
                        <div><strong>Output:</strong> [1,2]</div>
                      </pre>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Constraints:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>2 ≤ nums.length ≤ 10⁴</li>
                    <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                    <li>-10⁹ ≤ target ≤ 10⁹</li>
                    <li>Only one valid answer exists</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="editorial">
                <p className="text-muted-foreground">Editorial content will be available here...</p>
              </TabsContent>

              <TabsContent value="solutions">
                <p className="text-muted-foreground">Community solutions will be available here...</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Code Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 border-b border-border">
            <Editor
              height="100%"
              language={languageMap[language]}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                quickSuggestions: true,
                parameterHints: {
                  enabled: true,
                },
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            />
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="border-t border-border p-4 max-h-[300px] overflow-y-auto">
              <h3 className="font-semibold mb-4">Test Results</h3>
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <Card key={idx} className={result.passed ? "border-success" : "border-destructive"}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {result.passed ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-success">Test Case {idx + 1} Passed</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">Test Case {idx + 1} Failed</span>
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm">
                      <div className="mb-1"><strong>Input:</strong> {result.input}</div>
                      <div className="mb-1"><strong>Expected:</strong> {result.expected}</div>
                      <div className="mb-1"><strong>Actual:</strong> {result.actual}</div>
                      {result.error && (
                        <div className="mt-2 text-destructive text-xs">
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
