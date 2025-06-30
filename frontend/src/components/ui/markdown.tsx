'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/cn';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn(
      'prose max-w-none',
      'prose-headings:text-gray-900 prose-headings:font-semibold',
      'prose-h1:text-xl prose-h1:mb-3',
      'prose-h2:text-lg prose-h2:mb-3',
      'prose-h3:text-base prose-h3:mb-2',
      'prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3',
      'prose-strong:text-gray-900 prose-strong:font-semibold',
      'prose-em:text-gray-700',
      'prose-ul:my-2 prose-ul:pl-4',
      'prose-ol:my-2 prose-ol:pl-4',
      'prose-li:text-gray-700 prose-li:mb-1',
      'prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
      'prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs',
      'prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:text-gray-600',
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // カスタムコンポーネントでさらなる制御が可能
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold text-gray-900 mb-3">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-base text-gray-700 leading-relaxed mb-3">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside my-2 pl-4 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside my-2 pl-4 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-base text-gray-700">
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-700">
            {children}
          </em>
        ),
        code: ({ children }) => (
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-200 pl-4 text-gray-600 italic">
            {children}
          </blockquote>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}