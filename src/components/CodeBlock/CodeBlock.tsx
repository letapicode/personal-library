import React, { useState, useMemo } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import styles from './CodeBlock.module.css';

interface CodeBlockProps {
  language: string;
  code: string;
}

function escapeHtml(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Deterministic single-pass syntax highlighters with zero self-HTML corruption
 */
function highlightCode(src: string, lang: string): string {
  let tokenRegex: RegExp | null = null;
  let getTag: ((m: RegExpExecArray) => string) | null = null;

  if (lang === 'java') {
    tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[A-Za-z_]\w*)|(\b(?:public|private|protected|class|interface|implements|extends|void|return|new|if|else|for|while|throw|throws|static|final|abstract|boolean|int|double|float|long|byte|short|char|enum|default|switch|case|break)\b)|(\b(?:String|Override|System|List|Map|Set|Worker|HumanWorker|RobotWorker|PaymentStrategy|CreditCardStrategy|ShoppingCart|SystemMetric|Optional|ArrayList|HashMap|HashSet)\b)|(\b[a-zA-Z_]\w*(?=\s*\())/g;
    getTag = (m) => {
      if (m[1]) return 'syn-com';
      if (m[2]) return 'syn-str';
      if (m[3]) return 'syn-ann';
      if (m[4]) return 'syn-kw';
      if (m[5]) return 'syn-type';
      if (m[6]) return 'syn-method';
      return '';
    };
  } else if (['ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript'].includes(lang)) {
    tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|class|interface|type|extends|implements|export|import|from|async|await|try|catch|finally|throw|new|this|typeof|instanceof)\b)|(\b(?:Promise|Array|Record|Partial|Required|Readonly|Map|Set|Console|document|window|React|FC)\b)|(\b[a-zA-Z_]\w*(?=\s*\())/g;
    getTag = (m) => {
      if (m[1]) return 'syn-com';
      if (m[2]) return 'syn-str';
      if (m[3]) return 'syn-kw';
      if (m[4]) return 'syn-type';
      if (m[5]) return 'syn-method';
      return '';
    };
  } else if (['py', 'python'].includes(lang)) {
    tokenRegex = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:def|class|return|if|elif|else|for|while|try|except|finally|raise|import|from|as|with|lambda|yield|async|await|pass|None|True|False|self|in|is|and|or|not)\b)|(\b(?:str|int|float|bool|list|dict|set|tuple|Optional|Union|Any|List|Dict)\b)|(\b[a-zA-Z_]\w*(?=\s*\())/g;
    getTag = (m) => {
      if (m[1]) return 'syn-com';
      if (m[2]) return 'syn-str';
      if (m[3]) return 'syn-kw';
      if (m[4]) return 'syn-type';
      if (m[5]) return 'syn-method';
      return '';
    };
  } else if (['sql', 'postgresql', 'mysql', 'sqlite'].includes(lang)) {
    tokenRegex = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*')|(\b(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|CREATE|TABLE|DROP|ALTER|ADD|CONSTRAINT|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|AND|OR|AS|IN|EXISTS|BETWEEN|CASE|WHEN|THEN|ELSE|END)\b)|(\b(?:VARCHAR|TEXT|INTEGER|INT|BIGINT|BOOLEAN|TIMESTAMP|DATE|FLOAT|DECIMAL|SERIAL)\b)/gi;
    getTag = (m) => {
      if (m[1]) return 'syn-com';
      if (m[2]) return 'syn-str';
      if (m[3]) return 'syn-kw';
      if (m[4]) return 'syn-type';
      return '';
    };
  } else if (lang === 'json') {
    tokenRegex = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(\b-?\d+(?:\.\d+)?\b)/g;
    getTag = (m) => {
      if (m[1]) return 'syn-kw';
      if (m[2]) return 'syn-str';
      if (m[3]) return 'syn-ann';
      if (m[4]) return 'syn-type';
      return '';
    };
  }

  if (!tokenRegex || !getTag) {
    return escapeHtml(src);
  }

  let lastIndex = 0;
  let out = '';
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(src)) !== null) {
    out += escapeHtml(src.slice(lastIndex, match.index));
    const cls = getTag(match);
    const token = match[0];
    if (cls) {
      out += `<span class="${cls}">${escapeHtml(token)}</span>`;
    } else {
      out += escapeHtml(token);
    }
    lastIndex = tokenRegex.lastIndex;
  }
  out += escapeHtml(src.slice(lastIndex));
  return out;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const langNormalized = (language || 'text').toLowerCase();

  const handleCopy = async () => {
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        success = true;
      }
    } catch {
      // Fallback
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Copy fallback failed', err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlightedHtml = useMemo(() => {
    return highlightCode(code, langNormalized);
  }, [code, langNormalized]);

  return (
    <div className={styles.codeCard}>
      <div className={styles.codeHeader}>
        <div className={styles.langLabelGroup}>
          <span className={styles.codeIcon}><Code2 size={16} /></span>
          <span>
            {langNormalized === 'java'
              ? 'Java'
              : langNormalized === 'ts' || langNormalized === 'typescript'
              ? 'TypeScript'
              : langNormalized === 'js' || langNormalized === 'javascript'
              ? 'JavaScript'
              : langNormalized === 'py' || langNormalized === 'python'
              ? 'Python'
              : langNormalized === 'sql'
              ? 'SQL'
              : langNormalized.toUpperCase()}
          </span>
        </div>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} color="#60d394" />
              <span style={{ color: '#60d394' }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={styles.pre}>
        <code
          className={styles.code}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
};
