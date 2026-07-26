const findIndices = (arr, f) => arr.map((x, i, a) => f(x, i, a) ? i : null).filter((x) => x != null);
const splitAt = (arr, is) => [-1, ...is, arr.length].reduce(({ xs, a }, b) => {
  var _a;
  return { xs: (_a = xs == null ? void 0 : xs.concat([arr.slice(a + 1, b)])) != null ? _a : [], a: b };
}, {}).xs;
const concatArrays = (a, b) => a.slice(0, -1).concat([a[a.length - 1].concat(b[0])]).concat(b.slice(1));
const isNumber = /\d/;
const isCFI = /^epubcfi\((.*)\)$/;
const escapeCFI = (str) => str.replace(/[\^[\](),;=]/g, "^$&");
const wrap = (x) => isCFI.test(x) ? x : `epubcfi(${x})`;
const unwrap = (x) => {
  var _a, _b;
  return (_b = (_a = x.match(isCFI)) == null ? void 0 : _a[1]) != null ? _b : x;
};
const tokenizer = (str) => {
  const tokens = [];
  let state, escape, value = "";
  const push = (x) => (tokens.push(x), state = null, value = "");
  const cat = (x) => (value += x, escape = false);
  for (const char of Array.from(str.trim()).concat("")) {
    if (char === "^" && !escape) {
      escape = true;
      continue;
    }
    if (state === "!") push(["!"]);
    else if (state === ",") push([","]);
    else if (state === "/" || state === ":") {
      if (isNumber.test(char)) {
        cat(char);
        continue;
      } else push([state, parseInt(value)]);
    } else if (state === "~") {
      if (isNumber.test(char) || char === ".") {
        cat(char);
        continue;
      } else push(["~", parseFloat(value)]);
    } else if (state === "@") {
      if (char === ":") {
        push(["@", parseFloat(value)]);
        state = "@";
        continue;
      }
      if (isNumber.test(char) || char === ".") {
        cat(char);
        continue;
      } else push(["@", parseFloat(value)]);
    } else if (state === "[") {
      if (char === ";" && !escape) {
        push(["[", value]);
        state = ";";
      } else if (char === "," && !escape) {
        push(["[", value]);
        state = "[";
      } else if (char === "]" && !escape) push(["[", value]);
      else cat(char);
      continue;
    } else if (state == null ? void 0 : state.startsWith(";")) {
      if (char === "=" && !escape) {
        state = `;${value}`;
        value = "";
      } else if (char === ";" && !escape) {
        push([state, value]);
        state = ";";
      } else if (char === "]" && !escape) push([state, value]);
      else cat(char);
      continue;
    }
    if (char === "/" || char === ":" || char === "~" || char === "@" || char === "[" || char === "!" || char === ",") state = char;
  }
  return tokens;
};
const findTokens = (tokens, x) => findIndices(tokens, ([t]) => t === x);
const parser = (tokens) => {
  var _a, _b;
  const parts = [];
  let state;
  for (const [type, val] of tokens) {
    if (type === "/") parts.push({ index: val });
    else {
      const last = parts[parts.length - 1];
      if (type === ":") last.offset = val;
      else if (type === "~") last.temporal = val;
      else if (type === "@") last.spatial = ((_a = last.spatial) != null ? _a : []).concat(val);
      else if (type === ";s") last.side = val;
      else if (type === "[") {
        if (state === "/" && val) last.id = val;
        else {
          last.text = ((_b = last.text) != null ? _b : []).concat(val);
          continue;
        }
      }
    }
    state = type;
  }
  return parts;
};
const parserIndir = (tokens) => splitAt(tokens, findTokens(tokens, "!")).map(parser);
const parse = (cfi) => {
  const tokens = tokenizer(unwrap(cfi));
  const commas = findTokens(tokens, ",");
  if (!commas.length) return parserIndir(tokens);
  const [parent, start, end] = splitAt(tokens, commas).map(parserIndir);
  return { parent, start, end };
};
const partToString = ({ index, id, offset, temporal, spatial, text, side }) => {
  var _a, _b;
  const param = side ? `;s=${side}` : "";
  return `/${index}` + (id ? `[${escapeCFI(id)}${param}]` : "") + (offset != null && index % 2 ? `:${offset}` : "") + (temporal ? `~${temporal}` : "") + (spatial ? `@${spatial.join(":")}` : "") + (text || !id && side ? "[" + ((_b = (_a = text == null ? void 0 : text.map(escapeCFI)) == null ? void 0 : _a.join(",")) != null ? _b : "") + param + "]" : "");
};
const toInnerString = (parsed) => parsed.parent ? [parsed.parent, parsed.start, parsed.end].map(toInnerString).join(",") : parsed.map((parts) => parts.map(partToString).join("")).join("!");
const toString = (parsed) => wrap(toInnerString(parsed));
const collapse = (x, toEnd) => typeof x === "string" ? toString(collapse(parse(x), toEnd)) : x.parent ? concatArrays(x.parent, x[toEnd ? "end" : "start"]) : x;
const isTextNode = ({ nodeType }) => nodeType === 3 || nodeType === 4;
const isElementNode = ({ nodeType }) => nodeType === 1;
const getChildNodes = (node, filter) => {
  const nodes = Array.from(node.childNodes).filter((node2) => isTextNode(node2) || isElementNode(node2));
  return filter ? nodes.map((node2) => {
    const accept = filter(node2);
    if (accept === NodeFilter.FILTER_REJECT) return null;
    else if (accept === NodeFilter.FILTER_SKIP) return getChildNodes(node2, filter);
    else return node2;
  }).flat().filter((x) => x) : nodes;
};
const indexChildNodes = (node, filter) => {
  const nodes = getChildNodes(node, filter).reduce((arr, node2) => {
    let last = arr[arr.length - 1];
    if (!last) arr.push(node2);
    else if (isTextNode(node2)) {
      if (Array.isArray(last)) last.push(node2);
      else if (isTextNode(last)) arr[arr.length - 1] = [last, node2];
      else arr.push(node2);
    } else {
      if (isElementNode(last)) arr.push(null, node2);
      else arr.push(node2);
    }
    return arr;
  }, []);
  if (isElementNode(nodes[0])) nodes.unshift("first");
  if (isElementNode(nodes[nodes.length - 1])) nodes.push("last");
  nodes.unshift("before");
  nodes.push("after");
  return nodes;
};
const partsToNode = (node, parts, filter) => {
  var _a, _b;
  const { id } = parts[parts.length - 1];
  if (id) {
    const el = node.ownerDocument.getElementById(id);
    if (el) return { node: el, offset: 0 };
  }
  for (const { index } of parts) {
    const newNode = node ? indexChildNodes(node, filter)[index] : null;
    if (newNode === "first") return { node: (_a = node.firstChild) != null ? _a : node };
    if (newNode === "last") return { node: (_b = node.lastChild) != null ? _b : node };
    if (newNode === "before") return { node, before: true };
    if (newNode === "after") return { node, after: true };
    node = newNode;
  }
  const { offset } = parts[parts.length - 1];
  if (!Array.isArray(node)) return { node, offset };
  let sum = 0;
  for (const n of node) {
    const { length } = n.nodeValue;
    if (sum + length >= offset) return { node: n, offset: offset - sum };
    sum += length;
  }
};
const nodeToParts = (node, offset, filter) => {
  let { id, parentNode } = node;
  while (filter)
    parentNode = parentNode.parentNode;
  const indexed = indexChildNodes(parentNode, filter);
  const index = indexed.findIndex((x) => Array.isArray(x) ? x.some((x2) => x2 === node) : x === node);
  const chunk = indexed[index];
  if (Array.isArray(chunk)) {
    let sum = 0;
    for (const x of chunk) {
      if (x === node) {
        sum += offset;
        break;
      } else sum += x.nodeValue.length;
    }
    offset = sum;
  }
  const part = { id, index, offset };
  return (parentNode !== node.ownerDocument.documentElement ? nodeToParts(parentNode, null, filter).concat(part) : [part]).filter((x) => x.index !== -1);
};
const toRange = (doc, parts, filter) => {
  const startParts = collapse(parts);
  const endParts = collapse(parts, true);
  const root = doc.documentElement;
  const start = partsToNode(root, startParts[0], filter);
  const end = partsToNode(root, endParts[0], filter);
  const range = doc.createRange();
  if (start.before) range.setStartBefore(start.node);
  else if (start.after) range.setStartAfter(start.node);
  else range.setStart(start.node, start.offset);
  if (end.before) range.setEndBefore(end.node);
  else if (end.after) range.setEndAfter(end.node);
  else range.setEnd(end.node, end.offset);
  return range;
};
const fromElements = (elements) => {
  const results = [];
  const { parentNode } = elements[0];
  const parts = nodeToParts(parentNode);
  for (const [index, node] of indexChildNodes(parentNode).entries()) {
    const el = elements[results.length];
    if (node === el)
      results.push(toString([parts.concat({ id: el.id, index })]));
  }
  return results;
};
const toElement = (doc, parts) => partsToNode(doc.documentElement, collapse(parts)).node;

