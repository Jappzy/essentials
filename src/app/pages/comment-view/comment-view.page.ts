import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastController, ActionSheetController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { CommentService } from '../../services/comment.service';
import { FollowService } from '../../services/follow.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-comment-view',
  templateUrl: './comment-view.page.html',
  styleUrls: ['./comment-view.page.scss'],
})
export class CommentViewPage implements OnInit {
  following: boolean;
  liked: boolean;

  comment$: Observable<any>;
  commentId: string;
  commentUserId: string;
  commentLikedIds: string[];
  commentFollowerIds: string[];
  postId: string;
  postUserId: string;
  reply: string;

  constructor(
    public auth: AuthService,
    private toast: ToastController,
    private actionSheet: ActionSheetController,
    private route: ActivatedRoute,
    private router: Router,
    private commentService: CommentService,
    private follow: FollowService,
    private notifications: NotificationService
  ) { }

  ngOnInit() {
    this.comment$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.postId = params.get('postId');
        this.commentId = params.get('commentId');
        return this.commentService.watchComment(this.postId, this.commentId);
      }),
      tap(comment => {
        console.log({ comment });
        this.commentUserId = comment.userId;
        this.postUserId = comment.postUserId;
        this.commentLikedIds = comment.likedIds && comment.likedIds.length ? comment.likedIds : [];
        this.commentFollowerIds = comment.followerIds && comment.followerIds.length ? comment.followerIds : [];
        const user = this.auth.user$.getValue();
        this.following = user && user.uid && this.commentFollowerIds.includes(user.uid);
        this.liked = user && user.uid && this.commentLikedIds.includes(user.uid);
      })
    );
  }

  async toggleFollowing() {
    const { uid } = (this.auth.user$.getValue() || { uid: null });
    if (!uid) return;

    const toasty = await this.toast.create({
      message: !this.following ? 'Following!' : 'Stopped following :(',
      duration: 1000,
      position: 'top'
    });
    toasty.present();

    this.following = !this.following;

    if (this.following) {
      const oldId = this.commentFollowerIds.length > 99 ? this.commentFollowerIds[this.commentFollowerIds.length - 1] : undefined;
      await this.follow.addFollower(`posts/${this.postId}/comments/${this.commentId}`, uid, oldId);
    } else {
      await this.follow.removeFollower(`posts/${this.postId}/comments/${this.commentId}`, uid);
    }
  }

  async addReply() {
    if (!this.reply) return;
    const postId = this.postId;
    const commentId = this.commentId;
    this.postId = '';
    this.commentId = '';
    const { uid, username } = this.auth.user$.getValue();
    const newReply = {
      userId: uid,
      postId: this.postId,
      commentId: this.commentId,
      postUserId: this.postUserId,
      commentUserId: this.commentUserId,
      username,
      createdAt: new Date(),
      text: this.reply,
      likes: 0,
      likedIds: [],
      followerIds: []
    };

    await this.commentService.createReply(postId, commentId, newReply);

    this.reply = '';
    const toasty = await this.toast.create({
      message: 'Reply added!',
      duration: 1500
    });
    toasty.present();

    this.following = true;
    const oldId = this.commentFollowerIds.length > 99 ? this.commentFollowerIds[this.commentFollowerIds.length - 1] : undefined;
    await this.follow.addFollower(`posts/${postId}/comments/${commentId}`, uid, oldId);

    await this.notifications.notify(this.commentFollowerIds, {
      icon: 'pizza',
      title: newReply.text,
      subtitle: 'New reply!',
      route: `/comment-view/${postId}/${commentId}`
    });

    this.postId = postId;
    this.commentId = commentId;
  }

  async showActions() {
    const buttons = [];

    const { uid } = this.auth.user$.getValue();

    if (this.commentUserId === uid) {
      buttons.push({
        text: 'Delete Comment',
        role: 'destructive',
        icon: 'trash-bin',
        handler: () => {
          this.deleteComment().then(() => {});
        }
      });
    } else {
      buttons.push({
        text: 'Report Comment',
        role: 'destructive',
        icon: 'megaphone-outline',
        handler: () => {
          this.reportComment().then(() => {});
        }
      });
    }

    const actions = await this.actionSheet.create({
      buttons
    });
    await actions.present();
  }

  async like() {
    const user = this.auth.user$.getValue();
    if (!user || !user.uid) return;
    const uid = user.uid;
    this.liked = true;
    this.following = true;
    const toasty = await this.toast.create({
      message: 'Liked Comment :)',
      duration: 1500,
      position: 'top'
    });
    toasty.present();
    await this.commentService.likeComment(this.postId, this.commentId, uid, this.commentLikedIds, this.commentFollowerIds);
  }

  async unlike() {
    const user = this.auth.user$.getValue();
    if (!user || !user.uid) return;
    const uid = user.uid;
    this.liked = false;
    const toasty = await this.toast.create({
      message: 'Unliked comment :)',
      duration: 1500,
      position: 'top'
    });
    toasty.present();
    await this.commentService.unlikeComment(this.postId, this.commentId, uid);
  }

  async deleteComment() {
    await this.commentService.deleteComment(this.postId, this.commentId);
    this.router.navigateByUrl(`/post/${this.postId}`);
    const toasty = await this.toast.create({
      message: 'Comment has been deleted.',
      duration: 1500
    });
    toasty.present();
  }

  async reportComment() {
    const user = this.auth.user$.getValue();
    const report = {
      type: 'comment',
      postId: this.postId,
      commentId: this.commentId,
      commentUserId: this.commentUserId,
      userId: user ? user.uid : ''
    };
    await this.commentService.report(report);
    const toasty = await this.toast.create({
      message: 'Comment has been reported.',
      duration: 1234
    });
    toasty.present();
  }

}
