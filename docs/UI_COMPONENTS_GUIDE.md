# UI Enhancement Components - Usage Guide

This document demonstrates how to use the newly added UI components in the Jabil Feedback System.

## 📦 Components Added

### 1. SearchFilterBar
A comprehensive search and filter component with advanced filtering capabilities.

### 2. ActivityTimeline
A visual timeline showing the history and activity of a feedback item.

### 3. ConfirmDialog
A reusable confirmation dialog for destructive or important actions.

### 4. Toast Notifications
A global toast notification system with multiple variants (success, error, warning, info).

---

## 🔍 SearchFilterBar Component

### Basic Usage

```tsx
import { useState } from "react";
import SearchFilterBar, { SearchFilters } from "../components/SearchFilterBar";

const MyPage = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    status: "All",
    priority: "All",
    kind: "All"
  });

  return (
    <SearchFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      showAdvancedFilters={true}
  placeholder="Search feedback..."
      categories={["All", "HR", "Payroll", "Facilities", "IT", "Safety"]}
      plants={["Plant A", "Plant B", "Plant C"]}
    />
  );
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `SearchFilters` | ✅ | Current filter state |
| `onFiltersChange` | `(filters: SearchFilters) => void` | ✅ | Callback when filters change |
| `showAdvancedFilters` | `boolean` | ❌ | Show advanced filter options (default: false) |
| `placeholder` | `string` | ❌ | Search input placeholder |
| `categories` | `string[]` | ❌ | Available categories |
| `plants` | `string[]` | ❌ | Available plant locations |

### SearchFilters Interface

```typescript
interface SearchFilters {
  search: string;
  status?: ComplaintStatus | "All";
  priority?: Priority | "All";
  kind?: ComplaintKind | "All";
  category?: string;
  plant?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

---

## ⏰ ActivityTimeline Component

### Basic Usage

```tsx
import ActivityTimeline from "../components/ActivityTimeline";
import type { Complaint, Reply } from "../types";

const ComplaintDetailPage = () => {
  const complaint: Complaint = {...}; // Your complaint data
  const replies: Reply[] = [...]; // Reply data

  return (
    <ActivityTimeline
      complaint={complaint}
      replies={replies}
    />
  );
};
```

### Custom Events

You can also add custom timeline events:

```tsx
import ActivityTimeline, { TimelineEvent } from "../components/ActivityTimeline";

const customEvents: TimelineEvent[] = [
  {
    id: "custom-1",
    type: "edit",
    title: "Priority Updated",
    description: "Priority changed from Normal to Urgent",
    timestamp: new Date().toISOString(),
    user: "Admin #5",
    metadata: {
      old_value: "normal",
      new_value: "urgent"
    }
  }
];

<ActivityTimeline
  complaint={complaint}
  replies={replies}
  events={customEvents}
/>
```

### Event Types

- `created` - Feedback creation
- `status_change` - Status updates
- `reply` - Admin replies
- `assignment` - Feedback assignment
- `escalation` - Escalations
- `resolved` - Resolution
- `edit` - General edits

---

## ⚠️ ConfirmDialog Component

### Basic Usage

```tsx
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

const MyComponent = () => {
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = () => {
    setShowDialog(true);
  };

  const confirmDelete = () => {
    // Perform deletion
    console.log("Deleting...");
    setShowDialog(false);
  };

  return (
    <>
  <button onClick={handleDelete}>Delete Feedback</button>

      <ConfirmDialog
        isOpen={showDialog}
  title="Delete Feedback"
  message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
};
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | ✅ | - | Dialog visibility |
| `title` | `string` | ✅ | - | Dialog title |
| `message` | `string` | ✅ | - | Dialog message |
| `confirmText` | `string` | ❌ | "Confirm" | Confirm button text |
| `cancelText` | `string` | ❌ | "Cancel" | Cancel button text |
| `variant` | `"danger" \| "warning" \| "info" \| "success"` | ❌ | "warning" | Dialog variant |
| `onConfirm` | `() => void` | ✅ | - | Confirm callback |
| `onCancel` | `() => void` | ✅ | - | Cancel callback |

### Variants

- **danger** - Red theme, for destructive actions (delete, remove)
- **warning** - Orange theme, for cautionary actions (archive, disable)
- **info** - Blue theme, for informational confirmations
- **success** - Green theme, for positive confirmations

---

## 🔔 Toast Notifications

### Setup (Already Done in App.tsx)

The `ToastContainer` is already added to the root `App.tsx`:

```tsx
import ToastContainer from "./components/ToastContainer";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ... */}
      </Routes>
    </>
  );
}
```

### Basic Usage

```tsx
import { useToastStore } from "../store/toast";

