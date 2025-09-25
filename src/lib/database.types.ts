export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          school_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          school_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          school_code?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          school_id: string
          full_name: string
          email: string
          role: 'admin' | 'teacher' | 'student'
          avatar_url: string | null
          phone: string | null
          bio: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          school_id: string
          full_name: string
          email: string
          role: 'admin' | 'teacher' | 'student'
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'teacher' | 'student'
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          school_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          created_by: string | null
          created_at: string
          archived: boolean
        }
        Insert: {
          id?: string
          school_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          created_by?: string | null
          created_at?: string
          archived?: boolean
        }
        Update: {
          id?: string
          school_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          created_by?: string | null
          created_at?: string
          archived?: boolean
        }
      }
      course_teachers: {
        Row: {
          id: string
          course_id: string
          teacher_id: string
        }
        Insert: {
          id?: string
          course_id: string
          teacher_id: string
        }
        Update: {
          id?: string
          course_id?: string
          teacher_id?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          course_id: string
          student_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          enrolled_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          content: string | null
          order_index: number | null
          media_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content?: string | null
          order_index?: number | null
          media_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          content?: string | null
          order_index?: number | null
          media_url?: string | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          due_date: string | null
          points: number | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          due_date?: string | null
          points?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          points?: number | null
          created_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          submission_url: string | null
          submitted_at: string
          grade: number | null
          feedback: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          submission_url?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          submission_url?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
        }
      }
      quizzes: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question: string | null
          options: any
          correct_answer: string | null
          order_index: number | null
        }
        Insert: {
          id?: string
          quiz_id: string
          question?: string | null
          options?: any
          correct_answer?: string | null
          order_index?: number | null
        }
        Update: {
          id?: string
          quiz_id?: string
          question?: string | null
          options?: any
          correct_answer?: string | null
          order_index?: number | null
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          student_id: string
          submitted_at: string
          score: number | null
          answers: any
        }
        Insert: {
          id?: string
          quiz_id: string
          student_id: string
          submitted_at?: string
          score?: number | null
          answers?: any
        }
        Update: {
          id?: string
          quiz_id?: string
          student_id?: string
          submitted_at?: string
          score?: number | null
          answers?: any
        }
      }
      blackboards: {
        Row: {
          id: string
          course_id: string
          title: string | null
          board_state: any
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title?: string | null
          board_state?: any
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string | null
          board_state?: any
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          school_id: string
          course_id: string | null
          name: string | null
          is_private: boolean
        }
        Insert: {
          id?: string
          school_id: string
          course_id?: string | null
          name?: string | null
          is_private?: boolean
        }
        Update: {
          id?: string
          school_id?: string
          course_id?: string | null
          name?: string | null
          is_private?: boolean
        }
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          sender_id: string
          content: string | null
          attachment_url: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          sender_id: string
          content?: string | null
          attachment_url?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          sender_id?: string
          content?: string | null
          attachment_url?: string | null
          sent_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          content: string | null
          link_url: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          link_url?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          link_url?: string | null
          read?: boolean
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          school_id: string
          uploader_id: string | null
          file_url: string
          file_name: string | null
          file_type: string | null
          size_in_bytes: number | null
          is_assignment_submission: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          uploader_id?: string | null
          file_url: string
          file_name?: string | null
          file_type?: string | null
          size_in_bytes?: number | null
          is_assignment_submission?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          uploader_id?: string | null
          file_url?: string
          file_name?: string | null
          file_type?: string | null
          size_in_bytes?: number | null
          is_assignment_submission?: boolean
          created_at?: string
        }
      }
      engagement_events: {
        Row: {
          id: string
          user_id: string | null
          school_id: string | null
          type: string
          meta: any | null
          occurred_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          school_id?: string | null
          type: string
          meta?: any | null
          occurred_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          school_id?: string | null
          type?: string
          meta?: any | null
          occurred_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          course_id: string
          lesson_id: string | null
          user_id: string | null
          attended_at: string
        }
        Insert: {
          id?: string
          course_id: string
          lesson_id?: string | null
          user_id?: string | null
          attended_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          lesson_id?: string | null
          user_id?: string | null
          attended_at?: string
        }
      }
      background_jobs: {
        Row: {
          id: string
          job_type: string
          payload: any | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_for: string | null
          started_at: string | null
          finished_at: string | null
          error: string | null
        }
        Insert: {
          id?: string
          job_type: string
          payload?: any | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_for?: string | null
          started_at?: string | null
          finished_at?: string | null
          error?: string | null
        }
        Update: {
          id?: string
          job_type?: string
          payload?: any | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_for?: string | null
          started_at?: string | null
          finished_at?: string | null
          error?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          school_id: string
          plan: string
          price_cents: number | null
          current_period_start: string | null
          current_period_end: string | null
          is_active: boolean
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          plan: string
          price_cents?: number | null
          current_period_start?: string | null
          current_period_end?: string | null
          is_active?: boolean
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          plan?: string
          price_cents?: number | null
          current_period_start?: string | null
          current_period_end?: string | null
          is_active?: boolean
          stripe_customer_id?: string | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          duration_minutes: number
          start_time: string | null
          end_time: string | null
          is_published: boolean
          created_by: string | null
          school_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          duration_minutes: number
          start_time?: string | null
          end_time?: string | null
          is_published?: boolean
          created_by?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          start_time?: string | null
          end_time?: string | null
          is_published?: boolean
          created_by?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: any | null
          correct_answer: string | null
          points: number | null
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: any | null
          correct_answer?: string | null
          points?: number | null
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: any | null
          correct_answer?: string | null
          points?: number | null
          order_index?: number | null
          created_at?: string
        }
      }
      exam_sessions: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          started_at: string
          submitted_at: string | null
          auto_submitted: boolean
          time_remaining_seconds: number | null
          answers: any | null
          score: number | null
          total_points: number | null
          status: 'in_progress' | 'submitted' | 'graded'
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          started_at?: string
          submitted_at?: string | null
          auto_submitted?: boolean
          time_remaining_seconds?: number | null
          answers?: any | null
          score?: number | null
          total_points?: number | null
          status?: 'in_progress' | 'submitted' | 'graded'
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          started_at?: string
          submitted_at?: string | null
          auto_submitted?: boolean
          time_remaining_seconds?: number | null
          answers?: any | null
          score?: number | null
          total_points?: number | null
          status?: 'in_progress' | 'submitted' | 'graded'
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          school_id: string
          title: string
          description: string | null
          event_type: 'exam' | 'assignment' | 'holiday' | 'meeting' | 'class' | 'other'
          start_date: string
          end_date: string | null
          all_day: boolean
          location: string | null
          color: string
          course_id: string | null
          exam_id: string | null
          assignment_id: string | null
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          title: string
          description?: string | null
          event_type: 'exam' | 'assignment' | 'holiday' | 'meeting' | 'class' | 'other'
          start_date: string
          end_date?: string | null
          all_day?: boolean
          location?: string | null
          color?: string
          course_id?: string | null
          exam_id?: string | null
          assignment_id?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          title?: string
          description?: string | null
          event_type?: 'exam' | 'assignment' | 'holiday' | 'meeting' | 'class' | 'other'
          start_date?: string
          end_date?: string | null
          all_day?: boolean
          location?: string | null
          color?: string
          course_id?: string | null
          exam_id?: string | null
          assignment_id?: string | null
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calendar_event_participants: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          participant_type: 'required' | 'optional' | 'organizer'
          status: 'pending' | 'accepted' | 'declined' | 'tentative'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          participant_type?: 'required' | 'optional' | 'organizer'
          status?: 'pending' | 'accepted' | 'declined' | 'tentative'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          participant_id?: string
          participant_type?: 'required' | 'optional' | 'organizer'
          status?: 'pending' | 'accepted' | 'declined' | 'tentative'
          created_at?: string
        }
      }
      school_holidays: {
        Row: {
          id: string
          school_id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          is_recurring: boolean
          recurrence_pattern: string | null
          color: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          color?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          color?: string
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
