import { Injectable } from '@angular/core';
import { AngularFirestore, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, distinct } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions
  ) { }

  snapshotsToArray(snapshots: QuerySnapshot<DocumentData>) {
    return snapshots.docs.map((doc: DocumentData) => {
      return { id: doc.id, ...doc.data() };
    });
  }

  getFirst(sort: string) {
    return this.firestore.collection('posts',
        ref => ref.orderBy(sort, 'desc').limit(6)
      ).get().pipe(map(this.snapshotsToArray)).toPromise();
  }

  getMore(sort: string, last: any) {
    return this.firestore.collection('posts', ref =>
      ref.orderBy(sort, 'desc').startAfter(last[sort]).limit(4)
    ).get().pipe(map(this.snapshotsToArray)).toPromise();
  }

  getFirstFeatured() {
    return this.firestore
      .collection('posts', ref =>
        ref.where('featured', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(6)
      ).get().pipe(map(this.snapshotsToArray)).toPromise();
  }

  getMoreFeatured(lastPost: any) {
    return this.firestore
      .collection('posts', ref =>
        ref.where('featured', '==', true)
          .orderBy('createdAt', 'desc')
          .startAfter(lastPost.createdAt)
          .limit(4)
      ).get().pipe(map(this.snapshotsToArray)).toPromise();
  }

  getPostById(id: string) {
    return this.firestore.doc(`posts/${id}`).valueChanges();
  }

  getPostsByUserId(id: string) {
    return this.firestore.collection('posts',
      ref => ref.where('userId', '==', id).limit(40)
    ).valueChanges({ idField: 'id' });
  }

  getPostsBySearchTerm(term: string = '') {
    const searchTerm = term.toLowerCase().trim();
    if (!searchTerm) return of([]);

    const title$ = this.firestore.collection('posts',
      ref => ref
        .where('lowerCaseTitle', '>=', searchTerm)
        .where('lowerCaseTitle', '<=', searchTerm + 'z')
        .limit(40)
      ).valueChanges({ idField: 'id' });

    const company$ = this.firestore.collection('posts',
      ref => ref
        .where('lowerCaseCompany', '>=', searchTerm)
        .where('lowerCaseCompany', '<=', searchTerm + 'z')
        .limit(40)
      ).valueChanges({ idField: 'id' });

    return combineLatest([title$, company$])
      .pipe(
        switchMap(([titles, companys]) => of([...titles, ...companys])),
        distinct((post: any) => post.id)
      );
  }

  createPost(post: any) {
    return this.firestore.collection('posts').add(post);
  }

  deletePost(postId: string) {
    return this.firestore.doc(`posts/${postId}`).delete();
  }

  likePost(postId: string, userId: string, likedIds: string[], followerIds: string[]) {
    return this.functions
      .httpsCallable('like')({ doc: `posts/${postId}`, userId, likedIds, followerIds })
      .toPromise();
  }

  unlikePost(postId: string, userId: string) {
    return this.functions
      .httpsCallable('unlike')({ doc: `posts/${postId}`, userId })
      .toPromise();
  }

  report(obj: any) {
    return this.firestore.collection('reports').add(obj);
  }

  addFollower(doc: string, newId: string, oldId?: string) {
    return this.functions
      .httpsCallable('addFollower')({ doc, newId, oldId })
      .toPromise();
  }

  removeFollower(doc: string, id: string) {
    return this.functions
      .httpsCallable('removeFollower')({ doc, id })
      .toPromise();
  }
}
