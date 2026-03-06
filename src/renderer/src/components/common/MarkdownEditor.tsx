import { useRef, useEffect } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 200 }: MarkdownEditorProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(minHeight, textareaRef.current.scrollHeight) + 'px'
    }
  }, [value, minHeight])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className="w-full bg-bg border border-border rounded-lg p-4 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 resize-none focus:outline-none focus:border-accent transition-colors"
      style={{ minHeight }}
    />
  )
}
