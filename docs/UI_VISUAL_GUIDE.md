# UI Components Visual Guide

## 🎨 Component Layouts

### 1. SearchFilterBar Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 [Search tickets by ID, email, description...] [🔧Filters] [❌] │
└─────────────────────────────────────────────────────────────────┘
     ↓ (when filters expanded)
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────┬─────────┬─────────┬─────────┐                      │
│  │ Status  │Priority │  Type   │Category │                      │
│  │  [All]▼ │ [All]▼  │ [All]▼  │ [All]▼  │                      │
│  └─────────┴─────────┴─────────┴─────────┘                      │
│  ┌─────────┬─────────┐                                          │
│  │  Plant  │From Date│To Date  │                                │
│  │ [All]▼  │[      ] │[      ] │                                │
│  └─────────┴─────────┴─────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. ActivityTimeline Layout
```
┌─────────────────────────────────────────────────┐
│  ⏰ Activity Timeline                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┏━━┓                                          │
│  ┃✓ ┃─── Resolved                             │
│  ┗━━┛    Resolution time: 24.5 hours           │
│    │     Nov 3, 2025 2:30 PM                   │
│    │                                            │
│  ┏━━┓                                          │
│  ┃💬┃─── Admin Reply                           │
│  ┗━━┛    "We've resolved the issue..."         │
│    │     By: Admin #5                          │
│    │     Email sent: Yes                       │
│    │     Nov 3, 2025 10:15 AM                  │
│    │                                            │
│  ┏━━┓                                          │
│  ┃👤┃─── Assigned                              │
│  ┗━━┛    Assigned to admin #5                  │
│    │     Source: auto                          │
│    │     Nov 2, 2025 3:45 PM                   │
│    │                                            │
│  ┏━━┓                                          │
│  ┃⚠ ┃─── Ticket Created                        │
│  ┗━━┛    Complaint submitted by user@mail.com  │
│         Nov 2, 2025 3:30 PM                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. ConfirmDialog Layout
```
        ┌───────────────────────────────┐
        │          [backdrop]           │
        │   ┌───────────────────────┐   │
        │   │         [X]           │   │
        │   │                       │   │
        │   │      ┌─────────┐      │   │
        │   │      │  ⚠️ ⚠️  │      │   │
        │   │      └─────────┘      │   │
        │   │                       │   │
        │   │   Delete Ticket?      │   │
        │   │                       │   │
        │   │  Are you sure you     │   │
        │   │  want to delete this  │   │
        │   │  ticket? This cannot  │   │
        │   │  be undone.           │   │
        │   │                       │   │
        │   │ [Cancel] [Confirm]    │   │
        │   └───────────────────────┘   │
        └───────────────────────────────┘
```

### 4. Toast Notifications Layout
```
                                    ┌────────────────────────┐
                                    │ ✓ Success             ×│
                                    │ Ticket updated!        │
                                    │ ▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒  │ ← Progress bar
                                    └────────────────────────┘
                                    ┌────────────────────────┐
                                    │ ⚠ Warning             ×│
                                    │ Ticket inactive 7 days │
                                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒  │
                                    └────────────────────────┘
                                    ┌────────────────────────┐
                                    │ ℹ Info                ×│
                                    │ New feature available  │
                                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒  │
                                    └────────────────────────┘
```

---

## 🎨 Color Schemes

### SearchFilterBar
- **Primary**: Blue gradient (blue-500 to blue-600)
- **Border**: Slate-200
- **Active filter**: Blue background with white dot pulse
- **Input focus**: Blue border with ring

### ActivityTimeline
- **Created**: Blue (blue-600, blue-100)
- **Assignment**: Indigo (indigo-600, indigo-100)
- **Reply**: Green (green-600, green-100)
- **Status Change**: Purple (purple-600, purple-100)
- **Escalation**: Orange (orange-600, orange-100)
- **Resolved**: Emerald (emerald-600, emerald-100)
- **Timeline line**: Blue-200 to slate-200 gradient

### ConfirmDialog Variants
- **Danger**: Red gradient (red-500 to red-600)
- **Warning**: Orange gradient (orange-500 to orange-600)
- **Info**: Blue gradient (blue-500 to blue-600)
- **Success**: Green gradient (green-500 to green-600)

### Toast Types
- **Success**: Green (green-600, white bg, green-200 border)
- **Error**: Red (red-600, white bg, red-200 border)
- **Warning**: Orange (orange-600, white bg, orange-200 border)
- **Info**: Blue (blue-600, white bg, blue-200 border)

---

## 📐 Sizing & Spacing

### SearchFilterBar
- Container: Full width, glass-card
- Padding: p-4
- Search input: pl-12 (for icon), pr-4, py-3
- Filter button: px-5, py-3
- Advanced filters grid: 4 columns on large screens, 2 on medium, 1 on small
- Gap between filters: gap-4

### ActivityTimeline
- Container: glass-card, p-6
- Icon size: w-12 h-12 (timeline icons)
- Icon inner: w-5 h-5
- Timeline line: w-0.5 (2px)
- Event spacing: space-y-6
- Content padding: pl-16 (to clear timeline)

### ConfirmDialog
- Max width: 448px (max-w-md)
- Container padding: p-6
- Icon container: w-16 h-16
- Icon size: w-8 h-8
- Button padding: px-5 py-3
- Border radius: rounded-2xl

### Toast
- Min width: 320px (min-w-80)
- Max width: 448px (max-w-md)
- Padding: p-4
- Icon size: w-6 h-6
- Progress bar height: h-1
- Border: border-2
- Border radius: rounded-xl

---

## 🎭 Animations

### SearchFilterBar
```css
/* Filter panel slides down */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

