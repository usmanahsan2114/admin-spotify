# Accessibility, Cross-Browser & Mobile Compatibility Testing Guide

## Overview

This document outlines comprehensive testing procedures for accessibility (WCAG compliance), cross-browser compatibility, and mobile responsiveness. The goal is to ensure the application is usable by all users, regardless of their device, browser, or assistive technologies.

## Prerequisites

- Frontend running at `http://localhost:5173/`
- Backend running at `http://localhost:5000/`
- Test accounts: Admin, Staff, Demo users
- Test data seeded (orders, products, customers, returns)
- Access to real mobile devices or mobile emulators
- Browser testing tools: Chrome DevTools, Firefox DevTools, Safari Web Inspector
- Accessibility audit tools: Lighthouse, axe DevTools, WAVE

## Testing Tools

### Automated Accessibility Audits

1. **Lighthouse** (Chrome DevTools)
   - Run: Chrome DevTools → Lighthouse → Accessibility
   - Target: Score > 90

2. **axe DevTools** (Browser Extension)
   - Install: Chrome/Firefox extension
   - Run: Right-click → "Scan for accessibility issues"

3. **WAVE** (Web Accessibility Evaluation Tool)
   - Online: https://wave.webaim.org/
   - Browser Extension: WAVE Evaluation Tool

4. **Accessibility Audit Scripts**
   - `frontend/scripts/accessibility-audit.sh` (Linux/Mac)
   - `frontend/scripts/accessibility-audit.ps1` (Windows)

## Test Cases

### 1. Cross-Browser Testing

#### 1.1 Desktop Browsers

**Chrome (Desktop)**
- [ ] Login page renders correctly
- [ ] Dashboard loads with all charts visible
- [ ] Orders table displays and scrolls properly
- [ ] Products page filters and search work
- [ ] Settings page forms submit correctly
- [ ] Dark mode toggle works
- [ ] No console errors or warnings

**Firefox (Desktop)**
- [ ] Login page renders correctly
- [ ] Dashboard charts display properly
- [ ] DataGrid tables function correctly
- [ ] Forms validate and submit
- [ ] Theme switching works
- [ ] No layout overflow or horizontal scrolling

**Safari (Desktop)**
- [ ] All pages load correctly
- [ ] Charts render with proper colors
- [ ] Date pickers work correctly
- [ ] File uploads (CSV import) function
- [ ] No Safari-specific CSS issues

**Edge (Desktop)**
- [ ] Full functionality verified
- [ ] No Edge-specific rendering issues
- [ ] Performance is acceptable

#### 1.2 Mobile Browsers

**Chrome (Android)**
- [ ] Login page is fully responsive
- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally when needed
- [ ] Forms stack vertically
- [ ] Touch targets are at least 48x48px
- [ ] Charts resize appropriately
- [ ] No horizontal scrolling on main content

**Safari (iOS)**
- [ ] All pages render correctly
- [ ] Touch interactions work smoothly
- [ ] Date pickers are mobile-friendly
- [ ] Charts are readable on small screens
- [ ] Dark mode works correctly
- [ ] No iOS-specific bugs

**Firefox Mobile**
- [ ] Basic functionality verified
- [ ] Performance is acceptable

#### 1.3 Mobile Orientation Testing

**Portrait Mode**
- [ ] Sidebar collapses to drawer
- [ ] Tables use horizontal scroll
- [ ] Forms stack vertically
- [ ] Charts adapt to narrow width
- [ ] Navigation is accessible

**Landscape Mode**
- [ ] Layout adapts to wider viewport
- [ ] Tables may show more columns
- [ ] Charts utilize horizontal space
- [ ] No layout breaks

### 2. Accessibility (WCAG) Testing

#### 2.1 Keyboard Navigation

**Login Page**
- [ ] Tab key navigates through all form fields
- [ ] Enter key submits the form
- [ ] Focus indicators are visible
- [ ] Store selection dropdown is keyboard accessible

**Dashboard**
- [ ] Tab navigates through all interactive elements
- [ ] Skip link appears and works (if implemented)
- [ ] Charts are keyboard accessible (if applicable)
- [ ] Date filters are keyboard navigable

**Data Tables (Orders, Products, Customers)**
- [ ] Tab navigates through table cells
- [ ] Arrow keys navigate within table (if DataGrid supports)
- [ ] Sort buttons are keyboard accessible
- [ ] Filter inputs are keyboard accessible
- [ ] Action buttons (Edit, Delete) are keyboard accessible

**Forms (Product, Customer, Settings)**
- [ ] All inputs are keyboard accessible
- [ ] Labels are properly associated with inputs
- [ ] Error messages are announced by screen readers
- [ ] Submit buttons are keyboard accessible
- [ ] Cancel/Close buttons are keyboard accessible

