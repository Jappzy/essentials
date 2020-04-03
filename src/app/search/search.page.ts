import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss']
})
export class SearchPage implements OnInit {
  recentSearches: string[];
  searchResults$: Observable<any[]>;
  term: string;

  constructor(private toast: ToastController, private postService: PostService) {}

  ngOnInit() {
    this.recentSearches = [];
  }

  onSearch(term: string) {
    this.term = term.toLowerCase().trim();
    this.searchResults$ = this.postService.getPostsBySearchTerm(this.term);
    if (this.term) {
      this.recentSearches.unshift(term);
    }
  }

  searchRecentTerm(term: string) {
    this.term = term.toLowerCase();
    this.searchResults$ = this.postService.getPostsBySearchTerm(this.term);
  }

  clearSearch() {
    this.term = null;
  }

  async removeTerm(index: number) {
    const toasty = await this.toast.create({
      message: 'Search term removed!',
      duration: 1000
    });
    toasty.present();
    this.recentSearches.splice(index, 1);
  }

}