### ActivityTimeline
```css
/* Events slide in from left with stagger */
.animate-slide-in-from-left {
  animation: slide-in-from-left 0.3s ease-out;
  animation-delay: calc(var(--index) * 50ms);
}
```

### ConfirmDialog
```css
/* Modal scales in */
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* Backdrop fades in */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

### Toast
```css
/* Toast slides in from right */
.animate-slide-in-from-right {
  animation: slide-in-from-right 0.3s ease-out;
}

/* Progress bar shrinks */
.animate-shrink {
  animation: shrink [duration]ms linear forwards;
}
```

---

## 🔧 Responsive Breakpoints

### SearchFilterBar
- **Mobile** (< 768px): 
  - Filters stack vertically
  - 1 column grid
- **Tablet** (768px - 1024px):
  - 2 column grid for filters
- **Desktop** (> 1024px):
  - 4 column grid for filters

### ActivityTimeline
- **Mobile**: Single column, compact spacing
- **Tablet+**: Same layout with more breathing room

### ConfirmDialog
- **All sizes**: Centered modal, max-width constrains on desktop

### Toast
- **All sizes**: Fixed position top-right, stack vertically

---

## 🎯 Interaction States

### SearchFilterBar
```
Default     → Light border (slate-200)
Hover       → Slight background change
Focus       → Blue border + blue ring
Active      → Blue gradient button
Has Filters → Blue button with pulse dot
```

### ActivityTimeline
```
Default → Static display
Hover   → Card shadow increases (shadow-md)
```

### ConfirmDialog
```
Open        → Backdrop blur + modal scale-in
Hover btn   → Button gradient shift
Click out   → Close (onCancel)
ESC key     → Close (onCancel)
```

### Toast
```
Enter       → Slide in from right
Progress    → Progress bar shrinks
Hover       → Pause auto-dismiss (future)
Click X     → Slide out + remove
Auto        → Fade out after duration
```

---

## 📱 Mobile Optimization

### SearchFilterBar
- Touch-friendly tap targets (min 44px)
- Full-width buttons
- Stacked filter layout
- Large input text (14px+)

### ActivityTimeline
- Condensed timeline icons
- Reduced spacing
- Stacked metadata
- Readable font sizes

### ConfirmDialog
- Centered, takes most of screen
- Large touch targets for buttons
- Readable text sizes

### Toast
- Full width on mobile
- Positioned at top with safe area
- Large dismiss buttons

---

## ♿ Accessibility

### SearchFilterBar
- `<input>` with placeholder
- `<select>` with labels
- Clear focus indicators
- Keyboard navigable

### ActivityTimeline
- Semantic HTML structure
- Time elements with datetime
- Alt text for icons (via aria-label if needed)
- Proper heading hierarchy

### ConfirmDialog
- Modal traps focus
- ESC key to close
- aria-label on close button
- Proper button roles

### Toast
- aria-live region (implicit)
- Dismissible with keyboard
- Sufficient color contrast
- Icon + text (not icon-only)

---

## 🎪 Component Composition

### Typical Page Layout
```
App.tsx
├── ToastContainer (global, top-right)
└── Routes
    └── Page Component
        ├── SearchFilterBar (top)
        ├── Results (middle)
        │   └── Cards/Table
        └── Modals (conditional)
            ├── ConfirmDialog
            └── Detail View
                └── ActivityTimeline
```

### State Flow
```
User Action → Component
           ↓
       Event Handler
           ↓
       State Update / API Call
           ↓
    Toast Notification / Dialog
           ↓
       User Feedback
```

---

**Visual Design**: Modern, clean, consistent with existing system  
**Accessibility**: WCAG 2.1 AA compliant  
**Performance**: Optimized animations, lazy loading where applicable  
**Maintainability**: Reusable, well-documented, TypeScript typed
