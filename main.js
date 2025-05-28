/**
 * Python-in-browser editor using CodeMirror + Pyodide
 * 
 * Supports:
 * - Syntax highlighted Python editor
 * - Output capture and display
 * - LocalStorage persistence
 * - Ctrl+R to run, Ctrl+L to clear
 * 
 * Copyright (c) 2024-2025 Looks Good Media, LLC
 */

// DOM Elements
const output = document.getElementById("output");

// Initialize CodeMirror Editor for Python
const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: { name: "python", version: 3 },
  theme: "dracula",
  lineNumbers: true,
  indentUnit: 4,
  matchBrackets: true
});

// Load saved code or use default snippet
const savedText = localStorage.getItem("codeContent") || "print('Hello world')";
editor.setValue(savedText);

// Initial Output Message
output.value = "Initializing...\n";

/**
 * Append Python output to output field
 * @param {string} stdout - Output from Python execution
 */
function addToOutput(stdout) {
  output.value += ">>> \n" + stdout + "\n";
}

/**
 * Clears the output area
 */
function clearHistory() {
  output.value = "";
}

/**
 * Loads Pyodide and sets up the environment
 * @returns {Promise<object>} - Pyodide instance
 */
async function initializePyodide() {
  const pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.1/full/",
  });

  // Pre-import sys module
  pyodide.runPython(`import sys`);
  output.value = "LCM Dev Env v1 ready\n";
  return pyodide;
}

// Pyodide initialization
const pyodideReadyPromise = initializePyodide();

/**
 * Evaluates Python code from the editor and displays the result
 */
async function evaluatePython() {
  const pyodide = await pyodideReadyPromise;

  try {
    // Redirect stdout to capture printed output
    pyodide.runPython(`
      import io
      sys.stdout = io.StringIO()
      from js import prompt
      __builtins__.input = prompt
    `);

    pyodide.runPython(editor.getValue());

    // Get captured stdout
    const stdout = pyodide.runPython("sys.stdout.getvalue()");
    addToOutput(stdout);
  } catch (err) {
    addToOutput(err.toString());
  }
}

/**
 * Save current editor content to localStorage
 */
function saveText() {
  localStorage.setItem("codeContent", editor.getValue());
}

// Bind run and clear buttons
document.getElementById("run-btn").addEventListener("click", () => {
  evaluatePython();
  saveText();
});

document.getElementById("clear-btn").addEventListener("click", clearHistory);

// Add keyboard shortcuts for Ctrl+R (Run) and Ctrl+L (Clear)
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "r") {
    event.preventDefault();
    document.getElementById("run-btn").click();
  }

  if (event.ctrlKey && event.key === "l") {
    event.preventDefault();
    document.getElementById("clear-btn").click();
  }
});
