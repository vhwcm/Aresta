declare module 'foliate-js/epub.js' {
  export class Book {
    constructor(source: any);
    load(): Promise<any>;
    getPage(pageNumber: number): Promise<any>;
    destroy(): void;
  }
}

declare module 'foliate-js/fb2.js' {
  export class Book {
    constructor(source: any);
    load(): Promise<any>;
    getPage(pageNumber: number): Promise<any>;
    destroy(): void;
  }
}
