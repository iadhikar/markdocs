"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const theme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-content": {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    padding: "1rem 1.5rem",
    caretColor: "var(--brand)",
  },
  ".cm-line": {
    lineHeight: "1.7",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--bg-secondary) !important",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "var(--brand-light) !important",
  },
});

export default function CodeMirrorEditor({
  value,
  onChange,
}: CodeMirrorEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping,
        theme,
      ]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
      style={{ height: "100%" }}
    />
  );
}
