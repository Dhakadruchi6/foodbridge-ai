import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import AuthProvider from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodBridge AI | Intelligent Food Redistribution",
  description: "Eliminating food waste through AI-powered matching. Connect donors with NGOs instantly.",
  keywords: ["food waste", "AI matching", "NGO", "donation", "sustainability"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", geist.variable)}>
      <body className={cn(
        inter.className,
        "min-h-screen bg-background antialiased selection:bg-primary/20 selection:text-primary"
      )}>
        {/* Background Grids & Blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/20 dark:bg-grid-white/5 pointer-events-none opacity-50" />
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full animate-float opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-full animate-float opacity-30" style={{ animationDelay: '1.5s' }} />
        </div>

        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />

            <main className="relative pt-16">
              {children}
            </main>
          </ThemeProvider>
        </AuthProvider>

        <footer className="border-t bg-white relative z-10 py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center space-x-2">
                <div className="bg-primary p-2 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <span className="font-black text-xl tracking-tight">FoodBridge AI</span>
              </div>
              <p className="text-gray-600 max-w-sm leading-relaxed font-medium">
                The world's most advanced platform for food recovery. Using AI to ensure every surplus meal finds a home.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-slate-800 tracking-tight">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600 font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API for Developers</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-slate-800 tracking-tight">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600 font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>© 2024 FoodBridge AI Technology Group</span>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-slate-600">Twitter</a>
              <a href="#" className="hover:text-slate-600">LinkedIn</a>
              <a href="#" className="hover:text-slate-600">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