#### 2.2 Screen Reader Support

**ARIA Labels**
- [ ] All icon buttons have `aria-label` attributes
- [ ] Form inputs have `aria-label` or `aria-labelledby`
- [ ] Navigation items have descriptive labels
- [ ] Charts have `aria-label` or `aria-labelledby` (if applicable)
- [ ] Dialog titles use `aria-labelledby`

**Semantic HTML**
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Lists use `<ul>` or `<ol>` elements
- [ ] Forms use `<form>` elements
- [ ] Buttons use `<button>` elements (not divs)
- [ ] Links use `<a>` elements

**Landmarks**
- [ ] Navigation has `role="navigation"` or `<nav>`
- [ ] Main content has `role="main"` or `<main>`
- [ ] Headers have `role="banner"` or `<header>`
- [ ] Footers have `role="contentinfo"` or `<footer>`

#### 2.3 Color Contrast

**Text Contrast**
- [ ] All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- [ ] Error messages have sufficient contrast
- [ ] Success messages have sufficient contrast
- [ ] Links have sufficient contrast

**Interactive Elements**
- [ ] Buttons have sufficient contrast
- [ ] Focus indicators are visible
- [ ] Disabled states are distinguishable

**Charts**
- [ ] Chart colors are distinguishable
- [ ] Chart legends are readable
- [ ] Chart tooltips have sufficient contrast

**Dark Mode**
- [ ] All contrast ratios maintained in dark mode
- [ ] Text remains readable
- [ ] Interactive elements remain visible

#### 2.4 Images and Media

**Alt Text**
- [ ] All images have `alt` attributes
- [ ] Decorative images have empty `alt=""`
- [ ] Informative images have descriptive `alt` text
- [ ] Logos have appropriate `alt` text

**Charts**
- [ ] Charts have descriptive `aria-label` or `aria-labelledby`
- [ ] Chart data is accessible via screen readers (if possible)
- [ ] Chart legends are properly labeled

### 3. Mobile Responsiveness & Performance

#### 3.1 Layout Responsiveness

**Small Screens (< 600px)**
- [ ] Sidebar collapses to drawer
- [ ] Tables scroll horizontally
- [ ] Forms stack vertically
- [ ] Charts resize appropriately
- [ ] No horizontal scrolling on main content
- [ ] Navigation menu is accessible

**Medium Screens (600px - 900px)**
- [ ] Layout adapts gracefully
- [ ] Tables may show more columns
- [ ] Forms may use two columns where appropriate
- [ ] Charts utilize available space

**Large Screens (> 1200px)**
- [ ] Full layout displayed
- [ ] Tables show all columns
- [ ] Charts are appropriately sized
- [ ] No excessive whitespace

#### 3.2 Touch Targets

**Minimum Size**
- [ ] All interactive elements are at least 48x48px
- [ ] Buttons meet minimum size
- [ ] Icon buttons meet minimum size
- [ ] Links meet minimum size
- [ ] Form inputs meet minimum size

**Spacing**
- [ ] Touch targets have adequate spacing (8px minimum)
- [ ] No overlapping touch targets
- [ ] Accidental taps are minimized

#### 3.3 Mobile Performance

**Load Time**
- [ ] Initial page load < 3 seconds on 4G
- [ ] Charts load smoothly
- [ ] Images are optimized
- [ ] No render-blocking resources

**Interaction**
- [ ] Touch responses are immediate (< 100ms)
- [ ] Scrolling is smooth (60 FPS)
- [ ] No UI freezes during interactions
- [ ] Forms submit without lag

**Memory**
- [ ] No memory leaks
- [ ] Memory usage remains stable
- [ ] Large lists don't cause performance issues

### 4. UI/UX Consistency

#### 4.1 Theme Persistence

**Light Mode**
- [ ] Theme persists after page reload
- [ ] Theme persists after logout/login
- [ ] Theme preference stored in localStorage

**Dark Mode**
- [ ] Theme persists after page reload
- [ ] Theme persists after logout/login
- [ ] All components adapt to dark mode
- [ ] Charts are readable in dark mode
- [ ] Forms are usable in dark mode

#### 4.2 Branding Consistency

**Store Logo**
- [ ] Logo displays correctly on all pages
- [ ] Logo is visible in both light and dark mode
- [ ] Logo is responsive (scales appropriately)
- [ ] Logo has appropriate `alt` text

**Brand Colors**
- [ ] Brand color appears in header/sidebar
- [ ] Brand color persists across pages
- [ ] Brand color works in both themes
- [ ] Brand color meets contrast requirements

**Layout**
- [ ] No broken images
- [ ] No layout overflow
- [ ] Consistent spacing
- [ ] Consistent typography

