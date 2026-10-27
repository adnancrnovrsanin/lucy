// Light JavaScript and JSX reader for the craft scan. It finds JSX elements with their
// attributes, string literals, comments, and imports, and keeps a masked copy of the text
// with strings, comments, and JSX text blanked so rules can search code without false hits.
// It is not a parser: it tracks just enough context to stay in sync, and raises ReadError
// when the text does not balance.

export class ReadError extends Error {
  constructor(message, line) {
    super(`${message} (line ${line})`);
    this.name = 'ReadError';
    this.line = line;
  }
}

const ID_START = /[A-Za-z_$]/;
const ID_PART = /[\w$]/;
const TAG_NAME = /^[A-Za-z_$][\w$.:-]*/;
const ATTR_NAME = /^[A-Za-z_$][\w$:.-]*/;
const CLOSING_TAG = /^<\/\s*([A-Za-z_$][\w$.:-]*)?\s*>/;
const BEFORE_REGEX = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_WORDS = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'else', 'do']);
const BEFORE_JSX = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '>']);
const JSX_WORDS = new Set(['return', 'yield', 'await', 'case', 'default', 'else', 'do']);

export function readSource(text, { jsx = true } = {}) {
  const reader = new Reader(text, jsx);
  reader.scanJS(null);
  return reader.result();
}

class Reader {
  constructor(text, jsx) {
    this.text = text;
    this.jsx = jsx;
    this.pos = 0;
    this.masked = text.split('');
    this.elements = [];
    this.strings = [];
    this.comments = [];
    this.current = null;
    this.lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') this.lineStarts.push(i + 1);
  }

  lineOf(index) {
    let lo = 0;
    let hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }

  blank(from, to) {
    for (let i = from; i < to; i++) if (this.masked[i] !== '\n') this.masked[i] = ' ';
  }

  inside(el, fn) {
    const saved = this.current;
    this.current = el;
    try {
      return fn();
    } finally {
      this.current = saved;
    }
  }

  // Scans JavaScript until `closer` (a "}" at depth zero) or the end of the text.
  scanJS(closer) {
    const t = this.text;
    let depth = 0;
    let prev = '';
    while (this.pos < t.length) {
      const c = t[this.pos];
      const next = t[this.pos + 1];
      if (c === ' ' || c === '\n' || c === '\t' || c === '\r') { this.pos++; continue; }
      if (c === '/' && next === '/') { this.lineComment(); continue; }
      if (c === '/' && next === '*') { this.blockComment(); continue; }
      if (c === '"' || c === "'") { this.string(c); prev = 'value'; continue; }
      if (c === '`') { this.template(); prev = 'value'; continue; }
      if (c === '/' && (BEFORE_REGEX.has(prev) || REGEX_WORDS.has(prev))) { this.regex(); prev = 'value'; continue; }
      if (c === '<' && this.jsx && (BEFORE_JSX.has(prev) || JSX_WORDS.has(prev)) && /[A-Za-z_$>]/.test(next ?? '') && this.element(this.current, prev)) {
        prev = 'value';
        continue;
      }
      if (c === '{' || c === '(' || c === '[') { depth++; prev = c; this.pos++; continue; }
      if (c === '}' || c === ')' || c === ']') {
        if (depth === 0) {
          if (c === closer) return;
          throw new ReadError(`unbalanced "${c}"`, this.lineOf(this.pos));
        }
        depth--;
        prev = c;
        this.pos++;
        continue;
      }
      if (ID_START.test(c)) {
        const start = this.pos;
        while (this.pos < t.length && ID_PART.test(t[this.pos])) this.pos++;
        prev = t.slice(start, this.pos);
        continue;
      }
      if (/[0-9]/.test(c)) {
        while (this.pos < t.length && /[\w.]/.test(t[this.pos])) this.pos++;
        prev = 'value';
        continue;
      }
      prev = c;
      this.pos++;
    }
    if (closer) throw new ReadError(`missing "${closer}"`, this.lineOf(this.pos));
    if (depth > 0) throw new ReadError('unbalanced brackets at the end of the file', this.lineOf(this.pos));
  }

