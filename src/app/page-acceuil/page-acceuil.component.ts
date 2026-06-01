import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface Step {
  number: string;
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-page-acceuil',
  templateUrl: './page-acceuil.component.html',
  styleUrls: ['./page-acceuil.component.css']
})
export class PageAcceuilComponent implements OnInit, AfterViewInit, OnDestroy {

  robotMessages = [
    '👋 Bienvenue dans SatIA !',
    '🔍 Analyse IA ultra-précise',
    '💡 Estimation en temps réel',
    '🚗 Optimisé pour votre véhicule',
  ];
  currentMessageIndex = 0;
  robotMessage = this.robotMessages[0];
  showMessage = true;

  isDarkTheme = false;
  isScrolled = false;
  isMobileMenuOpen = false;
  activeNav = 'accueil';

  robotImageUrl = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';

  statsTargets = [98, 2, 50];
  statsDisplayed = [0, 0, 0];

  features: Feature[] = [
    {
      icon: '🔍',
      title: 'Détection IA',
      desc: "Analyse visuelle ultra-précise des dommages en moins de 0.5s grâce à notre modèle entraîné sur 1M+ d'images.",
    },
    {
      icon: '💰',
      title: 'Estimation Coût',
      desc: "Devis instantané avec précision à 98% basé sur les tarifs réels des garages de votre région.",
    },
    {
      icon: '⏱️',
      title: 'Durée Réparation',
      desc: 'Calcul intelligent du temps nécessaire selon le type de dommage et la disponibilité des pièces.',
    },
    {
      icon: '🎯',
      title: 'Recommandations',
      desc: "Solutions personnalisées et priorisées pour votre véhicule selon l'urgence des réparations.",
    },
  ];

  steps: Step[] = [
    {
      number: '01',
      icon: '📷',
      title: 'Photographiez',
      desc: 'Prenez une photo de la zone endommagée depuis votre smartphone ou appareil photo.',
    },
    {
      number: '02',
      icon: '🤖',
      title: 'Analyse IA',
      desc: 'Notre IA analyse en moins de 2 secondes et génère un rapport de dommages complet.',
    },
    {
      number: '03',
      icon: '📊',
      title: 'Votre rapport',
      desc: 'Recevez une estimation détaillée des coûts et des recommandations de réparation claires.',
    },
  ];

  private messageInterval?: ReturnType<typeof setInterval>;
  private observer?: IntersectionObserver;

  constructor() { }

  ngOnInit(): void {
    this.startMessageRotation();
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
    this.animateStats();
  }

  ngOnDestroy(): void {
    if (this.messageInterval) clearInterval(this.messageInterval);
    if (this.observer) this.observer.disconnect();
  }

  private startMessageRotation(): void {
    this.messageInterval = setInterval(() => {
      this.showMessage = false;
      setTimeout(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.robotMessages.length;
        this.robotMessage = this.robotMessages[this.currentMessageIndex];
        this.showMessage = true;
      }, 400);
    }, 3500);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  scrollTo(id: string): void {
    this.isMobileMenuOpen = false;
    this.activeNav = id;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';
  }

  private setupScrollAnimations(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    
    document.querySelectorAll('.aos').forEach((el) => {
      this.observer!.observe(el);
    });
  }

  private animateStats(): void {
    const total = 80;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / total, 3);
      this.statsDisplayed = this.statsTargets.map((t) => Math.round(t * ease));
      if (step >= total) clearInterval(timer);
    }, 20);
  }
}