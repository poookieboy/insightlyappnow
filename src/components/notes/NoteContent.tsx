import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function NoteContent({ content }: { content: string }) {
  return <div className="prose prose-sm max-w-none break-words text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground prose-blockquote:border-accent prose-blockquote:text-muted-foreground dark:prose-invert sm:prose-base">
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
    }}>{content}</ReactMarkdown>
  </div>;
}