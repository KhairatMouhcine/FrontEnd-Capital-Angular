import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService, Article } from '../../../services/article.service';
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

@Component({
  standalone: true,
  selector: 'app-article-list',
  imports: [CommonModule, FormsModule, RouterLink, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.css']
})
export class ArticleListComponent implements OnInit {
  articles = signal<Article[]>([]);
  loading = signal<boolean>(false);
  q = signal<string>('');

  constructor(private svc: ArticleService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => { this.articles.set(res || []); this.loading.set(false);console.log(res) },
      error: () => this.loading.set(false)
    });
  }

  filtered(): Article[] {
    const s = this.q().toLowerCase().trim();
    return s ? this.articles().filter(a =>
      (a.titre || '').toLowerCase().includes(s) ||
      (a.type || '').toLowerCase().includes(s)
    ) : this.articles();
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('Supprimer cet article ?')) return;
    this.svc.delete(id).subscribe({ next: () => this.load() });
  }
}
