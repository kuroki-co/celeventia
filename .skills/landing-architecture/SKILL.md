# Landing Architecture

Use this skill for every landing page project.

This skill defines the mandatory technology stack, responsive strategy, project architecture, file organization, and technical implementation rules.

It does not define visual design, branding, copywriting, art direction, or marketing strategy.

## Mandatory Stack

Every landing page must use:

- Astro
- TypeScript
- Tailwind CSS

Do not replace this stack unless explicitly requested by the user.

Astro is the primary framework.

Prefer `.astro` components for all static content and page sections.

Do not introduce React, Vue, Svelte, or another frontend framework unless a feature genuinely requires complex client-side interactivity.

## Astro First

Prefer static rendering.

Use Astro components for:

- layout
- navigation
- sections
- content blocks
- lists
- cards
- decorative elements
- static UI

Ship as little client-side JavaScript as possible.

Before introducing JavaScript, evaluate whether the behavior can be implemented with:

1. HTML
2. Tailwind CSS
3. CSS
4. Native browser APIs
5. JavaScript

Do not hydrate components unnecessarily.

Use Astro client directives only when the component genuinely requires client-side interaction.

Examples where hydration may be justified:

- complex mobile navigation
- interactive forms
- advanced carousels
- calculators
- stateful widgets
- complex interactive components

Purely visual sections must not be hydrated.

## TypeScript

TypeScript is mandatory.

Use TypeScript for:

- component props
- structured data
- utilities
- configuration
- interactive scripts
- shared types

Avoid `any`.

Prefer simple and explicit types.

Do not create unnecessarily complex type systems for simple landing page content.

## Styling

Tailwind CSS is the primary and mandatory styling system.

Use Tailwind for:

- layout
- spacing
- sizing
- typography
- colors
- borders
- shadows
- positioning
- flexbox
- grid
- responsive behavior
- hover states
- focus states
- transitions
- transforms
- simple animations

Do not recreate Tailwind utilities using custom CSS.

Custom CSS is allowed only when Tailwind is insufficient or would make the implementation unnecessarily complex.

Valid uses of custom CSS include:

- complex `@keyframes`
- advanced text effects
- masks
- clipping
- complex pseudo-elements
- specialized animations
- unusual visual effects that cannot be expressed cleanly with Tailwind

Keep global CSS minimal.

Do not create large CSS files for component styling when Tailwind can handle the same styles.

Avoid inline styles.

Inline styles are only acceptable for genuinely dynamic runtime values.

## Mobile First

Every landing page must be implemented mobile first.

Base Tailwind classes represent the mobile layout.

Responsive styles must progressively enhance the layout for larger screens.

Implementation order:

```text
Mobile
↓
Tablet
↓
Desktop
```

Never build the desktop layout first and then patch mobile afterward.

## Required Responsive Targets

Every landing page must explicitly support:

- Mobile
- Tablet
- Desktop

Tablet must be treated as an intentional layout, not merely an accidental intermediate state between mobile and desktop.

Each device category must be reviewed for:

- layout
- spacing
- typography
- navigation
- image dimensions
- image cropping
- content order
- alignment
- section height
- overflow
- interaction
- readability

## Responsive Breakpoint Strategy

Use Tailwind breakpoints consistently.

Conceptual mapping:

```text
Base → Mobile
md   → Tablet
lg+  → Desktop
```

Additional breakpoints may be used when necessary.

Do not add breakpoints arbitrarily.

Prefer adjusting layouts using the minimum number of breakpoints required.

## Architecture

Use modular vertical slicing.

Organize the project primarily by feature or landing section.

Do not organize the project globally only by technical file type.

Preferred architecture:

```text
Page
↓
Vertical Features
↓
Feature Components
↓
Shared Resources
```

Each major landing section should normally be treated as an independent feature.

Examples:

```text
hero
about
services
projects
testimonials
contact
footer
```

## Project Structure

Use the following structure as the default reference:

