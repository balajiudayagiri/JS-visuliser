export function analyzeCodeExecution(codeString) {
  const result = {
    globalContext: {},
    variables: {},
    functions: [],
    hoistedDeclarations: [],
    executionSteps: [],
  };

  // Parse variable declarations
  const varRegex =
    /(var|let|const)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)(?:\s*=\s*(.*?))?(?=;|\n|$)/g;
  let varMatch;
  while ((varMatch = varRegex.exec(codeString)) !== null) {
    result.variables[varMatch[2]] = {
      type: varMatch[1],
      initialValue:
        varMatch[3] || (varMatch[1] === "var" ? "undefined" : "uninitialized"),
      line: codeString.slice(0, varMatch.index).split("\n").length,
    };
  }

  // Parse function declarations
  const funcRegex =
    /(?:function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\$([^)]*)\$\s*\{([^]*?)\}|(const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*(?:\$([^)]*)\$\s*=>\s*\{([^]*?)\}|function\s*\$([^)]*)\$\s*\{([^]*?)\}))/g;
  let funcMatch;
  while ((funcMatch = funcRegex.exec(codeString)) !== null) {
    const type = funcMatch[1] ? "declaration" : "expression";
    const name = funcMatch[1] || funcMatch[5];
    const params = (funcMatch[2] || funcMatch[6] || funcMatch[8] || "")
      .split(",")
      .map((p) => p.trim());
    const body = funcMatch[3] || funcMatch[7] || funcMatch[9] || "";

    result.functions.push({
      type,
      name,
      params,
      body,
      line: codeString.slice(0, funcMatch.index).split("\n").length,
    });
  }

  // Simulate hoisting
  result.hoistedDeclarations = Object.entries(result.variables)
    .filter(([_, v]) => v.type === "var")
    .concat(
      result.functions
        .filter((f) => f.type === "declaration")
        .map((f) => [f.name, { type: "function", line: f.line }])
    );

  // Simulate execution steps
  result.executionSteps = codeString.split("\n").map((line, idx) => {
    const lineNum = idx + 1;
    return {
      line: lineNum,
      context: { ...result.globalContext },
      expression: line.trim() || "empty",
      state: {
        variables: Object.fromEntries(
          Object.entries(result.variables).filter(([_, v]) => v.line < lineNum)
        ),
        functions: result.functions.filter((f) => f.line < lineNum),
      },
    };
  });

  return result;
}

const codeAnalysisResult = analyzeCodeExecution(`function outer() {
    let outerVar = 'Outer variable';
    
    function inner() {
        let innerVar = 'Inner variable';
        console.log("hi");
    }
    
    return inner;
}

const demoFunc = outer();
demoFunc();`);

console.log("Global Context:", codeAnalysisResult.globalContext);
console.log("Variables:", codeAnalysisResult.variables);
console.log("Functions:", codeAnalysisResult.functions);
console.log("Hoisted Declarations:", codeAnalysisResult.hoistedDeclarations);
console.log("Execution Steps:", codeAnalysisResult.executionSteps);