### 5. Automated Testing

#### 5.1 Lighthouse Audit

Run Lighthouse audit on key pages:

```bash
# Using Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Run audit on:
   - Login page
   - Dashboard
   - Orders page
   - Products page
   - Settings page
```

**Target Scores:**
- Accessibility: > 90
- Performance: > 90
- Best Practices: > 90
- SEO: > 90

#### 5.2 axe DevTools Scan

```bash
# Using axe DevTools extension
1. Install axe DevTools extension
2. Navigate to each page
3. Right-click → "Scan for accessibility issues"
4. Review and fix all errors
5. Address warnings where possible
```

#### 5.3 Accessibility Audit Scripts

**Linux/Mac:**
```bash
cd frontend
chmod +x scripts/accessibility-audit.sh
./scripts/accessibility-audit.sh
```

**Windows:**
```powershell
cd frontend
.\scripts\accessibility-audit.ps1
```

### 6. Manual Testing Checklist

#### 6.1 Keyboard-Only Navigation

- [ ] Navigate entire application using only keyboard
- [ ] All interactive elements are reachable
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Skip links work (if implemented)

#### 6.2 Screen Reader Testing

**NVDA (Windows) or VoiceOver (Mac)**
- [ ] All pages are navigable
- [ ] Form labels are announced
- [ ] Error messages are announced
- [ ] Navigation is clear
- [ ] Content structure is logical

#### 6.3 Visual Testing

**Zoom Testing**
- [ ] Page is usable at 200% zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] Text remains readable
- [ ] Layout doesn't break

**Color Blindness Simulation**
- [ ] Use browser extension (e.g., Colorblindly)
- [ ] Verify charts are distinguishable
- [ ] Verify status indicators are clear
- [ ] Verify error/success messages are clear

### 7. Known Issues & Limitations

#### 7.1 Charts Accessibility

**Current Limitations:**
- Recharts components may not be fully accessible to screen readers
- Chart data may require alternative text descriptions
- Consider adding data tables as alternatives to charts

**Recommendations:**
- Add `aria-label` to chart containers
- Provide textual summaries of chart data
- Consider adding "View as table" option for charts

#### 7.2 DataGrid Accessibility

**Current Status:**
- MUI DataGrid has built-in accessibility features
- Keyboard navigation supported
- Screen reader support available

**Verification:**
- Test keyboard navigation
- Test screen reader announcements
- Verify sort/filter accessibility

### 8. Testing Results Template

```markdown
## Accessibility Testing Results

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Browser/Version]
**Device:** [Device/OS]

### Cross-Browser Testing
- [ ] Chrome Desktop: ✅ / ❌
- [ ] Firefox Desktop: ✅ / ❌
- [ ] Safari Desktop: ✅ / ❌
- [ ] Edge Desktop: ✅ / ❌
- [ ] Chrome Mobile: ✅ / ❌
- [ ] Safari iOS: ✅ / ❌

### Accessibility (WCAG)
- [ ] Keyboard Navigation: ✅ / ❌
- [ ] Screen Reader Support: ✅ / ❌
- [ ] Color Contrast: ✅ / ❌
- [ ] ARIA Labels: ✅ / ❌

### Mobile Responsiveness
- [ ] Layout Adapts: ✅ / ❌
- [ ] Touch Targets: ✅ / ❌
- [ ] Performance: ✅ / ❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Fixes Applied
1. [Fix description]
2. [Fix description]
```

### 9. Post-Testing Actions

1. **Document Issues**: Record all accessibility issues found
2. **Prioritize Fixes**: Fix critical issues first (errors > warnings)
3. **Re-test**: Verify fixes resolve issues
4. **Update Documentation**: Update README with accessibility features
5. **Commit Changes**: Push fixes to `test/accessibility-crossbrowser` branch

## Quick Reference

### WCAG 2.1 Level AA Requirements

- **Keyboard Accessible**: All functionality available via keyboard
- **Screen Reader Compatible**: Content readable by assistive technologies
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44x44px (we use 48x48px)
- **Focus Indicators**: Visible focus indicators
- **Labels**: All form inputs have labels
- **Headings**: Proper heading hierarchy

### Browser Support Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | Fully Supported |
| Firefox | ✅ | ✅ | Fully Supported |
| Safari | ✅ | ✅ | Fully Supported |
| Edge | ✅ | ✅ | Fully Supported |

### Testing Priority

1. **Critical**: Keyboard navigation, screen reader support, color contrast
2. **High**: Mobile responsiveness, touch targets, theme persistence
3. **Medium**: Cross-browser compatibility, performance optimization
4. **Low**: Minor UI/UX consistency issues

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)

