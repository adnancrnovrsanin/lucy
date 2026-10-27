// Predicates over the reader's Source and Element shapes, shared by every rule file.

export const INPUT_TAGS = new Set(['input', 'Input', 'InputGroupInput']);
export const TEXT_CONTROL_TAGS = new Set(['input', 'textarea', 'Input', 'Textarea', 'TextArea', 'InputGroupInput', 'InputGroupTextarea', 'TextField', 'SearchField', 'TextInput']);
export const REACT_ARIA_FIELDS = new Set(['TextField', 'NumberField', 'SearchField', 'DateField', 'TimeField', 'DatePicker', 'DateRangePicker', 'Select', 'ComboBox', 'Autocomplete', 'CheckboxGroup', 'RadioGroup', 'Checkbox', 'Radio', 'Switch', 'Slider', 'ColorField', 'InputOTP']);
export const LABEL_TAGS = new Set(['label', 'Label', 'FieldLabel']);
export const OPTION_TAGS = new Set(['option', 'SelectItem', 'Select.Item', 'ListBox.Item', 'ListBoxItem', 'NativeSelectOption', 'RadioGroupItem', 'Radio', 'ToggleGroupItem', 'ToggleButton', 'ComboboxItem']);
const FIELD_OWNERS = /^(Controller|FormField|Field|[\w$]+\.Field|[\w$]+\.AppField)$/;

export function attr(el, ...names) {
  for (const name of names) {
    const a = el.attrs.get(name);
    if (a) return a;
  }
  return undefined;
}

export function has(el, ...names) {
  return names.some((name) => el.attrs.has(name));
}

export function str(el, ...names) {
  const a = attr(el, ...names);
  if (!a) return undefined;
  if (a.kind === 'string') return a.value;
  if (a.kind === 'expr') {
    const m = /^(['"`])([^'"`$]*)\1$/.exec(a.value);
    if (m) return m[2];
  }
  return undefined;
}

export function expr(el, ...names) {
  const a = attr(el, ...names);
  return a && a.kind === 'expr' ? a.value : undefined;
}

export function isTrue(el, name) {
  const a = el.attrs.get(name);
  if (!a) return false;
  return a.kind === 'bool' || a.value === 'true';
}

export function ancestors(el) {
  const out = [];
  for (let p = el.parent; p; p = p.parent) out.push(p);
  return out;
}

export function descendants(el) {
  const out = [];
  const walk = (e) => {
    for (const child of e.children) {
      out.push(child);
      walk(child);
    }
  };
  walk(el);
  return out;
}

export function inLibraryDir(path) {
  return /(^|[\\/])components[\\/]ui[\\/]/.test(path);
}

export function inputType(el) {
  return (str(el, 'type') ?? 'text').toLowerCase();
}

export function fieldName(el) {
  const own = str(el, 'name');
  if (own) return own;
  for (const spread of el.spreads) {
    const m = /register\(\s*['"`]([^'"`]+)['"`]/.exec(spread);
    if (m) return m[1];
  }
  for (const a of ancestors(el)) {
    if (FIELD_OWNERS.test(a.tag)) {
      const name = str(a, 'name');
      if (name) return name;
    }
  }
  return str(el, 'id') ?? '';
}

export function isFormFile(source) {
  return source.elements.some((e) => e.tag === 'form' || e.tag === 'Form')
    || /\buse(?:App)?Form\s*\(|\bhandleSubmit\b|\buseActionState\s*\(|\.Field\b/.test(source.masked);
}

export function hasAccessibleName(el, source) {
  if (has(el, 'aria-label', 'aria-labelledby', 'label', 'accessibilityLabel')) return true;
  const id = attr(el, 'id');
  if (id && source.labelTargets.has(id.value)) return true;
  for (const a of ancestors(el)) {
    if (LABEL_TAGS.has(a.tag)) return true;
    if (REACT_ARIA_FIELDS.has(a.tag) && (has(a, 'aria-label', 'label') || a.children.some((c) => c.tag === 'Label'))) return true;
  }
  return false;
}

// Every block opened by `pattern` (a global regex whose match ends with "{"), matched on the
// masked text so braces inside strings and JSX text never count.
export function blocks(source, pattern) {
  const out = [];
  const m = source.masked;
  for (const hit of m.matchAll(pattern)) {
    const open = hit.index + hit[0].length - 1;
    let depth = 0;
    let i = open;
    for (; i < m.length; i++) {
      if (m[i] === '{') depth++;
      else if (m[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ start: hit.index, open, end: i, body: m.slice(open + 1, i), raw: source.text.slice(open + 1, i), line: source.lineOf(hit.index) });
  }
  return out;
}

export function catchBlocks(source) {
  return blocks(source, /\bcatch\s*(?:\([^)]*\))?\s*\{/g);
}

export function errorCallbacks(source) {
  return blocks(source, /\bonError\s*[:=(]\s*\{?\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>\s*\{/g);
}

export function importsFrom(source, pattern) {
  return source.imports.filter((i) => pattern.test(i.from));
}

export function importedName(source, name, pattern) {
  const head = name.split('.')[0].replace(/\$/g, '\\$');
  return importsFrom(source, pattern).some((i) => new RegExp(`\\b${head}\\b`).test(i.names));
}

export function hits(source, pattern, text = source.masked) {
  return [...text.matchAll(pattern)].map((m) => ({ index: m.index }));
}

export function lineText(source, line) {
  return source.lines[line - 1] ?? '';
}

export function optionsOf(el) {
  return descendants(el).filter((d) => OPTION_TAGS.has(d.tag));
}

export function isStatic(el, source) {
  return !/\.map\s*\(/.test(source.masked.slice(el.start, el.close));
}

export function isSubmitButton(el) {
  if (el.tag !== 'button' && el.tag !== 'Button' && el.tag !== 'input') return false;
  const type = str(el, 'type');
  if (type === 'submit') return true;
  return el.tag === 'button' && type === undefined && ancestors(el).some((a) => a.tag === 'form');
}

export function controlKind(el) {
  if (['textarea', 'Textarea', 'TextArea', 'InputGroupTextarea'].includes(el.tag)) return 'textarea';
  if (['select', 'Select', 'NativeSelect'].includes(el.tag)) return 'select';
  if (el.tag === 'form') return 'form';
  return 'input';
}
