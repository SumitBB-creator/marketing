export interface Platform {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    fields?: PlatformField[];
}

export interface PlatformField {
    id: string;
    field_name: string;
    field_type: 'text' | 'email' | 'url' | 'phone' | 'number' | 'date' | 'datetime' | 'textarea' | 'select' | 'file';
    field_category: 'lead_detail' | 'tracking_action';
    is_required: boolean;
    field_order: number;
    options?: any;
    placeholder?: string;
}

export interface BrandingConfig {
    id: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    sidebar_color?: string;
    background_color?: string;
    text_color?: string;
    heading_color?: string;
    logo_url?: string;
    favicon_url?: string;
    company_name: string;
    font_family: string;
    font_size_base: string;
    border_radius: string;
    custom_css?: string;
    updated_at: string;
    updated_by: string;
}

export interface UserSession {
    ip_address?: string;
    user_agent?: string;
    login_at: string;
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'marketer' | 'super_admin';
    is_active: boolean;
    avatar_url?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    headline?: string;
    bio?: string;
    last_login?: string;
    created_at: string;
    sessions?: UserSession[];
}
