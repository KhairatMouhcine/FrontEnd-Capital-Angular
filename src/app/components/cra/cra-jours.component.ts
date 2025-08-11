import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CraService, CratJour } from '../../services/cra.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-cra-jours',
  standalone: true, // ✅ nécessaire si tu utilises "imports"
  imports: [FormsModule, CommonModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './cra-jours.component.html'
})
export class CraJoursComponent implements OnInit {
  jours: CratJour[] = [];
  cratId!: number;
  id!: number;

  constructor(private craService: CraService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.cratId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadJours();
    this.route.paramMap.subscribe(params => {
      this.id = Number(params.get('id'));
    });
  }

  loadJours(): void {
    this.craService.getCratJours(this.cratId).subscribe(data => this.jours = data);
  }

  save(): void {
    console.log(this.jours);
    this.craService.updateCratJours(this.jours).subscribe({
      next: () => alert('Jours enregistrés'),
      error: err => console.error(err)
    });
  }
signer(id: number) {
  fetch(`https://localhost:9443/api/crat/signer/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erreur API : ${response.status}`);
    }
    alert("✅ Signer avec succès !");
    this.router.navigate(['/Mission']); 
  })
  .catch(error => {
    console.error("❌ Erreur lors de la signature :", error);
    alert("❌ Échec de la signature !");
  });
}


clientDenomination: string = '';
  profil: string = '';
async downloadCra(): Promise<void> {
  console.log('CRAT ID depuis URL:', this.cratId);

  try {
    // 1. On récupère les données AVANT de générer le HTML
    const response = await fetch(`https://localhost:9443/api/crat/giveInfoCrat/${this.cratId}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    const data = await response.json();
    console.log('Résultat de l’API :', data);

    // Stocker les données pour le HTML
    this.clientDenomination = data.clientDenomination;
    this.profil = data.profil;

    // 2. Générer le HTML une fois que les données sont prêtes
    const contenu = this.generateHtmlCra(this.clientDenomination, this.profil);

    // 3. Crée un conteneur temporaire dans le DOM
    const container = document.createElement('div');
    container.innerHTML = contenu;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    // 4. Générer le PDF
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save(`cra_${this.cratId}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Erreur lors de l’appel API :', error);
  }
}



  generateHtmlCra(clientDenomination: string, profil: string): string {
    const baseUrl = window.location.origin;
    const total = this.jours.reduce((acc, j) => {
  if (j.am) acc += 1;
  if (j.pm) acc += 1;
  return acc;
}, 0);

    const rows = this.jours.map(jour => {
      const day = new Date(jour.date).getDate();
      const amClass = jour.am ? '' : 'highlight';
      const pmClass = jour.pm ? '' : 'highlight';
      return `
        <tr>
          <td>${day}</td>
          <td>${jour.jourSemaine}</td>
          <td class="${amClass}">${jour.am ? 1 : 0}</td>
          <td class="${pmClass}">${jour.pm ? 1 : 0}</td>
          <td></td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>État Mensuel d'Activité</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 40px; background-color: #f8f9fa; color: #212529; }
    .highlight { background-color: #f4b084 !important; }
    .header-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header-logos img { height: 50px; }
    table { margin-top: 20px; border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #dee2e6; padding: 4px; }
    th { background-color: #e9ecef; }
    .footer-notes { font-size: 12px; margin-top: 20px; color: #6c757d; }
    .signature-section td { border: 3px solid #000; padding: 10px; }
  </style>
</head>
<body>
  <div class="header-logos">
    <img src="${baseUrl}/assets/img/LOGO.png" alt="Logo Cercle">
  </div>

  <h2 class="text-center">ÉTAT MENSUEL D'ACTIVITÉ</h2>

  <table class="table table-bordered w-100">
    <tr>
      <td>Année: <strong>${this.jours.length ? new Date(this.jours[0].date).getFullYear() : ''}</strong></td>
      <td>Mois: <strong>${this.jours.length ? new Date(this.jours[0].date).getMonth() + 1 : ''}</strong></td>
    </tr>
    <tr>
      <td>Client: <strong>${clientDenomination}</strong></td>
      <td>Collaborateur: <strong>Capital Conseil & Technologie</strong></td>
      <td>Presetataire: ${profil}</td>
    </tr>
  </table>

  <table class="table table-bordered table-sm w-100 text-center">
    <thead>
      <tr><th>Jour</th><th>Journée</th><th>AM</th><th>PM</th><th>Commentaires</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="4"><strong>TOTAL</strong></td><td><strong>${total}</strong></td></tr>
    </tfoot>
  </table>

  <div class="footer-notes">
    <p>
      Ce document est établi sur la base de calcul d’un horaire hebdomadaire forfaitaire.<br>
      Toute heure supplémentaire déclarée doit faire l’objet d’un accord écrit par l’employeur.<br>
      Ce document est à faire viser par votre responsable.
    </p>
  </div>

  <table class="w-100 mt-4 signature-section">
    <tr>
      <td style="width:40%;">
        <strong>Codification :</strong><br><br>
        <table class="table table-borderless table-sm w-100">
          <tr><td>1</td><td>Présent</td></tr>
          <tr><td>M</td><td>Maladie</td></tr>
          <tr><td>CP</td><td>Congés Payés</td></tr>
          <tr><td>CSS</td><td>Congés Sans Solde</td></tr>
          <tr><td>RTT</td><td>Réduction du Temps de Travail</td></tr>
          <tr><td>FOR</td><td>Formation</td></tr>
          <tr><td>CEF</td><td>Congés Evènements Familiaux</td></tr>
        </table>
      </td>
      <td style="width:30%; text-align: center;">
        <strong>Signature CLIENT</strong><br><br><br><br>
        <strong>Date: ${new Date().toLocaleDateString()}</strong>
      </td>
      <td style="width:50%; text-align:center; padding-top: 10px; padding-bottom: 10px;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <strong style="font-size: 14px;">Signature COLLABORATEUR</strong>
          <img src="${baseUrl}/assets/img/signature.png" alt="Signature Collaborateur" style="width: 140px; height: auto;" />
          <strong style="font-size: 13px; margin-top: 5px;">
            Date : ${new Date().toLocaleDateString('fr-FR')}
          </strong>
        </div>
      </td>

    </tr>
  </table>
</body>
</html>
`;
  }
}
