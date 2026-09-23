# Hussain Invoice - Official User Manual

Welcome to the **Hussain Invoice: Truck Repair Shop Management System**. This manual will guide you through all the features of the application so you can manage your shop efficiently.

---

## 1. Getting Started & Logging In
When you first open the application, you will be greeted by the login screen.
- **How it works:** The system uses a secure email and password login to ensure only authorized personnel can access your business data. 
- **Action:** Enter your email and password, then click "Log In". Once authenticated, you will be taken to your main Dashboard.

## 2. Shop Profile & Settings
Your shop profile contains the core details of your business, which are automatically used on all the invoices you generate.
- **How it works:** Any changes you make here are saved globally. When you create a new invoice or send a receipt, the system automatically pulls your Shop Name, Address, Phone, and Logo from this page.
- **Action:** Go to **Settings** (or Profile). Fill in your shop's details, set your default tax rate, and configure your standard payment terms (e.g., Net 30). Click **Save Profile**.

## 3. Customer Management
This section stores all your client information in a digital Rolodex.
- **How it works:** Keeping a record of customers allows you to quickly select them when creating an invoice, saving you from typing their details over and over. It also tracks how much money they owe you across all their invoices.
- **Action:** Go to the **Customers** tab. Click **Add Customer** to create a new profile. You can enter their Company Name, Contact Person, Phone, Email, and USDOT/MC numbers.

## 4. Vehicle Management
Every truck that rolls into your shop needs to be tracked.
- **How it works:** Vehicles are attached directly to Customers. This helps you track the repair history of a specific truck (like "Unit #101" or a specific VIN). 
- **Action:** Click on a Customer's name to open their profile. Click **Add Vehicle** and enter the Unit Number, VIN, Make, Model, and Mileage. 

## 5. Inventory & Parts
Keep track of what parts you have on the shelf and how much they cost.
- **How it works:** When you add a part to the system, you define its Purchase Cost (what you paid) and its Selling Price (what you charge the customer). When you add this part to an invoice, the system automatically deducts it from your stock and calculates your exact profit.
- **Action:** Go to **Inventory** -> **Add New Part**. Fill in the Part Number, Name, Selling Price, and current Stock Quantity.

## 6. Creating & Managing Invoices
This is the core of the system where you charge your customers for repairs.
- **How it works:** An invoice combines a Customer, their Vehicle, Labor hours, and Parts used. The system automatically does all the math for you—calculating the subtotal, adding your default tax rate, and generating a grand total.
- **Action:** 
  1. Go to **Invoices** -> **New Invoice**.
  2. Select the Customer and their Vehicle.
  3. Under "Items", add Labor (e.g., 4 hours at $100/hr) and Parts (e.g., 2 Brake Pads).
  4. Save the invoice.
  5. You can click **Print / PDF** to generate a commercial-grade paper invoice, or click **Public Link** to copy a link you can text/email to the customer.

## 7. Payments & Billing
Track who has paid you and who still owes you money.
- **How it works:** When a customer hands you cash, writes a check, or pays online, you record it against their invoice. The system supports split payments (e.g., paying half in cash, half on a card) and automatically updates the Invoice Status (from "Unpaid" to "Partially Paid" to "Paid").
- **Action:** Open an Invoice and click **Record Payment**. Enter the amount they paid and the method (Cash, Credit Card, etc.). If you select Credit Card, the system can automatically add a processing fee if you configured one in your Settings.

## 8. Vendors & Expenses
Track the money leaving your business.
- **How it works:** 
  - **Vendors:** Companies you buy parts from. When you buy parts, you record a "Vendor Purchase," which increases your parts inventory and adds to your Accounts Payable (money you owe).
  - **Expenses:** Everyday costs like Rent, Utilities, Payroll, and Insurance. Recording these ensures your Net Profit is accurately calculated on the Dashboard.
- **Action:** Go to **Vendors** to add part suppliers. Go to **Expenses** to log operational costs like Rent or Fuel.

## 9. Banking & Reconciliation
Make sure your app matches your real-world bank account.
- **How it works:** You can import or manually add transactions from your real bank statement. You can then "Match" these bank deposits to the Payments you recorded in the app. This proves that the money the customer gave you actually landed in your bank account.
- **Action:** Go to **Banking**. Add a bank transaction (e.g., +$500 Deposit). Click **Match** and select the $500 Invoice Payment it corresponds to.

## 10. Dashboard & Financial Reports
Your business at a glance.
- **How it works:** The Dashboard takes all the invoices, payments, and expenses you've entered and creates real-time financial metrics.
  - **Accounts Receivable (AR):** Total money customers still owe you.
  - **Accounts Payable (AP):** Total money you owe to vendors.
  - **Gross Profit:** Money made from Sales minus the direct cost of the parts.
  - **Net Profit:** Gross Profit minus all your operating expenses (like Rent and Payroll).
- **Action:** Simply click on **Dashboard** or **Reports** at any time to see the health of your business. No manual calculations required!
