import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          if (inline) {
            return (
              <code className="bg-graphite-light px-1.5 py-0.5 rounded text-gold-bright text-[0.85em]" {...props}>
                {children}
              </code>
            );
          }
          return match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{ borderRadius: "0.75rem", fontSize: "0.85rem", margin: "0.5rem 0" }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <pre className="bg-graphite-light rounded-xl p-3 overflow-x-auto text-sm">
              <code {...props}>{children}</code>
            </pre>
          );
        },
        a: ({ node, ...props }) => (
          <a {...props} className="text-gold underline hover:text-gold-bright" target="_blank" rel="noreferrer" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