```text
src/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── features/
│   ├── header/
│   │   ├── components/
│   │   └── Header.astro
│   │
│   ├── hero/
│   │   ├── components/
│   │   ├── data/
│   │   ├── types/
│   │   └── Hero.astro
│   │
│   ├── about/
│   │   └── About.astro
│   │
│   ├── services/
│   │   ├── components/
│   │   ├── data/
│   │   ├── types/
│   │   └── Services.astro
│   │
│   ├── testimonials/
│   │   ├── components/
│   │   └── Testimonials.astro
│   │
│   ├── contact/
│   │   ├── components/
│   │   └── Contact.astro
│   │
│   └── footer/
│       └── Footer.astro
│
├── shared/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   ├── constants/
│   └── types/
│
├── pages/
│   └── index.astro
│
└── styles/
    └── global.css
```

This is a reference architecture.

Do not create empty folders just to reproduce this structure.

Only create folders when they are needed.

## Vertical Slice Ownership

Each feature must own the code that primarily belongs to it.

Example:

```text
features/
└── services/
    ├── components/
    │   ├── ServiceItem.astro
    │   └── ServiceList.astro
    │
    ├── data/
    │   └── services.ts
    │
    ├── types/
    │   └── service.ts
    │
    └── Services.astro
```

Feature-specific code must remain inside its feature.

Do not move feature-specific files into global directories simply because they are technically:

- components
- data
- types
- utilities

## Feature Boundaries

Features should remain independent when possible.

A feature must not depend directly on internal files belonging to another feature.

Avoid:

```text
features/services/
importing from
features/hero/internal-component.astro
```

If something is genuinely reusable across multiple features, move it into `shared`.

## Shared Layer

Use:

```text
src/shared/
```

only for resources that are genuinely shared.

Possible contents:

```text
shared/
├── components/
├── layouts/
├── lib/
├── constants/
└── types/
```

Something belongs in `shared` only when:

- it is used by multiple features
- it is independent from one specific section
- reuse already exists

Do not move something into `shared` because it might be reused in the future.

Avoid turning `shared/components` into a dumping ground.

Rule:

> If only one feature uses it, it belongs to that feature.

## Page Composition

`src/pages/index.astro` should act mainly as a composition layer.

Example:

```astro
---
import BaseLayout from "@/shared/layouts/BaseLayout.astro"

import Header from "@/features/header/Header.astro"
import Hero from "@/features/hero/Hero.astro"
import About from "@/features/about/About.astro"
import Services from "@/features/services/Services.astro"
import Testimonials from "@/features/testimonials/Testimonials.astro"
import Contact from "@/features/contact/Contact.astro"
import Footer from "@/features/footer/Footer.astro"
---

<BaseLayout>
  <Header />

  <main>
    <Hero />
    <About />
    <Services />
    <Testimonials />
    <Contact />
  </main>

  <Footer />
</BaseLayout>
```

Do not place the full implementation of every landing section directly inside `index.astro`.

The page file should make the overall structure of the landing easy to understand at a glance.

## Component Granularity

Create a component when:

- it represents a meaningful subsection
- it repeats
- it contains independent behavior
- extracting it improves readability
- the parent feature has become too large

Do not create a component for every small HTML element.

Avoid unnecessary fragmentation such as:

```text
HeroTitle.astro
HeroSubtitle.astro
HeroParagraph.astro
HeroButton.astro
HeroImage.astro
```

when the entire hero remains simple and readable inside:

```text
Hero.astro
```

Prefer meaningful boundaries over maximum decomposition.

## Feature Data

Structured or repeated data belonging exclusively to one feature should remain inside that feature.

Example:

```text
features/services/data/services.ts
```

Do not create a global `src/data` folder for feature-specific information.

## Feature Types

Types used only by one feature remain inside that feature.

Example:

```text
features/services/types/service.ts
```

Types used by multiple unrelated features may move to:

```text
shared/types/
```

Do not move types into `shared` without actual reuse.

## Assets

Global reusable assets belong in:

```text
src/assets/
```

Recommended:

```text
assets/
├── fonts/
├── icons/
└── images/
```

