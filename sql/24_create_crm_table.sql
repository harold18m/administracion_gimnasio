-- CRM FOR SUPER ADMIN (Prospects & Leads)

-- 1. Create table 'crm_leads'
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Contact Info
    admin_name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- Cargo (Dueño, Admin, etc.)
    phone VARCHAR(50), 
    email VARCHAR(255),
    
    -- Gym Profile (Flexible JSON)
    -- Structure: { "members": 100, "system": "Excel", "locations": 1, "ticket": 50 }
    gym_profile JSONB DEFAULT '{}',
    
    -- Funnel Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'negotiation', 'won', 'lost')),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Only Super Admin can View/Edit everything
CREATE POLICY "Super Admin manages CRM" ON public.crm_leads
    FOR ALL
    USING ( public.is_super_admin() );

-- 4. Trigger for updated_at
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
