<template>
  <main class="home-page">
    <section class="hero">
      <div class="hero__badge">
        <span class="hero__badge-dot" />
        Leitor Web Avançado
      </div>
      <h1 class="hero__title">
        Leia seus livros.<br />
        <span class="hero__title-accent">Com vida.</span>
      </h1>
      <p class="hero__subtitle">
        Suporte a PDF e EPUB com virada de página realista,
        diretamente no seu navegador. Sem upload para servidores.
      </p>
      <NuxtLink to="/reader" class="hero__cta" id="cta-open-reader">
        Abrir Leitor
      </NuxtLink>
    </section>

    <section class="features">
      <div class="feature-card">
        <span class="feature-card__icon">📄</span>
        <h2>PDF & EPUB</h2>
        <p>Motor separado para cada formato com renderização nativa via Canvas.</p>
      </div>
      <div class="feature-card">
        <span class="feature-card__icon">✨</span>
        <h2>Page Curl</h2>
        <p>Animação cilíndrica com deformação cônica calculada em tempo real.</p>
      </div>
      <div class="feature-card">
        <span class="feature-card__icon">🔒</span>
        <h2>100% Privado</h2>
        <p>Seus arquivos nunca saem do seu dispositivo. Zero uploads.</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
  gap: 4rem;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  max-width: 680px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  background: rgba(124, 106, 247, 0.15);
  border: 1px solid rgba(124, 106, 247, 0.3);
  font-size: 0.8rem;
  color: var(--color-accent);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero__badge-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.hero__title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.hero__title-accent {
  background: linear-gradient(135deg, #7c6af7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 500px;
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.9rem 2.2rem;
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 0 32px rgba(124, 106, 247, 0.35);
}

.hero__cta:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 0 48px rgba(124, 106, 247, 0.5);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 800px;
}

.feature-card {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, transform 0.2s;
}

.feature-card:hover {
  border-color: rgba(124, 106, 247, 0.5);
  transform: translateY(-2px);
}

.feature-card__icon {
  font-size: 1.8rem;
}

.feature-card h2 {
  font-size: 1rem;
  font-weight: 600;
}

.feature-card p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
