import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import {css} from "@codemirror/lang-css";
import {html} from "@codemirror/lang-html";
import {json} from "@codemirror/lang-json";
import {material} from "@uiw/codemirror-theme-material";
import {useTheme} from "@/hooks/use-theme";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** "html" | "css" | "json" */
  language?: string;
  height?: number;
  readOnly?: boolean;
  className?: string;
}

function getLanguageExtension(language?: string) {
  switch (language) {
  case "html":
    return html();
  case "css":
    return css();
  case "json":
    return json();
  default:
    return null;
  }
}

/** CodeMirror 6 editor, replacing the antd-flavoured `common/Editor.js`. */
export function CodeEditor({value, onChange, language, height = 240, readOnly, className}: CodeEditorProps) {
  const {resolvedTheme} = useTheme();
  const extensions = React.useMemo(() => {
    const ext = getLanguageExtension(language);
    return ext ? [ext] : [];
  }, [language]);

  return (
    <div className={className}>
      <CodeMirror
        value={value ?? ""}
        height={`${height}px`}
        readOnly={readOnly}
        theme={resolvedTheme === "dark" ? material : "light"}
        extensions={extensions}
        onChange={(next) => onChange(next)}
        basicSetup={{lineNumbers: true, foldGutter: false, highlightActiveLine: !readOnly}}
      />
    </div>
  );
}

export default CodeEditor;
