import React from 'react';
import { X, Download, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../contexts/ThemeContext';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileContent: string;
  language?: string;
  filePath?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  isOpen,
  onClose,
  fileName,
  fileContent,
  language = 'text',
  filePath
}) => {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'tsx',
      'jsx': 'jsx',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'dockerfile': 'dockerfile',
      'tf': 'terraform',
      'hcl': 'terraform',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'm': 'matlab',
      'pl': 'perl',
      'lua': 'lua',
      'vim': 'vim',
      'conf': 'ini',
      'ini': 'ini',
      'toml': 'toml',
      'env': 'bash'
    };
    return languageMap[extension || ''] || 'text';
  };

  const detectedLanguage = language === 'text' ? getLanguageFromFileName(fileName) : language;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl h-5/6 mx-4 rounded-lg shadow-2xl"
        style={{
          backgroundColor: currentTheme.colors.surface,
          border: `1px solid ${currentTheme.colors.border}`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b rounded-t-lg"
          style={{ 
            borderColor: currentTheme.colors.border,
            backgroundColor: currentTheme.colors.background 
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTheme.colors.error }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTheme.colors.warning }}
              />
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTheme.colors.success }}
              />
            </div>
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: currentTheme.colors.text }}
              >
                {fileName}
              </h2>
              {filePath && (
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {filePath}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-md hover:opacity-80 transition-opacity"
              style={{ 
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary,
                border: `1px solid ${currentTheme.colors.border}`
              }}
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-md hover:opacity-80 transition-opacity"
              style={{ 
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary,
                border: `1px solid ${currentTheme.colors.border}`
              }}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:opacity-80 transition-opacity"
              style={{ 
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary,
                border: `1px solid ${currentTheme.colors.border}`
              }}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-auto">
            <SyntaxHighlighter
              language={detectedLanguage}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: '#1e1e1e',
                fontSize: '14px',
                lineHeight: '1.5',
                borderRadius: 0
              }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
            >
              {fileContent}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-between p-3 border-t text-xs"
          style={{ 
            borderColor: currentTheme.colors.border,
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.textSecondary
          }}
        >
          <div className="flex items-center gap-4">
            <span>Language: {detectedLanguage}</span>
            <span>Lines: {fileContent.split('\n').length}</span>
            <span>Characters: {fileContent.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