const MyComponent = () => {
  const toast = useToastStore();

  const handleSuccess = () => {
  toast.success("Feedback Updated", "The feedback was successfully updated.");
  };

  const handleError = () => {
  toast.error("Failed to Save", "An error occurred while saving the feedback.");
  };

  const handleWarning = () => {
  toast.warning("Warning", "This feedback has been inactive for 7 days.");
  };

  const handleInfo = () => {
    toast.info("New Feature", "Check out the new analytics dashboard!");
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
};
```

### Store Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `success(title, message?, duration?)` | title: string, message?: string, duration?: number | Show success toast |
| `error(title, message?, duration?)` | title: string, message?: string, duration?: number | Show error toast |
| `warning(title, message?, duration?)` | title: string, message?: string, duration?: number | Show warning toast |
| `info(title, message?, duration?)` | title: string, message?: string, duration?: number | Show info toast |
| `addToast(toast)` | toast: Omit<ToastItem, "id"> | Add custom toast |
| `removeToast(id)` | id: string | Remove specific toast |
| `clearAll()` | - | Clear all toasts |

### Custom Toast

For more control, use `addToast`:

```tsx
toast.addToast({
  type: "success",
  title: "Custom Toast",
  message: "This is a custom toast notification",
  duration: 10000 // 10 seconds
});
```

### Duration

- Success: 5 seconds (default)
- Error: 7 seconds (default)
- Warning: 6 seconds (default)
- Info: 5 seconds (default)
- Set `duration: 0` for persistent toasts that don't auto-close

---

## 🎯 Complete Integration Example

Here's a complete example showing all components together:

```tsx
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import SearchFilterBar, { SearchFilters } from "../components/SearchFilterBar";
import ActivityTimeline from "../components/ActivityTimeline";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToastStore } from "../store/toast";
import { listComplaints, deleteComplaint } from "../api";

const FeedbackPage = () => {
  const toast = useToastStore();
  
  // Search/Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    status: "All",
    priority: "All"
  });

  // Confirmation dialog state
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Fetch complaints with filters
  const { data: complaints } = useQuery({
    queryKey: ["complaints", filters],
    queryFn: () => listComplaints({
      status: filters.status !== "All" ? filters.status : undefined,
      priority: filters.priority !== "All" ? filters.priority : undefined,
      // ... other filters
    })
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteComplaint,
    onSuccess: () => {
    toast.success("Deleted", "Feedback was successfully deleted.");
      setConfirmDelete(null);
    },
    onError: () => {
    toast.error("Delete Failed", "Unable to delete the feedback.");
    }
  });

  const handleDeleteClick = (id: number) => {
    setConfirmDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <SearchFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        showAdvancedFilters={true}
      />

      {/* Results */}
      <div className="grid gap-4">
        {complaints?.items.map((complaint) => (
          <div key={complaint.id} className="glass-card p-4">
            <h3>Feedback #{{complaint.id}}</h3>
            <button
              onClick={() => handleDeleteClick(complaint.id)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
  title="Delete Feedback"
  message="Are you sure you want to delete this feedback? This cannot be undone."
        variant="danger"
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
```

---

## 🎨 Styling Notes

All components use:
- **Tailwind CSS** for styling
- **Glass card** effect (`glass-card` class)
- **Consistent animations** (fade-in, slide-in, scale-in)
- **Blue gradient** color scheme
- **Responsive design** (mobile-first)

---

## 🔧 Advanced Customization

### Custom Toast Component

You can create custom toast styles by extending the Toast component:

```tsx
import Toast, { ToastProps } from "../components/Toast";

const CustomToast = (props: ToastProps) => {
  return (
    <div className="custom-toast-wrapper">
      <Toast {...props} />
    </div>
  );
};
```

### Extending SearchFilters

Add custom filters by extending the interface:

```typescript
interface ExtendedFilters extends SearchFilters {
  assignedTo?: number;
  department?: string;
}
```

---

## 📝 Best Practices

1. **Toast Notifications**
   - Use success toasts for completed actions
   - Use error toasts with helpful error messages
   - Keep toast messages concise (< 100 characters)
   - Use appropriate duration based on message importance

2. **Confirmation Dialogs**
   - Always use for destructive actions (delete, archive)
   - Use clear, action-oriented language
   - Explain consequences in the message

3. **Search/Filter Bar**
   - Debounce search input for performance
   - Persist filter state in URL query params
   - Show active filter count to users

4. **Activity Timeline**
   - Include all significant events
   - Add metadata for context
   - Keep descriptions concise

---

## 🐛 Troubleshooting

### Toasts not appearing
- Check that `<ToastContainer />` is in your App.tsx
- Verify the toast store is imported correctly
- Check browser console for errors

### Filters not working
- Ensure backend API supports the filter parameters
- Check that filter values match expected types
- Verify API response format

### Timeline not showing events
- Verify complaint data has required fields
- Check that replies are being passed correctly
- Ensure timestamps are valid ISO strings

---

## 📚 Related Documentation

- [Design System](./DESIGN_IMPROVEMENTS.md)
- [API Documentation](http://localhost:8000/docs)
- [Component Library](../frontend/src/components/)

---

**Last Updated**: November 3, 2025