Use descriptive filenames using kebab-case.

Good:

```text
lawyer-profile.webp
office-interior.webp
brand-symbol.svg
```

Avoid:

```text
image1.png
foto2.jpg
final-final.png
```

Feature-specific assets may remain close to their feature when this improves ownership and maintainability.

## Images

Prefer modern image formats.

Preferred:

- AVIF
- WebP
- SVG

Use SVG for vector graphics and icons when appropriate.

Use optimized raster formats for photography.

Prevent layout shift by defining dimensions or aspect ratios.

Images outside the initial viewport should normally use lazy loading.

## Layouts

Reusable document-level layouts belong in:

```text
src/shared/layouts/
```

Example:

```text
BaseLayout.astro
```

Layouts may handle:

- document metadata
- `<head>`
- SEO defaults
- global styles
- document shell
- shared structural markup

Do not place feature-specific UI inside generic layouts.

## Global Styles

Global styles belong in:

```text
src/styles/global.css
```

This file should remain minimal.

It may contain:

- Tailwind setup
- `@font-face`
- global CSS variables
- base document styles
- browser normalization when required
- complex global keyframes
- styles that cannot reasonably be implemented using Tailwind

Do not use global CSS as the primary styling system.

## JavaScript

Keep client-side JavaScript minimal.

Do not use JavaScript for:

- responsive layouts
- simple hover effects
- basic transitions
- static content
- visual states achievable with CSS

Use JavaScript only for genuine interaction.

## Dependencies

Keep dependencies minimal.

Before installing a package, determine whether the requirement can already be solved using:

1. Astro
2. HTML
3. Tailwind CSS
4. CSS
5. Native browser APIs
6. Small amounts of JavaScript

Only install a dependency when it solves a concrete problem.

Do not install libraries preemptively.

## Framework Dependencies

Do not introduce React, Vue, Svelte, Solid, or another UI framework by default.

Astro components are the default.

A client framework may only be introduced when:

- the interaction is sufficiently complex
- native Astro and JavaScript would create significantly worse maintainability
- there is a clear technical justification

## State Management

Do not use global state management libraries for ordinary landing pages.

Avoid:

- Redux
- Zustand
- MobX

Landing pages should normally require little or no global state.

Prefer local state or native browser behavior when interaction is necessary.

## Animations

Use the following priority:

```text
Tailwind
↓
CSS
↓
JavaScript
```

Simple animations must use Tailwind transitions and transforms whenever possible.

Complex animations may use custom CSS.

JavaScript-driven animation should only be used when required for:

- choreography
- complex scroll-driven behavior
- dynamic timelines
- interaction-dependent motion
- effects impossible or unreasonable with CSS

Do not install an animation library by default.

## Accessibility

Use semantic HTML.

Prefer:

```text
header
nav
main
section
article
footer
```

Maintain correct heading hierarchy.

Use:

```html
<button></button>
```

for actions.

Use:

```html
<a></a>
```

for navigation.

Interactive elements must be keyboard accessible.

Images must have appropriate `alt` attributes.

Decorative images should use:

```html
alt=""
```

## Performance

Prioritize:

- static rendering
- minimal JavaScript
- minimal hydration
- optimized assets
- minimal dependencies
- lazy loading where appropriate
- fast initial rendering

Do not sacrifice Astro's static-first advantages without a concrete requirement.

## Architecture Rules

Always prefer:

- feature ownership
- explicit boundaries
- simple composition
- minimal dependencies
- minimal hydration
- maintainable code
- proportional architecture

Avoid:

- over-engineering
- unnecessary abstraction
- unnecessary global folders
- giant page files
- giant shared folders
- unnecessary client frameworks
- unnecessary state management
- unnecessary JavaScript

## Final Rule

The architecture must remain proportional to the landing page.

Use modular vertical slicing without turning a simple landing page into an enterprise application.

The preferred mental model is:

```text
Landing
├── Page composition
├── Vertical features
│   ├── Feature components
│   ├── Feature data
│   └── Feature types
└── Shared resources only when genuinely reused
```
