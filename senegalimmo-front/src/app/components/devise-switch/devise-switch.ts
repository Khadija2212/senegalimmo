import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Devise, DeviseService } from '../../services/devise';

@Component({
  selector: 'app-devise-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devise-switch.html',
  styleUrl: './devise-switch.css'
})
export class DeviseSwitch {
  options: { value: Devise; label: string }[] = [
    { value: 'FCFA', label: 'FCFA' },
    { value: 'EUR', label: '€' },
    { value: 'USD', label: '$' },
  ];

  constructor(public service: DeviseService) {}
}