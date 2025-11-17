/**
 * Filtre les erreurs de console liées aux extensions de navigateur
 * Ces erreurs sont normales et peuvent être ignorées
 */

if (typeof window !== "undefined") {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Liste des patterns d'erreurs à filtrer (extensions de navigateur)
  const ignoredPatterns = [
    /runtime\.lastError/i,
    /extension port/i,
    /message channel is closed/i,
    /chrome-extension:/i,
    /utils\.js.*Failed to load/i,
    /extensionState\.js.*Failed to load/i,
    /heuristicsRedefinitions\.js.*Failed to load/i,
  ];

  console.error = (...args: any[]) => {
    const message = args.join(" ");
    const shouldIgnore = ignoredPatterns.some((pattern) => pattern.test(message));
    
    if (!shouldIgnore) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    const shouldIgnore = ignoredPatterns.some((pattern) => pattern.test(message));
    
    if (!shouldIgnore) {
      originalWarn.apply(console, args);
    }
  };
}

