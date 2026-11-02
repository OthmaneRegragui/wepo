import type { AppKind } from '@wepo/core';

export interface AppDefinition {
  kind: AppKind;
  name: string;
  slug: string;
  icon: 'word' | 'sheets' | 'slides';
  tagline: string;
  description: string;
  formats: string[];
  accent: string;
  accentSoft: string;
  features: string[];
  seoTitle: string;
  seoDescription: string;
}

export const APPS: Record<AppKind, AppDefinition> = {
  word: {
    kind: 'word',
    name: 'Word',
    slug: 'word',
    icon: 'word',
    tagline: 'Documents that keep their structure.',
    description:
      'Open a real DOCX file, edit text and tables in a paginated layout, then export a new DOCX or print to PDF. Headings, lists, images and formatting stay in the document.',
    formats: ['DOCX', 'PDF'],
    accent: 'text-blue-700',
    accentSoft: 'bg-blue-50 ring-blue-100',
    seoTitle: 'Free online Word editor — open and edit DOCX in your browser | Wepo',
    seoDescription:
      'Edit DOCX documents online without uploading them. A private browser-based Word editor with tables, images, formatting, undo and DOCX export.',
    features: [
      'Paginated DOCX editing',
      'Bold, italic, underline and strikethrough',
      'Headings, lists and paragraph spacing',
      'Tables, images and page layout',
      'Undo and redo',
      'DOCX export and print-ready PDF',
    ],
  },
  sheets: {
    kind: 'sheets',
    name: 'Sheets',
    slug: 'sheets',
    icon: 'sheets',
    tagline: 'Spreadsheets with real formulas.',
    description:
      'Open XLSX workbooks or CSV files, edit multiple worksheets and formulas, apply formatting, then export a new XLSX or CSV. Formula results are calculated in the browser.',
    formats: ['XLSX', 'CSV', 'PDF'],
    accent: 'text-emerald-700',
    accentSoft: 'bg-emerald-50 ring-emerald-100',
    seoTitle: 'Free online Excel editor — open XLSX and CSV in your browser | Wepo',
    seoDescription:
      'View and edit XLSX spreadsheets online with formulas, multiple sheets, formatting and charts. Files stay on your device; export XLSX, CSV or PDF.',
    features: [
      'Multiple worksheets',
      'XLSX and CSV import',
      'Formula engine with Excel functions',
      'Cell formatting, borders and merges',
      'Undo, redo and clipboard support',
      'XLSX, CSV and printable PDF export',
    ],
  },
  slides: {
    kind: 'slides',
    name: 'Slides',
    slug: 'slides',
    icon: 'slides',
    tagline: 'Presentations, edited in place.',
    description:
      'Open a PPTX deck, add or reorder slides, edit text and shapes, and present full screen. Export a new PPTX or slide images without sending the deck anywhere.',
    formats: ['PPTX', 'PDF'],
    accent: 'text-orange-700',
    accentSoft: 'bg-orange-50 ring-orange-100',
    seoTitle: 'Free online PowerPoint editor — open and edit PPTX in your browser | Wepo',
    seoDescription:
      'Edit PPTX presentations online in a private browser editor. Manage slides, text, images and shapes, present full screen, and export PowerPoint files.',
    features: [
      'Slide creation, duplication and reordering',
      'Text, images and preset shapes',
      'Background and text formatting',
      'Slide thumbnails and zoom',
      'Full-screen presentation mode',
      'PPTX export and slide image export',
    ],
  },
};

export const APP_LIST: AppDefinition[] = [APPS.word, APPS.sheets, APPS.slides];

export const SITE = {
  name: 'Wepo Office',
  shortName: 'Wepo',
  url: 'https://wepo.example',
  tagline: 'The office suite that stays on your device.',
  description:
    'A private, browser-based office suite for DOCX, XLSX, CSV and PPTX files. No account, no uploads, no document-processing server.',
  email: 'hello@wepo.example',
};

export function appPath(kind: AppKind, suffix = ''): string {
  return `/${kind}${suffix}`;
}

export function editorPath(kind: AppKind, id?: string): string {
  return id ? `/${kind}/edit?doc=${encodeURIComponent(id)}` : `/${kind}/edit`;
}
