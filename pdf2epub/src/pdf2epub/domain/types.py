from enum import Enum

class RegionType(str, Enum):
    TITLE = "TITLE"
    HEADING = "HEADING"
    PARAGRAPH = "PARAGRAPH"
    IMAGE = "IMAGE"
    CAPTION = "CAPTION"
    TABLE = "TABLE"
    LIST = "LIST"
    LIST_ITEM = "LIST_ITEM"
    QUOTE = "QUOTE"
    FOOTNOTE = "FOOTNOTE"
    HEADER = "HEADER"
    FOOTER = "FOOTER"
    PAGE_NUMBER = "PAGE_NUMBER"
    FORMULA = "FORMULA"
    UNKNOWN = "UNKNOWN"

class DocumentClassification(str, Enum):
    DIGITAL = "DIGITAL"
    SCANNED = "SCANNED"
    MIXED = "MIXED"
    UNKNOWN = "UNKNOWN"

class ColumnLayout(str, Enum):
    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    MIXED = "MIXED"
