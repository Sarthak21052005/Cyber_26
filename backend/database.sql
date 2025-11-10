-- Drop existing tables
DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS OrderItems CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS RestaurantTables CASCADE;
DROP TABLE IF EXISTS Menu CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;

-- ==============================================
-- MENU TABLE
-- ==============================================
CREATE TABLE Menu (
    menu_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('appetizer', 'main', 'dessert', 'beverage')),
    cuisine VARCHAR(50) NOT NULL CHECK (cuisine IN ('north-indian', 'south-indian', 'chinese', 'italian', 'continental', 'desserts', 'beverages', 'starters')),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER CHECK (preparation_time >= 0),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CUSTOMERS TABLE
-- ==============================================
CREATE TABLE Customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15),
    email VARCHAR(100),
    customer_type VARCHAR(20) CHECK (customer_type IN ('dine-in', 'takeaway')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- RESTAURANT TABLES (NEW - FIX FOR YOUR ERROR!)
-- ==============================================
CREATE TABLE RestaurantTables (
    table_id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL CHECK (table_number > 0),
    seating_capacity INTEGER NOT NULL DEFAULT 4 CHECK (seating_capacity > 0),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    location VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- ORDERS TABLE (FIXED - Added missing columns!)
-- ==============================================
CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    order_token VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES Customers(customer_id) ON DELETE SET NULL,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine-in', 'takeaway')),
    table_number INTEGER REFERENCES RestaurantTables(table_number) ON DELETE SET NULL,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    special_instructions TEXT,
    subtotal DECIMAL(10, 2) DEFAULT 0.00 CHECK (subtotal >= 0),
    gst_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (gst_amount >= 0),
    service_charge DECIMAL(10, 2) DEFAULT 0.00 CHECK (service_charge >= 0),
    total_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (total_amount >= 0),
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- ORDER ITEMS TABLE (FIXED - Added customization!)
-- ==============================================
CREATE TABLE OrderItems (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES Menu(menu_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    customization TEXT,
    item_status VARCHAR(20) DEFAULT 'pending' CHECK (item_status IN ('pending', 'preparing', 'ready', 'served'))
);

-- ==============================================
-- PAYMENTS TABLE
-- ==============================================
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES Orders(order_id) ON DELETE RESTRICT,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi')),
    amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX idx_menu_category ON Menu(category);
CREATE INDEX idx_menu_cuisine ON Menu(cuisine);
CREATE INDEX idx_menu_available ON Menu(is_available);
CREATE INDEX idx_orders_status ON Orders(order_status);
CREATE INDEX idx_orders_date ON Orders(order_date);
CREATE INDEX idx_orders_customer ON Orders(customer_id);
CREATE INDEX idx_orders_token ON Orders(order_token);
CREATE INDEX idx_order_items_order ON OrderItems(order_id);
CREATE INDEX idx_order_items_menu ON OrderItems(menu_id);
CREATE INDEX idx_payments_order ON Payments(order_id);
CREATE INDEX idx_tables_status ON RestaurantTables(status);

-- ==============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_updated_at
    BEFORE UPDATE ON Menu
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON Orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON RestaurantTables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- INSERT SAMPLE RESTAURANT TABLES
-- ==============================================
INSERT INTO RestaurantTables (table_number, seating_capacity, status, location) VALUES
(1, 2, 'available', 'Window Side'),
(2, 2, 'available', 'Window Side'),
(3, 4, 'available', 'Main Hall'),
(4, 4, 'available', 'Main Hall'),
(5, 4, 'available', 'Main Hall'),
(6, 4, 'available', 'Main Hall'),
(7, 6, 'available', 'Main Hall'),
(8, 6, 'available', 'Main Hall'),
(9, 8, 'available', 'Private Room'),
(10, 8, 'available', 'Private Room'),
(11, 2, 'available', 'Bar Area'),
(12, 2, 'available', 'Bar Area'),
(13, 4, 'available', 'Garden'),
(14, 4, 'available', 'Garden'),
(15, 6, 'available', 'Garden'),
(16, 4, 'available', 'Main Hall'),
(17, 4, 'available', 'Main Hall'),
(18, 4, 'available', 'Main Hall'),
(19, 6, 'available', 'Main Hall'),
(20, 6, 'available', 'Main Hall'),
(21, 8, 'available', 'Banquet'),
(22, 8, 'available', 'Banquet'),
(23, 10, 'available', 'Banquet'),
(24, 10, 'available', 'Banquet'),
(25, 12, 'available', 'VIP Room');

-- ==============================================
-- INSERT MENU ITEMS
-- ==============================================
INSERT INTO Menu (item_name, description, category, cuisine, price, preparation_time) VALUES
-- Starters
('Paneer Tikka', 'Cottage cheese marinated in tandoori spices', 'appetizer', 'starters', 350.00, 15),
('Chicken Malai Tikka', 'Creamy chicken tikka with cashew marinade', 'appetizer', 'starters', 420.00, 18),
('Spring Rolls', 'Crispy vegetable rolls with sweet chili dip', 'appetizer', 'starters', 280.00, 12),
('Bruschetta', 'Toasted bread with tomato basil topping', 'appetizer', 'starters', 320.00, 10),

-- North Indian
('Butter Chicken', 'Tender chicken in rich tomato gravy', 'main', 'north-indian', 480.00, 25),
('Dal Makhani', 'Black lentils cooked overnight with butter', 'main', 'north-indian', 320.00, 20),
('Paneer Lababdar', 'Cottage cheese in onion tomato gravy', 'main', 'north-indian', 380.00, 22),
('Rogan Josh', 'Aromatic lamb curry with Kashmiri spices', 'main', 'north-indian', 550.00, 30),

-- South Indian
('Masala Dosa', 'Crispy rice crepe with spiced potato filling', 'main', 'south-indian', 220.00, 15),
('Idli Sambar', 'Steamed rice cakes with lentil soup', 'main', 'south-indian', 180.00, 12),
('Hyderabadi Biryani', 'Fragrant rice with marinated chicken', 'main', 'south-indian', 450.00, 35),
('Uttapam', 'Thick pancake topped with vegetables', 'main', 'south-indian', 200.00, 15),

-- Chinese
('Hakka Noodles', 'Stir-fried noodles with vegetables', 'main', 'chinese', 280.00, 18),
('Manchurian', 'Deep-fried vegetable balls in spicy sauce', 'main', 'chinese', 300.00, 20),
('Szechuan Chicken', 'Spicy chicken with bell peppers', 'main', 'chinese', 380.00, 22),

-- Italian
('Margherita Pizza', 'Classic pizza with tomato and mozzarella', 'main', 'italian', 420.00, 20),
('Pasta Alfredo', 'Fettuccine in creamy parmesan sauce', 'main', 'italian', 450.00, 18),
('Risotto', 'Creamy Italian rice with mushrooms', 'main', 'italian', 480.00, 25),

-- Continental
('Grilled Salmon', 'Pan-seared salmon with herb butter', 'main', 'continental', 650.00, 25),
('Chicken Steak', 'Grilled chicken breast with pepper sauce', 'main', 'continental', 550.00, 22),

-- Desserts
('Gulab Jamun', 'Milk dumplings in rose-flavored syrup', 'dessert', 'desserts', 150.00, 5),
('Tiramisu', 'Italian coffee-flavored layered dessert', 'dessert', 'desserts', 280.00, 8),
('Chocolate Lava Cake', 'Warm chocolate cake with molten center', 'dessert', 'desserts', 320.00, 12),

-- Beverages
('Fresh Lime Soda', 'Refreshing lime drink', 'beverage', 'beverages', 80.00, 5),
('Mango Lassi', 'Traditional yogurt drink with mango', 'beverage', 'beverages', 120.00, 5),
('Cappuccino', 'Espresso with steamed milk foam', 'beverage', 'beverages', 150.00, 8);

-- ==============================================
-- INSERT DEFAULT CUSTOMER
-- ==============================================
INSERT INTO Customers (name, phone, email, customer_type) VALUES
('Walk-in Customer', '0000000000', 'walkin@restaurant.com', 'dine-in');
