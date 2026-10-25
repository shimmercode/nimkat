export type Breakpoint = 'desktop' | 'tablet' | 'mobile';
export type PageNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style: Partial<Record<Breakpoint, Record<string, string | number>>>;
  children: PageNode[];
  visibility?: Partial<Record<Breakpoint,boolean>>;
};
export type PageSchema = { root: PageNode };
export type PublishedPageRecord = {
  slug: string;
  title: string;
  schema: PageSchema;
  status: 'draft' | 'published';
  updated_at: string;
  revision?:number;
};
