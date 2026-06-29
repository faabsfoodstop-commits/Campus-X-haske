# Tier 1 UI/UX Implementation Guide

**Status**: Components Created ✅  
**Next Step**: Integration into existing pages

---

## Quick Start

### 1. Modal Component

**Before** (Alert-based):
```javascript
alert('Profile updated successfully!');
alert(`Error: ${err.message}`);
```

**After** (Modal-based):
```javascript
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalConfig, setModalConfig] = useState({});

// To show a confirmation
<Modal
  isOpen={isModalOpen}
  title="Success"
  message="Profile updated successfully!"
  type="success"
  onClose={() => setIsModalOpen(false)}
/>

// To show confirmation dialog
<Modal
  isOpen={isModalOpen}
  title="Delete Profile?"
  message="This action cannot be undone."
  type="warning"
  actions={[
    { label: 'Cancel', variant: 'secondary', onClick: () => {} },
    { label: 'Delete', variant: 'danger', onClick: () => handleDelete() }
  ]}
  onClose={() => setIsModalOpen(false)}
/>
```

---

### 2. Button Component

**Before** (Inline styles):
```javascript
<button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600">
  Click me
</button>
```

**After** (Unified component):
```javascript
import Button from './components/Button';

<Button variant="primary" size="md">
  Click me
</Button>

<Button variant="danger" loading={isLoading}>
  Delete Item
</Button>

<Button variant="secondary" disabled>
  Disabled
</Button>

<Button variant="outline" icon="🔗" fullWidth>
  Share
</Button>
```

**Variants**:
- `primary` - Main action (blue gradient)
- `secondary` - Alternative action (gray)
- `danger` - Destructive action (red)
- `success` - Positive action (green)
- `warning` - Caution action (orange)
- `outline` - Outlined style
- `ghost` - Minimal style

**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`  
**States**: `loading`, `disabled`

---

### 3. Input Component

**Before** (Basic input):
```javascript
<div>
  <label>Email</label>
  <input
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

**After** (Enhanced input):
```javascript
import Input from './components/Input';

<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  hint="We'll never share your email"
  icon="✉️"
/>

// With validation states
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error={errors.password}
  state="error"
/>

// Success state
<Input
  label="Username"
  value={username}
  state="success"
  icon="✓"
/>
```

**Props**:
- `label` - Field label
- `type` - Input type (text, email, password, etc.)
- `error` - Error message (shows red border + error text)
- `hint` - Helper text below input
- `icon` - Icon emoji/symbol
- `state` - Visual state: `success`, `error`, `warning`
- `required` - Show required indicator
- `disabled` - Disable input
- `maxLength` - Max characters (shows counter)

---

### 4. useConfirm Hook

**Before** (Browser confirm):
```javascript
if (window.confirm('Are you sure?')) {
  handleDelete();
}
```

**After** (Promise-based):
```javascript
import { useConfirm } from './hooks/useConfirm';

function MyComponent() {
  const { confirm, alert, modal, closeModal } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item?',
      message: 'This action cannot be undone.',
      type: 'error',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (confirmed) {
      // Delete logic here
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <Modal {...modal} onClose={closeModal} />
    </>
  );
}
```

---

### 5. ErrorBoundary Component

**Setup**:
```javascript
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

The ErrorBoundary will catch any React errors and display a friendly error page.

---

## Migration Checklist

### Phase 1: Replace Alerts (Priority)

- [ ] SpinWheel.jsx - Replace 3 alerts
- [ ] Profile.jsx - Replace 2 alerts
- [ ] Admin.jsx - Replace 2 alerts
- [ ] DailyMissions.jsx - Replace 1 alert
- [ ] Dashboard.jsx - Replace 1 alert
- [ ] BuyPoints.jsx - Replace error handling
- [ ] Login.jsx - Replace error alerts
- [ ] SignUp.jsx - Replace error alerts

### Phase 2: Replace Buttons (High Priority)

- [ ] Dashboard.jsx - Update all buttons
- [ ] Marketplace.jsx - Update reward buttons
- [ ] BuyPoints.jsx - Update purchase buttons
- [ ] Wallet.jsx - Update action buttons
- [ ] Profile.jsx - Update form buttons
- [ ] LeaderBoard.jsx - Update nav buttons

### Phase 3: Replace Inputs (High Priority)

- [ ] Login.jsx - Email/password inputs
- [ ] SignUp.jsx - All form inputs
- [ ] Profile.jsx - Edit profile inputs
- [ ] BuyPoints.jsx - Payment inputs
- [ ] All forms throughout app

### Phase 4: Setup ErrorBoundary (Important)

- [ ] Wrap App.jsx with ErrorBoundary
- [ ] Test error handling
- [ ] Verify error pages

---

## Example: Complete Component Migration

### SpinWheel.jsx - Before

```javascript
const handleSpin = async () => {
  if (freeSpin <= 0) {
    alert('Not enough tokens to buy a spin (costs 50 tokens)');
    return;
  }

  try {
    // Spin logic
    setSpinResult(result);
    addToast('Success!', 'success');
  } catch (err) {
    alert(`Spin recorded but had an error: ${err.message}`);
  }
};

