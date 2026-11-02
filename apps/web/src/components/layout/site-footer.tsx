import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '../logo';
import { APP_LIST, SITE } from '../../lib/apps';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white no-print">
      <div className="container-page py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {SITE.description} Documents are processed by WebAssembly inside this tab, never by a server.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck size={14} aria-hidden /> Local processing · Apache-2.0
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Editors</h2>
              <ul className="mt-3 space-y-2">
                {APP_LIST.map((app) => (
                  <li key={app.kind}>
                    <Link to={`/${app.slug}`} className="text-slate-600 hover:text-slate-900">
                      {app.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link to="/licenses" className="text-slate-600 hover:text-slate-900">
                    Licenses
                  </Link>
                </li>
                <li>
                  <Link to="/compatibility" className="text-slate-600 hover:text-slate-900">
                    Compatibility
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-slate-600 hover:text-slate-900">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Formats</h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>DOCX</li>
                <li>XLSX · CSV</li>
                <li>PPTX</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Built on BetterOffice, React and WebAssembly.
          </p>
          <p>No account. No document uploads. No silent overwrites.</p>
        </div>
      </div>
    </footer>
  );
}
