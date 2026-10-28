import { has, str, expr, ancestors, descendants, inLibraryDir, classOf, innerSource, isFormFile, isDetailsFile, DYNAMIC_SEGMENT } from '../../lib/helpers.mjs';

// The ordered direct content of an element: child elements, {expression} children, and text.
// An expression's elements are children of the element too; they belong to that expression piece.
function pieces(source, el) {
  if (el.selfClosing) return [];
  const from = el.end;
  const to = from + innerSource(source, el).length;
  const m = source.masked;
  const t = source.text;
  const childAt = new Map(el.children.map((c) => [c.start, c]));
  const out = [];
  let text = '';
  const flush = () => { if (text.trim()) out.push({ kind: 'text', text: text.trim() }); text = ''; };
  for (let i = from; i < to; i++) {
    const child = childAt.get(i);
    if (child) { flush(); out.push({ kind: 'el', el: child }); i = child.close - 1; continue; }
    if (m[i] === '{') {
      let depth = 0;
      let j = i;
      for (; j < to; j++) {
        if (m[j] === '{') depth++;
        else if (m[j] === '}' && --depth === 0) break;
      }
      flush();
      const body = m.slice(i + 1, j).trim();
      if (body) out.push({ kind: 'expr', start: i, end: j, body: t.slice(i + 1, j).trim(), els: el.children.filter((c) => c.start > i && c.close <= j) });
      i = j;
      continue;
    }
    if (m[i] === ' ' && t[i] !== ' ') text += t[i];
  }
  flush();
  return out;
}

