// EduHub UI Kit — shared components
const { useState } = React;

function Button({ variant, size, children, ...rest }) {
  const cls = ['eh-btn'];
  if (variant === 'filled') cls.push('eh-btn--filled');
  if (variant === 'brand') cls.push('eh-btn--brand');
  if (size === 'sm') cls.push('eh-btn--sm');
  return <button className={cls.join(' ')} {...rest}>{children}</button>;
}

function Avatar({ initials, onClick }) {
  return <div className="eh-avatar" onClick={onClick}>{initials}</div>;
}

function AccountMenu({ onNavigate, onLogout }) {
  const items = ['Profile', 'My Certificates', 'Programs', 'Experts', 'FAQ'];
  return (
    <div className="eh-menu light" onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => (
        <div key={it} className={'eh-menu__item' + (i === 0 ? ' sel' : '')} onClick={() => onNavigate && onNavigate(it)}>{it}</div>
      ))}
      <div className="eh-menu__item" onClick={onLogout}>Logout</div>
    </div>
  );
}

function Header({ loggedIn, user, onLogin, onRegister, onLogout, onHome, lang, setLang }) {
  const [menuOpen, setMenuOpen] = useState(false);
  React.useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  return (
    <header className="eh-header">
      <div className="container eh-header__inner">
        <div className="eh-logo" onClick={onHome}>
          <img className="ring" src="../../assets/oc-logo.svg" alt="opencampus" />
          <img className="word" src="../../assets/eduhub-logo.svg" alt="EduHub" />
        </div>
        <div className="eh-header__right">
          <div className="eh-lang">
            <button className={lang === 'EN' ? 'on' : 'off'} onClick={() => setLang('EN')}>EN</button>
            <span style={{opacity:.5}}>|</span>
            <button className={lang === 'DE' ? 'on' : 'off'} onClick={() => setLang('DE')}>DE</button>
          </div>
          {loggedIn ? (
            <div style={{position:'relative'}}>
              <Avatar initials={user.initials} onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} />
              {menuOpen && <AccountMenu onNavigate={() => setMenuOpen(false)} onLogout={() => { setMenuOpen(false); onLogout(); }} />}
            </div>
          ) : (
            <React.Fragment>
              <Button onClick={onLogin}>Login</Button>
              <Button variant="filled" onClick={onRegister}>Register</Button>
            </React.Fragment>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="eh-footer">
      <div className="container">
        <h3 style={{margin:0,lineHeight:1.2}}>
          <span className="a">EDU HUB</span><br /><span className="b">by opencampus.sh</span>
        </h3>
        <div className="eh-footer__links">
          <a href="#">Imprint</a>
          <a href="#">Privacy</a>
          <a href="#">FAQ</a>
          <a href="#">Newsletter</a>
        </div>
        <div className="eh-footer__bottom">
          <span>© 2010 — 2026</span>
          <div className="eh-footer__social">
            <img src="../../assets/social-mastodon.svg" alt="Mastodon" />
            <img src="../../assets/social-linkedin.svg" alt="LinkedIn" />
            <img src="../../assets/social-instagram.svg" alt="Instagram" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function LoginModal({ mode, onClose, onSubmit }) {
  const isRegister = mode === 'register';
  return (
    <div className="eh-overlay" onClick={onClose}>
      <div className="eh-modal light" onClick={(e) => e.stopPropagation()}>
        <button className="eh-modal__close" onClick={onClose}>×</button>
        <h2>{isRegister ? 'Join EduHub' : 'Welcome back'}</h2>
        <p>{isRegister ? 'Create your account and start hacking your life.' : 'Log in to continue learning.'}</p>
        {isRegister && (
          <div className="eh-field"><label>Name</label><input defaultValue="Mia Hansen" /></div>
        )}
        <div className="eh-field"><label>Email</label><input defaultValue="mia@example.com" /></div>
        <div className="eh-field"><label>Password</label><input type="password" defaultValue="••••••••" /></div>
        <Button variant="brand" style={{width:'100%',justifyContent:'center',marginTop:8}} onClick={onSubmit}>
          {isRegister ? 'Create account' : 'Login'}
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { Button, Avatar, AccountMenu, Header, Footer, LoginModal });
