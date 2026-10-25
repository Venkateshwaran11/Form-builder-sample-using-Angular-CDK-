import { Injectable } from '@angular/core';
import { FieldConfig } from '../../dynamic-form/models/field-config.interface';

export interface FormTemplate {
  id: string;
  title: string;
  category: 'Personal' | 'Work' | 'Education' | 'Events' | 'General';
  color: string;
  icon: string;
  description: string;
  tags: string[];
  fields: FieldConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class FormTemplateService {

  private templates: FormTemplate[] = [
    {
      id: 'contact_info',
      title: 'Contact Information',
      category: 'Personal',
      color: '#3f51b5',
      icon: 'contacts',
      description: 'Collect contact details including names, email addresses, phone numbers, and physical addresses.',
      tags: ['Personal', 'Client Intake', 'Contact'],
      fields: [
        {
          type: 'heading',
          name: 'heading_contact',
          label: 'Contact Details',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'full_name',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
          width: '100%'
        },
        {
          type: 'email',
          name: 'email_address',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          required: true,
          width: '50%'
        },
        {
          type: 'mobile',
          name: 'phone_number',
          label: 'Phone Number',
          placeholder: '+1 (555) 000-0000',
          required: true,
          width: '50%'
        },
        {
          type: 'textarea',
          name: 'street_address',
          label: 'Street Address',
          placeholder: 'Street, City, State, ZIP code...',
          required: false,
          width: '100%'
        },
        {
          type: 'textarea',
          name: 'additional_notes',
          label: 'Comments or Notes',
          placeholder: 'Any additional notes you would like to share...',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'customer_feedback',
      title: 'Customer Feedback Survey',
      category: 'Work',
      color: '#673ab7',
      icon: 'rate_review',
      description: 'Gather satisfaction ratings, Net Promoter feedback, and qualitative suggestions from customers.',
      tags: ['Customer Experience', 'Survey', 'NPS'],
      fields: [
        {
          type: 'heading',
          name: 'heading_feedback',
          label: 'Customer Experience Survey',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'customer_name',
          label: 'Your Name (Optional)',
          placeholder: 'Enter your name or leave blank for anonymous feedback',
          required: false,
          width: '50%'
        },
        {
          type: 'email',
          name: 'customer_email',
          label: 'Email Address',
          placeholder: 'client@company.com',
          required: false,
          width: '50%'
        },
        {
          type: 'radio',
          name: 'overall_satisfaction',
          label: 'Overall how satisfied are you with our service?',
          required: true,
          width: '100%',
          options: [
            { label: 'Extremely Satisfied', value: 'extremely_satisfied' },
            { label: 'Satisfied', value: 'satisfied' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Dissatisfied', value: 'dissatisfied' }
          ]
        },
        {
          type: 'dropdown',
          name: 'recommendation_score',
          label: 'How likely are you to recommend us to a colleague?',
          required: true,
          width: '50%',
          options: [
            { label: '10 - Extremely likely', value: '10' },
            { label: '9 - Very likely', value: '9' },
            { label: '8 - Likely', value: '8' },
            { label: '7 - Somewhat likely', value: '7' },
            { label: '5 or below - Unlikely', value: 'unlikely' }
          ]
        },
        {
          type: 'textarea',
          name: 'best_aspects',
          label: 'What did you like most about your experience?',
          placeholder: 'Share your positive thoughts...',
          required: false,
          width: '100%'
        },
        {
          type: 'textarea',
          name: 'improvement_areas',
          label: 'What could we improve for your next visit?',
          placeholder: 'Suggestions for improvement...',
          required: false,
          width: '100%'
        },
        {
          type: 'toggle',
          name: 'allow_follow_up',
          label: 'May our team contact you regarding your feedback?',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'event_registration',
      title: 'Event Registration',
      category: 'Events',
      color: '#00897b',
      icon: 'event_available',
      description: 'Streamline participant registration, attendance days, dietary needs, and ticket badges.',
      tags: ['Events', 'Conference', 'RSVP'],
      fields: [
        {
          type: 'heading',
          name: 'heading_event',
          label: 'Attendee Information',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'attendee_name',
          label: 'Attendee Full Name',
          placeholder: 'First and last name',
          required: true,
          width: '50%'
        },
        {
          type: 'email',
          name: 'attendee_email',
          label: 'Email Address',
          placeholder: 'attendee@domain.com',
          required: true,
          width: '50%'
        },
        {
          type: 'text',
          name: 'company_org',
          label: 'Organization / Company',
          placeholder: 'Company, university, or freelance',
          required: true,
          width: '50%'
        },
        {
          type: 'dropdown',
          name: 'attendance_days',
          label: 'Which track / days will you attend?',
          required: true,
          width: '50%',
          options: [
            { label: 'Full Conference (All 3 Days)', value: 'all_days' },
            { label: 'Day 1: Keynote & Tech Talks', value: 'day_1' },
            { label: 'Day 2: Hands-on Workshops', value: 'day_2' },
            { label: 'Day 3: Networking & Hackathon', value: 'day_3' }
          ]
        },
        {
          type: 'radio',
          name: 'dietary_restrictions',
          label: 'Dietary Restrictions for Lunch & Refreshments',
          required: true,
          width: '100%',
          options: [
            { label: 'No Dietary Restrictions', value: 'none' },
            { label: 'Vegetarian', value: 'vegetarian' },
            { label: 'Vegan', value: 'vegan' },
            { label: 'Gluten-Free', value: 'gluten_free' },
            { label: 'Halal / Kosher', value: 'halal_kosher' }
          ]
        },
        {
          type: 'textarea',
          name: 'special_requests',
          label: 'Accessibility or Special Accommodation Needs',
          placeholder: 'Let us know how we can best support your attendance...',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'job_application',
      title: 'Job Application',
      category: 'Work',
      color: '#1565c0',
      icon: 'work_outline',
      description: 'Complete candidate screening form with career background, salary expectations, and resumes.',
      tags: ['Recruiting', 'HR', 'Hiring'],
      fields: [
        {
          type: 'heading',
          name: 'heading_candidate',
          label: 'Applicant Background',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'applicant_name',
          label: 'Full Legal Name',
          placeholder: 'Full name',
          required: true,
          width: '50%'
        },
        {
          type: 'email',
          name: 'applicant_email',
          label: 'Email Address',
          placeholder: 'candidate@email.com',
          required: true,
          width: '50%'
        },
        {
          type: 'mobile',
          name: 'applicant_phone',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
          required: true,
          width: '50%'
        },
        {
          type: 'dropdown',
          name: 'position_applied',
          label: 'Position Applied For',
          required: true,
          width: '50%',
          options: [
            { label: 'Senior Frontend Engineer (Angular)', value: 'senior_frontend' },
            { label: 'Fullstack Node / TS Developer', value: 'fullstack_dev' },
            { label: 'UI / UX Product Designer', value: 'product_designer' },
            { label: 'DevOps & Cloud Architect', value: 'devops_architect' },
            { label: 'Product Manager', value: 'product_manager' }
          ]
        },
        {
          type: 'number',
          name: 'years_experience',
          label: 'Years of Professional Experience',
          placeholder: 'e.g. 5',
          required: true,
          width: '50%'
        },
        {
          type: 'date',
          name: 'earliest_start_date',
          label: 'Earliest Available Start Date',
          required: true,
          width: '50%'
        },
        {
          type: 'file',
          name: 'resume_file',
          label: 'Upload Resume / CV (PDF or DOCX)',
          required: true,
          width: '100%'
        },
        {
          type: 'textarea',
          name: 'cover_letter',
          label: 'Why are you excited about joining our team?',
          placeholder: 'Brief cover letter or portfolio highlights...',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'party_rsvp',
      title: 'Party & Celebration RSVP',
      category: 'Personal',
      color: '#e91e63',
      icon: 'celebration',
      description: 'Host events with headcount tracking, attendance confirmation, song requests, and food dishes.',
      tags: ['Personal', 'Party', 'Celebration'],
      fields: [
        {
          type: 'heading',
          name: 'heading_rsvp',
          label: "You're Invited!",
          headingTextAlignment: 'center',
          width: '100%'
        },
        {
          type: 'text',
          name: 'guest_name',
          label: 'Your Name',
          placeholder: 'First and last name',
          required: true,
          width: '50%'
        },
        {
          type: 'email',
          name: 'guest_email',
          label: 'Email for event updates',
          placeholder: 'guest@email.com',
          required: true,
          width: '50%'
        },
        {
          type: 'radio',
          name: 'attending_status',
          label: 'Will you be joining us?',
          required: true,
          width: '100%',
          options: [
            { label: "Can't wait! I'll be there 🎉", value: 'yes' },
            { label: "Sorry, won't be able to make it 😢", value: 'no' }
          ]
        },
        {
          type: 'number',
          name: 'plus_ones_count',
          label: 'Total Number of People in Your Party (including yourself)',
          placeholder: '1',
          required: true,
          width: '50%'
        },
        {
          type: 'dropdown',
          name: 'potluck_item',
          label: 'What will you bring to share?',
          required: false,
          width: '50%',
          options: [
            { label: 'Appetizer / Finger food', value: 'appetizer' },
            { label: 'Main Dish / Casserole', value: 'main' },
            { label: 'Salad / Veggies', value: 'salad' },
            { label: 'Dessert / Sweet treat', value: 'dessert' },
            { label: 'Non-Alcoholic Drinks / Soda', value: 'drinks' }
          ]
        },
        {
          type: 'textarea',
          name: 'song_requests',
          label: 'Song Requests or Special Messages for the Host',
          placeholder: 'Tell us your favorite jam to put on the playlist!',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'course_evaluation',
      title: 'Course Evaluation & Feedback',
      category: 'Education',
      color: '#f57c00',
      icon: 'school',
      description: 'Educational assessment collecting student opinions on curriculum, teaching quality, and pacing.',
      tags: ['Education', 'University', 'Evaluation'],
      fields: [
        {
          type: 'heading',
          name: 'heading_course',
          label: 'Academic Course Evaluation',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'course_title',
          label: 'Course Name / Code',
          placeholder: 'e.g. CS-301 Advanced Web Development',
          required: true,
          width: '50%'
        },
        {
          type: 'text',
          name: 'instructor_name',
          label: 'Instructor Name',
          placeholder: 'Professor or lecturer name',
          required: true,
          width: '50%'
        },
        {
          type: 'radio',
          name: 'course_materials_clarity',
          label: 'The course syllabus and materials were organized and clear:',
          required: true,
          width: '100%',
          options: [
            { label: 'Strongly Agree', value: 'strongly_agree' },
            { label: 'Agree', value: 'agree' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Disagree', value: 'disagree' }
          ]
        },
        {
          type: 'radio',
          name: 'instructor_helpfulness',
          label: 'The instructor was supportive and stimulated student interest:',
          required: true,
          width: '100%',
          options: [
            { label: 'Outstanding', value: 'outstanding' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Needs Improvement', value: 'needs_improvement' }
          ]
        },
        {
          type: 'dropdown',
          name: 'workload_difficulty',
          label: 'Workload & Course Pace',
          required: true,
          width: '50%',
          options: [
            { label: 'Appropriate & Well Balanced', value: 'balanced' },
            { label: 'A Bit Heavy but Manageable', value: 'heavy' },
            { label: 'Too Easy / Light', value: 'too_easy' },
            { label: 'Overwhelming Workload', value: 'overwhelming' }
          ]
        },
        {
          type: 'textarea',
          name: 'instructor_suggestions',
          label: 'Constructive Suggestions for Improving This Course',
          placeholder: 'What assignments or topics were most helpful or could be refined?',
          required: false,
          width: '100%'
        }
      ]
    },
    {
      id: 'order_request',
      title: 'IT & Equipment Request',
      category: 'Work',
      color: '#0097a7',
      icon: 'devices',
      description: 'Internal procurement workflow for hardware requisition, software licenses, and office supplies.',
      tags: ['Operations', 'IT', 'Internal'],
      fields: [
        {
          type: 'heading',
          name: 'heading_order',
          label: 'Hardware & Resource Requisition',
          headingTextAlignment: 'left',
          width: '100%'
        },
        {
          type: 'text',
          name: 'requester_name',
          label: 'Employee Name & ID',
          placeholder: 'Jane Doe (#2049)',
          required: true,
          width: '50%'
        },
        {
          type: 'dropdown',
          name: 'department',
          label: 'Department',
          required: true,
          width: '50%',
          options: [
            { label: 'Engineering', value: 'engineering' },
            { label: 'Design & UX', value: 'design' },
            { label: 'Product & Analytics', value: 'product' },
            { label: 'Sales & Marketing', value: 'sales' },
            { label: 'Human Resources', value: 'hr' }
          ]
        },
        {
          type: 'dropdown',
          name: 'equipment_type',
          label: 'Equipment or Service Requested',
          required: true,
          width: '50%',
          options: [
            { label: 'External 4K Monitor & Hub', value: 'monitor' },
            { label: 'Laptop Upgrade / Replacement', value: 'laptop' },
            { label: 'Ergonomic Chair / Desk Setup', value: 'ergonomic' },
            { label: 'Software License (Figma, JetBrains, etc.)', value: 'license' },
            { label: 'Test Mobile Device / Tablet', value: 'test_device' }
          ]
        },
        {
          type: 'radio',
          name: 'urgency_level',
          label: 'Urgency / Priority',
          required: true,
          width: '50%',
          options: [
            { label: 'Standard (2-3 weeks)', value: 'standard' },
            { label: 'Medium (1 week)', value: 'medium' },
            { label: 'Critical / Blocker (Immediate)', value: 'critical' }
          ]
        },
        {
          type: 'textarea',
          name: 'business_need',
          label: 'Business Need & Justification',
          placeholder: 'Explain why this equipment is needed for your project deliverables...',
          required: true,
          width: '100%'
        }
      ]
    }
  ];

  getTemplates(): FormTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): FormTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  getCategories(): string[] {
    return ['All', 'Personal', 'Work', 'Education', 'Events'];
  }
}
