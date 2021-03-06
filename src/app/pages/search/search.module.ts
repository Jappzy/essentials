import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchPage } from './search.page';
import { ThumbnailListModule } from 'src/app/thumbnail-list/thumbnail-list.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ThumbnailListModule,
    RouterModule.forChild([{ path: '', component: SearchPage }])
  ],
  declarations: [
    SearchPage
  ]
})
export class SearchPageModule {}
