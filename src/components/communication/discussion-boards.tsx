'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Pin, 
  MoreVertical,
  Search,
  Filter,
  Clock,
  User,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface DiscussionPost {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_role: 'admin' | 'teacher' | 'student' | 'parent'
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_locked: boolean
  tags: string[]
  replies_count: number
  likes_count: number
  views_count: number
  last_reply_at?: string
  last_reply_author?: string
}

interface Reply {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_role: 'admin' | 'teacher' | 'student' | 'parent'
  created_at: string
  updated_at: string
  likes_count: number
  is_solution: boolean
}

interface DiscussionBoardsProps {
  courseId: string
  currentUserId: string
  currentUserRole: string
}

export function DiscussionBoards({ courseId, currentUserId, currentUserRole }: DiscussionBoardsProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [showNewPost, setShowNewPost] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  })
  const [newReply, setNewReply] = useState('')

  // Mock data for demonstration
  useEffect(() => {
    const mockPosts: DiscussionPost[] = [
      {
        id: '1',
        title: 'Welcome to the Course Discussion!',
        content: 'Welcome everyone to our course discussion board. Feel free to ask questions, share insights, and help each other learn.',
        author_id: 'teacher1',
        author_name: 'Dr. Smith',
        author_role: 'teacher',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        is_pinned: true,
        is_locked: false,
        tags: ['announcement', 'welcome'],
        replies_count: 5,
        likes_count: 12,
        views_count: 45,
        last_reply_at: new Date(Date.now() - 3600000).toISOString(),
        last_reply_author: 'John Doe'
      },
      {
        id: '2',
        title: 'Question about Assignment 1',
        content: 'I\'m having trouble understanding the requirements for Assignment 1. Can someone help clarify what we need to do for the data analysis part?',
        author_id: 'student1',
        author_name: 'John Doe',
        author_role: 'student',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        is_pinned: false,
        is_locked: false,
        tags: ['assignment', 'help'],
        replies_count: 3,
        likes_count: 2,
        views_count: 18,
        last_reply_at: new Date(Date.now() - 1800000).toISOString(),
        last_reply_author: 'Dr. Smith'
      },
      {
        id: '3',
        title: 'Interesting Article on Machine Learning',
        content: 'I found this great article about the latest developments in machine learning. Thought it might be relevant to our course: [link]',
        author_id: 'student2',
        author_name: 'Jane Smith',
        author_role: 'student',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        updated_at: new Date(Date.now() - 10800000).toISOString(),
        is_pinned: false,
        is_locked: false,
        tags: ['resources', 'machine-learning'],
        replies_count: 1,
        likes_count: 8,
        views_count: 22,
        last_reply_at: new Date(Date.now() - 5400000).toISOString(),
        last_reply_author: 'Mike Johnson'
      }
    ]
    setPosts(mockPosts)
  }, [courseId])

  useEffect(() => {
    if (selectedPost) {
      const mockReplies: Reply[] = [
        {
          id: '1',
          content: 'Great question! For the data analysis part, you need to focus on the statistical methods we covered in Chapter 3.',
          author_id: 'teacher1',
          author_name: 'Dr. Smith',
          author_role: 'teacher',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          likes_count: 5,
          is_solution: true
        },
        {
          id: '2',
          content: 'I had the same question! I found the examples in the textbook really helpful.',
          author_id: 'student3',
          author_name: 'Mike Johnson',
          author_role: 'student',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          likes_count: 2,
          is_solution: false
        }
      ]
      setReplies(mockReplies)
    }
  }, [selectedPost])

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !filterTag || post.tags.includes(filterTag)
    return matchesSearch && matchesTag
  })

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const post: DiscussionPost = {
      id: `post_${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      author_id: currentUserId,
      author_name: 'You', // This would come from user context
      author_role: currentUserRole as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_pinned: false,
      is_locked: false,
      tags: newPost.tags,
      replies_count: 0,
      likes_count: 0,
      views_count: 0
    }

    setPosts(prev => [post, ...prev])
    setNewPost({ title: '', content: '', tags: [] })
    setShowNewPost(false)
    toast.success('Post created successfully!')
  }

  const handleReply = async () => {
    if (!newReply.trim() || !selectedPost) return

    const reply: Reply = {
      id: `reply_${Date.now()}`,
      content: newReply.trim(),
      author_id: currentUserId,
      author_name: 'You',
      author_role: currentUserRole as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      is_solution: false
    }

    setReplies(prev => [...prev, reply])
    setNewReply('')
    toast.success('Reply posted!')
  }

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes_count: post.likes_count + 1 }
        : post
    ))
  }

  const handleLikeReply = (replyId: string) => {
    setReplies(prev => prev.map(reply => 
      reply.id === replyId 
        ? { ...reply, likes_count: reply.likes_count + 1 }
        : reply
    ))
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'teacher':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      case 'parent':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (selectedPost) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => setSelectedPost(null)}
        >
          ← Back to Discussions
        </Button>

        {/* Post Header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedPost.is_pinned && (
                    <Pin className="h-4 w-4 text-blue-500" />
                  )}
                  <h1 className="text-xl font-semibold">{selectedPost.title}</h1>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedPost.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedPost.author_name}</span>
                    <Badge className={getRoleColor(selectedPost.author_role)}>
                      {selectedPost.author_role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(selectedPost.created_at)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLike(selectedPost.id)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {selectedPost.likes_count}
              </Button>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MessageSquare className="h-4 w-4" />
                {selectedPost.replies_count} replies
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                {selectedPost.views_count} views
              </div>
            </div>
          </div>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Replies ({replies.length})</h2>
          
          {replies.map((reply) => (
            <Card key={reply.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(reply.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{reply.author_name}</span>
                    <Badge className={getRoleColor(reply.author_role)}>
                      {reply.author_role}
                    </Badge>
                    {reply.is_solution && (
                      <Badge className="bg-green-100 text-green-800">
                        Solution
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(reply.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeReply(reply.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {reply.likes_count}
                    </Button>
                  </div>
                </div>
                
                <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
              </div>
            </Card>
          ))}

          {/* Reply Form */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label>Add a Reply</Label>
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={!newReply.trim()}>
                  Post Reply
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discussion Board</h1>
          <p className="text-gray-600">Course discussions and Q&A</p>
        </div>
        <Button onClick={() => setShowNewPost(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card 
            key={post.id} 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedPost(post)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.is_pinned && (
                      <Pin className="h-4 w-4 text-blue-500" />
                    )}
                    <h3 className="font-semibold text-lg">{post.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(post.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author_name}</span>
                    <Badge className={getRoleColor(post.author_role)}>
                      {post.author_role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(post.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.replies_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views_count}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create New Post</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewPost(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your post content..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g., assignment, help, resources"
                    onChange={(e) => setNewPost(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewPost(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                >
                  Create Post
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
