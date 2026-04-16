<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Noora Modesty Project Guidelines

## Project Context
- **Image-Driven E-commerce**: High-quality visuals are central. Design with images as a first-class element.
- **Future-Proof**: Architect for Sanity CMS and OMS integration (use mock data in `data/` mirroring Sanity schemas).

## Data & Content Architecture
- **Mock Data**: Defined in `data/` folder. Use field names like `_id`, `title`, `slug`, `mainImage`, `images[]`, `price`, etc.
- **Props Only**: Components receive content via props ONLY. No hardcoded copy/images inside components.
- **Next.js `<Image />`**: ALWAYS use `<Image />`. No raw `<img>` tags.
- **Types**: Interfaces in `types/` reflecting future Sanity/OMS shapes.

## Project Structure
- **Pages**: Folders inside `components/` named after the page (e.g. `components/LandingPage/`).
- **Sections**: Dedicated files inside page folders (e.g. `components/LandingPage/Hero.tsx`).
- **App Route Files**: No logic, no styles, no JSX other than importing/composing section components.
- **Shared UI**: `components/ui/` (Buttons, Cards, etc.)
- **Root folders**: `types/`, `utils/`, `data/`, `lib/` (reserved for Sanity/OMS functions).

## Code Rules
1. **Tailwind CSS Only**: Inline utility classes only. No external CSS/CSS modules.
2. **Strict Props**: Pass all content from `data/` through the page down to components.
3. **600-line Limit**: Split components immediately if approaching this limit.
4. **One Component Per File**: Exactly one component export per file.
5. **Strict TypeScript**: Interfaces for every component prop. No `any`.
6. **Named Exports**: Use named exports except for Next.js route files.
7. **Next.js `<Image />`**: Must have `alt`, and `width/height` or `fill`.

## Naming Conventions
- Folders: PascalCase (e.g. `Hero/`)
- Components: PascalCase (e.g. `HeroBanner.tsx`)
- Prop Types: `ComponentNameProps`
- Data/Utils: camelCase (e.g. `products.ts`, `formatPrice.ts`)
