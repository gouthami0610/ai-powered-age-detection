import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import Avatar from './Avatar';
import Card from './Card';
import { Search as SearchIcon, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchTerm.toLowerCase()),
        where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map((doc) => doc.data() as User);
      setResults(usersData);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for people..."
          className="w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-4">
        {isSearching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <Card key={user.uid} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <Link to={`/profile/${user.uid}`} className="flex items-center gap-3">
                  <Avatar src={user.photoURL} />
                  <div>
                    <p className="font-semibold text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </Link>
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow
                </Button>
              </div>
            </Card>
          ))
        ) : searchTerm.trim() ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No users found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">Start searching for people to connect with.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
