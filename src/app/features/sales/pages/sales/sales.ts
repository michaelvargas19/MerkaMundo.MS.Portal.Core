import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { OnInit } from '@angular/core';
import { DailySales } from '../../../../shared/model/sales/daily-sales';
import { ListDailySales } from '../list-daily-sales/list-daily-sales';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit, AfterViewInit {

  //@ViewChild(ListDailySales) listDailySales!: ListDailySales;
  
  // Columnas para el grid de Angular Material
  displayedColumns: string[] = ['id', 'time', 'client', 'itemsCount', 'paymentMethod', 'isDelivery', 'total', 'actions'];

  // Datos simulados para el resumen del día
  public todaySales: DailySales[] = [];

  ngOnInit(): void {
    
    var sales = <DailySales[]>[
      { Id: 1, Client: 'Carlos Pérez', ItemsCount: 3, Total: 45000, PaymentMethod: 'Efectivo', IsDelivery: false, Time: '08:30 AM' },
      { Id: 2, Client: 'María Gómez', ItemsCount: 1, Total: 120000, PaymentMethod: 'Tarjeta', IsDelivery: true, Time: '09:15 AM' },
      { Id: 3, Client: 'Juan Rodríguez', ItemsCount: 5, Total: 85500, PaymentMethod: 'Transferencia', IsDelivery: true, Time: '10:05 AM' },
      { Id: 4, Client: 'Ana Martínez', ItemsCount: 2, Total: 32000, PaymentMethod: 'Efectivo', IsDelivery: false, Time: '10:40 AM' },
    ];         
    
    this.todaySales = sales;
            
    }

    constructor(private router: Router) {}

  // Métrica 1: Total facturado hoy
  get totalSalesAmount(): number {
    
    return this.todaySales.reduce((acc, sale) => acc + Number(sale.Total?.toString()), 0);
  }

  // Métrica 2: Cantidad total de domicilios
  get totalDeliveries(): number {
    return this.todaySales.filter(sale => sale.IsDelivery).length;
  }

  // Acciones rápidas
  openCreateSaleModal(): void {
    this.router.navigate(['/createSale']);
  }

  openSearchSaleModal(): void {
    
  }


  ngAfterViewInit(): void {

    setTimeout(() => {
      /*if (this.listDailySales) {
          this.listDailySales.load(this.todaySales);
      }*/
    }, 0);

  }
  
}
