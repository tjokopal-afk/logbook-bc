# 🎨 DESIGN SYSTEM - Log Book Magang

## 📏 **Design Tokens**

### **Typography**
```css
Font Family: 'Franklin Gothic'
Font Weight: 300 (thin) - ALL TEXT
Line Height: 1.5 (normal), 1.2 (headings)

Sizes:
- 3xl (30px): Page titles
- 2xl (24px): Section titles  
- xl (20px): Card titles
- lg (18px): Subheadings
- base (16px): Body text
- sm (14px): Secondary text
- xs (12px): Labels, captions
```

### **Colors**
```css
Brand:
- brand-black: #1D1D1B (text, headings)
- brand-green: #80BA27 (primary actions, active states)
- brand-green-dark: #6A9C1F (hover states)
- brand-green-light: #99D52A (backgrounds)

Neutrals:
- gray-50: #F9FAFB (page background)
- gray-100: #F3F4F6 (hover backgrounds)
- gray-200: #E5E7EB (borders)
- gray-300: #D1D5DB (disabled)
- gray-500: #6B7280 (secondary text)
- gray-600: #4B5563 (labels)
- gray-900: #111827 (primary text alternative)
- white: #FFFFFF (cards, sidebar)

Semantic:
- green-50/600: Success states
- blue-50/600: Info states  
- yellow-50/600: Warning states
- red-50/600: Error states
```

### **Spacing Scale**
```css
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)

Standard Gaps:
- gap-3: 12px (small elements)
- gap-4: 16px (medium spacing)
- gap-6: 24px (large spacing)

Standard Padding:
- p-4: 16px (compact cards)
- p-6: 24px (standard cards)
- px-6 py-4: Header/Footer
```

### **Border Radius**
```css
sm: 0.25rem (4px) - Small buttons
md: 0.375rem (6px) - Inputs
lg: 0.5rem (8px) - Cards (STANDARD)
xl: 0.75rem (12px) - Large cards
full: 9999px - Pills, avatars
```

### **Shadows**
```css
sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05) - Subtle
DEFAULT: 0 1px 3px 0 rgba(0, 0, 0, 0.1) - Cards
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1) - Elevated (STANDARD)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1) - Floating
```

### **Transitions**
```css
Duration: 200ms (STANDARD)
Easing: cubic-bezier(0.4, 0, 0.2, 1)

Classes:
- transition-all
- transition-colors
- transition-shadow
```

---

## 🏗️ **Component Standards**

### **Cards**
```tsx
Standard Card:
- bg-white
- rounded-lg (8px)
- border border-gray-200
- shadow-sm
- p-6

Hover Card:
- hover:shadow-md
- transition-shadow duration-200
```

### **Buttons**
```tsx
Primary:
- bg-brand-green hover:bg-brand-green-dark
- text-white
- px-4 py-2
- rounded-lg
- font-weight: 300 (thin)
- transition-colors

Secondary:
- bg-gray-100 hover:bg-gray-200
- text-gray-900
- same spacing as primary

Ghost:
- bg-transparent hover:bg-gray-100
- text-gray-700
```

### **Inputs**
```tsx
Standard Input:
- border border-gray-300
- rounded-lg
- px-4 py-2
- focus:ring-2 focus:ring-brand-green
- focus:border-transparent
```

### **Stat Cards**
```tsx
Layout:
- Grid: 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- Gap: gap-6
- Height: Auto (equal height via grid)

Structure:
- Icon: w-10 h-10, colored background
- Title: text-sm text-gray-600
- Value: text-3xl (thin weight)
- Trend: text-xs, colored by direction
```

---

## 📱 **Responsive Breakpoints**

```css
sm: 640px   // Mobile landscape
md: 768px   // Tablets
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### **Grid Behavior**
```tsx
Stat Cards:
- Mobile (< 768px): 1 column
- Tablet (768-1024px): 2 columns
- Desktop (> 1024px): 4 columns

Content Width:
- Sidebar: 256px (fixed)
- Main: calc(100vw - 256px)
- Max width: none (full width with padding)
```

---

## 🎯 **Layout Hierarchy**

```
Page Structure:
├─ DashboardLayout
│  ├─ Sidebar (256px, fixed left)
│  └─ Main Content
│     ├─ Header (sticky top, breadcrumb)
│     └─ Page Content (p-6)
│        ├─ Stats Row (optional)
│        ├─ Primary Content
│        └─ Secondary Content
```

---

## ✅ **DO's**

1. ✅ Always use **thin weight (300)** for ALL text
2. ✅ Use **rounded-lg** for all cards
3. ✅ Use **shadow-sm** for resting cards, **shadow-md** for hover
4. ✅ Use **gap-6** for major spacing
5. ✅ Use **p-6** for standard card padding
6. ✅ Use **border-gray-200** for all borders
7. ✅ Use **transition-** classes for animations
8. ✅ Use **brand-green** for primary actions
9. ✅ Use **text-gray-600** for secondary text
10. ✅ Keep mobile-first responsive design

---

## ❌ **DON'Ts**

1. ❌ Never use **font-black, font-bold, font-semibold**
2. ❌ Never mix border radius (stick to rounded-lg)
3. ❌ Never use random shadow values
4. ❌ Never use colors outside design system
5. ❌ Never use padding other than p-4, p-5, p-6
6. ❌ Never forget hover states
7. ❌ Never forget transitions
8. ❌ Never use hardcoded values
9. ❌ Never break responsive grid
10. ❌ Never forget accessibility

---

## 🎨 **Visual Examples**

### **Stat Card**
```tsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Total Aktivitas</p>
      <h3 className="text-3xl text-brand-black mt-1">24</h3>
      <p className="text-xs text-green-600 mt-2">↑ +12%</p>
    </div>
    <div className="bg-green-50 p-3 rounded-lg">
      <CalendarDays className="w-10 h-10 text-green-600" />
    </div>
  </div>
</div>
```

### **Content Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title Here</CardTitle>
    <CardDescription>Description here</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## 📊 **Dashboard Layout**

```
┌────────────────────────────────────────────────┐
│ Header: Breadcrumb + Search + Notifications   │
├────────────────────────────────────────────────┤
│                                                │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │Stat 1│ │Stat 2│ │Stat 3│ │Stat 4│  (gap-6) │
│ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Primary Content Card                     │  │
│ │ (Activity Form, Table, etc)              │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Secondary Content (if needed)            │  │
│ └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🚀 **Implementation Checklist**

### **Every Component Must Have:**
- [ ] Consistent font-weight: 300
- [ ] Consistent border-radius: rounded-lg
- [ ] Consistent shadow: shadow-sm/shadow-md
- [ ] Consistent spacing: p-6, gap-6
- [ ] Proper hover states
- [ ] Smooth transitions
- [ ] Responsive behavior
- [ ] Accessible labels
- [ ] Brand colors only
- [ ] No hardcoded values

---

**Version**: 1.0  
**Last Updated**: 22 Oktober 2025  
**Status**: STABLE - Ready for Production
