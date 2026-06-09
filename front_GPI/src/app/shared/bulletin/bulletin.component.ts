import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bulletin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulletin.component.html',
  styleUrl: './bulletin.component.css'
})
export class BulletinComponent implements OnInit {
  @Input() bulletin: any = null;
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  ngOnInit(): void {}
}