  // Reads one element starting at "<". Returns false, consuming nothing, when the "<" is a
  // type parameter rather than JSX.
  element(parent, prev = '') {
    const t = this.text;
    const start = this.pos;
    if (t[start + 1] === '>') {
      const fragment = this.makeElement('', start, parent);
      this.pos = start + 2;
      fragment.end = this.pos;
      this.children(fragment);
      fragment.close = this.pos;
      return true;
    }
    const match = TAG_NAME.exec(t.slice(start + 1, start + 200));
    if (!match) return false;
    const tag = match[0];
    const rest = t.slice(start + 1 + tag.length, start + 41 + tag.length);
    if (/^\s*(,|extends\b)/.test(rest)) return false;
    if (prev === ':' && /^\s*>\s*\(/.test(rest)) return false;
    const el = this.makeElement(tag, start, parent);
    this.pos = start + 1 + tag.length;
    this.attributes(el);
    if (!el.selfClosing) this.children(el);
    el.close = this.pos;
    return true;
  }

  makeElement(tag, start, parent) {
    const el = {
      tag, attrs: new Map(), spreads: [], start, end: start, close: start,
      line: this.lineOf(start), selfClosing: false, text: '', children: [], parent,
    };
    if (parent) parent.children.push(el);
    this.elements.push(el);
    return el;
  }

  attributes(el) {
    const t = this.text;
    while (this.pos < t.length) {
      this.skipTrivia();
      const c = t[this.pos];
      if (c === '/' && t[this.pos + 1] === '>') { el.selfClosing = true; this.pos += 2; el.end = this.pos; return; }
      if (c === '>') { this.pos++; el.end = this.pos; return; }
      if (c === '{') {
        const open = this.pos;
        this.pos++;
        this.inside(el, () => this.scanJS('}'));
        el.spreads.push(t.slice(open + 1, this.pos).trim().replace(/^\.\.\.\s*/, ''));
        this.pos++;
        continue;
      }
      const match = ATTR_NAME.exec(t.slice(this.pos, this.pos + 120));
      if (!match) throw new ReadError(`unexpected "${c}" in <${el.tag}>`, this.lineOf(this.pos));
      const name = match[0];
      const line = this.lineOf(this.pos);
      this.pos += name.length;
      this.skipTrivia();
      if (t[this.pos] !== '=') { el.attrs.set(name, { kind: 'bool', value: '', line }); continue; }
      this.pos++;
      this.skipTrivia();
      const q = t[this.pos];
      if (q === '"' || q === "'") {
        const close = t.indexOf(q, this.pos + 1);
        if (close < 0) throw new ReadError(`unterminated value of ${name}`, line);
        const value = t.slice(this.pos + 1, close);
        el.attrs.set(name, { kind: 'string', value, line });
        this.strings.push({ value, quote: q, start: this.pos, line, attr: name });
        this.blank(this.pos + 1, close);
        this.pos = close + 1;
        continue;
      }
      if (q === '{') {
        const open = this.pos;
        this.pos++;
        this.inside(el, () => this.scanJS('}'));
        el.attrs.set(name, { kind: 'expr', value: t.slice(open + 1, this.pos).trim(), line });
        this.pos++;
        continue;
      }
      if (q === '<') {
        const open = this.pos;
        if (!this.inside(el, () => this.element(el))) throw new ReadError(`bad value of ${name}`, line);
        el.attrs.set(name, { kind: 'expr', value: t.slice(open, this.pos).trim(), line });
        continue;
      }
      throw new ReadError(`bad value of ${name} in <${el.tag}>`, line);
    }
    throw new ReadError(`unterminated <${el.tag}>`, el.line);
  }

  children(el) {
    const t = this.text;
    let textStart = this.pos;
    while (this.pos < t.length) {
      const c = t[this.pos];
      if (c === '<') {
        this.flushText(el, textStart);
        if (t[this.pos + 1] === '/') {
          const m = CLOSING_TAG.exec(t.slice(this.pos, this.pos + 200));
          if (!m) throw new ReadError('bad closing tag', this.lineOf(this.pos));
          const found = m[1] ?? '';
          if (found !== el.tag) throw new ReadError(`expected </${el.tag}> but found </${found}>`, this.lineOf(this.pos));
          this.pos += m[0].length;
          return;
        }
        if (!this.inside(el, () => this.element(el))) throw new ReadError(`unexpected "<" inside <${el.tag}>`, this.lineOf(this.pos));
        textStart = this.pos;
        continue;
      }
      if (c === '{') {
        this.flushText(el, textStart);
        this.pos++;
        this.inside(el, () => this.scanJS('}'));
        this.pos++;
        textStart = this.pos;
        continue;
      }
      this.pos++;
    }
    throw new ReadError(`unclosed <${el.tag}>`, el.line);
  }

  flushText(el, from) {
    if (this.pos > from) {
      el.text += this.text.slice(from, this.pos);
      this.blank(from, this.pos);
    }
  }

  skipTrivia() {
    const t = this.text;
    while (this.pos < t.length) {
      const c = t[this.pos];
      if (c === ' ' || c === '\n' || c === '\t' || c === '\r') { this.pos++; continue; }
      if (c === '/' && t[this.pos + 1] === '/') { this.lineComment(); continue; }
      if (c === '/' && t[this.pos + 1] === '*') { this.blockComment(); continue; }
      return;
    }
  }

  lineComment() {
    const t = this.text;
    const start = this.pos;
    let end = t.indexOf('\n', start);
    if (end < 0) end = t.length;
    const line = this.lineOf(start);
    this.comments.push({ text: t.slice(start + 2, end), start, line, endLine: line });
    this.blank(start, end);
    this.pos = end;
  }

  blockComment() {
    const t = this.text;
    const start = this.pos;
    const end = t.indexOf('*/', start + 2);
    if (end < 0) throw new ReadError('unterminated comment', this.lineOf(start));
    this.comments.push({ text: t.slice(start + 2, end), start, line: this.lineOf(start), endLine: this.lineOf(end) });
    this.blank(start, end + 2);
    this.pos = end + 2;
  }

  string(q) {
    const t = this.text;
    const start = this.pos;
    const line = this.lineOf(start);
    let p = start + 1;
    while (p < t.length && t[p] !== q) {
      if (t[p] === '\n') throw new ReadError('unterminated string', line);
      p += t[p] === '\\' ? 2 : 1;
    }
    if (p >= t.length) throw new ReadError('unterminated string', line);
    this.strings.push({ value: t.slice(start + 1, p), quote: q, start, line });
    this.blank(start + 1, p);
    this.pos = p + 1;
  }

  template() {
    const t = this.text;
    const start = this.pos;
    const line = this.lineOf(start);
    let value = '';
    let segment = start + 1;
    this.pos = start + 1;
    while (this.pos < t.length) {
      const c = t[this.pos];
      if (c === '\\') { this.pos += 2; continue; }
      if (c === '`') {
        value += t.slice(segment, this.pos);
        this.blank(segment, this.pos);
        this.pos++;
        this.strings.push({ value, quote: '`', start, line });
        return;
      }
      if (c === '$' && t[this.pos + 1] === '{') {
        value += `${t.slice(segment, this.pos)}\${}`;
        this.blank(segment, this.pos);
        this.pos += 2;
        this.scanJS('}');
        this.pos++;
        segment = this.pos;
        continue;
      }
      this.pos++;
    }
    throw new ReadError('unterminated template literal', line);
  }

  regex() {
    const t = this.text;
    const start = this.pos;
    let p = start + 1;
    let inClass = false;
    while (p < t.length) {
      const c = t[p];
      if (c === '\\') { p += 2; continue; }
      if (c === '\n') throw new ReadError('unterminated regular expression', this.lineOf(start));
      if (inClass) {
        if (c === ']') inClass = false;
      } else if (c === '[') {
        inClass = true;
      } else if (c === '/') {
        break;
      }
      p++;
    }
    p++;
    while (p < t.length && /[a-z]/i.test(t[p])) p++;
    this.pos = p;
  }

  result() {
    const labelTargets = new Set();
    const ids = new Set();
    for (const el of this.elements) {
      for (const [name, a] of el.attrs) {
        if (name === 'htmlFor' || name === 'for') labelTargets.add(a.value);
        if (name === 'id') ids.add(a.value);
      }
    }
    const imports = [];
    for (const m of this.text.matchAll(/^[ \t]*import\s+(?:type\s+)?([^'";]*?)\s+from\s+['"]([^'"\n]+)['"]/gm)) {
      imports.push({ names: m[1], from: m[2], line: this.lineOf(m.index) });
    }
    for (const m of this.text.matchAll(/^[ \t]*import\s+['"]([^'"\n]+)['"]/gm)) {
      imports.push({ names: '', from: m[1], line: this.lineOf(m.index) });
    }
    return {
      text: this.text,
      masked: this.masked.join(''),
      elements: this.elements,
      strings: this.strings,
      comments: this.comments,
      imports,
      labelTargets,
      ids,
      lineOf: (index) => this.lineOf(index),
      lines: this.text.split('\n'),
    };
  }
}
