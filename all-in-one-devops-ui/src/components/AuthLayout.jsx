import BrandMark from "./BrandMark";

export default function AuthLayout({ children }) {
  return (
    <div className="login-page">
      <div className="login-circle login-circle-left"></div>
      <div className="login-circle login-circle-right"></div>

      <div className="login-glow login-glow-left"></div>
      <div className="login-glow login-glow-right"></div>

      <header className="login-header">
        <div className="login-brand">
          <BrandMark
            className="h-9 w-9 rounded-xl sm:h-[52px] sm:w-[52px] sm:rounded-[15px]"
            iconClassName="h-5 w-5 sm:h-8 sm:w-8"
          />

          <div className="login-brand-name">
            AllInOne<span>DevOps</span>
          </div>
        </div>

        <nav className="login-nav">
          <span>Build</span>
          <b>•</b>
          <span>Deploy</span>
          <b>•</b>
          <span>Monitor</span>
          <b>•</b>
          <span>Innovate</span>
        </nav>
      </header>

      <main className="login-main">
        <section className="login-card">
          <div className="login-card-content">{children}</div>
        </section>

        <div className="login-quote">
          <p>
            "Automate today
            <br />
            for a better tomorrow"
          </p>

          <div className="quote-line"></div>
        </div>
      </main>

      <div className="login-waves">
        <div className="login-wave wave-back"></div>
        <div className="login-wave wave-middle"></div>
        <div className="login-wave wave-front"></div>
      </div>

      <footer className="login-footer">
        <span>© 2026 AllInOneDevOps. All rights reserved.</span>

        <div className="footer-links">
          <button>Privacy</button>
          <i>|</i>
          <button>Terms</button>
          <i>|</i>
          <button>Help</button>
        </div>
      </footer>
    </div>
  );
}
