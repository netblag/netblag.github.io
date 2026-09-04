import MessageForm from '../components/MessageForm'
import { useApp } from '../lib/app-context'
import { copy } from '../lib/i18n'

export default function Home() {
  const { language } = useApp()
  const t = copy[language]
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-meta">
            <span className="accent-text">{t.hero.eyebrow}</span>
            <span className="status"><i />{t.hero.status}</span>
          </div>
          <h1 className="hero-title"><span>ASHKAN</span><span className="outline">AHMADI</span></h1>
          <div className="hero-bottom">
            <p className="hero-intro">{t.hero.intro}</p>
            <div className="hero-side"><p>{t.hero.side}</p><a href="#work" className="text-link">{t.hero.link}<b>↘</b></a></div>
          </div>
        </section>

        <section id="about" className="section"><div className="section-grid"><div className="section-number">01</div><div>
          <SectionLabel main={t.about.label} secondary={t.about.secondary} />
          <p className="about-large">{t.about.large}</p>
          <div className="two-columns"><p>{t.about.a}</p><p>{t.about.b}</p></div>
        </div></div></section>

        <section id="work" className="section"><div className="section-grid"><div className="section-number">02</div><div>
          <SectionLabel main={t.work.label} secondary={t.work.secondary} />
          <div className="projects">
            <Project n="01" data={t.projects.data} />
            <Project n="02" data={t.projects.ml} />
            <Project n="03" data={t.projects.predictive} />
          </div>
        </div></div></section>

        <section className="section"><div className="section-grid"><div className="section-number">03</div><div>
          <SectionLabel main={t.software.label} secondary={t.software.secondary} />
          <div className="apps">
            <AppCard title="Darooyar" text={t.apps.darooyar} number="01" />
            <AppCard title="Lexi Book" text={t.apps.lexibook} number="02" />
          </div>
        </div></div></section>

        <section id="stack" className="section"><div className="section-grid"><div className="section-number">04</div><div>
          <SectionLabel main={t.stack.label} secondary={t.stack.secondary} />
          <div className="stack-list">
            <StackRow title={t.stack.rows.data}>Python · Pandas · NumPy · Jupyter</StackRow>
            <StackRow title={t.stack.rows.ml}>Scikit-learn · XGBoost · SHAP</StackRow>
            <StackRow title={t.stack.rows.development}>Kotlin · Java · Python · Android</StackRow>
            <StackRow title={t.stack.rows.tools}>Git · GitHub · Docker · FastAPI · VS Code</StackRow>
          </div>
        </div></div></section>

        <section className="section"><div className="section-grid"><div className="section-number">05</div><div>
          <SectionLabel main={t.education.label} secondary={t.education.secondary} />
          <div className="education-list">
            <div className="education-row"><div className="education-date">{t.education.degree}</div><div><h2>{t.education.degreeTitle}</h2><p>{t.education.degreeText}</p></div></div>
            <div className="education-row"><div className="education-date">{t.education.focus}</div><div><h2>{t.education.focusTitle}</h2><p>{t.education.focusText}</p></div></div>
          </div>
        </div></div></section>

        <section id="contact" className="contact">
          <div className="contact-head"><span className="section-number">06</span><span className="accent-text">{t.contact.label}</span></div>
          <h2 className="contact-title" dangerouslySetInnerHTML={{ __html: t.contact.title }} />
          <MessageForm text={t.contact.text} language={language} />
        </section>
      </main>
      <footer className="footer"><span>{t.footer}</span><a href="https://github.com/netblag" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </>
  )
}

function SectionLabel({ main, secondary }: { main: string, secondary: string }) { return <div className="section-label"><span>{main}</span><span className="secondary">{secondary}</span></div> }
function Project({ n, data }: { n: string, data: { title: string, text: string, tags: readonly string[] } }) { return <a className="project" href="https://github.com/netblag" target="_blank" rel="noreferrer"><div className="project-number">{n}</div><div className="project-content"><h2>{data.title}</h2><p>{data.text}</p><div className="tags">{data.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="project-arrow">↗</div></a> }
function AppCard({ title, text, number }: { title: string, text: string, number: string }) { return <article className="app"><div className="app-top"><span>Android · {number}</span><span>2026</span></div><div className="app-main"><h2>{title}</h2><p>{text}</p></div><div className="app-stack">Kotlin · Android · Room</div></article> }
function StackRow({ title, children }: { title: string, children: string }) { return <div className="stack-row"><span className="stack-title">{title}</span><span>{children}</span></div> }
