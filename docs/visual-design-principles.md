# Visual Design Principles

This document defines the visual design standards for all visualizers.

---

## Overall Character

The visual style should be:

- **Academic, not corporate** - Serious intellectual aesthetic
- **Polished, not flashy** - Refined without being showy
- **Intuitive, not gimmicky** - Clear without tricks
- **Explanatory, not decorative** - Every element serves understanding
- **Rigorous, not hand-wavy** - Precise and careful

---

## Typography

### Fonts

- **Primary:** System fonts (native stack)
- **Code/math:** Monospace
- **Labels:** Sans-serif, high legibility

### Hierarchy

- **H1:** Visualizer title
- **H2:** Section headers (Controls, Views, etc.)
- **H3:** Subsection headers
- **Body:** Explanatory text
- **Labels:** Axis labels, legend entries
- **Annotations:** In-visualization labels

### Sizing

- Clear hierarchy through size
- Minimum 14px for body text
- Labels legible at all zoom levels

---

## Color

### Palette

Use a restrained, professional palette:

- **Primary:** Blues and grays
- **Accent:** Single accent color for emphasis
- **Data:** Colorblind-safe palette for data encoding
- **Background:** Light (white/off-white) or dark mode support

### Data Encoding

- Sequential: Single hue, varying lightness
- Diverging: Two hues, neutral center
- Categorical: Distinct, colorblind-safe hues

### Avoid

- Saturated rainbow palettes
- More than 6-8 categorical colors
- Color as only differentiator (use shape/pattern too)

---

## Layout

### Panels

Standard visualizer layout:

```
┌──────────────────────────────────────────┐
│  Title + Scientific Status Label         │
├───────────────────────────────┬──────────┤
│                               │          │
│   Main Visualization          │ Controls │
│                               │          │
├───────────────────────────────┴──────────┤
│  Metrics / Output Panel                  │
├──────────────────────────────────────────┤
│  Explanation / Content                   │
└──────────────────────────────────────────┘
```

### Responsive

- Desktop-first design
- Graceful mobile degradation
- Controls collapse to drawer on mobile
- Visualization scales or scrolls

### White Space

- Generous padding
- Clear visual grouping
- Don't crowd elements

---

## Animation

### When to Animate

- When motion conveys information (trajectories, transitions)
- When time evolution is the point (simulations)
- When animation aids understanding

### When NOT to Animate

- Pure decoration
- Attention-grabbing effects
- When static would be clearer

### Animation Style

- Smooth, not jerky
- Appropriate speed (adjustable)
- Clear play/pause/step controls
- Frame-by-frame stepping available

### Performance

- 60fps target
- Graceful degradation
- Option to disable animation

---

## Interactivity

### Controls

- Sliders for continuous parameters
- Dropdowns for categorical choices
- Toggles for binary options
- Number inputs for precise values

### Feedback

- Immediate response to input
- Visual indication of current state
- Clear reset behavior

### Hover/Click

- Tooltip on hover for details
- Click for selection/focus
- Clear affordances

---

## Charts and Graphs

### Axes

- Clear labels with units
- Appropriate scale (linear/log)
- Grid lines where helpful (subtle)
- Axis titles when not obvious

### Legends

- Positioned not to obscure data
- Minimal but sufficient
- Interactive (click to toggle)

### Data Points

- Appropriate marker size
- Shape variation for categories
- Transparency for overlap

---

## Networks and Graphs

### Nodes

- Consistent sizing or size encoding meaning
- Clear labels (or on hover)
- Visual hierarchy for importance

### Edges

- Appropriate thickness
- Direction indicators if needed
- Curved vs straight based on layout

### Layouts

- Force-directed for exploration
- Fixed layouts for comparison
- User-adjustable when helpful

---

## 3D Visualization

### Use Sparingly

Only when 3D genuinely adds understanding.

### If Used

- Clear camera controls
- Multiple preset viewpoints
- Option for 2D projections
- Depth cues (lighting, occlusion)

---

## Accessibility

### Color Blindness

- Don't rely on color alone
- Use shape, pattern, position
- Test with simulation tools

### Screen Readers

- Alt text for visualizations
- Aria labels for controls
- Keyboard navigation

### Contrast

- WCAG AA minimum
- Clear text/background contrast

---

## Dark Mode

Support both light and dark modes:

- Automatic system detection
- Manual toggle
- Consistent across all visualizers
- Ensure all elements remain visible

---

## Consistency

### Across Visualizers

- Same control styles
- Same color palette principles
- Same animation behaviors
- Same layout patterns

### Within Visualizers

- Consistent visual encoding
- Consistent terminology
- Consistent interaction patterns
