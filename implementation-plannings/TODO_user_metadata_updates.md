user_metadata schema -
user_metadata?: {
// Basic
full_name?: string;
display_name?: string;
avatar_url?: string;
phone?: string;

// Professional
company?: string;
job_title?: string;
department?: string;
industry?: string;

// Platform
subscription_tier?: string;
subscription_start_date?: string;
subscription_end_date?: string;
onboarding_completed?: boolean;

// Preferences
preferences?: {
email_notifications?: boolean;
research_interests?: string[];
theme_preference?: 'light' | 'dark' | 'system';
default_view?: string;
};

// Tracking
last_active_at?: string;
timezone?: string;
locale?: string;

// Compliance
terms_accepted_at?: string;
privacy_policy_version?: string;
country?: string;

[key: string]: any;

}