const TRANSLATION = /^(t|translate|i18n\.t|intl\.formatMessage|formatMessage|__)\s*\(/;
const isValueExpr = (body) => !TRANSLATION.test(body) && !/^(['"`])[^'"`]*\1$/.test(body) && !/^children$/.test(body) && !/^\{?\s*\/\*/.test(body);
const ICONISH = (el) => el.tag === 'svg' || (/^[A-Z]/.test(el.tag) && el.selfClosing && !has(el, 'value', 'source', 'record', 'label', 'text', 'children', 'placeholder'));
const TRANSLATE_TAGS = new Set(['Trans', 'Translate', 'FormattedMessage']);

// The value an element shows: any {expression} that is not a translation call, in it or below it,
// or a self-closing field component fed a value (`<TextField value={record.title} />`, `<DateField source="createdAt" />`).
function showsValue(source, el) {
  if (el.selfClosing) return /^[A-Z]/.test(el.tag) && (has(el, 'source') || /\w\??\.\w/.test(expr(el, 'value', 'record') ?? ''));
  for (const p of pieces(source, el)) {
    if (p.kind === 'expr' && isValueExpr(p.body)) return true;
    if (p.kind === 'el' && !ICONISH(p.el) && showsValue(source, p.el)) return true;
  }
  return false;
}

// Rule helpers shared below.
const OVERLAY_CONTENT = /^(Dialog|Sheet|Drawer|Modal|AlertDialog)(Content|\.Content|\.Popup)$/;
const OVERLAY_TITLE = /^(Dialog|Sheet|Drawer|AlertDialog)(Title|\.Title)$|^ModalHeader$|^Modal\.Header$/;
const SHOW_ROOT = /\b(ShowBase|useShow|useShowController)\b\s*[(<]|<\s*(Show|ShowView)\b/;
const RECORD_NAME = /^[a-z_$][\w$]*(?:\??\.[\w$]+)*\??\.(name|title|display_?name|displayName|full_?name|fullName|subject|label|number|code|reference|email|username|handle|first_?name|firstName)$/;
const isRouteFile = (path) => DYNAMIC_SEGMENT.test(path) && !/(^|[\\/])(edit|new|create)([\\/.]|$)/.test(path)
  && /(^|[\\/])(page|route|index)\.[jt]sx?$|[[$][^\\/]*\.[jt]sx?$/.test(path);
const levelOf = (el, name) => { const v = str(el, name) ?? expr(el, name); return v && /^\d$/.test(v) ? Number(v) : undefined; };

function headingLevel(el) {
  if (/^h[1-6]$/.test(el.tag)) return Number(el.tag[1]);
  const as = str(el, 'as', 'component');
  if (as && /^h[1-6]$/.test(as)) return Number(as[1]);
  if (el.tag === 'PageHeader.Title') return 2;
  if (el.tag === 'CardTitle') return 3;
  if (el.tag === 'Heading') return levelOf(el, 'level') ?? null;
  if (el.tag === 'Title' || el.tag === 'Typography.Title') return levelOf(el, 'level') ?? levelOf(el, 'order') ?? 1;
  if (el.tag === 'Typography') { const v = str(el, 'variant'); return v && /^h[1-6]$/.test(v) ? Number(v[1]) : undefined; }
  return undefined;
}

const rendersH1 = (source) => source.elements.some((el) => headingLevel(el) === 1 || headingLevel(el) === null || el.tag === 'PageTitle'
  || (/Header$/.test(el.tag) && has(el, 'title')));

const CONTROL_TAGS = new Set(['input', 'textarea', 'select', 'Input', 'Textarea', 'TextArea', 'Select', 'NativeSelect', 'Checkbox', 'Switch', 'RadioGroup', 'Slider', 'Combobox', 'DatePicker', 'InputOTP', 'TextInput', 'NumberInput']);
const READ_ONLY_FLAG = ['disabled', 'readOnly', 'readonly', 'isDisabled', 'isReadOnly'];
const isOn = (el, name) => { const a = el.attrs.get(name); return !!a && (a.kind === 'bool' || a.value === 'true'); };
const DISPLAY_CONTROLS = new Set(['input', 'textarea', 'Input', 'Textarea', 'TextArea', 'Select', 'select', 'TextInput', 'NumberInput', 'TextField']);

// Foreign keys shown as text: `post.userId`, `order.customer_id`, `post.user?.id`. The record's own
// `.id`, and identifiers that belong to another system (tracking, transaction, external), are skipped.
const FOREIGN_ID = /^[a-z_$][\w$]*(?:\??\.[\w$]+)*\??\.([\w$]+?)(Id|_id|ID)$|^[a-z_$][\w$]*(?:\??\.[\w$]+)*\??\.([\w$]+)\??\.id$/;
const NOT_A_RELATION = /^(display|public|short|human|friendly|sequence|serial|series|external|tracking|transaction|trace|request|correlation|session|idempotency|stripe\w*|payment_?intent|paypal|provider|reference|client|device|vendor_?ref|sku|tax)$/i;
// Roots that carry the route's own identifiers, not a related record: `params.orderId` names the page's segment.
const ROUTE_SOURCES = new Set(['params', 'route', 'searchParams']);
// Wrappers a record is reached through: `props.order.id` and `row.original.id` read the record's own id.
const RECORD_WRAPPERS = new Set(['props', 'original', 'params', 'route', 'loaderData', 'searchParams']);
const COPY = /clipboard|copy/i;
const LINKS = new Set(['a', 'Link', 'NextLink']);
const DATE_NAME = /(At|_at|Date|_date|date|_on|On|Time|time|timestamp|Timestamp)$/;

// Icon-only buttons, copied from the tables rule `icon-action-without-name` (rules/tables/behaviour.mjs).
const BUTTONS = new Set(['button', 'Button', 'IconButton', 'ActionIcon']);
const BACK_OR_CLOSE = /^(Arrow\w*|Chevron\w*|\w*Back\w*|X|XIcon|Close\w*|Cross\w*|IconArrow\w*|IconChevron\w*|IconX)$/;
const CONTENT_PROPS = ['placeholder', 'value', 'label', 'text', 'children'];
const isIcon = (el) => el.tag === 'svg' || (/^[A-Z]/.test(el.tag) && el.selfClosing && el.children.length === 0 && !has(el, ...CONTENT_PROPS));
// Children written between the tags; an element passed in a prop (`render={<Link />}`) is not content.
const content = (el) => el.children.filter((c) => c.start >= el.end);
const named = (el) => has(el, 'aria-label', 'aria-labelledby', 'title', 'label', 'text', 'tooltip') || descendants(el).some((d) => /\bsr-only\b/.test(classOf(d)))
  || el.text.trim().length > 0 || descendants(el).some((d) => d.text.trim().length > 0)
  || (el.parent && has(el.parent, 'asChild') && has(el.parent, 'aria-label', 'aria-labelledby'));
const rendersExpression = (source, el) => pieces(source, el).some((p) => p.kind === 'expr' && !(p.els.length === 1 && p.body.trim().startsWith('<')));

// Field groups. A label is static text (an icon beside it is fine), or muted label styling around a translated string.
const LABEL_CLASS = /\b(text-muted-foreground|text-muted|font-medium|font-semibold|text-xs|uppercase|tracking-wide|text-(gray|slate|zinc|neutral)-[45]00|fg-subtle|text-secondary)\b/;
const PAIR_TAGS = new Set(['span', 'div', 'p', 'small', 'strong', 'b', 'label', 'Label', 'Text', 'Typography']);
function isLabel(source, el) {
  if (!PAIR_TAGS.has(el.tag) || el.selfClosing) return false;
  const ps = pieces(source, el);
  if (ps.some((p) => p.kind === 'el' && !ICONISH(p.el) && !TRANSLATE_TAGS.has(p.el.tag))) return false;
  const exprs = ps.filter((p) => p.kind === 'expr');
  const text = ps.some((p) => p.kind === 'text') || ps.some((p) => p.kind === 'el' && TRANSLATE_TAGS.has(p.el.tag));
  if (exprs.length === 0) return text;
  return LABEL_CLASS.test(classOf(el)) && exprs.every((p) => TRANSLATION.test(p.body));
}
const isValue = (source, el) => !isLabel(source, el) && !/^h[1-6]$/.test(el.tag) && showsValue(source, el);
const NO_DL = (el) => !ancestors(el).some((a) => ['dl', 'table', 'DescriptionList', 'Descriptions', 'DataList'].includes(a.tag))
  && !descendants(el).some((d) => ['dt', 'dd', 'DescriptionListTerm', 'DescriptionList'].includes(d.tag));

function pairWrapper(source, el) {
  const ps = pieces(source, el);
  if (ps.length !== 2 || ps[0].kind !== 'el' || !isLabel(source, ps[0].el)) return false;
  if (ps[1].kind === 'el') return isValue(source, ps[1].el);
  return ps[1].kind === 'expr' && isValueExpr(ps[1].body);
}

function pairCount(source, el) {
  const ps = pieces(source, el);
  let wrapped = 0;
  for (const p of ps) {
    const only = p.kind === 'el' ? p.el : p.kind === 'expr' && p.els.length === 1 ? p.els[0] : null;
    if (only && pairWrapper(source, only)) wrapped++;
  }
  let flat = 0;
  for (let i = 0; i + 1 < ps.length; i++) {
    const a = ps[i];
    const b = ps[i + 1];
    if (a.kind === 'el' && isLabel(source, a.el) && ((b.kind === 'el' && isValue(source, b.el)) || (b.kind === 'expr' && isValueExpr(b.body)))) { flat++; i++; }
  }
  return Math.max(wrapped, flat);
}

// A heading used as a field label: static or translated text in an h4-h6, `as="h5"`, a level 4/5 antd Title,
// an order 4-6 Mantine Title, or an h2/h3 styled at body text size.
function isLabelHeading(source, el) {
  const level = headingLevel(el);
  // An h2 or h3 counts only when styled at body size, as label headings usually are.
  if (!level || (level < 4 && !(level > 1 && /\btext-(xs|sm|base)\b/.test(classOf(el))))) return false;
  const ps = pieces(source, el);
  if (ps.some((p) => p.kind === 'el' && !ICONISH(p.el) && !TRANSLATE_TAGS.has(p.el.tag))) return false;
  const exprs = ps.filter((p) => p.kind === 'expr');
  return (ps.some((p) => p.kind === 'text') || exprs.length > 0) && exprs.every((p) => TRANSLATION.test(p.body));
}

const DETAILS_FILE = 'app/orders/[id]/page.tsx';
const PAGE = (body) => ['export default async function Page({ params }) {', '  const { id } = await params;', '  const order = await getOrder(id);', `  return (${body});`, '}'].join('\n');

export default [
  {
    id: 'record-title-not-h1',
    severity: 'warning',
    platform: 'web',
    why: 'The record name is rendered as a lower heading and the page has no h1, so the page has no top-level heading naming what it shows.',
    fix: 'Render the record display name as the one h1 of the page (pass as="h1" to header components that default to h2).',
    ref: 'WCAG 1.3.1 and 2.4.6; Primer PageHeader (Title defaults to h2); craft details research, report-implementations D8',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      if (!isRouteFile(path) && !SHOW_ROOT.test(source.masked)) return [];
      if (source.elements.some((el) => OVERLAY_CONTENT.test(el.tag)) || rendersH1(source)) return [];
      return source.elements
        .filter((el) => { const l = headingLevel(el); return l && l > 1; })
        .filter((el) => pieces(source, el).some((p) => p.kind === 'expr' && RECORD_NAME.test(p.body.replace(/\s*(\?\?|\|\|)[\s\S]*$/, ''))))
        .slice(0, 1)
        .map((el) => ({ line: el.line, message: `record name in <${el.tag}> and no h1 on the page` }));
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<div><header className="flex justify-between"><h1 className="text-2xl font-semibold">{order.number}</h1><Actions /></header><h2>Customer</h2><p>{order.customer.name}</p></div>') },
      { file: DETAILS_FILE, code: PAGE('<PageHeader><PageHeader.TitleArea><PageHeader.Title as="h1">{order.name}</PageHeader.Title></PageHeader.TitleArea></PageHeader>') },
      { file: DETAILS_FILE, code: PAGE('<Container><Heading>{order.display_id}</Heading><h2>{order.customer.name}</h2></Container>') },
      { file: 'src/components/orders/customer-card.tsx', code: 'export const CustomerCard = ({ customer }) => <Card><CardTitle>{customer.name}</CardTitle></Card>;' },
      { file: DETAILS_FILE, code: PAGE('<Dialog open><DialogContent><DialogTitle>{order.name}</DialogTitle><h2>{order.name}</h2></DialogContent></Dialog>') },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<div><div className="flex items-center gap-4"><h2 className="text-xl font-semibold">{order.name}</h2></div></div>') },
      { file: DETAILS_FILE, code: PAGE('<PageHeader><PageHeader.TitleArea><PageHeader.Title>{order.name}</PageHeader.Title></PageHeader.TitleArea></PageHeader>') },
      { file: 'src/pages/posts/show.tsx', code: ['export default function ShowPost() {', '  const { query } = useShow();', '  const post = query.data?.data;', '  return <ShowView><Card><CardTitle className="text-3xl"><Hash />{post?.title}</CardTitle></Card></ShowView>;', '}'].join('\n') },
    ],
  },
  {
    id: 'label-value-without-dl',
    severity: 'warning',
    platform: 'web',
    why: 'Label and value pairs are built from divs and spans, so assistive technology cannot tell which label belongs to which value.',
    fix: 'Render each field group as a dl, with a div around every dt and dd pair, styled as the grid.',
    ref: 'HTML description list; GOV.UK summary list; craft details research, report-implementations D19',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      const flagged = [];
      for (const el of source.elements) {
        if (el.selfClosing || el.children.length < 3 || flagged.some((f) => ancestors(el).includes(f)) || !NO_DL(el)) continue;
        const count = pairCount(source, el);
        if (count >= 3) flagged.push(el);
      }
      return flagged.map((el) => ({ line: el.line, message: `${pairCount(source, el)} label and value pairs in <${el.tag}> without dl, dt, and dd` }));
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<section><h2>Details</h2><dl className="grid grid-cols-[12rem_1fr] gap-2"><div><dt>Status</dt><dd>{order.status}</dd></div><div><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div><div><dt>Placed</dt><dd>{formatDate(order.placedAt)}</dd></div></dl></section>') },
      { file: DETAILS_FILE, code: PAGE('<div className="grid gap-4"><p>{order.note}</p><p>{order.summary}</p><p>{order.footer}</p></div>') },
      { file: DETAILS_FILE, code: PAGE('<table><tbody><tr><th scope="row">Status</th><td>{order.status}</td></tr><tr><th scope="row">Total</th><td>{order.total}</td></tr><tr><th scope="row">Placed</th><td>{order.placedAt}</td></tr></tbody></table>') },
      { file: 'src/components/orders/order-summary.tsx', code: 'export const S = ({ order }) => <div className="grid grid-cols-2"><span className="text-muted-foreground">Status</span><span>{order.status}</span><span className="text-muted-foreground">Total</span><span>{order.total}</span><span className="text-muted-foreground">Placed</span><span>{order.placedAt}</span></div>;' },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<div className="grid grid-cols-2 gap-6"><div><Label><User />User</Label><div className="text-muted-foreground">{order.customer.name}</div></div><div><Label>Slug</Label><div>{order.slug}</div></div><div><Label>Hits</Label><div>{order.hits}</div></div></div>') },
      { file: DETAILS_FILE, code: PAGE('<div className="flex gap-8"><div className="flex flex-col"><span className="text-xs text-muted-foreground">{translate("fields.amount")}</span><span className="text-sm">{formatMoney(order.amount)}</span></div><div className="flex flex-col"><span className="text-xs text-muted-foreground">{translate("fields.stage")}</span><span>{order.stage}</span></div>{order.categories && (<div className="flex flex-col"><span className="text-xs text-muted-foreground">{translate("fields.categories")}</span><span>{order.categories.join(", ")}</span></div>)}</div>') },
      { file: DETAILS_FILE, code: PAGE('<div className="grid grid-cols-2"><span className="text-muted-foreground">Status</span><span>{order.status}</span><span className="text-muted-foreground">Total</span><span>{order.total}</span><span className="text-muted-foreground">Placed</span><span>{order.placedAt}</span></div>') },
    ],
  },
  {
    id: 'form-label-for-display',
    severity: 'warning',
    platform: 'web',
    why: 'A form label names a read-only value, so screen readers announce a label with no control and the value is not tied to it.',
    fix: 'Use dt for the field name and dd for the value inside a dl; keep Label for form controls.',
    ref: 'HTML label element; craft details research, report-implementations D18',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path) || isFormFile(source)) return [];
      if (source.elements.some((el) => CONTROL_TAGS.has(el.tag))) return [];
      const labels = source.elements.filter((el) => (el.tag === 'Label' || el.tag === 'label') && !has(el, 'htmlFor', 'for') && el.spreads.length === 0);
      return labels.length ? [{ line: labels[0].line, message: `${labels.length} form label${labels.length > 1 ? 's' : ''} naming read-only values` }] : [];
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Slug</dt><dd>{order.slug}</dd></div><div><dt>Hits</dt><dd>{order.hits}</dd></div></dl>') },
      { file: DETAILS_FILE, code: PAGE('<div><Label htmlFor="note">Note</Label><Textarea id="note" defaultValue={order.note} /></div>') },
      { file: DETAILS_FILE, code: PAGE('<div><label>Include archived <input type="checkbox" checked={archived} onChange={toggle} /></label><p>{order.slug}</p></div>') },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<div className="grid"><div><Label>Slug</Label><div>{order.slug}</div></div></div>') },
      { file: 'src/pages/posts/show.tsx', code: ['export default function ShowPost() {', '  const { query } = useShow();', '  const post = query.data?.data;', '  return <div><Label className="flex gap-2"><User />User</Label><div>{post?.author}</div></div>;', '}'].join('\n') },
    ],
  },
  {
    id: 'heading-as-field-label',
    severity: 'warning',
    platform: 'web',
    why: 'Field names are rendered as headings, so the heading outline fills with labels and screen-reader heading navigation stops on every field.',
    fix: 'Render the fields as a dl with dt names and dd values; keep headings for section titles.',
    ref: 'WCAG 1.3.1 and 2.4.6; craft details research, report-implementations D20',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      // Pairs as siblings (<h5>Status</h5><p>{x}</p>...) or each in its own wrapper (<div><h5>Status</h5><div>{x}</div></div>...).
      const pairsIn = (ps) => {
        let count = 0;
        for (let i = 0; i + 1 < ps.length; i++) {
          if (ps[i].kind !== 'el' || !isLabelHeading(source, ps[i].el)) continue;
          const next = ps[i + 1];
          if ((next.kind === 'el' && !isLabelHeading(source, next.el) && showsValue(source, next.el)) || (next.kind === 'expr' && isValueExpr(next.body))) count++;
        }
        return count;
      };
      const wrapperPair = (el) => { const ps = pieces(source, el); return ps.length === 2 && pairsIn(ps) === 1; };
      const out = [];
      const seen = new Set();
      for (const el of source.elements) {
        if (!el.parent || !isLabelHeading(source, el)) continue;
        const owner = wrapperPair(el.parent) && el.parent.parent ? el.parent.parent : el.parent;
        if (seen.has(owner)) continue;
        seen.add(owner);
        const ps = pieces(source, owner);
        const count = Math.max(pairsIn(ps), ps.filter((p) => p.kind === 'el' && wrapperPair(p.el)).length);
        if (count >= 3) out.push({ line: el.line, message: `${count} headings used as field labels` });
      }
      return out;
    },
    good: [
      { file: 'src/pages/posts/show.tsx', code: ['export const PostShow = () => {', '  const { query } = useShow();', '  const record = query.data?.data;', '  return <Show><Descriptions column={1}><Descriptions.Item label="Title">{record?.title}</Descriptions.Item><Descriptions.Item label="Status">{record?.status}</Descriptions.Item><Descriptions.Item label="Created">{record?.createdAt}</Descriptions.Item></Descriptions></Show>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<div><h2>Shipping</h2><dl><div><dt>Carrier</dt><dd>{order.carrier}</dd></div></dl><h2>Billing</h2><dl><div><dt>Card</dt><dd>{order.card}</dd></div></dl><h2>Notes</h2><p>{order.note}</p></div>') },
      { file: DETAILS_FILE, code: PAGE('<div><h2 className="text-lg">Notes</h2><p>{order.note}</p><h2 className="text-lg">Gift message</h2><p>{order.gift}</p><h2 className="text-lg">Return reason</h2><p>{order.reason}</p></div>') },
      { file: DETAILS_FILE, code: PAGE('<div><h4>Shipping</h4><AddressCard address={order.shipping} /><h4>Billing</h4><p>Same as shipping</p></div>') },
    ],
    bad: [
      { file: 'src/pages/posts/show.tsx', code: ['export const PostShow = () => {', '  const { query } = useShow();', '  const record = query.data?.data;', '  return (<Show>', '    <Title level={5}>Title</Title>', '    <TextField value={record?.title} />', '    <Title level={5}>Content</Title>', '    <MarkdownField value={record?.content} />', '    <Title level={5}>Category</Title>', '    {loading ? <>Loading...</> : <>{category?.title}</>}', '  </Show>);', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<div><h5>Status</h5><p>{order.status}</p><h5>Total</h5><p>{order.total}</p><h5>Carrier</h5><p>{order.carrier}</p></div>') },
      { file: DETAILS_FILE, code: PAGE('<Card><h2 className="text-base font-medium">Name</h2><p>{order.name}</p><h2 className="text-base font-medium">Price</h2><p>{order.price}</p><h2 className="text-base font-medium">{t("fields.category")}</h2><p>{order.category.title}</p></Card>') },
      { file: DETAILS_FILE, code: PAGE('<Show><Heading as="h5" size="sm">Title</Heading><Text>{order.title}</Text><Title order={5}>Status</Title><Text>{order.status}</Text><Heading as="h5">Total</Heading><Text>{order.total}</Text></Show>') },
      { file: DETAILS_FILE, code: PAGE('<div><div className="mt-2"><h5>Status</h5><div>{order.status}</div></div><div className="mt-2"><h5>Total</h5><div>{order.total}</div></div><div className="mt-2"><h5>Placed</h5><div>{order.placedAt}</div></div></div>') },
    ],
  },
  {
    id: 'disabled-input-for-display',
    severity: 'error',
    platform: 'web',
    why: 'Read-only record values are shown in disabled or read-only inputs, which are low contrast, skipped by keyboard, and look editable.',
    fix: 'Show read-only values as text in a dl; open an edit surface when the value can change.',
    ref: 'Carbon read-only states (use text, not disabled inputs); craft details research, MODEL field groups',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path) || isFormFile(source)) return [];
      return source.elements
        // Always read-only (a bare flag or ={true}) and never changed: a display, not a control disabled by permission or state.
        .filter((el) => DISPLAY_CONTROLS.has(el.tag) && READ_ONLY_FLAG.some((f) => isOn(el, f)) && !has(el, 'onChange', 'onValueChange', 'onChangeText', 'onSelectionChange', 'name')
          && el.spreads.length === 0 && /^[a-z_$][\w$]*(\??\.[\w$]+)+/.test(expr(el, 'value', 'defaultValue') ?? ''))
        .map((el) => ({ line: el.line, message: `record value in a ${READ_ONLY_FLAG.find((f) => isOn(el, f))} <${el.tag}>` }));
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Email</dt><dd>{order.email}</dd></div></dl>') },
      { file: DETAILS_FILE, code: ['export default function Page({ params }) {', '  const form = useForm({ defaultValues: order });', '  return <form onSubmit={form.handleSubmit(save)}><Input readOnly value={order.number} /><Input {...form.register("email")} /></form>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<div><Input aria-label="Share link" readOnly value={shareUrl} /><Button onClick={copy}>Copy link</Button></div>') },
      { file: DETAILS_FILE, code: PAGE('<div><Label htmlFor="email">Email</Label><Input id="email" disabled={!canEdit} value={order.email} onChange={(e) => save(e.target.value)} /></div>') },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<div><Label>Email</Label><Input disabled value={order.email} /></div>') },
      { file: DETAILS_FILE, code: PAGE('<div><TextInput labelText="Name" readOnly defaultValue={order.customer.name} /><Textarea readOnly value={order.note} /></div>') },
    ],
  },
  {
    id: 'raw-foreign-id-value',
    severity: 'error',
    platform: 'web',
    why: 'A related record is shown as its raw id, which means nothing to the reader and gives no way to reach that record.',
    fix: 'Show the related record\'s display name, linked to its details page, through a reference or relation field.',
    ref: 'craft details research, report-implementations D21; react-admin ReferenceField',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      const out = [];
      for (const el of source.elements) {
        if (ancestors(el).concat(el).some((a) => LINKS.has(a.tag) || /Copy|Clipboard/.test(a.tag) || COPY.test(expr(a, 'onClick', 'onCopy') ?? ''))) continue;
        if (el.parent && el.parent.children.some((s) => /Copy|Clipboard/.test(s.tag))) continue;
        for (const p of pieces(source, el)) {
          if (p.kind !== 'expr') continue;
          const body = p.body.replace(/\s*(\?\?|\|\|)\s*(['"`][^'"`]*['"`]|null|undefined)\s*$/, '');
          const m = FOREIGN_ID.exec(body);
          if (!m) continue;
          const segs = body.replace(/\?/g, '').split('.');
          if (segs.some((s) => ROUTE_SOURCES.has(s))) continue;
          if (segs.length === 3 && segs[2] === 'id' && (RECORD_WRAPPERS.has(segs[0]) || RECORD_WRAPPERS.has(segs[1]))) continue;
          const entity = m[1] ?? m[3];
          if (!entity || NOT_A_RELATION.test(entity) || entity === 'record' || entity === 'data') continue;
          out.push({ index: p.start, message: `raw foreign id {${body}} shown as text` });
        }
      }
      return out;
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Customer</dt><dd><Link href={`/customers/${order.customerId}`}>{order.customer.name}</Link></dd></div></dl>') },
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Order ID</dt><dd className="font-mono">{order.id}</dd></div><div><dt>Tracking</dt><dd>{order.trackingId}</dd></div></dl>') },
      { file: 'src/pages/deals/DealShow.tsx', code: ['export const DealShow = () => {', '  const record = useRecordContext();', '  return <ReferenceField source="company_id" reference="companies" link="show"><TextField source="name" /></ReferenceField>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<div><code>{order.customerId}</code><CopyButton value={order.customerId} /></div>') },
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Order ID</dt><dd>{props.order.id}</dd></div></dl>') },
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Order ID</dt><dd>{row.original.id}</dd></div></dl>') },
      { file: DETAILS_FILE, code: PAGE('<h1>Order {params.orderId}</h1>') },
    ],
    bad: [
      { file: 'src/pages/posts/show.tsx', code: ['export default function ShowPost() {', '  const { query } = useShow();', '  const post = query.data?.data;', '  return <div><Label>User ID</Label><div className="font-mono">{post.user?.id}</div><Label>Category</Label><div>{post.categoryId}</div></div>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Customer</dt><dd>{order.customer_id}</dd></div></dl>') },
    ],
  },
  {
    id: 'inline-date-format',
    severity: 'warning',
    platform: 'web',
    why: 'A date is formatted inline with toLocale*String, so the format, time zone, and locale drift from the rest of the app.',
    fix: 'Format dates through the app\'s shared formatter for the value kind, with an explicit time zone.',
    ref: 'craft details research, report-implementations D22; craft tables column kinds',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      const out = [];
      const m = source.masked;
      for (const hit of m.matchAll(/\.toLocale(Date|Time)?String\s*\(/g)) {
        const before = m.slice(Math.max(0, hit.index - 160), hit.index);
        const onDate = /new\s+Date\s*\((?:[^()]|\([^()]*\))*\)\s*\??$/.test(before);
        const member = /([\w$]+)\s*\??$/.exec(before)?.[1] ?? '';
        if (onDate || hit[1] || DATE_NAME.test(member)) out.push({ index: hit.index, message: `inline ${hit[0].slice(1, -1).trim()} on a record date` });
      }
      return out;
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Placed</dt><dd><time dateTime={order.placedAt}>{formatDateTime(order.placedAt)}</time></dd></div></dl>') },
      { file: DETAILS_FILE, code: PAGE('<dl><div><dt>Total</dt><dd>{order.amount.toLocaleString("en-US", { style: "currency", currency })}</dd></div></dl>') },
      { file: 'src/lib/format.ts', code: 'export const formatDate = (v) => new Date(v).toLocaleDateString(undefined, { timeZone: "UTC" });' },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<span>{new Date(order.publishedAt).toLocaleDateString()}</span>') },
      { file: DETAILS_FILE, code: PAGE('<div>{new Date(order.createdAt).toLocaleString()}</div>') },
      { file: DETAILS_FILE, code: PAGE('<div>{order.createdAt.toLocaleString()}</div>') },
    ],
  },
  {
    id: 'badge-color-from-data',
    severity: 'warning',
    platform: 'web',
    why: 'A badge takes its colour from record data, so its contrast with the text is unknown and the status may be told by colour alone.',
    fix: 'Map each status to a badge variant from the design system, and keep the status text visible.',
    ref: 'WCAG 1.4.1 and 1.4.3; craft details research, report-implementations D23',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      return source.elements
        .filter((el) => {
          const style = expr(el, 'style') ?? '';
          const m = /\b(?:backgroundColor|background|color)\s*:\s*([^,}]+)/g;
          const fromData = [...style.matchAll(m)].some((x) => /^[a-z_$][\w$]*(?:\??\.[\w$]+)+\s*$/.test(x[1].trim()) && !/^(theme|colors|tokens|palette|vars|token)\b/.test(x[1].trim()));
          const badgeLike = /(Badge|Chip|Tag|Pill|Status|Label)$/.test(el.tag) || /\b(rounded-full|badge|chip|pill)\b/.test(classOf(el));
          return fromData && badgeLike && (el.text.trim() || pieces(source, el).some((p) => p.kind === 'expr'));
        })
        .map((el) => ({ line: el.line, message: `<${el.tag}> colour taken from data` }));
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<Badge variant={STATUS_VARIANT[order.status]}>{statusLabel(order.status)}</Badge>') },
      { file: DETAILS_FILE, code: PAGE('<div><span className="inline-block size-6 rounded-full border" style={{ backgroundColor: order.status_color }} /><span className="font-mono">{order.status_color}</span></div>') },
      { file: DETAILS_FILE, code: PAGE('<Badge style={{ backgroundColor: "var(--badge-bg)" }}>{order.status}</Badge>') },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<Badge variant="outline" style={{ backgroundColor: order.status_color, color: "#fff" }}>{order.status}</Badge>') },
      { file: DETAILS_FILE, code: PAGE('<span className="rounded-full px-2 text-xs" style={{ color: tag.color }}>{tag.name}</span>') },
    ],
  },
  {
    id: 'details-icon-button-without-name',
    severity: 'error',
    platform: 'web',
    why: 'An icon-only button or back link on a details page has no accessible name, so screen readers announce just "button" or "link".',
    fix: 'Name icon buttons with aria-label, such as "Back to orders", "Close", or "Copy order ID".',
    ref: 'WCAG 4.1.2 Name, Role, Value; craft details research, report-implementations D11',
    check: ({ source, path }) => (inLibraryDir(path) || !isDetailsFile(source, path) ? [] : source.elements
      .filter((el) => (BUTTONS.has(el.tag) || (LINKS.has(el.tag) && content(el).some((c) => BACK_OR_CLOSE.test(c.tag))))
        && el.spreads.length === 0 && content(el).length > 0 && content(el).every(isIcon) && !named(el) && !rendersExpression(source, el))
      .map((el) => ({ line: el.line, message: `icon-only <${el.tag}> without a name` }))),
    good: [
      { file: DETAILS_FILE, code: PAGE('<Button variant="ghost" size="icon" aria-label="Back to orders" onClick={back}><ArrowLeft /></Button>') },
      { file: DETAILS_FILE, code: PAGE('<Button variant="ghost" size="icon" onClick={close}><X /><span className="sr-only">Close</span></Button>') },
      { file: DETAILS_FILE, code: PAGE('<Button onClick={edit}><Pencil />{t("orders.edit")}</Button>') },
      { file: DETAILS_FILE, code: PAGE('<Link href="/orders"><ArrowLeft />Orders</Link>') },
      { file: 'src/components/ui/dialog.tsx', code: 'export const C = () => <button onClick={close}><XIcon /></button>;' },
      { file: DETAILS_FILE, code: PAGE('<Button variant="secondary" label="Back to orders" render={<Link href="/orders" />} />') },
    ],
    bad: [
      { file: DETAILS_FILE, code: PAGE('<Button variant="ghost" size="icon" onClick={back}><ArrowLeftIcon className="h-4 w-4" /></Button>') },
      { file: DETAILS_FILE, code: PAGE('<Link href="/orders"><ChevronLeft /></Link>') },
      { file: DETAILS_FILE, code: PAGE('<Button size="icon" onClick={close}><X /></Button>') },
    ],
  },
  {
    id: 'overlay-without-title',
    severity: 'error',
    platform: 'web',
    why: 'A dialog, sheet, or drawer has no title, so it opens with no accessible name and Radix logs an error.',
    fix: 'Put a DialogTitle (or SheetTitle, DrawerTitle) holding the record name inside the content; wrap it in VisuallyHidden only if the design shows the name another way.',
    ref: 'WAI-ARIA APG dialog pattern; Radix Dialog Title; craft details research, report-implementations D12',
    check: ({ source, path }) => {
      if (inLibraryDir(path) || !isDetailsFile(source, path)) return [];
      return source.elements
        .filter((el) => OVERLAY_CONTENT.test(el.tag) && !has(el, 'aria-label', 'aria-labelledby') && el.spreads.length === 0)
        .filter((el) => {
          const family = el.tag.replace(/\.?(Content|Popup)$/, '');
          // A component imported from the app may render the title; only a package component or one defined here is visible.
          const local = new Set(source.imports.filter((i) => /^(\.|@\/|~\/|#)/.test(i.from)).flatMap((i) => i.names.replace(/[{}]/g, ' ').split(/[\s,]+/).filter(Boolean).map((n) => n.split(/\s+as\s+/).pop())));
          if (descendants(el).some((d) => local.has(d.tag.split('.')[0]))) return false;
          const root = ancestors(el).find((a) => a.tag === family || a.tag === `${family}.Root`);
          if (root && has(root, 'aria-label', 'aria-labelledby', 'title')) return false;
          if (descendants(root ?? el).some((d) => OVERLAY_TITLE.test(d.tag) || (/Title$/.test(d.tag) && d.tag.startsWith(family)))) return false;
          // A title rendered by a component defined in this file counts when the file renders that title tag anywhere.
          const title = family === 'Modal' ? /<\s*Modal\.?(Header|Title)\b/ : new RegExp(`<\\s*${family}\\.?Title\\b`);
          return !title.test(source.masked);
        })
        .map((el) => ({ line: el.line, message: `<${el.tag}> without a title` }));
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<Sheet open><SheetContent><SheetHeader><SheetTitle>{order.number}</SheetTitle></SheetHeader><OrderBody order={order} /></SheetContent></Sheet>') },
      { file: DETAILS_FILE, code: PAGE('<Dialog open><DialogContent><VisuallyHidden><DialogTitle>{order.number}</DialogTitle></VisuallyHidden><OrderBody /></DialogContent></Dialog>') },
      { file: DETAILS_FILE, code: ['import { CycleForm } from "./cycle-form";', PAGE('<Dialog open><DialogContent size="md"><CycleForm data={order} /></DialogContent></Dialog>')].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<Dialog open><DialogContent aria-labelledby="order-heading"><h2 id="order-heading">{order.number}</h2></DialogContent></Dialog>') },
      { file: 'src/deals/DealShow.tsx', code: ['export const DealShow = ({ id }) => <Dialog open><DialogContent><ShowBase id={id}><Content /></ShowBase></DialogContent></Dialog>;', 'const Content = () => { const record = useRecordContext(); return <DialogHeader><DialogTitle>{record.name}</DialogTitle></DialogHeader>; };'].join('\n') },
    ],
    bad: [
      { file: 'src/deals/DealShow.tsx', code: ['export const DealShow = ({ id }) => <Dialog open><DialogContent className="lg:max-w-4xl"><ShowBase id={id}><Content /></ShowBase></DialogContent></Dialog>;', 'const Content = () => { const record = useRecordContext(); return <h2>{record.name}</h2>; };'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<Sheet open><SheetContent side="right"><h2>{order.number}</h2></SheetContent></Sheet>') },
    ],
  },
  {
    id: 'view-page-is-form',
    severity: 'error',
    platform: 'web',
    why: 'The record\'s view page renders an edit form, so reading the record means facing editable fields and there is no read-only view.',
    fix: 'Render the view page read-only (header, dl field groups, related records) and move editing to an edit route or inline edit controls.',
    ref: 'craft details research, report-implementations D24 (Kiranism product view page)',
    check: ({ source, path }) => {
      // Edit and create routes, and settings pages, are forms by purpose.
      if (inLibraryDir(path) || /(^|[\\/])(edit|new|create|settings|preferences|config|configuration|account|profile)([\\/.]|$)|[-_.](edit|new|create)[-_.]/i.test(path)) return [];
      const named = /[\\/][\w-]*(view-page|show-page|detail-page|details-page|-view|-show)\.[jt]sx$/i.test(path);
      const loadsRecord = /\b[a-z]\w*Id\b|\bparams\b|\buse(?:Suspense)?Query\s*\(|\buse(?:Show|One)\s*\(/.test(source.masked);
      if (!(isRouteFile(path) && isDetailsFile(source, path)) && !(named && loadsRecord)) return [];
      const FORMISH = (el) => el.tag === 'form' || el.tag === 'Form' || (/^[A-Z][\w$]*Form$/.test(el.tag) && !/(Comment|Note|Reply|Message|Chat|Activity|Search|Filter|Feedback)Form$/.test(el.tag));
      // A literal <form> counts only with an input control inside: a lone button is an action, not an edit form.
      const forms = source.elements.filter((el) => FORMISH(el) && (el.tag !== 'form' || descendants(el).some((d) => CONTROL_TAGS.has(d.tag))));
      const hook = /\buse(?:App)?Form\s*\(/.exec(source.masked);
      if (!forms.length && !hook) return [];
      if (forms.some((el) => /(Comment|Note|Reply)/i.test(el.tag))) return [];
      if (source.elements.some((el) => ['dl', 'dt', 'DescriptionList', 'Descriptions'].includes(el.tag))) return [];
      const inForm = (el) => FORMISH(el) || ancestors(el).some(FORMISH);
      // A non-form component given a record prop (`<OrderSummary order={order} />`) means the page shows the record.
      const showsRecord = source.elements.some((el) => !inForm(el) && /^[A-Z]/.test(el.tag) && !CONTROL_TAGS.has(el.tag)
        && [...el.attrs.values()].some((a) => a.kind === 'expr' && /^[\w$]+(\??\.[\w$]+)*$/.test(a.value)));
      if (showsRecord) return [];
      const shown = source.elements.filter((el) => !inForm(el) && !CONTROL_TAGS.has(el.tag))
        .flatMap((el) => pieces(source, el).filter((p) => p.kind === 'expr' && isValueExpr(p.body) && /\w\??\.\w/.test(p.body) && !p.els.length));
      if (shown.length >= 2) return [];
      const at = forms[0] ?? null;
      return [at ? { line: at.line, message: `view page renders <${at.tag}> as its only content` } : { index: hook.index, message: 'view page is a form' }];
    },
    good: [
      { file: DETAILS_FILE, code: PAGE('<main><h1>{order.number}</h1><dl><div><dt>Status</dt><dd>{order.status}</dd></div></dl><h2>Comments</h2><CommentForm orderId={order.id} /></main>') },
      { file: DETAILS_FILE, code: ['export default function Page({ params }) {', '  const { data: order } = useQuery(orderOptions(params.id));', '  const form = useForm({ defaultValues: { note: order.note } });', '  return <main><h1>{order.number}</h1><p>{order.customer.name}</p><p>{formatMoney(order.total)}</p><form onSubmit={form.handleSubmit(save)}><Textarea {...form.register("note")} /></form></main>;', '}'].join('\n') },
      { file: 'app/[workspace]/settings/webhooks/[webhookId]/page.tsx', code: ['export default function Page({ params }) {', '  const webhook = useWebhook(params.webhookId);', '  return <SettingsContentWrapper><WebhookForm onSubmit={save} data={webhook} /></SettingsContentWrapper>;', '}'].join('\n') },
      { file: 'app/orders/[id]/edit/page.tsx', code: ['export default async function Page({ params }) {', '  const order = await getOrder((await params).id);', '  return <OrderForm initialData={order} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: PAGE('<main><OrderHeader order={order} /><OrderSummary order={order} /></main>') },
      { file: DETAILS_FILE, code: PAGE('<main><OrderSummary order={order}/><form action={archive}><button>Archive</button></form></main>') },
      { file: DETAILS_FILE, code: ['export default function Page({ params }) {', '  const { data: order } = useQuery(orderOptions(params.id));', '  const form = useForm();', '  return <main><OrderHeader order={order} /><OrderSummary order={order} /><DeleteOrderDialog order={order} /></main>;', '}'].join('\n') },
    ],
    bad: [
      { file: 'src/features/products/components/product-view-page.tsx', code: ['export default function ProductViewPage({ productId }) {', '  const { data } = useSuspenseQuery(productByIdOptions(productId));', '  return <ProductForm initialData={data.product} pageTitle="Edit Product" />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export default function Page({ params }) {', '  const { data: order } = useQuery(orderOptions(params.id));', '  const form = useForm({ defaultValues: order });', '  return <form onSubmit={form.handleSubmit(save)}><Input {...form.register("number")} /><Input {...form.register("email")} /><Button type="submit">Save</Button></form>;', '}'].join('\n') },
    ],
  },
];
