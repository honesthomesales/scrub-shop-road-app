import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../utils/cn'

const MessageBubble = ({ message, currentUserId }) => {
  const isOwnMessage = message.sender_id === currentUserId
  const senderName = message.sender?.name || 'Unknown User'
  const messageTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  return (
    <div className={cn(
      'flex mb-4',
      isOwnMessage ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
        isOwnMessage 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      )}>
        {/* Always show sender name for clarity */}
        <div className={cn(
          'text-xs font-medium mb-1',
          isOwnMessage ? 'text-primary-200' : 'text-gray-600'
        )}>
          {senderName}
          {isOwnMessage && ' (You)'}
        </div>
        <div className="text-sm">
          {message.message_text}
        </div>
        <div className={cn(
          'text-xs mt-1',
          isOwnMessage ? 'text-primary-200' : 'text-gray-500'
        )}>
          {messageTime}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble 