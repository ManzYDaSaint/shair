# CircleFund — Women Monthly Contribution & Membership Fee App

An elegant, minimalistic, and dead-simple Android application built with React Native (Expo SDK 58) and persistent local SQLite storage. Designed specifically for women's rotating savings clubs, chamas, and welfare associations.

- **Currency**: **MWK (Malawian Kwacha)** with localized thousand formatting.
- **Top Buffer**: Generous safe-area inset buffer preventing any collision with Android camera cutouts or status bars.
- **Bottom Navigation**: Persistent, tactile 3-tab navigation bar (*Ledger*, *Expenses*, *Columns*) with active badge indicators.

---

## 🌸 Key Capabilities & Features

### 1. Interactive Master Contribution Ledger
- **Pinned Identity Columns**: `SR` (Serial Number) and `Member Name` remain frozen on the left while horizontally panning through the months and custom levies.
- **Ordered Columns**:
  - `SR` (Auto-incremented, clean formatting)
  - `Member Name` (with initials avatar and member role)
  - `Membership Fee` (Standard dues)
  - **12 Months of the Year**: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, `Dec`
  - **Dynamic Custom Columns**: Toggleable and customizable (e.g. Welfare, Uniform, Party Levy)
  - **Total Column (Automatic)**: Programmatically computes the sum of all contributions logged for each member in real time.
- **Bottom Summary Row**: Automatically computes:
  - Total Membership Fees collected
  - Total collected per individual month (`Jan`..`Dec`)
  - Total collected per custom column
  - **Grand Total** of all circle contributions

---

### 2. 📉 Integrated Expenses & Net Balance Engine
- **Automatic Net Deduction**: Any expenditure logged immediately deducts from total group savings:
  $$\text{Available Net Balance} = \text{Total Income Collected} - \text{Total Group Expenses}$$
- **Expense Categorization**: Categories tailored for community groups: *Venue & Hall Rental*, *Refreshments & Food*, *Welfare & Bereavement Support*, *Supplies & Stationery*, and *Transport*.
- **Full Audit Trail**: Displays the date, amount deducted, responsible officer/sister, and optional notes/receipts.
- **Delete / Restore**: Deleting an expense automatically returns the money to the available Net Balance.

---

### 3. ⚙️ Dynamic Column & Fund Rule Customizer
- **Create Custom Levies**: Add new fee categories (e.g., *End of Year Party*, *Uniform Levy*, *Emergency Fund*) with one tap.
- **Set Target Amounts**: Assign default expected amounts per member.
- **Toggle Visibility**: Turn columns on/off using clean switches without losing historical records.

---

### 4. ⚡ Rapid Payment Entry Modal
- **Zero-Friction Logging**: Tapping any cell in the ledger opens a clean bottom sheet.
- **One-Tap Mark Full**: Instantly mark as paid with one tap of the green checkmark button.
- **Custom / Partial Amounts**: Input any custom amount or clear a payment back to unpaid status.

---

### 5. 🎨 Design & Aesthetic System
- **Theme**: *Terracotta & Plum Community Finance* (Warm Tactile Minimalism).
- **Colors**:
  - **Terracotta Rose (`#944430`)**: Collective warmth, call-to-actions, and accents.
  - **Deep Plum (`#7E4F70`)**: Heritage, stability, and custom fund identifiers.
  - **Emerald Green (`#1E6753`)**: Verified, paid status badges.
  - **Warm Amber (`#C8872A`)**: Partial payments & upcoming targets.
  - **Soft Cream Canvas (`#FAF7F5`)**: Soft, eye-friendly background that prevents screen fatigue.
- **Tabular Figures (`tnum`)**: All monetary figures render with fixed-width numerals for alignment.

---

## 🗄️ Database Architecture (Local SQLite)

Database: `circle_fund.db` via `expo-sqlite` (100% offline, zero sign-in required).

```mermaid
erDiagram
    GROUP_SETTINGS ||--o{ MEMBERS : manages
    GROUP_SETTINGS ||--o{ CUSTOM_COLUMNS : configures
    MEMBERS ||--o{ PAYMENTS : owns
    GROUP_SETTINGS ||--o{ EXPENSES : logs

    GROUP_SETTINGS {
        int id PK
        string group_name
        string currency_symbol
        int active_year
        float default_membership_fee
        float default_monthly_contribution
    }

    MEMBERS {
        int id PK
        int sr_number
        string name
        string phone_number
        string avatar_initials
        string role
        int is_active
    }

    CUSTOM_COLUMNS {
        int id PK
        string column_key UK
        string column_label
        float default_amount
        int sort_order
        int is_enabled
    }

    PAYMENTS {
        int id PK
        int member_id FK
        string item_key "fee | jan..dec | col_*"
        int year
        float amount_paid
        float target_amount
        string status "paid | partial | unpaid"
        string payment_date
    }

    EXPENSES {
        int id PK
        string title
        float amount
        string category
        string expense_date
        string recorded_by
        string notes
    }
```

---

## 📱 Project Structure

```
shair/
├── App.tsx                     # Main application entry point & root navigator
├── app.json                    # Expo configuration
├── package.json                # Project dependencies
├── template/                   # UI/UX design mockups and token specifications
├── src/
│   ├── constants/
│   │   └── theme.ts            # Terracotta & Plum color tokens, spacing, radiuses
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces for database & state
│   ├── db/
│   │   ├── index.ts            # SQLite initialization, schema creation & seeding
│   │   └── dbService.ts        # Database queries (CRUD for members, payments, expenses)
│   ├── context/
│   │   └── AppContext.tsx      # Global reactive state provider & automated math engine
│   ├── components/
│   │   ├── SummaryHeaderCard.tsx  # Top financial card (Net Balance, Collections, Expenses)
│   │   └── QuickPaymentModal.tsx  # Cell-tap bottom sheet for 1-tap payment logging
│   └── screens/
│       ├── LedgerMatrixScreen.tsx # Spreadsheet contribution table (SR, Name, Fee, Months, Total)
│       ├── ExpensesScreen.tsx     # Expenses tracker that deducts from total balance
│       └── CustomColumnsScreen.tsx# Manager for dynamic/custom columns
```

---

## 🚀 Running the App

To run the app on Android:

```bash
# Start the Expo development server
npx expo start

# Or directly target Android emulator / device
npx expo run:android
```
