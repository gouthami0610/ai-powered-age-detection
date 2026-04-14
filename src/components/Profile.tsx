import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User, Post } from '../types';
import PostCard from './PostCard';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import { Edit, Calendar, MapPin, Link as LinkIcon, Loader2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        setUserProfile(data);
        setEditData({ displayName: data.displayName, bio: data.bio || '' });
      }
      setIsLoading(false);
    };
    fetchProfile();

    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSaveProfile = async () => {
    if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        displayName: editData.displayName,
        bio: editData.bio,
      });
      setUserProfile((prev) => prev ? { ...prev, displayName: editData.displayName, bio: editData.bio } : null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">User not found.</p>
      </div>
    );
  }

  const isOwnProfile = auth.currentUser?.uid === userId;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4">
      <Card className="relative overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="px-8 pb-8">
          <div className="relative -mt-16 flex items-end justify-between">
            <div className="relative">
              <Avatar src={userProfile.photoURL} size="xl" className="border-4 border-white shadow-lg" />
              {userProfile.isVerified && (
                <div className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  className="w-full text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  value={editData.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                />
                <textarea
                  className="w-full text-gray-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
                <Button onClick={handleSaveProfile} isLoading={isSaving}>Save Changes</Button>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{userProfile.displayName}</h1>
                  <p className="text-gray-500">@{userProfile.username}</p>
                </div>
                {userProfile.bio && <p className="text-gray-800 whitespace-pre-wrap">{userProfile.bio}</p>}
              </>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {format(userProfile.createdAt, 'MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Age Verified</span>
              </div>
            </div>

            <div className="flex gap-6 border-t border-gray-100 pt-4">
              <div>
                <span className="font-bold text-gray-900">0</span>
                <span className="ml-1 text-gray-500">Following</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">0</span>
                <span className="ml-1 text-gray-500">Followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">{posts.length}</span>
                <span className="ml-1 text-gray-500">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Posts</h2>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            <p className="text-lg font-medium">No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
