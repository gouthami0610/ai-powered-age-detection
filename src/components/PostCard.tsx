import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post } from '../types';
import Avatar from './Avatar';
import Card from './Card';
import Button from './Button';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const user = auth.currentUser;
  const isLiked = user ? post.likes.includes(user.uid) : false;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', post.id);
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
        });
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) return;

    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, 'posts', post.id));
      } catch (err) {
        console.error('Error deleting post:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.authorId}`}>
              <Avatar src={post.authorPhoto} />
            </Link>
            <div>
              <Link to={`/profile/${post.authorId}`} className="font-semibold text-gray-900 hover:underline">
                {post.authorName}
              </Link>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(post.createdAt)} ago
              </p>
            </div>
          </div>
          {user && user.uid === post.authorId && (
            <Button variant="ghost" size="sm" onClick={handleDelete} isLoading={isDeleting} className="text-gray-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          {post.imageURL && (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
              <img
                src={post.imageURL}
                alt="Post content"
                className="w-full object-cover max-h-[500px]"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-6 border-t border-gray-100 pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes.length}</span>
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
