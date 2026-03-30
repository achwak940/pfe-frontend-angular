import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-yolo-predict',
  templateUrl: './yolo-predict.component.html',
  styleUrls: ['./yolo-predict.component.css']
})
export class YoloPredictComponent {

  selectedFile!: File;
  result: any = null;
  loading = false;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadAndPredict() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.loading = true;

    this.http.post('http://127.0.0.1:8000/predict', formData)
      .subscribe({
        next: (res: any) => {
          this.result = res;
          this.loading = false;

          setTimeout(() => {
            this.drawImageAndBoxes();
          }, 100);
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  drawImageAndBoxes() {
    if (!this.result || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = 'http://127.0.0.1:8000' + this.result.image_url;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      this.result.boxes.forEach((box: any) => {

        const width = box.x2 - box.x1;
        const height = box.y2 - box.y1;

        // 🎯 Couleur selon la gravité
        if (box.gravite > 0.15) {
          ctx.strokeStyle = '#ff6b6b'; // Rouge pour gravité élevée
        } else if (box.gravite > 0.05) {
          ctx.strokeStyle = '#ffa64d'; // Orange pour gravité moyenne
        } else {
          ctx.strokeStyle = '#6b4eff'; // Violet pour gravité faible
        }

        ctx.lineWidth = 3;
        ctx.strokeRect(box.x1, box.y1, width, height);

        // 🔢 Conversion en pourcentage
        const conf = (box.confidence * 100).toFixed(1);
        const grav = (box.gravite * 100).toFixed(1);

        const label = `${box.damage} | Conf:${conf}% | Grav:${grav}%`;

        // Mesure du texte pour la largeur de fond
        ctx.font = 'bold 14px Inter, Arial';
        const textWidth = ctx.measureText(label).width;
        
        // Fond du texte
        ctx.fillStyle = 'rgba(107, 78, 255, 0.85)';
        ctx.fillRect(box.x1, box.y1 - 28, textWidth + 20, 24);

        // Texte
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Inter, Arial';
        ctx.fillText(label, box.x1 + 5, box.y1 - 10);
      });
    };
  }
}