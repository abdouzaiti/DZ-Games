/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AvatarProps {
  avatar: string | undefined;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatar, className = "w-full h-full flex items-center justify-center" }) => {
  if (!avatar) {
    return <span className={className}>👤</span>;
  }

  // Check if it's a Base64 image, standard HTTP URL, or other image URL
  const isImage = avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://');

  if (isImage) {
    return (
      <img
        src={avatar}
        alt="User Profile"
        className={`${className} object-cover rounded-[inherit]`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Otherwise, render as text/emoji
  return <span className={className}>{avatar}</span>;
};
