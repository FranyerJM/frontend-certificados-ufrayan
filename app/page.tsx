import { CertificateGenerator } from "@/components/certificate-generator"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Ufrayan</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Generador de Certificados</h1>
            </div>
            <div className="text-sm text-muted-foreground"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CertificateGenerator />
      </main>

      <footer className="border-t border-border bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <p>© 2025 Sistema de creación de certificados. Hecho con ❤️, para mi mami de su inge.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
