import html
import re

DEFAULT_CSS = """@charset "utf-8";

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif;
    line-height: 1.6;
    margin: 5% 8%;
    color: #1a1a1a;
    background-color: transparent;
}

h1 {
    font-size: 2.0em;
    line-height: 1.25;
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    font-weight: 700;
    page-break-before: always;
}

h2 {
    font-size: 1.5em;
    line-height: 1.3;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: 600;
}

h3 {
    font-size: 1.2em;
    line-height: 1.35;
    margin-top: 1.0em;
    margin-bottom: 0.5em;
    font-weight: 600;
}

p {
    margin-top: 0;
    margin-bottom: 0.85em;
    text-indent: 1.5em;
    text-align: justify;
    hyphens: auto;
}

p.first-after-heading {
    text-indent: 0;
}

p.toc-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 0.3em;
    margin-bottom: 0.3em;
    text-indent: 0;
    text-align: left;
    font-size: 0.95em;
    line-height: 1.45;
}

p.toc-item .toc-title {
    flex-shrink: 1;
}

p.toc-item .toc-leader {
    flex-grow: 1;
    border-bottom: 1px dotted #888;
    margin: 0 0.5em 0.25em 0.5em;
    min-width: 1em;
    height: 0;
}

p.toc-item .toc-page {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    text-align: right;
    min-width: 1.5em;
}

p.list-item {
    margin-top: 0.25em;
    margin-bottom: 0.25em;
    text-indent: 0;
    text-align: left;
}

blockquote {
    margin: 1.2em 2em;
    padding-left: 1em;
    border-left: 3px solid #ccc;
    font-style: italic;
    color: #444;
}

figure {
    margin: 1.5em auto;
    text-align: center;
    page-break-inside: avoid;
}

figure img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
}

figcaption {
    font-size: 0.88em;
    color: #555;
    margin-top: 0.5em;
    font-style: italic;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f5f5f5;
    font-weight: 600;
}

aside.footnote, div.footnote {
    font-size: 0.85em;
    color: #666;
    border-top: 1px solid #eee;
    margin-top: 2em;
    padding-top: 0.5em;
}
"""

def escape_text(text: str) -> str:
    if not text:
        return ""
    # Sanitize invalid XML 1.0 control characters
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return html.escape(cleaned.strip())
