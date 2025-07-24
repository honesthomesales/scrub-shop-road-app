import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import MessageBubble from '../components/MessageBubble'
import MessageInput from '../components/MessageInput'

const Messages = () => {
  const { 
    loading, 
    messagesData, 
    messageGroups, 
    usersData, 
    currentUser,
    loadMessages, 
    sendMessage,
    setCurrentUser,
    setSelectedGroup 
  } = useApp()

  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Set default current user (first user) if none selected
    if (usersData.length > 0 && !currentUser) {
      setCurrentUser(usersData[0])
    }

    // Set default group (first group) if none selected
    if (messageGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(messageGroups[0].id)
      setSelectedGroup(messageGroups[0])
    }
  }, [usersData, messageGroups, currentUser, selectedGroupId])

  useEffect(() => {
    if (selectedGroupId) {
      loadMessages(selectedGroupId)
    }
  }, [selectedGroupId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleSendMessage = async (messageText) => {
    if (!currentUser || !selectedGroupId) return

    const messageData = {
      sender_id: currentUser.id,
      group_id: selectedGroupId,
      message_text: messageText,
      message_type: 'text'
    }

    await sendMessage(messageData)
  }

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId)
    const group = messageGroups.find(g => g.id === groupId)
    setSelectedGroup(group)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Team Messages
          </h1>
          <p className="mt-2 text-secondary-600">
            Communicate with your team members and stay connected
          </p>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 h-[600px]">
            {/* Groups Sidebar */}
            <div className="lg:col-span-1 border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
              </div>
              <div className="p-2">
                {messageGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group.id)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{group.group_name}</div>
                    <div className="text-sm text-gray-500">
                      {group.member_count || 0} members
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="lg:col-span-3 flex flex-col">
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {messageGroups.find(g => g.id === selectedGroupId)?.group_name || 'Select a group'}
                </h3>
                <p className="text-sm text-gray-500">
                  {messagesData.length} messages
                </p>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesData.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messagesData.map(message => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={currentUser?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedGroupId && (
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!currentUser}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages 