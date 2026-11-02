import { Link } from 'react-router-dom';
import { Compass, FileQuestion } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { Button } from '../components/ui/button';
import { APP_LIST } from '../lib/apps';
import { AppIconTile } from '../components/app-icon';

export function NotFoundPage() {
  useSeo({
    title: 'Page not found — Wepo Office',
    description: 'This page does not exist. Open the Wepo Office dashboard to edit a Word, Excel or PowerPoint file locally.',
    path: '/404',
    robots: 'noindex,follow',
  });

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <FileQuestion size={26} aria-hidden />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">That page is not here</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The link may be old, or the address may be mistyped. Your documents are stored locally in this browser and
          are not affected by a missing page.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Compass size={16} /> Go to the dashboard
            </Button>
          </Link>
          <Link to="/compatibility">
            <Button variant="outline" className="w-full sm:w-auto">
              Compatibility notes
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
        {APP_LIST.map((app) => (
          <Link
            key={app.kind}
            to={`/${app.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-card"
          >
            <AppIconTile kind={app.kind} size="sm" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{app.name}</span>
              <span className="block text-xs text-slate-500">{app.formats.join(' · ')}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
