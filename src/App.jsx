import { useEffect, useRef, useState } from 'react';
import { Home, FolderKanban, Wallet, ClipboardList, Bell, Eye, EyeOff, RotateCcw, Globe, LogOut } from 'lucide-react';
import { useStore, update, resetar } from './store';
import { Toaster, toast } from './ui';
import Inicio from './pages/Inicio';
import Projetos from './pages/Projetos';
import Projeto from './pages/Projeto';
import Financeiro from './pages/Financeiro';
import Briefings from './pages/Briefings';
import BriefingPublico from './pages/BriefingPublico';
import Portal from './pages/Portal';

function useRota() {
  const ler = () => location.hash.replace(/^#\/?/, '');
  const [r, setR] = useState(ler);
  useEffect(() => {
    const f = () => { setR(ler()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return r.split('/').filter(Boolean);
}

const NAV = [
  ['', 'Início', Home],
  ['projetos', 'Projetos', FolderKanban],
  ['financeiro', 'Financeiro', Wallet],
  ['briefings', 'Briefings', ClipboardList],
];

export default function App() {
  const rota = useRota();
  const s = useStore();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const f = e => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    addEventListener('mousedown', f);
    return () => removeEventListener('mousedown', f);
  }, [menu]);

  // páginas que o cliente abre por link: sem menu do sistema
  if (rota[0] === 'portal') return <><Portal id={rota[1]} /><Toaster /></>;
  if (rota[0] === 'b') return <><BriefingPublico formId={rota[1]} /><Toaster /></>;

  const sec = rota[0] === 'projeto' ? 'projetos' : rota[0] || '';
  const novas = s.respostas.filter(r => !r.lida).length;
  let page;
  if (rota[0] === 'projetos') page = <Projetos />;
  else if (rota[0] === 'projeto') page = <Projeto id={rota[1]} aba={rota[2] || 'geral'} />;
  else if (rota[0] === 'financeiro') page = <Financeiro />;
  else if (rota[0] === 'briefings') page = <Briefings abrir={rota[1]} />;
  else page = <Inicio />;

  return (
    <div className={s.ui.ocultar ? 'hide-money' : ''}>
      <div className="demo-bar">Prévia de demonstração com dados fictícios. <a href="#/portal/jardim">Ver o que o cliente vê</a></div>
      <header className="top">
        <a href="#/" className="logo" aria-label="Início"><img src="./img/logo-branca.png" alt="Giullia Pereira Arquitetura & Feng Shui" /></a>
        <nav aria-label="Seções">
          {NAV.map(([k, t, I]) => <a key={k} href={`#/${k}`} className={sec === k ? 'on' : ''}><I />{t}</a>)}
        </nav>
        <div className="top-r" ref={menuRef}>
          <button className="ico-btn" aria-label={s.ui.ocultar ? 'Mostrar valores' : 'Ocultar valores'} title={s.ui.ocultar ? 'Mostrar valores' : 'Ocultar valores'}
            onClick={() => update(d => { d.ui.ocultar = !d.ui.ocultar; })}>{s.ui.ocultar ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          <a className="ico-btn" href="#/briefings" aria-label="Notificações"><Bell size={18} />{novas > 0 && <i className="dot" />}</a>
          <button className="avatar" onClick={() => setMenu(m => !m)} aria-label="Menu da conta"><img src="./img/giullia-1.webp" alt="" /></button>
          {menu && (
            <div className="menu">
              <div className="who"><b>Giullia Pereira</b><span>Arquitetura & Feng Shui</span></div>
              <a href="#/portal/jardim" onClick={() => setMenu(false)}><Globe />Ver portal do cliente</a>
              <button onClick={() => { resetar(); setMenu(false); toast('Dados de demonstração restaurados'); }}><RotateCcw />Restaurar dados da demonstração</button>
              <button onClick={() => { setMenu(false); toast('Na prévia não tem login 🙂'); }}><LogOut />Sair</button>
            </div>
          )}
        </div>
      </header>
      <main className="page">{page}</main>
      <nav className="tabbar" aria-label="Seções">
        {NAV.map(([k, t, I]) => <a key={k} href={`#/${k}`} className={sec === k ? 'on' : ''}><I />{t}</a>)}
      </nav>
      <Toaster />
    </div>
  );
}
