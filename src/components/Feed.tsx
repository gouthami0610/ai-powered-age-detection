import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post, User } from '../types';
import PostCard from './PostCard';
import Button from './Button';
import Card from './Card';
import Avatar from './Avatar';
import { Image, Send, Loader2, AlertCircle } from 'lucide-react';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        }
      }
    };
    fetchCurrentUser();

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching posts:', err);
      setError('Could not load posts. Please check your connection.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !auth.currentUser || !currentUser) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: auth.currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL || '',
        content: newPostContent,
        likes: [],
        commentsCount: 0,
        createdAt: Date.now(),
      });
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      {currentUser && (
        <Card className="p-4">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-4">
              <Avatar src={currentUser.photoURL} />
              <textarea
                placeholder="What's on your mind?"
                className="w-full resize-none border-none bg-transparent p-2 text-lg focus:outline-none focus:ring-0"
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" type="button" className="text-gray-500 hover:text-blue-600">
                  <Image className="mr-2 h-5 w-5" />
                  Photo
                </Button>
              </div>
              <Button type="submit" size="sm" disabled={!newPostContent.trim()} isLoading={isPosting}>
                <Send className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No posts yet.</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
