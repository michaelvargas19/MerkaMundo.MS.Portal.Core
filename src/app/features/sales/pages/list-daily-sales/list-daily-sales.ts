import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { DailySales } from '../../../../shared/model/sales/daily-sales';

@Component({
  selector: 'app-list-daily-sales',
  standalone: false,
  templateUrl: './list-daily-sales.html',
  styleUrl: './list-daily-sales.css',
})
export class ListDailySales implements OnInit {

    public currentDate: Date = new Date();
  
    // Columnas para el grid de Angular Material
    public displayedColumns: string[] = ['id', 'time', 'client', 'itemsCount', 'paymentMethod', 'isDelivery', 'total', 'actions'];
  
    public todaySalesSignal = signal<DailySales[]>([]);
    public salesCount = computed(() => this.todaySalesSignal().length);

    // Datos simulados para el resumen del día
    @Input() todaySales: DailySales[] = [];

    @Input() set sales(data: DailySales[]) {
      if (data) {
        this.todaySalesSignal.set(data);
      }
    }



    ngOnInit(): void {
      
    }

    load(sale: DailySales[]): void {
      
      if (!sale) return;

      this.todaySales = sale;
    }

    viewSaleDetail(sale: DailySales): void {

    }

}
    