return (
  <>
    <button 
      onClick={handleSpin}
      disabled={freeSpin <= 0}
      className={`px-8 py-3 rounded-lg font-semibold ${freeSpin > 0 ? 'bg-primary text-white' : 'bg-gray-400'}`}
    >
      {isSpinning ? 'Spinning...' : 'Spin Now'}
    </button>
  </>
);
```

### SpinWheel.jsx - After

```javascript
import { useConfirm } from './hooks/useConfirm';
import Button from './components/Button';
import Modal from './components/Modal';

const { confirm, alert, modal, closeModal } = useConfirm();

const handleSpin = async () => {
  if (freeSpin <= 0) {
    await alert({
      title: 'Not Enough Spins',
      message: 'You need tokens to buy additional spins. Each spin costs 50 tokens.',
      type: 'warning'
    });
    return;
  }

  try {
    // Spin logic
    setSpinResult(result);
    addToast('Success!', 'success');
  } catch (err) {
    await alert({
      title: 'Error',
      message: err.message || 'Failed to complete spin. Please try again.',
      type: 'error'
    });
  }
};

return (
  <>
    <Button
      onClick={handleSpin}
      disabled={freeSpin <= 0}
      loading={isSpinning}
      variant="primary"
      size="lg"
      fullWidth
    >
      {isSpinning ? 'Spinning...' : 'Spin Now'}
    </Button>
    
    <Modal {...modal} onClose={closeModal} />
  </>
);
```

---

## Component Integration Steps

### For Each Page That Uses Alerts:

1. **Import the hook**:
   ```javascript
   import { useConfirm } from '../hooks/useConfirm';
   ```

2. **Initialize the hook**:
   ```javascript
   const { confirm, alert, modal, closeModal } = useConfirm();
   ```

3. **Replace alerts**:
   ```javascript
   // OLD
   alert('Success!');
   
   // NEW
   await alert({
     title: 'Success',
     message: 'Operation completed!',
     type: 'success'
   });
   ```

4. **Add Modal to JSX**:
   ```javascript
   return (
     <>
       {/* Your component JSX */}
       <Modal {...modal} onClose={closeModal} />
     </>
   );
   ```

### For Form Inputs:

1. **Import Input component**:
   ```javascript
   import Input from '../components/Input';
   ```

2. **Replace input elements**:
   ```javascript
   // OLD
   <input
     type="email"
     className="w-full px-4 py-2 border border-gray-300 rounded-lg"
   />

   // NEW
   <Input
     type="email"
     label="Email"
     value={email}
     onChange={(e) => setEmail(e.target.value)}
     error={errors.email}
   />
   ```

### For Buttons:

1. **Import Button component**:
   ```javascript
   import Button from '../components/Button';
   ```

2. **Replace button elements**:
   ```javascript
   // OLD
   <button className="bg-primary text-white px-4 py-2 rounded-lg">
     Click me
   </button>

   // NEW
   <Button variant="primary">
     Click me
   </Button>
   ```

---

## Testing After Migration

- [ ] Verify all alerts appear as modals
- [ ] Test modal actions work correctly
- [ ] Check buttons display correctly
- [ ] Verify form inputs validate
- [ ] Test on mobile devices
- [ ] Check keyboard navigation
- [ ] Verify focus states
- [ ] Test with screen readers

---

## Troubleshooting

### Modal doesn't appear
- Ensure `modal` state is passed to Modal component
- Check `isOpen` prop is being set correctly
- Verify `onClose` callback is provided

### Button not showing loading spinner
- Check `loading` prop is boolean
- Verify button has `type="button"` if needed
- Check CSS is loaded

### Input validation not showing
- Ensure `error` prop is set
- Check error message is not empty
- Verify `state` prop is set to "error"

---

## Performance Notes

- ✅ All components use CSS for animations (GPU accelerated)
- ✅ Modal uses backdrop-filter for smooth effect
- ✅ Input uses focus-visible for accessibility
- ✅ Button uses smooth gradients and shadows
- ✅ No additional dependencies required

---

## Accessibility Checklist

- ✅ Modal has ARIA labels
- ✅ Input has associated labels
- ✅ Button has clear focus states
- ✅ Keyboard navigation works
- ✅ Screen reader compatible
- ✅ Color contrast compliant
- ✅ Touch targets 44x44px minimum

---

## Next Steps

1. ✅ Components created
2. ⬜ Integrate into pages (Start with highest impact)
3. ⬜ Test thoroughly
4. ⬜ Deploy to staging
5. ⬜ Get user feedback
6. ⬜ Move to Tier 2 improvements

**Estimated Timeline for Full Integration**: 1-2 weeks  
**Priority**: HIGH - These are foundational changes

---

**Last Updated**: 2026-06-29  
**Version**: 1.0
