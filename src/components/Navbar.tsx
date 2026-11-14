import { useState } from 'react';
import type { Lang } from '../data/catalog';
import { tr, UiKey } from '../i18n';

// id de cada sección de la página + clave del texto del botón
const SECTIONS: Array<{ id: string; label: UiKey }> = [
    { id: 'ejemplos', label: 'navExamples' },
    { id: 'mapa', label: 'navMap' },
    { id: 'variable', label: 'navVariable' },
    { id: 'region', label: 'navRegion' },
    { id: 'resultado', label: 'navResult' },
];

interface Props {
    lang: Lang;
    onToggleLang: () => void;
}

export function Navbar({ lang, onToggleLang }: Props) {
    const [open, setOpen] = useState(false); // menú desplegado en pantallas pequeñas

    const goTo = (id: string) => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        setOpen(false);
    };

    return (
        <nav className="navbar navbar-expand-lg bg-dark sticky-top" data-bs-theme="dark">
            <div className="container">
                <h1 className="navbar-brand mb-0">{tr(lang, 'title')}</h1>

                <div className="d-flex align-items-center gap-2 order-lg-3 ms-auto">
                    <button type="button" className="btn btn-light btn-sm" onClick={onToggleLang}>
                        {tr(lang, 'lang')}
                    </button>
                    <button
                        type="button"
                        className="navbar-toggler"
                        aria-controls="menu-principal"
                        aria-expanded={open}
                        aria-label="Menu"
                        onClick={() => setOpen(!open)}
                    >
                        <span className="navbar-toggler-icon" />
                    </button>
                </div>

                <div id="menu-principal" className={`collapse navbar-collapse order-lg-2 ${open ? 'show' : ''}`}>
                    <ul className="navbar-nav gap-2 py-2 py-lg-0 ms-lg-3">
                        {SECTIONS.map((s) => (
                            <li className="nav-item" key={s.id}>
                                <button type="button" className="btn btn-outline-light btn-sm" onClick={() => goTo(s.id)}>
                                    {tr(lang, s.label)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    );
}