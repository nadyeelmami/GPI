import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { jsPDF } from 'jspdf';
import { BulletinComponent } from '../../../shared/bulletin/bulletin.component';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, BulletinComponent],
  templateUrl: './student-grades.component.html',
  styleUrl: './student-grades.component.css'
})
export class StudentGradesComponent implements OnInit {
  currentUser: any = null;
  bulletin: any = null;
  isLoading = true;
  hasBulletin = false;
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.fetchBulletin();
      } catch (e) {
        console.error('Error parsing user data in grades init', e);
      }
    }

    // Sync with backend to get latest user info
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        this.fetchBulletin();
      },
      error: (err) => {
        console.error('Error syncing user details in grades init', err);
        this.isLoading = false;
      }
    });
  }

  fetchBulletin(): void {
    if (!this.currentUser || !this.currentUser.id) {
      this.isLoading = false;
      return;
    }

    const isPublished = this.currentUser.bulletin_publie === 1 || this.currentUser.bulletin_publie === true;
    if (!isPublished) {
      this.hasBulletin = false;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.authService.getBulletin(this.currentUser.id).subscribe({
      next: (res) => {
        this.bulletin = res;
        this.hasBulletin = true;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching student bulletin', err);
        this.hasBulletin = false;
        this.isLoading = false;
      }
    });
  }

  exportPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Preload logo and then draw PDF content
    this.getBase64ImageFromURL('/logo-iscae.png')
      .then((base64Img) => {
        this.generatePDFContent(doc, base64Img);
      })
      .catch((err) => {
        console.error('Could not load official logo, generating PDF without logo', err);
        // Try fallback JPEG logo
        this.getBase64ImageFromURL('/logo_iscae.jpeg')
          .then((base64ImgJpg) => {
            this.generatePDFContent(doc, base64ImgJpg);
          })
          .catch((err2) => {
            console.error('Could not load fallback logo either, generating text-only PDF', err2);
            this.generatePDFContent(doc, null);
          });
      });
  }

  private getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = url;
    });
  }

  private generatePDFContent(doc: jsPDF, logoBase64: string | null): void {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // --- 1. HEADER SECTION ---
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 15, 22, 22);
    }
    
    doc.setTextColor(15, 23, 42); // Dark slate
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('République Islamique de Mauritanie', 115, 19, { align: 'center' });
    
    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(8);
    doc.text('Honneur - Fraternité - Justice', 115, 23, { align: 'center' });
    
    // School Title (bold, blue)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(21, 96, 189); // ISCAE Blue
    doc.text("L'Institut Supérieur de Comptabilitát et d'Administration des Entreprises (ISCAE)", 115, 29, { align: 'center' });
    
    // Relevé title (bold, dark grey)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('RELEVÉ DE NOTES ET BULLETIN SEMESTRIEL', 115, 36, { align: 'center' });
    
    // Separator line
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.line(margin, 42, pageWidth - margin, 42);
    doc.line(margin, 43, pageWidth - margin, 43);
    
    // --- 2. STUDENT DETAILS BLOCK ---
    doc.setFillColor(248, 250, 252); // Light Slate
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 48, pageWidth - (margin * 2), 26, 3, 3, 'FD');
    
    doc.setTextColor(71, 85, 105); // Slate-600 (Labels)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("Nom de l'étudiant :", 20, 54);
    doc.text("Email académique :", 20, 60);
    doc.text("Numéro Matricule :", 110, 54);
    doc.text("Classe & Niveau :", 110, 60);
    
    doc.setTextColor(15, 23, 42); // Slate-900 (Values)
    doc.setFont('Helvetica', 'normal');
    doc.text(this.bulletin?.student?.name || '', 55, 54);
    doc.text(this.bulletin?.student?.email || '', 55, 60);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(21, 96, 189); // Matricule in Blue
    doc.text(this.bulletin?.student?.matricule || '-', 142, 54);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const className = this.bulletin?.student?.classes?.[0]?.nom_classe || 'Non assigné';
    const level = this.bulletin?.student?.classes?.[0]?.niveau || '-';
    doc.text(`${className} (${level})`, 142, 60);
    
    // --- 3. GRADES TABLE ---
    const tableY = 82;
    doc.setFillColor(241, 245, 249); // Header background
    doc.rect(margin, tableY, pageWidth - (margin * 2), 8, 'F');
    
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, tableY, pageWidth - margin, tableY);
    doc.line(margin, tableY + 8, pageWidth - margin, tableY + 8);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Matière', 18, tableY + 5.5);
    doc.text('Coefficient', 80, tableY + 5.5, { align: 'center' });
    doc.text('Devoir', 100, tableY + 5.5, { align: 'center' });
    doc.text('Examen', 120, tableY + 5.5, { align: 'center' });
    doc.text('Moyenne', 140, tableY + 5.5, { align: 'center' });
    doc.text('Pondérée', 160, tableY + 5.5, { align: 'center' });
    doc.text('Enseignant', 175, tableY + 5.5);
    
    let currentY = tableY + 8;
    const rowHeight = 8;
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    const notes = this.bulletin?.notes || [];
    notes.forEach((n: any) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);
      
      doc.setFont('Helvetica', 'bold');
      doc.text(n.nom_matiere || '', 18, currentY + 5.5);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(String(n.coefficient || '0'), 80, currentY + 5.5, { align: 'center' });
      
      const devoirVal = n.note_devoir !== null && n.note_devoir !== undefined ? n.note_devoir.toFixed(2) : '-';
      doc.text(String(devoirVal), 100, currentY + 5.5, { align: 'center' });

      const examenVal = n.note_examen !== null && n.note_examen !== undefined ? n.note_examen.toFixed(2) : '-';
      doc.text(String(examenVal), 120, currentY + 5.5, { align: 'center' });

      const gradeVal = n.moyenne !== null && n.moyenne !== undefined ? n.moyenne.toFixed(2) : '-';
      doc.setFont('Helvetica', 'bold');
      doc.text(String(gradeVal), 140, currentY + 5.5, { align: 'center' });
      
      const weightedVal = n.moyenne !== null && n.moyenne !== undefined ? (n.moyenne * n.coefficient).toFixed(2) : '-';
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(21, 96, 189);
      doc.text(String(weightedVal), 160, currentY + 5.5, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(n.prof_name || 'Non assigné', 175, currentY + 5.5);
      
      currentY += rowHeight;
    });
    
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, tableY, pageWidth - (margin * 2), (notes.length * rowHeight) + 8, 'S');
    
    // --- 4. SUMMARY & SIGNATURE BLOCK ---
    const summaryY = currentY + 12;
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, summaryY, 95, 22, 2, 2, 'FD');
    
    doc.setTextColor(21, 96, 189);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Résultats Globaux', margin + 5, summaryY + 6);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Moyenne Générale :', margin + 5, summaryY + 12);
    doc.text('Mention obtenue :', margin + 5, summaryY + 17);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    const moyG = this.bulletin?.moyenneG !== null && this.bulletin?.moyenneG !== undefined ? this.bulletin.moyenneG.toFixed(2) : '-';
    doc.text(`${moyG} / 20`, margin + 40, summaryY + 12);
    doc.text(this.bulletin?.mention || 'Pas de notes', margin + 40, summaryY + 17);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Fait à Nouakchott, le ${this.todayStr}`, pageWidth - margin, summaryY + 4, { align: 'right' });
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('La Direction des Études', pageWidth - margin, summaryY + 10, { align: 'right' });
    doc.line(pageWidth - margin - 38, summaryY + 11.5, pageWidth - margin, summaryY + 11.5);
    
    doc.setDrawColor(203, 213, 225);
    doc.rect(pageWidth - margin - 45, summaryY + 15, 45, 18, 'S');
    
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Cachet Officiel', pageWidth - margin - 22.5, summaryY + 25, { align: 'center' });
    
    const filename = `Bulletin_${this.bulletin?.student?.name?.replace(/\s+/g, '_') || 'etudiant'}.pdf`;
    doc.save(filename);
  }

  onToggleSidebar(): void {
    window.dispatchEvent(new Event('toggle-sidebar'));
  }
}
