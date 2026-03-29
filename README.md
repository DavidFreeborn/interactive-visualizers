# Interactive Visualizers

A reusable TypeScript/React framework for embeddable interactive scientific and philosophical visualizers.

## Purpose

This project produces professional-quality interactive visualizers for an academic personal website. The visualizers must be:

- Scientifically rigorous
- Philosophically careful
- Visually intuitive
- Elegant and professional
- Pedagogically strong
- Modular and reusable
- Easy to extend

## Visualizer Families

The first wave includes these families:

| Family | Status | Source Support |
|--------|--------|----------------|
| Signaling Games & Compositionality | Implementation candidate | Strong |
| Factionalization & Polarization | Implementation candidate | Strong |
| Manifold Learning | Implementation candidate | Strong |
| Zollman Effect | Implementation candidate | Partial |
| Deep Learning Intuition | Partial candidate | Partial |
| LLM Visualizers | Conservative candidate | Limited |
| QFT Particles (DOF) | Spec only | Gap |
| Norton's Dome | Spec only | Gap |
| Maxwell's Demon | Spec only | Gap |

## Project Structure

```
interactive-visualizers/
├── apps/
│   └── showcase/           # Demo/showcase application
├── packages/
│   ├── core-ui/            # Shared UI primitives
│   ├── core-math/          # Mathematical utilities
│   ├── core-sim/           # Simulation framework
│   ├── core-content/       # Content/explanation structures
│   └── viz-*/              # Individual visualizer packages
├── docs/
│   ├── paper-notes/        # Source paper summaries
│   ├── visualizer-specs/   # Per-family specifications
│   └── *.md                # Architecture and standards
├── content/                # Explanatory content
└── source_materials/       # Primary sources (papers, notes)
```

## Stack

- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS
- **Visualization:** D3.js, SVG (Canvas only when needed)
- **3D:** three.js (only when true 3D value exists)

## Scientific Standards

Every visualizer must be labeled as one of:
- **Exact model:** Faithful mathematical representation
- **Standard toy model:** Simplified using established formalisms
- **Conceptual analogy:** Illustrative, not literal
- **Theorem intuition builder:** Helps build intuition for formal results

See `docs/scientific-integrity.md` for full standards.

## Development

```bash
# Install dependencies
npm install

# Run showcase app
npm run dev

# Run tests
npm test
```

## Documentation

- `docs/architecture.md` - System architecture
- `docs/scientific-integrity.md` - Scientific standards
- `docs/visual-design-principles.md` - Design guidelines
- `docs/testing-strategy.md` - Testing approach
- `docs/adding-a-new-visualizer.md` - Extension guide
- `docs/progress-report.md` - Current status

## License

TBD

## Author

David Peter Wallis Freeborn
Assistant Professor in Philosophy
Northeastern University London
