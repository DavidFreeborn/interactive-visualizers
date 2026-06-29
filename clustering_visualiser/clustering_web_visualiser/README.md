# Dynamic Clustering Visualiser

A standalone, dependency-free HTML/CSS/JavaScript visualiser for demonstrating how canonical clustering assumptions behave on two-dimensional point clouds.

Open `index.html` directly in a browser, or copy the page into a website. No build step is required.

## Included data geometries

- Separated Gaussian blobs
- Uniform random field
- Unequal cluster sizes
- Different densities
- Anisotropic ellipses
- Two moons
- Concentric rings
- Interlocking spirals
- Two blobs with a bridge
- Blobs with outliers
- Noisy diagonal bands
- Nested local clusters
- Line plus blob

## Included clustering methods

- k-means
- k-medoids
- Fuzzy c-means
- Gaussian mixture
- DBSCAN
- HDBSCAN-style density hierarchy (teaching approximation, not production HDBSCAN)
- Mean shift
- Agglomerative hierarchy
- Graph communities

The visualiser is designed for clarity rather than high-performance production clustering. Some methods are simplified but faithful enough to show the core clustering intuition dynamically. The browser HDBSCAN-style mode implements only the visual core: core distances, mutual-reachability edges, a minimum-spanning hierarchy, condensed small components, and a selected visual density level. It does not implement the full condensed-tree stability / EOM cluster selection used by production HDBSCAN libraries, and should not be presented as exact HDBSCAN.