var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var _entries, _lastMediaOverlayItem, _sectionIndex, _audioIndex, _itemIndex, _audio, _volume, _rate, _state, _MediaOverlay_instances, loadSMIL_fn, activeAudio_get, activeItem_get, error_fn, highlight_fn, unhighlight_fn, play_fn, stop_fn, _uris, _decoders, _algorithms, _cache, _children, _refCount, _loader, _encryption, _EPUB_instances, loadXML_fn;
const NS = {
  CONTAINER: "urn:oasis:names:tc:opendocument:xmlns:container",
  XHTML: "http://www.w3.org/1999/xhtml",
  OPF: "http://www.idpf.org/2007/opf",
  EPUB: "http://www.idpf.org/2007/ops",
  DC: "http://purl.org/dc/elements/1.1/",
  ENC: "http://www.w3.org/2001/04/xmlenc#",
  NCX: "http://www.daisy.org/z3986/2005/ncx/",
  XLINK: "http://www.w3.org/1999/xlink",
  SMIL: "http://www.w3.org/ns/SMIL"
};
const MIME = {
  XML: "application/xml",
  NCX: "application/x-dtbncx+xml",
  XHTML: "application/xhtml+xml",
  HTML: "text/html",
  CSS: "text/css",
  SVG: "image/svg+xml",
  JS: /\/(x-)?(javascript|ecmascript)/
};
const PREFIX = {
  a11y: "http://www.idpf.org/epub/vocab/package/a11y/#",
  dcterms: "http://purl.org/dc/terms/",
  marc: "http://id.loc.gov/vocabulary/",
  media: "http://www.idpf.org/epub/vocab/overlays/#",
  onix: "http://www.editeur.org/ONIX/book/codelists/current.html#",
  rendition: "http://www.idpf.org/vocab/rendition/#",
  schema: "http://schema.org/",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  msv: "http://www.idpf.org/epub/vocab/structure/magazine/#",
  prism: "http://www.prismstandard.org/specifications/3.0/PRISM_CV_Spec_3.0.htm#"
};
const RELATORS = {
  art: "artist",
  aut: "author",
  clr: "colorist",
  edt: "editor",
  ill: "illustrator",
  nrt: "narrator",
  trl: "translator",
  pbl: "publisher"
};
const ONIX5 = {
  "02": "isbn",
  "06": "doi",
  "15": "isbn",
  "26": "doi",
  "34": "issn"
};
const camel = (x) => x.toLowerCase().replace(/[-:](.)/g, (_, g) => g.toUpperCase());
const normalizeWhitespace = (str) => str ? str.replace(/[\t\n\f\r ]+/g, " ").replace(/^[\t\n\f\r ]+/, "").replace(/[\t\n\f\r ]+$/, "") : "";
const filterAttribute = (attr, value, isList) => isList ? (el) => {
  var _a, _b;
  return (_b = (_a = el.getAttribute(attr)) == null ? void 0 : _a.split(/\s/)) == null ? void 0 : _b.includes(value);
} : typeof value === "function" ? (el) => value(el.getAttribute(attr)) : (el) => el.getAttribute(attr) === value;
const getAttributes = (...xs) => (el) => el ? Object.fromEntries(xs.map((x) => [camel(x), el.getAttribute(x)])) : null;
const getElementText = (el) => normalizeWhitespace(el == null ? void 0 : el.textContent);
const childGetter = (doc, ns) => {
  const useNS = doc.lookupNamespaceURI(null) === ns || doc.lookupPrefix(ns);
  const f = useNS ? (el, name) => (el2) => el2.namespaceURI === ns && el2.localName === name : (el, name) => (el2) => el2.localName === name;
  return {
    $: (el, name) => [...el.children].find(f(el, name)),
    $$: (el, name) => [...el.children].filter(f(el, name)),
    $$$: useNS ? (el, name) => [...el.getElementsByTagNameNS(ns, name)] : (el, name) => [...el.getElementsByTagName(name)]
  };
};
const resolveURL = (url, relativeTo) => {
  try {
    if (relativeTo.includes(":")) return new URL(url, relativeTo);
    const root = "https://invalid.invalid/";
    const obj = new URL(url, root + relativeTo);
    obj.search = "";
    return decodeURI(obj.href.replace(root, ""));
  } catch (e) {
    console.warn(e);
    return url;
  }
};
const isExternal = (uri) => /^(?!blob)\w+:/i.test(uri);
const pathRelative = (from, to) => {
  if (!from) return to;
  const as = from.replace(/\/$/, "").split("/");
  const bs = to.replace(/\/$/, "").split("/");
  const i = (as.length > bs.length ? as : bs).findIndex((_, i2) => as[i2] !== bs[i2]);
  return i < 0 ? "" : Array(as.length - i).fill("..").concat(bs.slice(i)).join("/");
};
const pathDirname = (str) => str.slice(0, str.lastIndexOf("/") + 1);
const replaceSeries = async (str, regex, f) => {
  const matches = [];
  str.replace(regex, (...args) => (matches.push(args), null));
  const results = [];
  for (const args of matches) results.push(await f(...args));
  return str.replace(regex, () => results.shift());
};
const regexEscape = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
const tidy = (obj) => {
  for (const [key, val] of Object.entries(obj))
    if (val == null) delete obj[key];
    else if (Array.isArray(val)) {
      obj[key] = val.filter((x) => x).map((x) => typeof x === "object" && !Array.isArray(x) ? tidy(x) : x);
      if (!obj[key].length) delete obj[key];
      else if (obj[key].length === 1) obj[key] = obj[key][0];
    } else if (typeof val === "object") {
      obj[key] = tidy(val);
      if (!Object.keys(val).length) delete obj[key];
    }
  const keys = Object.keys(obj);
  if (keys.length === 1 && keys[0] === "name") return obj[keys[0]];
  return obj;
};
const getPrefixes = (doc) => {
  const map = new Map(Object.entries(PREFIX));
  const value = doc.documentElement.getAttributeNS(NS.EPUB, "prefix") || doc.documentElement.getAttribute("prefix");
  if (value) for (const [, prefix, url] of value.matchAll(/(.+): +(.+)[ \t\r\n]*/g)) map.set(prefix, url);
  return map;
};
const getPropertyURL = (value, prefixes) => {
  if (!value) return null;
  const [a, b] = value.split(":");
  const prefix = b ? a : null;
  const reference = b ? b : a;
  const baseURL = prefixes.get(prefix);
  return baseURL ? baseURL + reference : null;
};
const getMetadata = (opf) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K;
  const { $ } = childGetter(opf, NS.OPF);
  const $metadata = $(opf.documentElement, "metadata");
  const els = Object.groupBy($metadata.children, (el) => el.namespaceURI === NS.DC ? "dc" : el.namespaceURI === NS.OPF && el.localName === "meta" ? el.hasAttribute("name") ? "legacyMeta" : "meta" : "");
  const baseLang = (_b = (_a = $metadata.getAttribute("xml:lang")) != null ? _a : opf.documentElement.getAttribute("xml:lang")) != null ? _b : "und";
  const prefixes = getPrefixes(opf);
  const parse = (el) => {
    var _a2, _b2;
    const property = el.getAttribute("property");
    const scheme = el.getAttribute("scheme");
    return {
      property: (_a2 = getPropertyURL(property, prefixes)) != null ? _a2 : property,
      scheme: (_b2 = getPropertyURL(scheme, prefixes)) != null ? _b2 : scheme,
      lang: el.getAttribute("xml:lang"),
      value: getElementText(el),
      props: getProperties(el),
      // `opf:` attributes from EPUB 2 & EPUB 3.1 (removed in EPUB 3.2)
      attrs: Object.fromEntries(Array.from(el.attributes).filter((attr) => attr.namespaceURI === NS.OPF).map((attr) => [attr.localName, attr.value]))
    };
  };
  const refines = Map.groupBy((_c = els.meta) != null ? _c : [], (el) => el.getAttribute("refines"));
  const getProperties = (el) => {
    const els2 = refines.get(el ? "#" + el.getAttribute("id") : null);
    if (!els2) return null;
    return Object.groupBy(els2.map(parse), (x) => x.property);
  };
  const dc = Object.fromEntries(Object.entries(Object.groupBy(els.dc, (el) => el.localName)).map(([name, els2]) => [name, els2.map(parse)]));
  const properties = (_d = getProperties()) != null ? _d : {};
  const legacyMeta = Object.fromEntries((_f = (_e = els.legacyMeta) == null ? void 0 : _e.map((el) => [el.getAttribute("name"), el.getAttribute("content")])) != null ? _f : []);
  const one = (x) => {
    var _a2;
    return (_a2 = x == null ? void 0 : x[0]) == null ? void 0 : _a2.value;
  };
  const prop = (x, p) => {
    var _a2;
    return one((_a2 = x == null ? void 0 : x.props) == null ? void 0 : _a2[p]);
  };
  const makeLanguageMap = (x) => {
    var _a2, _b2, _c2, _d2, _e2;
    if (!x) return null;
    const alts = (_b2 = (_a2 = x.props) == null ? void 0 : _a2["alternate-script"]) != null ? _b2 : [];
    const altRep = x.attrs["alt-rep"];
    if (!alts.length && (!x.lang || x.lang === baseLang) && !altRep) return x.value;
    const map = { [(_c2 = x.lang) != null ? _c2 : baseLang]: x.value };
    if (altRep) map[x.attrs["alt-rep-lang"]] = altRep;
    for (const y of alts) (_e2 = map[_d2 = y.lang]) != null ? _e2 : map[_d2] = y.value;
    return map;
  };
  const makeContributor = (x) => {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2;
    return x ? {
      name: makeLanguageMap(x),
      sortAs: (_c2 = makeLanguageMap((_b2 = (_a2 = x.props) == null ? void 0 : _a2["file-as"]) == null ? void 0 : _b2[0])) != null ? _c2 : x.attrs["file-as"],
      role: (_g2 = (_f2 = (_e2 = (_d2 = x.props) == null ? void 0 : _d2.role) == null ? void 0 : _e2.filter((x2) => x2.scheme === PREFIX.marc + "relators")) == null ? void 0 : _f2.map((x2) => x2.value)) != null ? _g2 : [x.attrs.role],
      code: (_h2 = prop(x, "term")) != null ? _h2 : x.attrs.term,
      scheme: (_i2 = prop(x, "authority")) != null ? _i2 : x.attrs.authority
    } : null;
  };
  const makeCollection = (x) => {
    var _a2;
    return {
      name: makeLanguageMap(x),
      // NOTE: webpub requires number but EPUB allows values like "2.2.1"
      position: one((_a2 = x.props) == null ? void 0 : _a2["group-position"])
    };
  };
  const makeAltIdentifier = (x) => {
    var _a2;
    const { value } = x;
    if (/^urn:/i.test(value)) return value;
    if (/^doi:/i.test(value)) return `urn:${value}`;
    const type = (_a2 = x.props) == null ? void 0 : _a2["identifier-type"];
    if (!type) {
      const scheme = x.attrs.scheme;
      if (!scheme) return value;
      if (/^(doi|isbn|uuid)$/i.test(scheme)) return `urn:${scheme}:${value}`;
      return { scheme, value };
    }
    if (type.scheme === PREFIX.onix + "codelist5") {
      const nid = ONIX5[type.value];
      if (nid) return `urn:${nid}:${value}`;
    }
    return value;
  };
  const belongsTo = Object.groupBy(
    (_g = properties["belongs-to-collection"]) != null ? _g : [],
    (x) => prop(x, "collection-type") === "series" ? "series" : "collection"
  );
  const mainTitle = (_j = (_h = dc.title) == null ? void 0 : _h.find((x) => prop(x, "title-type") === "main")) != null ? _j : (_i = dc.title) == null ? void 0 : _i[0];
  const metadata = {
    identifier: getIdentifier(opf),
    title: makeLanguageMap(mainTitle),
    sortAs: (_o = (_n = makeLanguageMap((_l = (_k = mainTitle == null ? void 0 : mainTitle.props) == null ? void 0 : _k["file-as"]) == null ? void 0 : _l[0])) != null ? _n : (_m = mainTitle == null ? void 0 : mainTitle.attrs) == null ? void 0 : _m["file-as"]) != null ? _o : legacyMeta == null ? void 0 : legacyMeta["calibre:title_sort"],
    subtitle: (_q = (_p = dc.title) == null ? void 0 : _p.find((x) => prop(x, "title-type") === "subtitle")) == null ? void 0 : _q.value,
    language: (_r = dc.language) == null ? void 0 : _r.map((x) => x.value),
    description: one(dc.description),
    publisher: (_s = dc.publisher) == null ? void 0 : _s.map(makeContributor),
    published: (_v = (_u = (_t = dc.date) == null ? void 0 : _t.find((x) => x.attrs.event === "publication")) == null ? void 0 : _u.value) != null ? _v : one(dc.date),
    modified: (_y = one(properties[PREFIX.dcterms + "modified"])) != null ? _y : (_x = (_w = dc.date) == null ? void 0 : _w.find((x) => x.attrs.event === "modification")) == null ? void 0 : _x.value,
    subject: (_z = dc.subject) == null ? void 0 : _z.map(makeContributor),
    belongsTo: {
      collection: (_A = belongsTo.collection) == null ? void 0 : _A.map(makeCollection),
      series: ((_C = (_B = belongsTo.series) == null ? void 0 : _B.map(makeCollection)) != null ? _C : legacyMeta == null ? void 0 : legacyMeta["calibre:series"]) ? {
        name: legacyMeta == null ? void 0 : legacyMeta["calibre:series"],
        position: parseFloat(legacyMeta == null ? void 0 : legacyMeta["calibre:series_index"])
      } : null
    },
    altIdentifier: (_D = dc.identifier) == null ? void 0 : _D.map(makeAltIdentifier),
    source: (_E = dc.source) == null ? void 0 : _E.map(makeAltIdentifier),
    // NOTE: not in webpub schema
    rights: one(dc.rights),
    // NOTE: not in webpub schema
    pageBreakSource: one(properties["pageBreakSource"])
    // NOTE: not in webpub schema
  };
  const remapContributor = (defaultKey) => (x) => {
    var _a2;
    const keys = new Set((_a2 = x.role) == null ? void 0 : _a2.map((role) => {
      var _a3;
      return (_a3 = RELATORS[role]) != null ? _a3 : defaultKey;
    }));
    return [keys.size ? keys : [defaultKey], x];
  };
  for (const [keys, val] of [].concat(
    (_H = (_G = (_F = dc.creator) == null ? void 0 : _F.map(makeContributor)) == null ? void 0 : _G.map(remapContributor("author"))) != null ? _H : [],
    (_K = (_J = (_I = dc.contributor) == null ? void 0 : _I.map(makeContributor)) == null ? void 0 : _J.map(remapContributor("contributor"))) != null ? _K : []
  ))
    for (const key of keys)
      if (metadata[key]) metadata[key].push(val);
      else metadata[key] = [val];
  tidy(metadata);
  if (metadata.altIdentifier === metadata.identifier)
    delete metadata.altIdentifier;
  const rendition = {};
  const media = {};
  for (const [key, val] of Object.entries(properties)) {
    if (key.startsWith(PREFIX.rendition))
      rendition[camel(key.replace(PREFIX.rendition, ""))] = one(val);
    else if (key.startsWith(PREFIX.media))
      media[camel(key.replace(PREFIX.media, ""))] = one(val);
  }
  if (media.duration) media.duration = parseClock(media.duration);
  return { metadata, rendition, media };
};
const parseNav = (doc, resolve = (f) => f) => {
  var _a, _b;
  const { $, $$, $$$ } = childGetter(doc, NS.XHTML);
  const resolveHref = (href) => href ? decodeURI(resolve(href)) : null;
  const parseLI = (getType) => ($li) => {
    var _a2, _b2;
    const $a = (_a2 = $($li, "a")) != null ? _a2 : $($li, "span");
    const $ol = $($li, "ol");
    const href = resolveHref($a == null ? void 0 : $a.getAttribute("href"));
    const label = getElementText($a) || ($a == null ? void 0 : $a.getAttribute("title"));
    const result = { label, href, subitems: parseOL($ol) };
    if (getType) result.type = (_b2 = $a == null ? void 0 : $a.getAttributeNS(NS.EPUB, "type")) == null ? void 0 : _b2.split(/\s/);
    return result;
  };
  const parseOL = ($ol, getType) => $ol ? $$($ol, "li").map(parseLI(getType)) : null;
  const parseNav2 = ($nav, getType) => parseOL($($nav, "ol"), getType);
  const $$nav = $$$(doc, "nav");
  let toc = null, pageList = null, landmarks = null, others = [];
  for (const $nav of $$nav) {
    const type = (_b = (_a = $nav.getAttributeNS(NS.EPUB, "type")) == null ? void 0 : _a.split(/\s/)) != null ? _b : [];
    if (type.includes("toc")) toc != null ? toc : toc = parseNav2($nav);
    else if (type.includes("page-list")) pageList != null ? pageList : pageList = parseNav2($nav);
    else if (type.includes("landmarks")) landmarks != null ? landmarks : landmarks = parseNav2($nav, true);
    else others.push({
      label: getElementText($nav.firstElementChild),
      type,
      list: parseNav2($nav)
    });
  }
  return { toc, pageList, landmarks, others };
};
const parseNCX = (doc, resolve = (f) => f) => {
  const { $, $$ } = childGetter(doc, NS.NCX);
  const resolveHref = (href) => href ? decodeURI(resolve(href)) : null;
  const parseItem = (el) => {
    const $label = $(el, "navLabel");
    const $content = $(el, "content");
    const label = getElementText($label);
    const href = resolveHref($content.getAttribute("src"));
    if (el.localName === "navPoint") {
      const els = $$(el, "navPoint");
      return { label, href, subitems: els.length ? els.map(parseItem) : null };
    }
    return { label, href };
  };
  const parseList = (el, itemName) => $$(el, itemName).map(parseItem);
  const getSingle = (container, itemName) => {
    const $container = $(doc.documentElement, container);
    return $container ? parseList($container, itemName) : null;
  };
  return {
    toc: getSingle("navMap", "navPoint"),
    pageList: getSingle("pageList", "pageTarget"),
    others: $$(doc.documentElement, "navList").map((el) => ({
      label: getElementText($(el, "navLabel")),
      list: parseList(el, "navTarget")
    }))
  };
};
const parseClock = (str) => {
  if (!str) return;
  const parts = str.split(":").map((x2) => parseFloat(x2));
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 60 * 60 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  const [x, unit] = str.split(/(?=[^\d.])/);
  const n = parseFloat(x);
  const f = unit === "h" ? 60 * 60 : unit === "min" ? 60 : unit === "ms" ? 1e-3 : 1;
  return n * f;
};
class MediaOverlay extends EventTarget {
  constructor(book, loadXML) {
    super();
    __privateAdd(this, _MediaOverlay_instances);
    __privateAdd(this, _entries);
    __privateAdd(this, _lastMediaOverlayItem);
    __privateAdd(this, _sectionIndex);
    __privateAdd(this, _audioIndex);
    __privateAdd(this, _itemIndex);
    __privateAdd(this, _audio);
    __privateAdd(this, _volume, 1);
    __privateAdd(this, _rate, 1);
    __privateAdd(this, _state);
    this.book = book;
    this.loadXML = loadXML;
  }
  async start(sectionIndex, filter = () => true) {
    var _a;
    (_a = __privateGet(this, _audio)) == null ? void 0 : _a.pause();
    const section = this.book.sections[sectionIndex];
    const href = section == null ? void 0 : section.id;
    if (!href) return;
    const { mediaOverlay } = section;
    if (!mediaOverlay) return this.start(sectionIndex + 1);
    __privateSet(this, _sectionIndex, sectionIndex);
    await __privateMethod(this, _MediaOverlay_instances, loadSMIL_fn).call(this, mediaOverlay);
    for (let i = 0; i < __privateGet(this, _entries).length; i++) {
      const { items } = __privateGet(this, _entries)[i];
      for (let j = 0; j < items.length; j++) {
        if (items[j].text.split("#")[0] === href && filter(items[j], j, items))
          return __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, i, j).catch((e) => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, e));
      }
    }
  }
  pause() {
    var _a;
    __privateSet(this, _state, "paused");
    (_a = __privateGet(this, _audio)) == null ? void 0 : _a.pause();
  }
  resume() {
    var _a;
    __privateSet(this, _state, "playing");
    (_a = __privateGet(this, _audio)) == null ? void 0 : _a.play().catch((e) => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, e));
  }
  stop() {
    __privateSet(this, _state, "stopped");
    __privateMethod(this, _MediaOverlay_instances, stop_fn).call(this);
  }
  prev() {
    if (__privateGet(this, _itemIndex) > 0) __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, __privateGet(this, _audioIndex), __privateGet(this, _itemIndex) - 1);
    else if (__privateGet(this, _audioIndex) > 0) __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, __privateGet(this, _audioIndex) - 1, __privateGet(this, _entries)[__privateGet(this, _audioIndex) - 1].items.length - 1);
    else if (__privateGet(this, _sectionIndex) > 0)
      this.start(__privateGet(this, _sectionIndex) - 1, (_, i, items) => i === items.length - 1);
  }
  next() {
    __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, __privateGet(this, _audioIndex), __privateGet(this, _itemIndex) + 1);
  }
  setVolume(volume) {
    __privateSet(this, _volume, volume);
    if (__privateGet(this, _audio)) __privateGet(this, _audio).volume = volume;
  }
  setRate(rate) {
    __privateSet(this, _rate, rate);
    if (__privateGet(this, _audio)) __privateGet(this, _audio).playbackRate = rate;
  }
}
_entries = new WeakMap();
_lastMediaOverlayItem = new WeakMap();
_sectionIndex = new WeakMap();
_audioIndex = new WeakMap();
_itemIndex = new WeakMap();
_audio = new WeakMap();
_volume = new WeakMap();
_rate = new WeakMap();
_state = new WeakMap();
_MediaOverlay_instances = new WeakSet();
loadSMIL_fn = async function(item) {
  if (__privateGet(this, _lastMediaOverlayItem) === item) return;
  const doc = await this.loadXML(item.href);
  const resolve = (href) => href ? resolveURL(href, item.href) : null;
  const { $, $$$ } = childGetter(doc, NS.SMIL);
  __privateSet(this, _audioIndex, -1);
  __privateSet(this, _itemIndex, -1);
  __privateSet(this, _entries, $$$(doc, "par").reduce((arr, $par) => {
    var _a;
    const text = resolve((_a = $($par, "text")) == null ? void 0 : _a.getAttribute("src"));
    const $audio = $($par, "audio");
    if (!text || !$audio) return arr;
    const src = resolve($audio.getAttribute("src"));
    const begin = parseClock($audio.getAttribute("clipBegin"));
    const end = parseClock($audio.getAttribute("clipEnd"));
    const last = arr.at(-1);
    if ((last == null ? void 0 : last.src) === src) last.items.push({ text, begin, end });
    else arr.push({ src, items: [{ text, begin, end }] });
    return arr;
  }, []));
  __privateSet(this, _lastMediaOverlayItem, item);
};
activeAudio_get = function() {
  return __privateGet(this, _entries)[__privateGet(this, _audioIndex)];
};
activeItem_get = function() {
  var _a, _b;
  return (_b = (_a = __privateGet(this, _MediaOverlay_instances, activeAudio_get)) == null ? void 0 : _a.items) == null ? void 0 : _b[__privateGet(this, _itemIndex)];
};
error_fn = function(e) {
  console.error(e);
  this.dispatchEvent(new CustomEvent("error", { detail: e }));
};
highlight_fn = function() {
  this.dispatchEvent(new CustomEvent("highlight", { detail: __privateGet(this, _MediaOverlay_instances, activeItem_get) }));
};
unhighlight_fn = function() {
  this.dispatchEvent(new CustomEvent("unhighlight", { detail: __privateGet(this, _MediaOverlay_instances, activeItem_get) }));
};
play_fn = async function(audioIndex, itemIndex) {
  var _a, _b;
  __privateMethod(this, _MediaOverlay_instances, stop_fn).call(this);
  __privateSet(this, _audioIndex, audioIndex);
  __privateSet(this, _itemIndex, itemIndex);
  const src = (_a = __privateGet(this, _MediaOverlay_instances, activeAudio_get)) == null ? void 0 : _a.src;
  if (!src || !__privateGet(this, _MediaOverlay_instances, activeItem_get)) return this.start(__privateGet(this, _sectionIndex) + 1);
  const url = URL.createObjectURL(await this.book.loadBlob(src));
  const audio = new Audio(url);
  __privateSet(this, _audio, audio);
  audio.volume = __privateGet(this, _volume);
  audio.playbackRate = __privateGet(this, _rate);
  audio.addEventListener("timeupdate", () => {
    var _a2, _b2;
    if (audio.paused) return;
    const t = audio.currentTime;
    const { items } = __privateGet(this, _MediaOverlay_instances, activeAudio_get);
    if (t > ((_a2 = __privateGet(this, _MediaOverlay_instances, activeItem_get)) == null ? void 0 : _a2.end)) {
      __privateMethod(this, _MediaOverlay_instances, unhighlight_fn).call(this);
      if (__privateGet(this, _itemIndex) === items.length - 1) {
        __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, __privateGet(this, _audioIndex) + 1, 0).catch((e) => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, e));
        return;
      }
    }
    const oldIndex = __privateGet(this, _itemIndex);
    while (((_b2 = items[__privateGet(this, _itemIndex) + 1]) == null ? void 0 : _b2.begin) <= t) __privateWrapper(this, _itemIndex)._++;
    if (__privateGet(this, _itemIndex) !== oldIndex) __privateMethod(this, _MediaOverlay_instances, highlight_fn).call(this);
  });
  audio.addEventListener("error", () => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, new Error(`Failed to load ${src}`)));
  audio.addEventListener("playing", () => __privateMethod(this, _MediaOverlay_instances, highlight_fn).call(this));
  audio.addEventListener("ended", () => {
    __privateMethod(this, _MediaOverlay_instances, unhighlight_fn).call(this);
    URL.revokeObjectURL(url);
    __privateSet(this, _audio, null);
    __privateMethod(this, _MediaOverlay_instances, play_fn).call(this, audioIndex + 1, 0).catch((e) => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, e));
  });
  if (__privateGet(this, _state) === "paused") {
    __privateMethod(this, _MediaOverlay_instances, highlight_fn).call(this);
    audio.currentTime = (_b = __privateGet(this, _MediaOverlay_instances, activeItem_get).begin) != null ? _b : 0;
  } else audio.addEventListener("canplaythrough", () => {
    var _a2;
    audio.currentTime = (_a2 = __privateGet(this, _MediaOverlay_instances, activeItem_get).begin) != null ? _a2 : 0;
    __privateSet(this, _state, "playing");
    audio.play().catch((e) => __privateMethod(this, _MediaOverlay_instances, error_fn).call(this, e));
  }, { once: true });
};
stop_fn = function() {
  if (__privateGet(this, _audio)) {
    __privateGet(this, _audio).pause();
    URL.revokeObjectURL(__privateGet(this, _audio).src);
    __privateSet(this, _audio, null);
    __privateMethod(this, _MediaOverlay_instances, unhighlight_fn).call(this);
  }
};
const isUUID = /([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/;
const getUUID = (opf) => {
  for (const el of opf.getElementsByTagNameNS(NS.DC, "identifier")) {
    const [id] = getElementText(el).split(":").slice(-1);
    if (isUUID.test(id)) return id;
  }
  return "";
};
const getIdentifier = (opf) => {
  var _a;
  return getElementText(
    (_a = opf.getElementById(opf.documentElement.getAttribute("unique-identifier"))) != null ? _a : opf.getElementsByTagNameNS(NS.DC, "identifier")[0]
  );
};
const deobfuscate = async (key, length, blob) => {
  const array = new Uint8Array(await blob.slice(0, length).arrayBuffer());
  length = Math.min(length, array.length);
  for (var i = 0; i < length; i++) array[i] = array[i] ^ key[i % key.length];
  return new Blob([array, blob.slice(length)], { type: blob.type });
};
const WebCryptoSHA1 = async (str) => {
  const data = new TextEncoder().encode(str);
  const buffer = await globalThis.crypto.subtle.digest("SHA-1", data);
  return new Uint8Array(buffer);
};
const deobfuscators = (sha1 = WebCryptoSHA1) => ({
  "http://www.idpf.org/2008/embedding": {
    key: (opf) => sha1(getIdentifier(opf).replaceAll(/[\u0020\u0009\u000d\u000a]/g, "")),
    decode: (key, blob) => deobfuscate(key, 1040, blob)
  },
  "http://ns.adobe.com/pdf/enc#RC": {
    key: (opf) => {
      const uuid = getUUID(opf).replaceAll("-", "");
      return Uint8Array.from({ length: 16 }, (_, i) => parseInt(uuid.slice(i * 2, i * 2 + 2), 16));
    },
    decode: (key, blob) => deobfuscate(key, 1024, blob)
  }
});
class Encryption {
  constructor(algorithms) {
    __privateAdd(this, _uris, /* @__PURE__ */ new Map());
    __privateAdd(this, _decoders, /* @__PURE__ */ new Map());
    __privateAdd(this, _algorithms);
    __privateSet(this, _algorithms, algorithms);
  }
  async init(encryption, opf) {
    if (!encryption) return;
    const data = Array.from(
      encryption.getElementsByTagNameNS(NS.ENC, "EncryptedData"),
      (el) => {
        var _a, _b;
        return {
          algorithm: (_a = el.getElementsByTagNameNS(NS.ENC, "EncryptionMethod")[0]) == null ? void 0 : _a.getAttribute("Algorithm"),
          uri: (_b = el.getElementsByTagNameNS(NS.ENC, "CipherReference")[0]) == null ? void 0 : _b.getAttribute("URI")
        };
      }
    );
    for (const { algorithm, uri } of data) {
      if (!__privateGet(this, _decoders).has(algorithm)) {
        const algo = __privateGet(this, _algorithms)[algorithm];
        if (!algo) {
          console.warn("Unknown encryption algorithm");
          continue;
        }
        const key = await algo.key(opf);
        __privateGet(this, _decoders).set(algorithm, (blob) => algo.decode(key, blob));
      }
      __privateGet(this, _uris).set(uri, algorithm);
    }
  }
  getDecoder(uri) {
    var _a;
    return (_a = __privateGet(this, _decoders).get(__privateGet(this, _uris).get(uri))) != null ? _a : ((x) => x);
  }
}
_uris = new WeakMap();
_decoders = new WeakMap();
_algorithms = new WeakMap();
class Resources {
  constructor({ opf, resolveHref }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    this.opf = opf;
    const { $, $$, $$$ } = childGetter(opf, NS.OPF);
    const $manifest = $(opf.documentElement, "manifest");
    const $spine = $(opf.documentElement, "spine");
    const $$itemref = $$($spine, "itemref");
    this.manifest = $$($manifest, "item").map(getAttributes("href", "id", "media-type", "properties", "media-overlay")).map((item) => {
      var _a2;
      item.href = resolveHref(item.href);
      item.properties = (_a2 = item.properties) == null ? void 0 : _a2.split(/\s/);
      return item;
    });
    this.manifestById = new Map(this.manifest.map((item) => [item.id, item]));
    this.spine = $$itemref.map(getAttributes("idref", "id", "linear", "properties")).map((item) => {
      var _a2;
      return item.properties = (_a2 = item.properties) == null ? void 0 : _a2.split(/\s/), item;
    });
    this.pageProgressionDirection = $spine.getAttribute("page-progression-direction");
    this.navPath = (_a = this.getItemByProperty("nav")) == null ? void 0 : _a.href;
    this.ncxPath = (_c = (_b = this.getItemByID($spine.getAttribute("toc"))) != null ? _b : this.manifest.find((item) => item.mediaType === MIME.NCX)) == null ? void 0 : _c.href;
    const $guide = $(opf.documentElement, "guide");
    if ($guide) this.guide = $$($guide, "reference").map(getAttributes("type", "title", "href")).map(({ type, title, href }) => ({
      label: title,
      type: type.split(/\s/),
      href: resolveHref(href)
    }));
    this.cover = (_h = (_e = this.getItemByProperty("cover-image")) != null ? _e : this.getItemByID((_d = $$$(opf, "meta").find(filterAttribute("name", "cover"))) == null ? void 0 : _d.getAttribute("content"))) != null ? _h : this.getItemByHref((_g = (_f = this.guide) == null ? void 0 : _f.find((ref) => ref.type.includes("cover"))) == null ? void 0 : _g.href);
    this.cfis = fromElements($$itemref);
  }
  getItemByID(id) {
    return this.manifestById.get(id);
  }
  getItemByHref(href) {
    return this.manifest.find((item) => item.href === href);
  }
  getItemByProperty(prop) {
    return this.manifest.find((item) => {
      var _a;
      return (_a = item.properties) == null ? void 0 : _a.includes(prop);
    });
  }
  resolveCFI(cfi) {
    var _a;
    const parts = parse(cfi);
    const top = ((_a = parts.parent) != null ? _a : parts).shift();
    let $itemref = toElement(this.opf, top);
    if ($itemref && $itemref.nodeName !== "idref") {
      top.at(-1).id = null;
      $itemref = toElement(this.opf, top);
    }
    const idref = $itemref == null ? void 0 : $itemref.getAttribute("idref");
    const index = this.spine.findIndex((item) => item.idref === idref);
    const anchor = (doc) => toRange(doc, parts);
    return { index, anchor };
  }
}
class Loader {
  constructor({ loadText, loadBlob, resources }) {
    __privateAdd(this, _cache, /* @__PURE__ */ new Map());
    __privateAdd(this, _children, /* @__PURE__ */ new Map());
    __privateAdd(this, _refCount, /* @__PURE__ */ new Map());
    __publicField(this, "eventTarget", new EventTarget());
    this.loadText = loadText;
    this.loadBlob = loadBlob;
    this.manifest = resources.manifest;
    this.assets = resources.manifest;
  }
  async createURL(href, data, type, parent) {
    if (!data) return "";
    const detail = { data, type };
    Object.defineProperty(detail, "name", { value: href });
    const event = new CustomEvent("data", { detail });
    this.eventTarget.dispatchEvent(event);
    const newData = await event.detail.data;
    const newType = await event.detail.type;
    const url = URL.createObjectURL(new Blob([newData], { type: newType }));
    __privateGet(this, _cache).set(href, url);
    __privateGet(this, _refCount).set(href, 1);
    if (parent) {
      const childList = __privateGet(this, _children).get(parent);
      if (childList) childList.push(href);
      else __privateGet(this, _children).set(parent, [href]);
    }
    return url;
  }
  ref(href, parent) {
    const childList = __privateGet(this, _children).get(parent);
    if (!(childList == null ? void 0 : childList.includes(href))) {
      __privateGet(this, _refCount).set(href, __privateGet(this, _refCount).get(href) + 1);
      if (childList) childList.push(href);
      else __privateGet(this, _children).set(parent, [href]);
    }
    return __privateGet(this, _cache).get(href);
  }
  unref(href) {
    if (!__privateGet(this, _refCount).has(href)) return;
    const count = __privateGet(this, _refCount).get(href) - 1;
    if (count < 1) {
      URL.revokeObjectURL(__privateGet(this, _cache).get(href));
      __privateGet(this, _cache).delete(href);
      __privateGet(this, _refCount).delete(href);
      const childList = __privateGet(this, _children).get(href);
      if (childList) while (childList.length) this.unref(childList.pop());
      __privateGet(this, _children).delete(href);
    } else __privateGet(this, _refCount).set(href, count);
  }
  // load manifest item, recursively loading all resources as needed
  async loadItem(item, parents = []) {
    if (!item) return null;
    const { href, mediaType } = item;
    const isScript = MIME.JS.test(item.mediaType);
    const detail = { type: mediaType, isScript, allow: true };
    const event = new CustomEvent("load", { detail });
    this.eventTarget.dispatchEvent(event);
    const allow = await event.detail.allow;
    if (!allow) return null;
    const parent = parents.at(-1);
    if (__privateGet(this, _cache).has(href)) return this.ref(href, parent);
    const shouldReplace = (isScript || [MIME.XHTML, MIME.HTML, MIME.CSS, MIME.SVG].includes(mediaType)) && parents.every((p) => p !== href);
    if (shouldReplace) return this.loadReplaced(item, parents);
    const tryLoadBlob = Promise.resolve().then(() => this.loadBlob(href));
    return this.createURL(href, tryLoadBlob, mediaType, parent);
  }
  async loadHref(href, base, parents = []) {
    if (isExternal(href)) return href;
    const path = resolveURL(href, base);
    const item = this.manifest.find((item2) => item2.href === path);
    if (!item) return href;
    return this.loadItem(item, parents.concat(base));
  }
  async loadReplaced(item, parents = []) {
    var _a, _b, _c;
    const { href, mediaType } = item;
    const parent = parents.at(-1);
    let str = "";
    try {
      str = await this.loadText(href);
    } catch (e) {
      return this.createURL(href, Promise.reject(e), mediaType, parent);
    }
    if (!str) return null;
    if ([MIME.XHTML, MIME.HTML, MIME.SVG].includes(mediaType)) {
      let doc = new DOMParser().parseFromString(str, mediaType);
      if (mediaType === MIME.XHTML && (doc.querySelector("parsererror") || !((_a = doc.documentElement) == null ? void 0 : _a.namespaceURI))) {
        console.warn((_c = (_b = doc.querySelector("parsererror")) == null ? void 0 : _b.innerText) != null ? _c : "Invalid XHTML");
        item.mediaType = MIME.HTML;
        doc = new DOMParser().parseFromString(str, item.mediaType);
      }
      if ([MIME.XHTML, MIME.SVG].includes(item.mediaType)) {
        let child = doc.firstChild;
        while (child instanceof ProcessingInstruction) {
          if (child.data) {
            const replacedData = await replaceSeries(
              child.data,
              /(?:^|\s*)(href\s*=\s*['"])([^'"]*)(['"])/i,
              (_, p1, p2, p3) => this.loadHref(p2, href, parents).then((p22) => `${p1}${p22}${p3}`)
            );
            child.replaceWith(doc.createProcessingInstruction(
              child.target,
              replacedData
            ));
          }
          child = child.nextSibling;
        }
      }
      const replace = async (el, attr) => el.setAttribute(
        attr,
        await this.loadHref(el.getAttribute(attr), href, parents)
      );
      for (const el of doc.querySelectorAll("link[href]")) await replace(el, "href");
      for (const el of doc.querySelectorAll("[src]")) await replace(el, "src");
      for (const el of doc.querySelectorAll("[poster]")) await replace(el, "poster");
      for (const el of doc.querySelectorAll("object[data]")) await replace(el, "data");
      for (const el of doc.querySelectorAll("[*|href]:not([href])"))
        el.setAttributeNS(NS.XLINK, "href", await this.loadHref(
          el.getAttributeNS(NS.XLINK, "href"),
          href,
          parents
        ));
      for (const el of doc.querySelectorAll("[srcset]"))
        el.setAttribute("srcset", await replaceSeries(
          el.getAttribute("srcset"),
          /(\s*)(.+?)\s*((?:\s[\d.]+[wx])+\s*(?:,|$)|,\s+|$)/g,
          (_, p1, p2, p3) => this.loadHref(p2, href, parents).then((p22) => `${p1}${p22}${p3}`)
        ));
      for (const el of doc.querySelectorAll("style"))
        if (el.textContent) el.textContent = await this.replaceCSS(el.textContent, href, parents);
      for (const el of doc.querySelectorAll("[style]"))
        el.setAttribute(
          "style",
          await this.replaceCSS(el.getAttribute("style"), href, parents)
        );
      const result2 = new XMLSerializer().serializeToString(doc);
      return this.createURL(href, result2, item.mediaType, parent);
    }
    const result = mediaType === MIME.CSS ? await this.replaceCSS(str, href, parents) : await this.replaceString(str, href, parents);
    return this.createURL(href, result, mediaType, parent);
  }
  async replaceCSS(str, href, parents = []) {
    const replacedUrls = await replaceSeries(
      str,
      /url\(\s*["']?([^'"\n]*?)\s*["']?\s*\)/gi,
      (_, url) => this.loadHref(url, href, parents).then((url2) => `url("${url2}")`)
    );
    return replaceSeries(
      replacedUrls,
      /@import\s*["']([^"'\n]*?)["']/gi,
      (_, url) => this.loadHref(url, href, parents).then((url2) => `@import "${url2}"`)
    );
  }
  // find & replace all possible relative paths for all assets without parsing
  replaceString(str, href, parents = []) {
    const assetMap = /* @__PURE__ */ new Map();
    const urls = this.assets.map((asset) => {
      if (asset.href === href) return;
      const relative = pathRelative(pathDirname(href), asset.href);
      const relativeEnc = encodeURI(relative);
      const rootRelative = "/" + asset.href;
      const rootRelativeEnc = encodeURI(rootRelative);
      const set = /* @__PURE__ */ new Set([relative, relativeEnc, rootRelative, rootRelativeEnc]);
      for (const url of set) assetMap.set(url, asset);
      return Array.from(set);
    }).flat().filter((x) => x);
    if (!urls.length) return str;
    const regex = new RegExp(urls.map(regexEscape).join("|"), "g");
    return replaceSeries(str, regex, async (match) => this.loadItem(
      assetMap.get(match.replace(/^\//, "")),
      parents.concat(href)
    ));
  }
  unloadItem(item) {
    this.unref(item == null ? void 0 : item.href);
  }
  destroy() {
    for (const url of __privateGet(this, _cache).values()) URL.revokeObjectURL(url);
  }
}
_cache = new WeakMap();
_children = new WeakMap();
_refCount = new WeakMap();
const getHTMLFragment = (doc, id) => {
  var _a;
  return (_a = doc.getElementById(id)) != null ? _a : doc.querySelector(`[name="${CSS.escape(id)}"]`);
};
const getPageSpread = (properties) => {
  for (const p of properties) {
    if (p === "page-spread-left" || p === "rendition:page-spread-left")
      return "left";
    if (p === "page-spread-right" || p === "rendition:page-spread-right")
      return "right";
    if (p === "rendition:page-spread-center") return "center";
  }
};
const getDisplayOptions = (doc) => {
  if (!doc) return null;
  return {
    fixedLayout: getElementText(doc.querySelector('option[name="fixed-layout"]')),
    openToSpread: getElementText(doc.querySelector('option[name="open-to-spread"]'))
  };
};
class EPUB {
  constructor({ loadText, loadBlob, getSize, sha1 }) {
    __privateAdd(this, _EPUB_instances);
    __publicField(this, "parser", new DOMParser());
    __privateAdd(this, _loader);
    __privateAdd(this, _encryption);
    this.loadText = loadText;
    this.loadBlob = loadBlob;
    this.getSize = getSize;
    __privateSet(this, _encryption, new Encryption(deobfuscators(sha1)));
  }
  async init() {
    var _a, _b, _c, _d, _e, _f;
    const $container = await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, "META-INF/container.xml");
    if (!$container) throw new Error("Failed to load container file");
    const opfs = Array.from(
      $container.getElementsByTagNameNS(NS.CONTAINER, "rootfile"),
      getAttributes("full-path", "media-type")
    ).filter((file) => file.mediaType === "application/oebps-package+xml");
    if (!opfs.length) throw new Error("No package document defined in container");
    const opfPath = opfs[0].fullPath;
    const opf = await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, opfPath);
    if (!opf) throw new Error("Failed to load package document");
    const $encryption = await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, "META-INF/encryption.xml");
    await __privateGet(this, _encryption).init($encryption, opf);
    this.resources = new Resources({
      opf,
      resolveHref: (url) => resolveURL(url, opfPath)
    });
    __privateSet(this, _loader, new Loader({
      loadText: this.loadText,
      loadBlob: (uri) => Promise.resolve(this.loadBlob(uri)).then(__privateGet(this, _encryption).getDecoder(uri)),
      resources: this.resources
    }));
    this.transformTarget = __privateGet(this, _loader).eventTarget;
    this.sections = this.resources.spine.map((spineItem, index) => {
      const { idref, linear, properties = [] } = spineItem;
      const item = this.resources.getItemByID(idref);
      if (!item) {
        console.warn(`Could not find item with ID "${idref}" in manifest`);
        return null;
      }
      return {
        id: item.href,
        load: () => __privateGet(this, _loader).loadItem(item),
        unload: () => __privateGet(this, _loader).unloadItem(item),
        createDocument: () => this.loadDocument(item),
        size: this.getSize(item.href),
        cfi: this.resources.cfis[index],
        linear,
        pageSpread: getPageSpread(properties),
        resolveHref: (href) => resolveURL(href, item.href),
        mediaOverlay: item.mediaOverlay ? this.resources.getItemByID(item.mediaOverlay) : null
      };
    }).filter((s) => s);
    const { navPath, ncxPath } = this.resources;
    if (navPath) try {
      const resolve = (url) => resolveURL(url, navPath);
      const nav = parseNav(await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, navPath), resolve);
      this.toc = nav.toc;
      this.pageList = nav.pageList;
      this.landmarks = nav.landmarks;
    } catch (e) {
      console.warn(e);
    }
    if (!this.toc && ncxPath) try {
      const resolve = (url) => resolveURL(url, ncxPath);
      const ncx = parseNCX(await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, ncxPath), resolve);
      this.toc = ncx.toc;
      this.pageList = ncx.pageList;
    } catch (e) {
      console.warn(e);
    }
    (_a = this.landmarks) != null ? _a : this.landmarks = this.resources.guide;
    const { metadata, rendition, media } = getMetadata(opf);
    this.metadata = metadata;
    this.rendition = rendition;
    this.media = media;
    this.dir = this.resources.pageProgressionDirection;
    const displayOptions = getDisplayOptions(
      (_b = await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, "META-INF/com.apple.ibooks.display-options.xml")) != null ? _b : await __privateMethod(this, _EPUB_instances, loadXML_fn).call(this, "META-INF/com.kobobooks.display-options.xml")
    );
    if (displayOptions) {
      if (displayOptions.fixedLayout === "true")
        (_d = (_c = this.rendition).layout) != null ? _d : _c.layout = "pre-paginated";
      if (displayOptions.openToSpread === "false") (_f = (_e = this.sections.find((section) => section.linear !== "no")).pageSpread) != null ? _f : _e.pageSpread = this.dir === "rtl" ? "left" : "right";
    }
    return this;
  }
  async loadDocument(item) {
    const str = await this.loadText(item.href);
    return this.parser.parseFromString(str, item.mediaType);
  }
  getMediaOverlay() {
    return new MediaOverlay(this, __privateMethod(this, _EPUB_instances, loadXML_fn).bind(this));
  }
  resolveCFI(cfi) {
    return this.resources.resolveCFI(cfi);
  }
  resolveHref(href) {
    const [path, hash] = href.split("#");
    const item = this.resources.getItemByHref(decodeURI(path));
    if (!item) return null;
    const index = this.resources.spine.findIndex(({ idref }) => idref === item.id);
    const anchor = hash ? (doc) => getHTMLFragment(doc, hash) : () => 0;
    return { index, anchor };
  }
  splitTOCHref(href) {
    var _a;
    return (_a = href == null ? void 0 : href.split("#")) != null ? _a : [];
  }
  getTOCFragment(doc, id) {
    var _a;
    return (_a = doc.getElementById(id)) != null ? _a : doc.querySelector(`[name="${CSS.escape(id)}"]`);
  }
  isExternal(uri) {
    return isExternal(uri);
  }
  async getCover() {
    var _a;
    const cover = (_a = this.resources) == null ? void 0 : _a.cover;
    return (cover == null ? void 0 : cover.href) ? new Blob([await this.loadBlob(cover.href)], { type: cover.mediaType }) : null;
  }
  async getCalibreBookmarks() {
    const txt = await this.loadText("META-INF/calibre_bookmarks.txt");
    const magic = "encoding=json+base64:";
    if (txt == null ? void 0 : txt.startsWith(magic)) {
      const json = atob(txt.slice(magic.length));
      return JSON.parse(json);
    }
  }
  destroy() {
    var _a;
    (_a = __privateGet(this, _loader)) == null ? void 0 : _a.destroy();
  }
}
_loader = new WeakMap();
_encryption = new WeakMap();
_EPUB_instances = new WeakSet();
loadXML_fn = async function(uri) {
  const str = await this.loadText(uri);
  if (!str) return null;
  const doc = this.parser.parseFromString(str, MIME.XML);
  if (doc.querySelector("parsererror"))
    throw new Error(`XML parsing error: ${uri}
${doc.querySelector("parsererror").innerText}`);
  return doc;
};

export { EPUB };
//# sourceMappingURL=epub.mjs.map
