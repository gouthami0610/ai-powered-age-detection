import React from 'react';
import { Bell, ShieldCheck, Heart, MessageCircle, UserPlus, AlertCircle } from 'lucide-react';
import Card from './Card';
import Avatar from './Avatar';

const Notifications: React.FC = () => {
  // Mock notifications for now
  const notifications = [
    {
      id: '1',
      type: 'verification',
      title: 'Age Verified Successfully',
      description: 'Your account has been verified. You now have full access to the platform.',
      icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'like',
      title: 'Jane Doe liked your post',
      description: '"Just joined this amazing platform! #secure #social"',
      icon: <Heart className="h-6 w-6 text-red-500 fill-current" />,
      time: '5 hours ago',
      user: { name: 'Jane Doe', photo: 'https://picsum.photos/seed/jane/100/100' },
    },
    {
      id: '3',
      type: 'follow',
      title: 'John Smith followed you',
      description: 'You have a new follower!',
      icon: <UserPlus className="h-6 w-6 text-green-500" />,
      time: '1 day ago',
      user: { name: 'John Smith', photo: 'https://picsum.photos/seed/john/100/100' },
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <Bell className="h-8 w-8 text-gray-400" />
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                {notification.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{notification.title}</p>
                  <span className="text-xs text-gray-500">{notification.time}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.description}</p>
                {notification.user && (
                  <div className="mt-3 flex items-center gap-2">
                    <Avatar src={notification.user.photo} size="sm" />
                    <span className="text-xs font-medium text-gray-700">{notification.user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
