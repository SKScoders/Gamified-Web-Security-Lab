export type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'default'

export interface Token {
  type: TokenType
  value: string
}

// Keywords for JS/TS
const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'throw',
  'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'as', 'typeof', 'instanceof',
  'true', 'false', 'null', 'undefined', 'super', 'static', 'get', 'set', 'yield', 'interface',
  'type', 'enum', 'namespace', 'abstract', 'implements', 'declare', 'module', 'require',
  'delete', 'void', 'in', 'of',
])

// Keywords for SQL
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'INTO', 'VALUES', 'UPDATE',
  'SET', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT',
  'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
  'DISTINCT', 'AS', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IS', 'NULL', 'LIKE',
  'BETWEEN', 'IN', 'EXISTS', 'ALL', 'ANY', 'SOME', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN',
  'CONSTRAINT', 'CHECK', 'UNIQUE', 'AUTO_INCREMENT', 'VARCHAR', 'INT', 'DECIMAL', 'DATE',
  'BOOLEAN', 'TEXT', 'BLOB', 'TIMESTAMP', 'SCHEMA', 'DATABASE', 'VIEW', 'PROCEDURE',
  'FUNCTION', 'TRIGGER', 'GRANT', 'REVOKE', 'PRAGMA',
])

export function tokenizeCode(code: string, language: 'js' | 'sql' = 'js'): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < code.length) {
    // Skip whitespace but preserve it
    if (/\s/.test(code[i])) {
      let ws = ''
      while (i < code.length && /\s/.test(code[i])) {
        ws += code[i]
        i++
      }
      tokens.push({ type: 'default', value: ws })
      continue
    }

    // Comments
    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = ''
      while (i < code.length && code[i] !== '\n') {
        comment += code[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    // Multi-line comments
    if (code[i] === '/' && code[i + 1] === '*') {
      let comment = ''
      comment += code[i++]
      comment += code[i++]
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i]
        i++
      }
      if (i < code.length) {
        comment += code[i++]
        comment += code[i++]
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    // SQL Comments
    if (language === 'sql' && code[i] === '-' && code[i + 1] === '-') {
      let comment = ''
      while (i < code.length && code[i] !== '\n') {
        comment += code[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    // Strings (single quotes)
    if (code[i] === "'") {
      let str = "'"
      i++
      while (i < code.length && code[i] !== "'") {
        if (code[i] === '\\') {
          str += code[i++]
          if (i < code.length) str += code[i++]
        } else {
          str += code[i++]
        }
      }
      if (i < code.length) str += code[i++]
      tokens.push({ type: 'string', value: str })
      continue
    }

    // Strings (double quotes)
    if (code[i] === '"') {
      let str = '"'
      i++
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') {
          str += code[i++]
          if (i < code.length) str += code[i++]
        } else {
          str += code[i++]
        }
      }
      if (i < code.length) str += code[i++]
      tokens.push({ type: 'string', value: str })
      continue
    }

    // Backticks (template literals in JS)
    if (code[i] === '`') {
      let str = '`'
      i++
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') {
          str += code[i++]
          if (i < code.length) str += code[i++]
        } else {
          str += code[i++]
        }
      }
      if (i < code.length) str += code[i++]
      tokens.push({ type: 'string', value: str })
      continue
    }

    // Numbers
    if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
      let num = ''
      while (i < code.length && /[\d.xXbBoOeE]/.test(code[i])) {
        num += code[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let ident = ''
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        ident += code[i]
        i++
      }

      const keywordSet = language === 'sql' ? SQL_KEYWORDS : JS_KEYWORDS
      const isKeyword = keywordSet.has(ident) || (language === 'sql' && keywordSet.has(ident.toUpperCase()))

      tokens.push({
        type: isKeyword ? 'keyword' : 'default',
        value: ident,
      })
      continue
    }

    // Default character
    tokens.push({ type: 'default', value: code[i] })
    i++
  }

  return tokens
}
