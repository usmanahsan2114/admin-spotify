-- Create the "users" table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the "products" table
CREATE TABLE public.products (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 0,
    low_stock BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active',
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_reordered_at TIMESTAMPTZ
);

-- Create the "orders" table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY,
    product_name TEXT NOT NULL, -- Note: This is a textual reference, not a foreign key to products.id
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_by UUID REFERENCES public.users(id),
    total REAL NOT NULL
);

-- Create the "order_timeline" table
CREATE TABLE public.order_timeline (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor TEXT NOT NULL
);

-- Set up Row Level Security (RLS) policies for tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users only" ON public.users FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for own user or admin" ON public.users FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Enable delete for admin only" ON public.users FOR DELETE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- Policies for public.products
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users only" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for authenticated users only" ON public.products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users only" ON public.products FOR DELETE USING (auth.uid() IS NOT NULL);


-- Policies for public.orders
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users only" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for authenticated users only" ON public.orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users only" ON public.orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for public.order_timeline
CREATE POLICY "Enable read access for all users" ON public.order_timeline FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users only" ON public.order_timeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for authenticated users only" ON public.order_timeline FOR UPDATE WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable delete for authenticated users only" ON public.order_timeline FOR DELETE USING (auth.uid() IS NOT NULL);

// -- Create a trigger to update 'updated_at' for 'users' table
// -- CREATE TRIGGER update_users_updated_at
// -- BEFORE UPDATE ON public.users
// -- FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

// -- Create a trigger to update 'updated_at' for 'products' table
// -- CREATE TRIGGER update_products_updated_at
// -- BEFORE UPDATE ON public.products
// -- FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

// -- Create a trigger to update 'updated_at' for 'orders' table
// -- CREATE TRIGGER update_orders_updated_at
// -- BEFORE UPDATE ON public.orders
// -- FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
